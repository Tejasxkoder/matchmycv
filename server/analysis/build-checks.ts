import type { Check, CheckStatus } from "../../lib/analysis-types";
import type { Signals } from "./signals";
import type { AiOutput } from "./validate";

function byCount(n: number, warnAt: number, failAt: number): CheckStatus {
  if (n >= failAt) return "fail";
  if (n >= warnAt) return "warn";
  return "pass";
}

function plural(n: number, word: string): string {
  return `${n} ${word}${n === 1 ? "" : "s"}`;
}

function uniqueCaseless(items: string[]): string[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = item.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function buildChecks(signals: Signals, ai: AiOutput): Check[] {
  const atsIssues = signals.atsFlags.length + ai.suggestions.filter((s) => s.category === "ats").length;
  const ats: Check = {
    id: "ats",
    title: "ATS Compatibility",
    sublabel: "tables, columns, symbols",
    status: byCount(atsIssues, 1, 3),
    detail: atsIssues === 0 ? "No parsing blockers found" : `${plural(atsIssues, "formatting issue")} may block parsing`,
    actionLabel: "Fix issues",
    href: "/resume-analysis",
  };

  let quantStatus: CheckStatus;
  let quantDetail: string;
  if (signals.bulletCount >= 3) {
    const share = signals.quantifiedBulletCount / signals.bulletCount;
    const missing = signals.bulletCount - signals.quantifiedBulletCount;
    quantStatus = share >= 0.6 ? "pass" : share >= 0.3 ? "warn" : "fail";
    quantDetail =
      missing === 0
        ? `All ${signals.bulletCount} bullets include a number`
        : `${missing} of ${signals.bulletCount} bullets lack measurable impact`;
  } else {
    const flagged = ai.suggestions.filter((s) => s.category === "quantify").length;
    quantStatus = byCount(flagged, 1, 3);
    quantDetail = flagged === 0 ? "No bullets needing metrics found" : `${plural(flagged, "bullet")} need metrics`;
  }
  const quantification: Check = {
    id: "quantification",
    title: "Quantification",
    sublabel: "missing numbers, percentages, scale",
    status: quantStatus,
    detail: quantDetail,
    actionLabel: "Add metrics",
    href: "/resume-analysis",
  };

  const skillCount = signals.skills.length;
  const keywords: Check = {
    id: "keywords",
    title: "Keyword Density",
    sublabel: skillCount ? signals.skills.slice(0, 4).join(", ") : "no recognised skills",
    status: skillCount >= 10 ? "pass" : skillCount >= 5 ? "warn" : "fail",
    detail:
      skillCount >= 10
        ? `${skillCount} skills detected`
        : `Only ${skillCount} recognised skills. List the tools you actually use`,
    actionLabel: "View report",
    href: "/resume-analysis",
  };

  const phrases = uniqueCaseless([...signals.biasWords, ...ai.toneFlags, ...signals.weakPhrases]);
  const tone: Check = {
    id: "tone",
    title: "Bias & Tone",
    sublabel: phrases.length ? phrases.slice(0, 2).map((p) => `"${p}"`).join(", ") : "gender-coded and passive wording",
    status: byCount(phrases.length, 1, 4),
    detail: phrases.length === 0 ? "No flagged phrases" : `${plural(phrases.length, "flagged phrase")}`,
    actionLabel: "Review flags",
    href: "/resume-analysis",
  };

  const problems: string[] = [];
  if (signals.wordCount < 250) problems.push("Resume is very short");
  if (signals.wordCount > 1100) problems.push("Resume is long, aim for two pages");
  if (!signals.hasEmail) problems.push("No email address found");
  if (!signals.hasPhone) problems.push("No phone number found");
  if (!signals.sections.experience) problems.push("No experience section");
  if (!signals.sections.education) problems.push("No education section");
  if (!signals.sections.skills) problems.push("No skills section");
  const format: Check = {
    id: "format",
    title: "Format Compliance",
    sublabel: "length, sections, contact block",
    status: byCount(problems.length, 1, 3),
    detail:
      problems.length === 0
        ? "All structural checks pass"
        : problems.length === 1
        ? problems[0]
        : `${problems[0]}, plus ${problems.length - 1} more`,
    actionLabel: "View report",
    href: "/resume-analysis",
  };

  const github: Check = {
    id: "github",
    title: "GitHub Signals",
    sublabel: signals.githubUsername ? `github.com/${signals.githubUsername} found` : "no GitHub link found",
    status: "pending",
    detail: "Not run yet. Needs the GitHub connection",
    actionLabel: "Connect GitHub",
    href: "/credibility",
  };

  const jd: Check = {
    id: "jd",
    title: "JD Match",
    sublabel: "needs a job description",
    status: "pending",
    detail: "Not run yet. Paste a job description to score it",
    actionLabel: "Add a job description",
    href: "/jd-match",
  };

  const skillGap: Check = {
    id: "skills",
    title: "Skill Gap",
    sublabel: "needs a target job",
    status: "pending",
    detail: "Not run yet. Runs after a job description is scored",
    actionLabel: "View roadmap",
    href: "/skill-roadmap",
  };

  return [ats, quantification, keywords, tone, format, github, jd, skillGap];
}
