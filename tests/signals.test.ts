import test from "node:test";
import assert from "node:assert/strict";
import { analyzeSignals, detectSkills, hasMetric, normalizeText } from "../server/analysis/signals";
import { RESUME } from "./fixtures";

test("finds email, phone and github", () => {
  const s = analyzeSignals(RESUME);
  assert.equal(s.hasEmail, true);
  assert.equal(s.hasPhone, true);
  assert.equal(s.githubUsername, "arjunk");
});

test("phone formats", () => {
  const phones = ["+91 98765 43210", "98765 43210", "9876543210", "(415) 555-0123", "415-555-0123", "+1 415 555 0123"];
  for (const p of phones) assert.equal(analyzeSignals(`call ${p} now`).hasPhone, true, p);
  assert.equal(analyzeSignals("2019 2021 2022 and 2023").hasPhone, false);
});

test("detects sections", () => {
  const s = analyzeSignals(RESUME);
  assert.deepEqual(s.sections, { experience: true, education: true, skills: true });
  const bare = analyzeSignals("Just a name and a paragraph about nothing in particular.");
  assert.deepEqual(bare.sections, { experience: false, education: false, skills: false });
});

test("skill matching respects word boundaries", () => {
  assert.deepEqual(detectSkills("PostgreSQL"), ["PostgreSQL"]);
  assert.deepEqual(detectSkills("JavaScript"), ["JavaScript"]);
  assert.deepEqual(detectSkills("Go and Rust"), ["Go", "Rust"]);
  assert.deepEqual(detectSkills("go to the market"), []);
  assert.deepEqual(detectSkills("GitHub"), ["GitHub"]);
  assert.deepEqual(detectSkills("Node.js, Next.js"), ["Next.js", "Node.js"]);
});

test("skills from the fixture", () => {
  const skills = analyzeSignals(RESUME).skills;
  for (const name of ["React", "TypeScript", "Node.js", "PostgreSQL", "Docker", "AWS", "Kubernetes", "Redis", "GraphQL", "Git", "CI/CD", "Python"]) {
    assert.ok(skills.includes(name), name);
  }
});

test("counts bullets and quantified bullets", () => {
  const s = analyzeSignals(RESUME);
  assert.equal(s.bulletCount, 6);
  assert.equal(s.quantifiedBulletCount, 1);
});

test("metric detection ignores years and months", () => {
  assert.equal(hasMetric("Led the team in 2021"), false);
  assert.equal(hasMetric("Jan 2020 to Mar 2021 at Fintech Corp"), false);
  assert.equal(hasMetric("Cut cloud costs by 40%"), true);
  assert.equal(hasMetric("Managed a team of 3 engineers"), true);
});

test("flags gender coded and weak phrases", () => {
  const s = analyzeSignals(RESUME);
  assert.deepEqual(s.biasWords, ["aggressive"]);
  assert.deepEqual(s.weakPhrases.sort(), ["responsible for", "worked on"]);
});

test("flags column spacing and thin extraction", () => {
  const columns = "Name      Role      Years\nA         B         C\nD         E         F\nG         H         I";
  const s = analyzeSignals(columns);
  assert.ok(s.atsFlags.some((f) => f.includes("multi-column") || f.includes("Table")));
  assert.ok(s.atsFlags.some((f) => f.includes("Very little text")));
  assert.deepEqual(analyzeSignals(RESUME).atsFlags.filter((f) => f.includes("Table")), []);
});

test("normalizeText tidies whitespace", () => {
  assert.equal(normalizeText("a\r\n\r\n\r\n\r\nb  \n"), "a\n\nb");
});
