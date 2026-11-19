import test from "node:test";
import assert from "node:assert/strict";
import { handleAnalyze } from "../server/handle-analyze";
import { analyzeResume } from "../server/analysis/analyze";
import { createRateLimiter } from "../server/rate-limit";
import { MAX_FILE_BYTES, type Extractors } from "../server/parsing/extract-text";
import { GOOD_AI_REPLY, RESUME, replyWith } from "./fixtures";

type Chat = Parameters<typeof analyzeResume>[1];

const chat = (async () => replyWith(GOOD_AI_REPLY)) as unknown as Chat;
const analyze = (input: { text: string; fileName: string }) => analyzeResume(input, chat);
const roomy = () => createRateLimiter(100, 60000);

const fakeExtractors: Extractors = {
  pdf: async () => RESUME,
  docx: async () => RESUME,
};

function upload(name: string, content: string | Uint8Array, extra: Record<string, string> = {}) {
  const form = new FormData();
  form.set("file", new File([content as BlobPart], name));
  for (const [k, v] of Object.entries(extra)) form.set(k, v);
  return new Request("http://localhost/api/analyze", { method: "POST", body: form });
}

function errorOf(result: { body: unknown }) {
  return (result.body as { error: { code: string; message: string } }).error;
}

test("txt upload end to end", async () => {
  const res = await handleAnalyze(upload("resume.txt", RESUME), { analyze, limiter: roomy() });
  assert.equal(res.status, 200);
  const body = res.body as { analysis: { fileName: string; checks: unknown[]; suggestions: unknown[] } };
  assert.equal(body.analysis.fileName, "resume.txt");
  assert.equal(body.analysis.checks.length, 8);
  assert.equal(body.analysis.suggestions.length, 3);
});

test("pdf and docx go through their extractors", async () => {
  for (const name of ["cv.pdf", "cv.docx"]) {
    const res = await handleAnalyze(upload(name, new Uint8Array([1, 2, 3])), { analyze, extractors: fakeExtractors, limiter: roomy() });
    assert.equal(res.status, 200, name);
  }
});

test("pasted text as form field and as json", async () => {
  const form = new FormData();
  form.set("text", RESUME);
  const viaForm = await handleAnalyze(new Request("http://x/api", { method: "POST", body: form }), { analyze, limiter: roomy() });
  assert.equal(viaForm.status, 200);
  assert.equal((viaForm.body as { analysis: { fileName: string } }).analysis.fileName, "pasted-experience.txt");

  const viaJson = await handleAnalyze(
    new Request("http://x/api", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: RESUME }) }),
    { analyze, limiter: roomy() }
  );
  assert.equal(viaJson.status, 200);
});

test("rejects unsupported, oversized, empty and unreadable input", async () => {
  const deps = { analyze, extractors: fakeExtractors, limiter: roomy() };

  const doc = await handleAnalyze(upload("old.doc", "x"), deps);
  assert.equal(doc.status, 415);
  assert.equal(errorOf(doc).code, "unsupported");

  const big = await handleAnalyze(upload("big.pdf", new Uint8Array(MAX_FILE_BYTES + 1)), deps);
  assert.equal(big.status, 413);
  assert.equal(errorOf(big).code, "too_large");

  const empty = await handleAnalyze(new Request("http://x/api", { method: "POST", body: new FormData() }), deps);
  assert.equal(empty.status, 422);

  const broken = await handleAnalyze(upload("bad.pdf", "x"), {
    ...deps,
    extractors: { ...fakeExtractors, pdf: async () => { throw new Error("corrupt"); } },
  });
  assert.equal(broken.status, 422);
  assert.equal(errorOf(broken).code, "unreadable");

  const plain = await handleAnalyze(new Request("http://x/api", { method: "POST", headers: { "Content-Type": "text/plain" }, body: "hi" }), deps);
  assert.equal(plain.status, 415);

  const longText = await handleAnalyze(
    new Request("http://x/api", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: "a".repeat(20001) }) }),
    deps
  );
  assert.equal(longText.status, 413);
});

test("a scanned pdf with almost no text is a clear 422", async () => {
  const res = await handleAnalyze(upload("scan.pdf", "x"), {
    analyze,
    extractors: { ...fakeExtractors, pdf: async () => "   \n  " },
    limiter: roomy(),
  });
  assert.equal(res.status, 422);
});

test("short extracted text is explained", async () => {
  const res = await handleAnalyze(upload("scan.pdf", "x"), {
    analyze,
    extractors: { ...fakeExtractors, pdf: async () => "Only a few words came out of this scan." },
    limiter: roomy(),
  });
  assert.equal(res.status, 422);
  assert.equal(errorOf(res).code, "too_short");
  assert.match(errorOf(res).message, /scanned PDF/);
});

test("rate limit kicks in per ip", async () => {
  const limiter = createRateLimiter(2, 60000);
  const send = (ip: string) =>
    handleAnalyze(
      new Request("http://x/api", { method: "POST", headers: { "Content-Type": "application/json", "x-forwarded-for": ip }, body: JSON.stringify({ text: RESUME }) }),
      { analyze, limiter }
    );
  assert.equal((await send("1.1.1.1")).status, 200);
  assert.equal((await send("1.1.1.1")).status, 200);
  assert.equal((await send("1.1.1.1")).status, 429);
  assert.equal((await send("2.2.2.2")).status, 200);
});

test("unexpected errors do not leak details", async () => {
  const boom = async () => {
    throw new Error("database password is hunter2");
  };
  const original = console.error;
  console.error = () => {};
  const res = await handleAnalyze(upload("resume.txt", RESUME), { analyze: boom as unknown as typeof analyze, limiter: roomy() });
  console.error = original;
  assert.equal(res.status, 500);
  assert.ok(!JSON.stringify(res.body).includes("hunter2"));
});
