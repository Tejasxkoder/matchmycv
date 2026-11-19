import test from "node:test";
import assert from "node:assert/strict";
import { analyzeJd, normalizeAiJd } from "../server/jd/analyze-jd";
import { extractRequirements, matchRequirement } from "../server/jd/rules";
import { scoreRequirements, verdictFor } from "../lib/jd-types";
import { handleJd } from "../server/handle-jd";
import { createRateLimiter } from "../server/rate-limit";

const resume = [
  "Arjun Kumar",
  "EXPERIENCE",
  "- Designed and documented REST APIs consumed by 14 downstream services.",
  "- Designed PostgreSQL schemas for 50M+ row datasets.",
  "- 6 years building distributed systems at Fintech Corp.",
  "SKILLS",
  "React, TypeScript, Node.js, PostgreSQL, Docker, REST APIs",
].join("\n");

const jd = [
  "Senior Software Engineer",
  "About the role",
  "You will build payment systems for millions of businesses.",
  "Requirements",
  "- 5+ years of backend engineering experience",
  "- Proficiency in Go or Rust",
  "- Experience with Kubernetes and Docker",
  "- Strong SQL and database design skills",
  "Nice to have",
  "- Experience with Kafka or similar event streaming systems",
].join("\n");

test("extracts requirements and tells nice-to-have apart", () => {
  const reqs = extractRequirements(jd);
  assert.equal(reqs.length, 5);
  assert.equal(reqs[4].kind, "nice");
  assert.ok(!reqs.some((r) => /payment systems/.test(r.text)));
});

test("rule matching gives match, partial and missing", () => {
  const lines = resume.split("\n");
  const skills = ["React", "TypeScript", "Node.js", "PostgreSQL", "Docker", "REST APIs"];
  assert.equal(matchRequirement("Experience with Docker", lines, skills).verdict, "match");
  assert.equal(matchRequirement("Experience with Kubernetes and Docker", lines, skills).verdict, "partial");
  assert.equal(matchRequirement("Proficiency in Go or Rust", lines, skills).verdict, "missing");
  assert.equal(matchRequirement("5+ years of backend engineering experience", lines, skills).verdict, "match");
});

test("score weights nice-to-have lower", () => {
  const base = { id: 1, evidence: null, note: "" };
  const { score } = scoreRequirements([
    { ...base, text: "a", kind: "required", verdict: "match" },
    { ...base, text: "b", kind: "required", verdict: "missing" },
    { ...base, text: "c", kind: "nice", verdict: "missing" },
  ]);
  assert.equal(score, 40);
  assert.equal(verdictFor(80).tone, "pass");
  assert.equal(verdictFor(30).tone, "fail");
});

test("AI output is validated against the resume", () => {
  const out = normalizeAiJd(
    {
      title: "Engineer",
      company: "Acme",
      requirements: [
        { text: "REST APIs", kind: "required", verdict: "match", evidence: "Designed and documented REST APIs consumed by 14 downstream services.", note: "" },
        { text: "Rust", kind: "required", verdict: "match", evidence: "Wrote Rust for years", note: "" },
        { text: "Kafka", kind: "nice", verdict: "partial", evidence: "", note: "" },
        { text: "Go", kind: "required", verdict: "missing", evidence: "", note: "Add Go" },
      ],
    },
    resume
  );
  assert.ok(out);
  assert.deepEqual(out.requirements.map((r) => r.verdict), ["match", "partial", "missing", "missing"]);
});

test("falls back to rules when the model fails", async () => {
  const result = await analyzeJd({ resumeText: resume, jdText: jd }, async () => {
    throw new Error("down");
  });
  assert.equal(result.source, "rules");
  assert.equal(result.warnings.length, 1);
  assert.equal(result.title, "Senior Software Engineer");
  assert.ok(result.requiredSkills.includes("Kubernetes"));
});

test("handler validates input and rate limits", async () => {
  const post = (body: unknown) =>
    new Request("http://x/api/jd-match", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  const limiter = createRateLimiter(2, 60000);
  assert.equal((await handleJd(post({ resumeText: resume }), { limiter })).status, 422);
  const ok = await handleJd(post({ resumeText: resume, jdText: jd }), {
    limiter,
    analyze: async () => ({ id: "1" }) as never,
  });
  assert.equal(ok.status, 200);
  assert.equal((await handleJd(post({}), { limiter })).status, 429);
});
