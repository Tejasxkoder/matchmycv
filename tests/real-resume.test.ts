import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { analyzeResume } from "../server/analysis/analyze";
import { buildChecks } from "../server/analysis/build-checks";
import { analyzeSignals, normalizeText } from "../server/analysis/signals";
import { analyzeJd } from "../server/jd/analyze-jd";
import { buildInterviewSet } from "../server/interview/build-questions";
import { scoreRequirements } from "../lib/jd-types";

const text = normalizeText(readFileSync(join(__dirname, "data", "tejas-resume.txt"), "utf8"));

const jd = [
  "Backend Engineer",
  "Requirements",
  "- 2+ years of Node.js and TypeScript experience",
  "- Experience with Docker and Kubernetes",
  "- Strong SQL and PostgreSQL skills",
  "- Experience with AWS or GCP",
  "- Experience designing REST APIs",
  "Nice to have",
  "- Experience with Kafka or similar event streaming systems",
].join("\n");

const down = async () => {
  throw new Error("offline");
};

test("signals on a real developer resume", () => {
  const s = analyzeSignals(text);
  assert.equal(s.hasEmail, true);
  assert.equal(s.hasPhone, true);
  assert.deepEqual(s.sections, { experience: true, education: true, skills: true });
  for (const skill of ["Node.js", "TypeScript", "Next.js", "PostgreSQL", "Docker", "Kubernetes", "Redis", "MongoDB"]) {
    assert.ok(s.skills.includes(skill), `missing ${skill}`);
  }
  assert.ok(!s.skills.includes("Go"));
  assert.ok(s.wordCount > 400);
  assert.ok(s.weakPhrases.includes("worked on"));
});

test("github link inside a PDF hyperlink is not visible in the text", () => {
  assert.equal(analyzeSignals(text).githubUsername, null);
});

test("dashboard checks for this resume", () => {
  const checks = buildChecks(analyzeSignals(text), { targetRole: "", suggestions: [], toneFlags: [] });
  const by = Object.fromEntries(checks.map((c) => [c.id, c.status]));
  assert.equal(by.keywords, "pass");
  assert.equal(by.format, "pass");
  assert.equal(by.quantification, "fail");
  assert.equal(by.github, "pending");
  assert.equal(by.jd, "pending");
  assert.equal(by.skills, "pending");
});

test("full analysis keeps the rule based checks when the AI is offline", async () => {
  const result = await analyzeResume({ text, fileName: "resume.pdf" }, down);
  assert.equal(result.checks.length, 8);
  assert.equal(result.suggestions.length, 0);
  assert.equal(result.warnings.length, 1);
  assert.ok(result.skills.length >= 15);
});

test("full analysis accepts AI suggestions that quote the resume", async () => {
  const reply = JSON.stringify({
    targetRole: "full stack developer",
    suggestions: [
      {
        current: "Worked on the commercial real estate platform as a Freelance Full Stack Developer.",
        suggested: "Built [N] features on a commercial real estate platform used by [X] users as a freelance full stack developer.",
        category: "quantify",
        note: "Add scale",
      },
      { current: "This line is not in the resume at all.", suggested: "Invented", category: "tone", note: "" },
    ],
    toneFlags: ["worked on"],
  });
  const result = await analyzeResume({ text, fileName: "resume.pdf" }, async () => ({ content: reply, model: "test" }));
  assert.equal(result.targetRole, "full stack developer");
  assert.equal(result.suggestions.length, 1);
  assert.match(result.suggestions[0].suggested, /\[N\]/);
});

test("JD match on this resume without AI", async () => {
  const out = await analyzeJd({ resumeText: text, jdText: jd }, down);
  const verdict = (needle: string) => out.requirements.find((r) => r.text.includes(needle))?.verdict;
  assert.equal(out.source, "rules");
  assert.equal(verdict("Node.js"), "match");
  assert.equal(verdict("Docker and Kubernetes"), "match");
  assert.equal(verdict("AWS or GCP"), "missing");
  assert.equal(verdict("Kafka"), "missing");
  assert.deepEqual(out.requiredSkills.sort(), ["AWS", "Docker", "GCP", "Kafka", "Kubernetes", "Node.js", "PostgreSQL", "REST APIs", "SQL", "TypeScript"].sort());
  assert.equal(out.score, scoreRequirements(out.requirements).score);
  assert.ok(out.score >= 60 && out.score <= 80);
});

test("interview fallback uses real skills and the JD gap", async () => {
  const s = analyzeSignals(text);
  const set = await buildInterviewSet(
    { analysisId: "t", resumeText: text, targetRole: "full stack developer", skills: s.skills, missingSkills: ["AWS"], repos: ["PrepDost"] },
    down
  );
  assert.equal(set.source, "template");
  assert.ok(set.questions.some((q) => q.src === "Skill gap: AWS"));
  assert.ok(set.questions.some((q) => q.q.includes("PrepDost")));
  const cats = new Set(set.questions.map((q) => q.cat));
  assert.equal(cats.size, 3);
});
