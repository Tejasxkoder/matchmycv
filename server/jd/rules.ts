import { detectSkills, stripBullet } from "../analysis/signals";
import { lineMentioning } from "../../lib/skill-match";
import type { JdKind, JdRequirement, JdVerdict } from "../../lib/jd-types";

const NICE_HEADING = /nice\s+to\s+have|preferred|bonus|good\s+to\s+have|desirable|optional|a\s+plus/i;
const REQUIRED_HEADING = /requirements?|qualifications?|what\s+you.{0,3}ll\s+need|must\s+have|you\s+have|who\s+you\s+are|about\s+you|looking\s+for|skills|experience/i;
const SKIP_HEADING = /about\s+the|responsibilit|what\s+you.{0,3}ll\s+do|benefits|perks|compensation|we\s+offer|why\s+join|overview|the\s+role|the\s+team/i;
const STOPWORDS = new Set(
  "with that this have from your will their they them into over under such also more than which where when able strong good experience familiarity knowledge ability working work years year using used within across about must should could would these those other including etc proven solid deep demonstrated plus".split(" ")
);

function stem(word: string): string {
  return word.replace(/(ing|ed|es|s)$/, "");
}

function tokens(text: string): Set<string> {
  return new Set(
    (text.toLowerCase().match(/[a-z][a-z0-9+#.-]{3,}/g) ?? [])
      .filter((w) => !STOPWORDS.has(w))
      .map(stem)
  );
}

function isHeading(line: string): boolean {
  if (line.length > 60 || /[.!?]$/.test(line)) return false;
  if (/^[•●▪\-*–]\s/.test(line)) return false;
  return line.endsWith(":") || line === line.toUpperCase() || NICE_HEADING.test(line) || REQUIRED_HEADING.test(line) || SKIP_HEADING.test(line);
}

export function extractRequirements(jdText: string): { text: string; kind: JdKind }[] {
  const lines = jdText.split("\n").map((l) => l.trim()).filter(Boolean);
  const sawHeading = lines.slice(1).some(isHeading);
  let section: "required" | "nice" | "skip" | null = sawHeading ? null : "required";
  const found: { text: string; kind: JdKind }[] = [];
  const seen = new Set<string>();

  lines.forEach((line, index) => {
    if (index === 0 && sawHeading) return;
    if (isHeading(line)) {
      if (NICE_HEADING.test(line)) section = "nice";
      else if (SKIP_HEADING.test(line) && !REQUIRED_HEADING.test(line)) section = "skip";
      else if (REQUIRED_HEADING.test(line)) section = "required";
      else section = "skip";
      return;
    }
    if (section === null || section === "skip") return;
    const parts = stripBullet(line).split(/(?<=[.!?])\s+(?=[A-Z])/);
    for (const part of parts) {
      const text = part.replace(/[.;]$/, "").trim();
      if (text.length < 8 || text.length > 240 || text.split(/\s+/).length < 3) continue;
      const key = text.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      found.push({ text, kind: section });
    }
  });

  if (found.length === 0) {
    for (const skill of detectSkills(jdText).slice(0, 12)) {
      found.push({ text: `Experience with ${skill}`, kind: "required" });
    }
  }
  return found.slice(0, 15);
}

export function guessTitle(jdText: string): string {
  const first = jdText.split("\n").map((l) => l.trim()).find(Boolean) ?? "";
  return first.length <= 100 ? first : first.slice(0, 97) + "...";
}

export function guessCompany(jdText: string): string {
  const labelled = jdText.match(/(?:company|employer)\s*:\s*([^\n]{2,60})/i);
  if (labelled) return labelled[1].trim();
  const at = jdText.slice(0, 200).match(/\bat\s+([A-Z][A-Za-z0-9&.\- ]{1,40})/);
  return at ? at[1].trim() : "";
}

function yearsClaimed(resumeLines: string[]): { years: number; line: string } | null {
  let best: { years: number; line: string } | null = null;
  for (const line of resumeLines) {
    for (const m of line.matchAll(/(\d{1,2})\+?\s*(?:years?|yrs?)/gi)) {
      const years = Number(m[1]);
      if (!best || years > best.years) best = { years, line };
    }
  }
  return best;
}

export function matchRequirement(
  text: string,
  resumeLines: string[],
  resumeSkills: string[]
): { verdict: JdVerdict; evidence: string | null; note: string } {
  const resumeText = resumeLines.join("\n");
  const skills = detectSkills(text);

  if (skills.length > 0) {
    const have = new Set(resumeSkills.map((s) => s.toLowerCase()));
    const present = skills.filter((s) => have.has(s.toLowerCase()));
    const alternation = skills.length > 1 && /\bor\b|\//i.test(text);
    const evidence = present.length ? lineMentioning(resumeText, present[0]) : null;
    if (present.length === skills.length || (alternation && present.length > 0)) {
      return { verdict: "match", evidence, note: "Confirmed in your resume" };
    }
    if (present.length > 0) {
      const absent = skills.filter((s) => !have.has(s.toLowerCase()));
      return { verdict: "partial", evidence, note: `Partly covered. Not found: ${absent.join(", ")}.` };
    }
    return { verdict: "missing", evidence: null, note: `Not found in resume: ${skills.join(", ")}.` };
  }

  const years = text.match(/(\d{1,2})\+?\s*years?/i);
  if (years) {
    const claim = yearsClaimed(resumeLines);
    if (claim) {
      const needed = Number(years[1]);
      return claim.years >= needed
        ? { verdict: "match", evidence: claim.line, note: "Confirmed in your resume" }
        : { verdict: "partial", evidence: claim.line, note: `Role asks for ${needed}+ years, resume shows ${claim.years}.` };
    }
  }

  const wanted = tokens(text);
  if (wanted.size === 0) return { verdict: "missing", evidence: null, note: "Not found in resume." };
  let bestLine: string | null = null;
  let bestRatio = 0;
  for (const line of resumeLines) {
    const have = tokens(line);
    let hits = 0;
    for (const w of wanted) if (have.has(w)) hits += 1;
    const ratio = hits / wanted.size;
    if (ratio > bestRatio) {
      bestRatio = ratio;
      bestLine = line;
    }
  }
  if (bestRatio >= 0.5) return { verdict: "match", evidence: bestLine, note: "Confirmed in your resume" };
  if (bestRatio >= 0.25) {
    return { verdict: "partial", evidence: bestLine, note: "Weak match. Add specifics that mirror the wording in the job description." };
  }
  return { verdict: "missing", evidence: null, note: "Not found in resume." };
}

export function analyzeByRules(jdText: string, resumeText: string): JdRequirement[] {
  const resumeLines = resumeText.split("\n").map((l) => stripBullet(l)).filter(Boolean);
  const resumeSkills = detectSkills(resumeText);
  return extractRequirements(jdText).map((req, i) => ({
    id: i + 1,
    text: req.text,
    kind: req.kind,
    ...matchRequirement(req.text, resumeLines, resumeSkills),
  }));
}
