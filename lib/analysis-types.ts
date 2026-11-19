export type CheckStatus = "pass" | "warn" | "fail" | "pending";

export type Check = {
  id: string;
  title: string;
  sublabel: string;
  status: CheckStatus;
  detail: string;
  actionLabel: string;
  href: string;
};

export type SuggestionCategory = "ats" | "quantify" | "tone" | "ok";
export type SuggestionStatus = "pending" | "accepted" | "rejected";

export type Suggestion = {
  id: number;
  current: string;
  suggested: string;
  category: SuggestionCategory;
  note: string;
  changed: boolean;
};

export type AnalysisResult = {
  id: string;
  source: "ai" | "sample";
  fileName: string;
  createdAt: string;
  runtimeMs: number;
  model: string | null;
  targetRole: string;
  skills: string[];
  resumeText: string;
  checks: Check[];
  suggestions: Suggestion[];
  warnings: string[];
};

export type Analysis = AnalysisResult & {
  runNumber: number;
  statuses: Record<number, SuggestionStatus>;
};

export function countChecks(checks: Check[]) {
  const count = { pass: 0, warn: 0, fail: 0, pending: 0 };
  for (const c of checks) count[c.status] += 1;
  return count;
}
