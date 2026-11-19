import test from "node:test";
import assert from "node:assert/strict";
import { AnalysisError, analyzeResume } from "../server/analysis/analyze";
import { OpenRouterError } from "../server/ai/openrouter";
import { countChecks } from "../lib/analysis-types";
import { GOOD_AI_REPLY, RESUME, replyWith } from "./fixtures";

type Chat = Parameters<typeof analyzeResume>[1];

function scripted(replies: Array<ReturnType<typeof replyWith> | Error>) {
  const calls: unknown[][] = [];
  const chat = (async (messages: unknown[]) => {
    calls.push(messages);
    const next = replies.shift();
    if (!next) throw new Error("no more scripted replies");
    if (next instanceof Error) throw next;
    return next;
  }) as unknown as Chat;
  return { chat, calls };
}

const input = { text: RESUME, fileName: "arjun.pdf" };

test("full run with a good AI reply", async () => {
  const { chat, calls } = scripted([replyWith(GOOD_AI_REPLY)]);
  const result = await analyzeResume(input, chat);

  assert.equal(calls.length, 1);
  assert.equal(result.source, "ai");
  assert.equal(result.model, "mock/free-model");
  assert.equal(result.targetRole, "backend engineer");
  assert.deepEqual(result.warnings, []);
  assert.equal(result.fileName, "arjun.pdf");
  assert.equal(result.suggestions.length, 3);
  assert.ok(result.skills.includes("React"));
  assert.ok(result.resumeText.startsWith("Arjun Kumar"));
  assert.equal(result.checks.length, 8);
  assert.deepEqual(result.checks.map((c) => c.id), ["ats", "quantification", "keywords", "tone", "format", "github", "jd", "skills"]);
});

test("check results for the fixture resume", async () => {
  const { chat } = scripted([replyWith(GOOD_AI_REPLY)]);
  const { checks } = await analyzeResume(input, chat);
  const by = Object.fromEntries(checks.map((c) => [c.id, c]));

  assert.equal(by.ats.status, "warn");
  assert.equal(by.ats.detail, "2 formatting issues may block parsing");
  assert.equal(by.quantification.status, "fail");
  assert.equal(by.quantification.detail, "5 of 6 bullets lack measurable impact");
  assert.equal(by.keywords.status, "pass");
  assert.equal(by.tone.status, "warn");
  assert.equal(by.tone.detail, "3 flagged phrases");
  assert.equal(by.format.status, "warn");
  assert.equal(by.format.detail, "Resume is very short");
  assert.equal(by.github.sublabel, "github.com/arjunk found");
  assert.deepEqual([by.github.status, by.jd.status, by.skills.status], ["pending", "pending", "pending"]);
  assert.deepEqual(countChecks(checks), { pass: 1, warn: 3, fail: 1, pending: 3 });
});

test("retries once when the first reply is not JSON", async () => {
  const { chat, calls } = scripted([
    { content: "Sorry, here is my analysis in words.", model: "mock/free-model" },
    replyWith(GOOD_AI_REPLY, false),
  ]);
  const result = await analyzeResume(input, chat);
  assert.equal(calls.length, 2);
  assert.equal(result.suggestions.length, 3);
  assert.deepEqual(result.warnings, []);
});

test("gives up after two bad replies but still returns the rule based checks", async () => {
  const bad = { content: "still not json", model: "mock/free-model" };
  const { chat, calls } = scripted([bad, bad]);
  const result = await analyzeResume(input, chat);
  assert.equal(calls.length, 2);
  assert.equal(result.suggestions.length, 0);
  assert.equal(result.model, null);
  assert.equal(result.checks.length, 8);
  assert.match(result.warnings[0], /valid JSON/);
  assert.equal(result.targetRole, "software engineer");
});

test("a rate limit does not stop the run and is not retried", async () => {
  const { chat, calls } = scripted([new OpenRouterError("rate_limited", "Free models are rate limited right now.", 429)]);
  const result = await analyzeResume(input, chat);
  assert.equal(calls.length, 1);
  assert.match(result.warnings[0], /rate limited/);
  assert.equal(result.checks.find((c) => c.id === "quantification")?.status, "fail");
});

test("a reply with only invented lines produces a warning", async () => {
  const invented = { targetRole: "x", suggestions: [{ current: "A line that is nowhere in the resume text.", suggested: "Better.", category: "tone", note: "n" }], toneFlags: [] };
  const { chat } = scripted([replyWith(invented)]);
  const result = await analyzeResume(input, chat);
  assert.equal(result.suggestions.length, 0);
  assert.match(result.warnings[0], /no usable rewrite/);
});

test("rejects text that is too short", async () => {
  const { chat, calls } = scripted([]);
  await assert.rejects(analyzeResume({ text: "tiny", fileName: "x.txt" }, chat), (e: unknown) => e instanceof AnalysisError && e.code === "too_short");
  assert.equal(calls.length, 0);
});

test("long resumes are truncated in the prompt only", async () => {
  const long = RESUME + "\n" + "Maintained internal tooling for the platform team every quarter.\n".repeat(400);
  const { chat, calls } = scripted([replyWith({ targetRole: "x", suggestions: [], toneFlags: [] })]);
  const result = await analyzeResume({ text: long, fileName: "long.txt" }, chat);
  const user = (calls[0] as { role: string; content: string }[])[1].content;
  assert.ok(user.length < 12500);
  assert.ok(result.resumeText.length > 20000);
});
