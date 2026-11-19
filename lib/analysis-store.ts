import { useSyncExternalStore } from "react";
import type { Analysis, AnalysisResult, SuggestionStatus } from "./analysis-types";
import { clearJd } from "./jd-store";
import { clearInterview } from "./interview-store";
import { pushVersion } from "./versions-store";

const KEY = "matchmycv-analysis";
const COUNTER = "matchmycv-run-counter";
const EVENT = "matchmycv-analysis-change";

let lastRaw: string | null = null;
let lastValue: Analysis | null = null;

function read(): Analysis | null {
  const raw = window.localStorage.getItem(KEY);
  if (raw === lastRaw) return lastValue;
  lastRaw = raw;
  try {
    lastValue = raw ? (JSON.parse(raw) as Analysis) : null;
  } catch {
    lastValue = null;
  }
  return lastValue;
}

function write(analysis: Analysis | null) {
  if (analysis) window.localStorage.setItem(KEY, JSON.stringify(analysis));
  else window.localStorage.removeItem(KEY);
  window.dispatchEvent(new Event(EVENT));
}

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(EVENT, onChange);
  };
}

export function useAnalysis(): Analysis | null | undefined {
  return useSyncExternalStore<Analysis | null | undefined>(subscribe, read, () => undefined);
}

export function saveAnalysis(result: AnalysisResult): Analysis {
  const runNumber = Number(window.localStorage.getItem(COUNTER) ?? "0") + 1;
  const statuses: Record<number, SuggestionStatus> = {};
  for (const s of result.suggestions) {
    if (s.category === "ok") statuses[s.id] = "accepted";
  }
  const analysis: Analysis = { ...result, runNumber, statuses };
  window.localStorage.setItem(COUNTER, String(runNumber));
  write(analysis);
  clearJd();
  clearInterview();
  pushVersion({
    id: analysis.id,
    runNumber,
    fileName: analysis.fileName,
    createdAt: analysis.createdAt,
    words: analysis.resumeText.split(/\s+/).filter(Boolean).length,
    resumeText: analysis.resumeText,
    checks: analysis.checks,
  });
  return analysis;
}

export function saveStatuses(statuses: Record<number, SuggestionStatus>) {
  const current = read();
  if (current) write({ ...current, statuses });
}

export function clearAnalysis() {
  write(null);
}
