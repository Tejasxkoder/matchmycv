import type { AnalysisResult, Check, Suggestion } from "./analysis-types";

const checks: Check[] = [
  { id: "ats", title: "ATS Compatibility", sublabel: "tables, graphics, custom fonts", status: "warn", detail: "3 formatting issues block parsing", actionLabel: "Fix issues", href: "/resume-analysis" },
  { id: "quantification", title: "Quantification", sublabel: "missing numbers, percentages, scale", status: "fail", detail: "8 of 11 bullets lack measurable impact", actionLabel: "Add metrics", href: "/resume-analysis" },
  { id: "keywords", title: "Keyword Density", sublabel: "matched 47/50 required terms", status: "pass", detail: "94% coverage for target role", actionLabel: "View report", href: "/resume-analysis" },
  { id: "tone", title: "Bias & Tone", sublabel: '"aggressive", "dominant"', status: "warn", detail: "2 gender-coded phrases flagged", actionLabel: "Review flags", href: "/resume-analysis" },
  { id: "format", title: "Format Compliance", sublabel: "length, sections, contact block", status: "pass", detail: "All structural checks pass", actionLabel: "View report", href: "/resume-analysis" },
  { id: "github", title: "GitHub Signals", sublabel: "23 public repos · 4 starred > 50", status: "pass", detail: "847 contributions verified", actionLabel: "View profile", href: "/credibility" },
  { id: "jd", title: "JD Match", sublabel: "Senior Software Engineer · Stripe", status: "warn", detail: "67% match for target role", actionLabel: "Improve match", href: "/jd-match" },
  { id: "skills", title: "Skill Gap", sublabel: "Kubernetes, GraphQL, Terraform, AWS", status: "fail", detail: "4 missing dependencies for target roles", actionLabel: "View roadmap", href: "/skill-roadmap" },
];

const rows: [string, string, Suggestion["category"], string][] = [
  ["Led development of features for the product.", "Led development of 12 features for 3M+ active users, reducing load time by 40%.", "quantify", "Add scale and measurable outcome"],
  ["Responsible for managing the team and coordinating sprints.", "Managed 6-person engineering team across 8 sprints, shipping 4 major releases on schedule.", "quantify", "Replace passive voice, add team size and output"],
  ["Experience with React, TypeScript, and Node.js", "Experience with React, TypeScript, and Node.js", "ok", "Keyword match confirmed"],
  ["Worked on improving system performance.", "Reduced API p99 latency from 800ms to 120ms by introducing Redis caching and query batching.", "quantify", "Vague impact, add specific before and after numbers"],
  ["Aggressive approach to problem-solving.", "Methodical approach to problem-solving.", "tone", '"Aggressive" is gender-coded, neutral alternative suggested'],
  ["Education section uses a two-column table layout.", "Education section uses plain text layout.", "ats", "Tables fail ATS parsing, convert to single-column text"],
  ["Built a recommendation engine for the platform.", "Built a collaborative-filtering recommendation engine that increased click-through rate by 22%.", "quantify", "Add algorithm type and business outcome"],
  ["Skills: React, TS, Node, Postgres, Docker", "Skills: React, TypeScript, Node.js, PostgreSQL, Docker, REST APIs, CI/CD", "ats", 'Expand abbreviations, ATS may not match "TS" to "TypeScript"'],
];

export function buildSampleAnalysis(now: number = Date.now()): AnalysisResult {
  const suggestions: Suggestion[] = rows.map(([current, suggested, category, note], i) => ({
    id: i + 1,
    current,
    suggested,
    category,
    note,
    changed: current !== suggested,
  }));

  const resumeText = [
    "Arjun Kumar",
    "arjun@dev.io | +91 98765 43210 | github.com/arjunk",
    "",
    "EXPERIENCE",
    ...rows.slice(0, 7).map(([current]) => current),
    "",
    "EDUCATION",
    "B.Tech in Computer Science, 2018 - 2022",
    "",
    "SKILLS",
    rows[7][0],
  ].join("\n");

  return {
    id: "sample",
    source: "sample",
    fileName: "resumé_v3.pdf",
    createdAt: new Date(now - 2 * 60 * 60 * 1000).toISOString(),
    runtimeMs: 14800,
    model: null,
    targetRole: "software engineer",
    skills: ["React", "TypeScript", "Node.js", "PostgreSQL", "Docker"],
    resumeText,
    checks,
    suggestions,
    warnings: [],
  };
}
