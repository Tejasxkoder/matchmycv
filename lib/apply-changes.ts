import type { Suggestion, SuggestionStatus } from "./analysis-types";

const PLACEHOLDER = /\[[^\]\n]{1,30}\]/g;

export function applyAccepted(
  resumeText: string,
  suggestions: Suggestion[],
  statuses: Record<number, SuggestionStatus>
) {
  let text = resumeText;
  let applied = 0;
  let skipped = 0;
  let unresolved = 0;

  for (const s of suggestions) {
    if (statuses[s.id] !== "accepted" || !s.changed) continue;
    const at = text.indexOf(s.current);
    if (at === -1) {
      skipped += 1;
      continue;
    }
    text = text.slice(0, at) + s.suggested + text.slice(at + s.current.length);
    applied += 1;
    unresolved += (s.suggested.match(PLACEHOLDER) ?? []).length;
  }

  return { text, applied, skipped, unresolved };
}
