import test from "node:test";
import assert from "node:assert/strict";
import { applyAccepted } from "../lib/apply-changes";
import { shortTimeAgo, timeAgo } from "../lib/format";
import { scoreMatch } from "../lib/job-match";
import {
  currencyForCountry,
  formatAnnualSalary,
  formatAnnualSalaryRange,
} from "../lib/salary";
import { createRateLimiter } from "../server/rate-limit";
import { extractResumeText } from "../server/parsing/extract-text";
import type { Suggestion } from "../lib/analysis-types";

const suggestion = (id: number, current: string, suggested: string): Suggestion => ({
  id,
  current,
  suggested,
  category: "quantify",
  note: "",
  changed: current !== suggested,
});

test("applies only accepted suggestions", () => {
  const text = "Line one is here.\nLine two is here.\nLine three is here.";
  const list = [suggestion(1, "Line one is here.", "First line, improved."), suggestion(2, "Line two is here.", "Second line, improved.")];
  const out = applyAccepted(text, list, { 1: "accepted", 2: "rejected" });
  assert.equal(out.text, "First line, improved.\nLine two is here.\nLine three is here.");
  assert.equal(out.applied, 1);
});

test("skips missing lines and counts placeholders", () => {
  const text = "Worked on speed.";
  const list = [
    suggestion(1, "Worked on speed.", "Cut latency by [X]% for [N] users."),
    suggestion(2, "A line that is gone.", "Anything."),
  ];
  const out = applyAccepted(text, list, { 1: "accepted", 2: "accepted" });
  assert.equal(out.text, "Cut latency by [X]% for [N] users.");
  assert.deepEqual([out.applied, out.skipped, out.unresolved], [1, 1, 2]);
});

test("unchanged ok lines are never applied", () => {
  const out = applyAccepted("Same line here.", [suggestion(1, "Same line here.", "Same line here.")], { 1: "accepted" });
  assert.equal(out.applied, 0);
});

test("relative times", () => {
  const now = Date.parse("2026-01-01T12:00:00Z");
  assert.equal(timeAgo("2026-01-01T11:59:50Z", now), "just now");
  assert.equal(timeAgo("2026-01-01T11:55:00Z", now), "5 minutes ago");
  assert.equal(timeAgo("2026-01-01T10:00:00Z", now), "2 hours ago");
  assert.equal(timeAgo("2025-12-29T12:00:00Z", now), "3 days ago");
  assert.equal(shortTimeAgo("2026-01-01T10:00:00Z", now), "2h ago");
  assert.equal(timeAgo("nonsense", now), "unknown");
});

test("job market score measures coverage of skills in the posting", () => {
  const resumeSkills = [
    "JavaScript",
    "TypeScript",
    "Java",
    "SQL",
    "React",
    "Next.js",
    "Tailwind CSS",
    "CSS",
    "Node.js",
    "Express.js",
    "REST APIs",
    "PostgreSQL",
    "MongoDB",
    "Redis",
    "Docker",
    "Kubernetes",
    "Git",
    "GitHub",
  ];
  assert.equal(scoreMatch(resumeSkills, ["React", "Python"]), 50);
  assert.equal(scoreMatch(resumeSkills, []), 0);
});

test("formats Indian annual salary in LPA and other currencies compactly", () => {
  assert.equal(currencyForCountry("IN"), "INR");
  assert.equal(formatAnnualSalaryRange(300000, 400000, "INR"), "₹3–4 LPA");
  assert.equal(formatAnnualSalary(400000, "INR"), "₹4L");
  assert.equal(formatAnnualSalaryRange(100000, 160000, "USD"), "$100K – $160K");
});

test("rate limiter window", () => {
  const limiter = createRateLimiter(2, 1000);
  assert.equal(limiter.take("a", 0).ok, true);
  assert.equal(limiter.take("a", 100).ok, true);
  const blocked = limiter.take("a", 200);
  assert.equal(blocked.ok, false);
  assert.equal(blocked.retryInSeconds, 1);
  assert.equal(limiter.take("a", 1001).ok, true);
});

test("plain text files decode", async () => {
  const bytes = new TextEncoder().encode("hello résumé");
  assert.equal(await extractResumeText({ name: "a.TXT", bytes }), "hello résumé");
});
