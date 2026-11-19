import { useMemo } from "react";
import { useAnalysis } from "./analysis-store";
import type { Analysis } from "./analysis-types";
import { useGithub } from "./github-store";
import { useJd } from "./jd-store";
import { mergeChecks } from "./live-checks";
import { useProfile } from "./profile-store";

export function useLiveAnalysis(): Analysis | null | undefined {
  const analysis = useAnalysis();
  const jd = useJd();
  const github = useGithub();
  const profile = useProfile();
  return useMemo(() => {
    if (!analysis) return analysis;
    return { ...analysis, checks: mergeChecks(analysis, { jd, github, profile }) };
  }, [analysis, jd, github, profile]);
}
