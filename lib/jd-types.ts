export type JdVerdict = "match" | "partial" | "missing";
export type JdKind = "required" | "nice";

export type JdRequirement = {
  id: number;
  text: string;
  kind: JdKind;
  verdict: JdVerdict;
  evidence: string | null;
  note: string;
};

export type JdAnalysis = {
  id: string;
  title: string;
  company: string;
  jdText: string;
  score: number;
  createdAt: string;
  source: "ai" | "rules";
  model: string | null;
  requirements: JdRequirement[];
  requiredSkills: string[];
  warnings: string[];
};

export type StoredJd = JdAnalysis & { analysisId: string };

export function scoreRequirements(requirements: JdRequirement[]) {
  let earned = 0;
  let total = 0;
  const count = { match: 0, partial: 0, missing: 0 };
  for (const r of requirements) {
    const weight = r.kind === "nice" ? 0.5 : 1;
    total += weight;
    if (r.verdict === "match") earned += weight;
    else if (r.verdict === "partial") earned += weight / 2;
    count[r.verdict] += 1;
  }
  return { score: total === 0 ? 0 : Math.round((earned / total) * 100), ...count };
}

export function verdictFor(score: number): { label: string; tone: "pass" | "warn" | "fail" } {
  if (score >= 75) return { label: "Strong match, apply", tone: "pass" };
  if (score >= 50) return { label: "Apply after filling gaps", tone: "warn" };
  return { label: "Not ready for this role yet", tone: "fail" };
}
