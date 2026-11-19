import test from "node:test";
import assert from "node:assert/strict";
import { normalizeAiOutput } from "../server/analysis/validate";
import { GOOD_AI_REPLY, RESUME } from "./fixtures";

test("keeps real lines and drops invented ones", () => {
  const out = normalizeAiOutput(GOOD_AI_REPLY, RESUME);
  assert.equal(out.suggestions.length, 3);
  for (const s of out.suggestions) assert.ok(RESUME.includes(s.current), s.current);
  assert.ok(!out.suggestions.some((s) => s.current.includes("forty")));
});

test("orders suggestions by position and numbers them", () => {
  const out = normalizeAiOutput(GOOD_AI_REPLY, RESUME);
  assert.deepEqual(out.suggestions.map((s) => s.id), [1, 2, 3]);
  assert.deepEqual(out.suggestions.map((s) => s.category), ["quantify", "tone", "ats"]);
});

test("snaps a near-verbatim line back to the resume text", () => {
  const out = normalizeAiOutput(
    {
      suggestions: [
        { current: "- worked on improving system performance", suggested: "Cut p99 latency by [X]%.", category: "quantify", note: "x" },
      ],
    },
    RESUME
  );
  assert.equal(out.suggestions.length, 1);
  assert.equal(out.suggestions[0].current, "Worked on improving system performance.");
});

test("does not snap a short fragment of a longer line", () => {
  const out = normalizeAiOutput(
    { suggestions: [{ current: "Led development of features", suggested: "Led [N] features.", category: "quantify", note: "x" }] },
    RESUME
  );
  assert.equal(out.suggestions.length, 1);
  assert.equal(out.suggestions[0].current, "Led development of features");
});

test("an unchanged line becomes ok, and only one ok survives", () => {
  const line = "Built a recommendation engine for the platform.";
  const other = "Worked on improving system performance.";
  const out = normalizeAiOutput(
    {
      suggestions: [
        { current: line, suggested: line, category: "quantify", note: "" },
        { current: other, suggested: other, category: "ok", note: "" },
      ],
    },
    RESUME
  );
  assert.equal(out.suggestions.length, 1);
  assert.equal(out.suggestions[0].category, "ok");
  assert.equal(out.suggestions[0].changed, false);
  assert.equal(out.suggestions[0].note, "Looks good as written");
});

test("fixes an ok category on a changed line", () => {
  const out = normalizeAiOutput(
    { suggestions: [{ current: "Built a recommendation engine for the platform.", suggested: "Built a ranking service for [N] users.", category: "ok", note: "" }] },
    RESUME
  );
  assert.equal(out.suggestions[0].category, "quantify");
});

test("filters tone flags to phrases present in the resume", () => {
  const out = normalizeAiOutput(GOOD_AI_REPLY, RESUME);
  assert.deepEqual(out.toneFlags, ["aggressive"]);
});

test("cleans the role and survives garbage", () => {
  assert.equal(normalizeAiOutput({ targetRole: "  Backend <b>Engineer</b>!! " }, RESUME).targetRole, "Backend Engineer");
  assert.deepEqual(normalizeAiOutput(null, RESUME), { targetRole: "", suggestions: [], toneFlags: [] });
  assert.deepEqual(normalizeAiOutput("text", RESUME).suggestions, []);
  assert.deepEqual(normalizeAiOutput({ suggestions: "nope", toneFlags: 5 }, RESUME).suggestions, []);
});

test("caps at eight suggestions", () => {
  const lines = Array.from({ length: 12 }, (_, i) => `Delivered migration number ${i + 1} for the billing platform on time.`);
  const text = lines.join("\n");
  const out = normalizeAiOutput(
    { suggestions: lines.map((l) => ({ current: l, suggested: `${l} Saved [X] hours.`, category: "quantify", note: "n" })) },
    text
  );
  assert.equal(out.suggestions.length, 8);
});
