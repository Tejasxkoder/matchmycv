import test from "node:test";
import assert from "node:assert/strict";
import { bucketActivity, fetchGithub, GithubError } from "../server/github/fetch-github";
import { githubEvidence } from "../lib/github-types";
import { normalizeQuestions, buildInterviewSet } from "../server/interview/build-questions";
import { templateQuestions } from "../server/interview/templates";
import { certStatus } from "../lib/certs-store";
import { buildSkillGraph } from "../lib/skill-graph";
import { mergeChecks } from "../lib/live-checks";
import { buildSampleAnalysis } from "../lib/sample-analysis";
import { buildSampleJd } from "../lib/sample-jd";

const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status });

test("fetches and summarises a github profile", async () => {
  const now = new Date().toISOString();
  const fake = (async (url: string) => {
    if (url.endsWith("/users/octo")) return json({ login: "octo", public_repos: 3, followers: 9, html_url: "https://github.com/octo" });
    if (url.includes("/repos")) {
      return json([
        { name: "a", stargazers_count: 5, language: "TypeScript", topics: ["react"], html_url: "u" },
        { name: "b", stargazers_count: 50, language: "Go", topics: [], html_url: "u" },
        { name: "c", stargazers_count: 999, language: "Rust", fork: true },
      ]);
    }
    return json([{ created_at: now, type: "PushEvent", payload: { size: 3 } }]);
  }) as unknown as typeof fetch;
  const out = await fetchGithub("octo", fake);
  assert.equal(out.totalStars, 55);
  assert.equal(out.topRepos[0].name, "b");
  assert.equal(Object.values(out.activity)[0], 6);
  assert.ok(githubEvidence(out, "TypeScript") > 0);
  assert.ok(githubEvidence(out, "React") > 0);
  assert.equal(githubEvidence(out, "Rust"), 0);
});

test("github errors are typed", async () => {
  const missing = (async () => json({}, 404)) as unknown as typeof fetch;
  await assert.rejects(() => fetchGithub("nobody", missing), (e: unknown) => e instanceof GithubError && e.code === "not_found");
  await assert.rejects(() => fetchGithub("bad name!", missing), GithubError);
});

test("old events are dropped from the heatmap", () => {
  const old = new Date(Date.now() - 200 * 86400000).toISOString();
  assert.deepEqual(bucketActivity([{ created_at: old, type: "PushEvent" }]), {});
});

test("interview questions are validated", () => {
  const out = normalizeQuestions({
    questions: [
      { cat: "technical", lvl: "hard", q: "Q?", a: "A.", hint: "h" },
      { cat: "nonsense", q: "Q?", a: "A." },
      { cat: "Behavioral", q: "", a: "A." },
    ],
  });
  assert.equal(out.length, 1);
  assert.equal(out[0].cat, "Technical");
  assert.equal(out[0].lvl, "HARD");
});

test("interview set falls back to templates", async () => {
  const set = await buildInterviewSet(
    { analysisId: "x", resumeText: "r".repeat(300), targetRole: "dev", skills: ["React"], missingSkills: ["Kubernetes"], repos: [] },
    async () => {
      throw new Error("down");
    }
  );
  assert.equal(set.source, "template");
  assert.equal(set.questions.length, 9);
  assert.ok(templateQuestions({ skills: [], missingSkills: [], repos: [] }).length >= 8);
});

test("certificate status", () => {
  const base = { id: "1", name: "n", issuer: "", issued: "", expires: "", url: "" };
  assert.equal(certStatus(base), "unverified");
  assert.equal(certStatus({ ...base, url: "https://x" }), "active");
  assert.equal(certStatus({ ...base, url: "https://x", expires: "2020-01" }), "expired");
});

test("skill graph and live checks use the JD", () => {
  const sample = buildSampleAnalysis();
  const analysis = { ...sample, runNumber: 1, statuses: {} };
  const jd = { ...buildSampleJd("x", "", ""), analysisId: analysis.id };
  const graph = buildSkillGraph(analysis, jd, null);
  assert.ok(graph.counts.missing >= 3);
  assert.ok(graph.edges.length > 0);
  assert.equal(graph.nodes.length, graph.counts.verified + graph.counts.partial + graph.counts.missing);
  const checks = mergeChecks(analysis, { jd });
  assert.notEqual(checks.find((c) => c.id === "jd")?.status, "pending");
  assert.notEqual(checks.find((c) => c.id === "skills")?.status, "pending");
});
