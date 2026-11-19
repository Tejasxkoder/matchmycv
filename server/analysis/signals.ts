import { SKILLS } from "./skills-vocab";

export type Signals = {
  wordCount: number;
  hasEmail: boolean;
  hasPhone: boolean;
  githubUsername: string | null;
  sections: { experience: boolean; education: boolean; skills: boolean };
  skills: string[];
  bulletCount: number;
  quantifiedBulletCount: number;
  biasWords: string[];
  weakPhrases: string[];
  atsFlags: string[];
};

export function normalizeText(raw: string): string {
  return raw
    .replace(/\r\n?/g, "\n")
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&");
}

const SKILL_MATCHERS = SKILLS.map((def) => {
  const names = [def.name, ...(def.aliases ?? [])].map(escapeRe).join("|");
  return {
    name: def.name,
    re: new RegExp(`(?<![A-Za-z0-9+#.])(?:${names})(?![A-Za-z0-9+#]|\\.[A-Za-z])`, def.caseSensitive ? "" : "i"),
  };
});

export function detectSkills(text: string): string[] {
  return SKILL_MATCHERS.filter((m) => m.re.test(text)).map((m) => m.name);
}

const EMAIL = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
const PHONE = new RegExp(
  [
    "\\+\\d{1,3}[\\s.-]?\\d{4,5}[\\s.-]?\\d{4,6}",
    "(?:\\+?\\d{1,3}[\\s.-]?)?\\(?\\d{3}\\)?[\\s.-]\\d{3}[\\s.-]\\d{4}",
    "\\b\\d{5}[\\s-]\\d{5}\\b",
    "\\b\\d{10}\\b",
  ].join("|")
);

const BIAS_WORDS = [
  "aggressive",
  "aggressively",
  "dominant",
  "dominate",
  "dominated",
  "ninja",
  "rockstar",
  "rock star",
  "guru",
  "ruthless",
  "fearless",
  "forceful",
  "headstrong",
  "assertive",
  "manpower",
  "salesman",
  "chairman",
];

const WEAK_PHRASES = [
  "responsible for",
  "worked on",
  "helped with",
  "helped to",
  "assisted in",
  "assisted with",
  "involved in",
  "duties included",
  "participated in",
];

function findPhrases(text: string, phrases: string[]): string[] {
  const lower = text.toLowerCase();
  return phrases.filter((p) => new RegExp(`(?<![a-z])${escapeRe(p)}(?![a-z])`).test(lower));
}

const SECTION_PATTERNS = {
  experience: "(?:work\\s+|professional\\s+)?experience|employment(?:\\s+history)?|internships?",
  education: "education|academics?|qualifications?",
  skills: "(?:technical\\s+|key\\s+)?skills|technologies|tech\\s+stack",
};

function hasSection(text: string, pattern: string): boolean {
  const heading = new RegExp(`(?:^|\\n)\\s*(?:${pattern})\\s*:?\\s*(?:\\n|$)`, "i");
  const upperAnywhere = new RegExp(`\\b(?:${pattern.toUpperCase()})\\b`);
  return heading.test(text) || upperAnywhere.test(text);
}

const ACTION_VERBS = new Set(
  (
    "led built designed developed implemented created managed delivered launched improved reduced increased " +
    "optimized optimised automated migrated architected owned shipped drove established mentored coordinated " +
    "analyzed analysed integrated maintained refactored deployed engineered wrote scaled streamlined spearheaded " +
    "collaborated resolved debugged tested introduced replaced configured supported trained handled organised organized " +
    "responsible worked helped assisted involved participated"
  ).split(" ")
);

const BULLET_MARKER = /^[\s]*[\u2022\u25CF\u25AA\u25E6\u2023\u00B7\-*\u2013\u2014]\s+/;

export function stripBullet(line: string): string {
  return line.replace(BULLET_MARKER, "").trim();
}

function candidateLines(text: string): string[] {
  let lines = text.split("\n");
  if (lines.length < 8 && text.length > 1200) {
    lines = text.split(/\s*[\u2022\u25CF\u25AA\u25E6\u2023]\s*|(?<=[.!?])\s+(?=[A-Z])/);
  }
  return lines.map((l) => l.trim()).filter(Boolean);
}

function isBulletLine(line: string): boolean {
  const hadMarker = BULLET_MARKER.test(line);
  const body = stripBullet(line);
  const words = body.split(/\s+/).filter(Boolean);
  if (words.length < 4 || words.length > 60) return false;
  if (/@|https?:\/\/|linkedin\.com|github\.com/i.test(body)) return false;
  if (body === body.toUpperCase()) return false;
  if (hadMarker) return true;
  if (words.length < 6) return false;
  const first = words[0].toLowerCase().replace(/[^a-z]/g, "");
  return ACTION_VERBS.has(first) || (/(?:ed|ing)$/.test(first) && first.length > 4);
}

const MONTHS = /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.?\b/gi;

export function hasMetric(line: string): boolean {
  const stripped = line.replace(/\b(?:19|20)\d{2}\b/g, " ").replace(MONTHS, " ");
  return /\d/.test(stripped);
}

export function analyzeSignals(text: string): Signals {
  const wordCount = text.split(/\s+/).filter(Boolean).length;

  const bullets = candidateLines(text).filter(isBulletLine);
  const quantified = bullets.filter((l) => hasMetric(l));

  const atsFlags: string[] = [];
  const columnar = text.split("\n").filter((l) => /\S {3,}\S|\t/.test(l)).length;
  if (columnar >= 3) atsFlags.push(`Table or multi-column spacing in ${columnar} lines`);
  if (wordCount < 150) atsFlags.push("Very little text could be extracted, so the file may be image based");
  const glyphs = (text.match(/[\u2190-\u2BFF\uE000-\uF8FF\u{1F300}-\u{1FAFF}]/gu) ?? []).length;
  if (glyphs >= 3) atsFlags.push("Icon or emoji glyphs that many parsers drop");

  const github = text.match(/github\.com\/([A-Za-z0-9-]{1,39})(?![A-Za-z0-9-])/i);

  return {
    wordCount,
    hasEmail: EMAIL.test(text),
    hasPhone: PHONE.test(text),
    githubUsername: github ? github[1] : null,
    sections: {
      experience: hasSection(text, SECTION_PATTERNS.experience),
      education: hasSection(text, SECTION_PATTERNS.education),
      skills: hasSection(text, SECTION_PATTERNS.skills),
    },
    skills: detectSkills(text),
    bulletCount: bullets.length,
    quantifiedBulletCount: quantified.length,
    biasWords: findPhrases(text, BIAS_WORDS),
    weakPhrases: findPhrases(text, WEAK_PHRASES),
    atsFlags,
  };
}
