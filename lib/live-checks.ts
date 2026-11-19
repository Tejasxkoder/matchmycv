import type { Analysis, Check } from "./analysis-types";
import type { StoredJd } from "./jd-types";
import { githubEvidence, type GithubSnapshot } from "./github-types";
import type { Profile } from "./profile-store";

export function missingJdSkills(analysis: Analysis, jd: StoredJd | null | undefined): string[] {
  if (!jd || jd.analysisId !== analysis.id) return [];
  const have = new Set(analysis.skills.map((s) => s.toLowerCase()));
  return jd.requiredSkills.filter((s) => !have.has(s.toLowerCase()));
}

export function mergeChecks(
  analysis: Analysis,
  extras: { jd?: StoredJd | null; github?: GithubSnapshot | null; profile?: Profile }
): Check[] {
  const jd = extras.jd && extras.jd.analysisId === analysis.id ? extras.jd : null;
  const github = extras.github ?? null;

  return analysis.checks.map((check) => {
    if (check.id === "tone" && extras.profile && !extras.profile.biasFlags) {
      return {
        ...check,
        status: "pending",
        sublabel: "turned off in settings",
        detail: "Bias and tone flags are switched off",
        actionLabel: "Open settings",
        href: "/profile",
      };
    }

    if (check.id === "github" && github && github.username) {
      const verified = analysis.skills.filter((s) => githubEvidence(github, s) > 0).length;
      const total = analysis.skills.length;
      const share = total === 0 ? 0 : verified / total;
      return {
        ...check,
        sublabel: `${github.publicRepos} public repos · ${github.totalStars} stars`,
        status: total === 0 ? "warn" : share >= 0.4 ? "pass" : verified > 0 ? "warn" : "fail",
        detail: total === 0 ? "No resume skills to compare" : `${verified} of ${total} resume skills seen in public repos`,
        actionLabel: "View profile",
        href: "/credibility",
      };
    }

    if (check.id === "jd" && jd) {
      return {
        ...check,
        sublabel: jd.company ? `${jd.title} · ${jd.company}` : jd.title,
        status: jd.score >= 75 ? "pass" : jd.score >= 50 ? "warn" : "fail",
        detail: `${jd.score}% match for the pasted role`,
        actionLabel: "Improve match",
      };
    }

    if (check.id === "skills" && jd) {
      const missing = missingJdSkills(analysis, jd);
      return {
        ...check,
        sublabel: missing.length ? missing.slice(0, 4).join(", ") : "no missing skills",
        status: missing.length === 0 ? "pass" : missing.length <= 2 ? "warn" : "fail",
        detail: missing.length === 0 ? "Every skill named in the job is on your resume" : `${missing.length} skills named in the job are missing`,
        actionLabel: "View roadmap",
      };
    }

    return check;
  });
}
