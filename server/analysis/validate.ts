import type { Suggestion, SuggestionCategory } from "../../lib/analysis-types";
import { stripBullet } from "./signals";

export type AiOutput = {
  targetRole: string;
  suggestions: Suggestion[];
  toneFlags: string[];
};

const CATEGORIES: SuggestionCategory[] = ["quantify", "tone", "ats", "ok"];

const DEFAULT_NOTES: Record<SuggestionCategory, string> = {
  quantify: "Add scale and a measurable outcome",
  tone: "Use direct, neutral wording",
  ats: "Write it plainly so ATS can parse it",
  ok: "Looks good as written",
};

function squash(text: string): string {
  return stripBullet(text.toLowerCase())
    .replace(/[^a-z0-9%$]+/g, " ")
    .trim();
}

export function findSource(current: string, text: string, lines: string[]): string | null {
  const wanted = current.trim();
  if (wanted.length < 12) return null;
  if (text.includes(wanted)) return wanted;

  const key = squash(wanted);
  for (const line of lines) {
    const lineKey = squash(line);
    if (!lineKey) continue;
    if (lineKey === key) return line;
    const ratio = Math.min(key.length, lineKey.length) / Math.max(key.length, lineKey.length);
    if (ratio >= 0.8 && (lineKey.includes(key) || key.includes(lineKey))) return line;
  }
  return null;
}

export function normalizeAiOutput(raw: unknown, text: string): AiOutput {
  const empty: AiOutput = { targetRole: "", suggestions: [], toneFlags: [] };
  if (!raw || typeof raw !== "object") return empty;

  const data = raw as Record<string, unknown>;
  const lines = text
    .split("\n")
    .map((l) => stripBullet(l))
    .filter(Boolean);

  const seen = new Set<string>();
  const found: { at: number; item: Omit<Suggestion, "id"> }[] = [];
  let okCount = 0;

  const entries = Array.isArray(data.suggestions) ? data.suggestions.slice(0, 15) : [];
  for (const entry of entries) {
    if (!entry || typeof entry !== "object") continue;
    const e = entry as Record<string, unknown>;
    if (typeof e.current !== "string" || typeof e.suggested !== "string") continue;

    const current = findSource(e.current, text, lines);
    const suggested = e.suggested.trim();
    if (!current || !suggested || current.length > 500 || suggested.length > 500) continue;

    const key = squash(current);
    if (seen.has(key)) continue;
    seen.add(key);

    const changed = key !== squash(suggested);
    let category = (typeof e.category === "string" ? e.category.toLowerCase() : "") as SuggestionCategory;
    if (!CATEGORIES.includes(category)) category = "quantify";
    if (!changed) category = "ok";
    else if (category === "ok") category = /\d|\[/.test(suggested) ? "quantify" : "tone";

    if (category === "ok") {
      if (okCount >= 1) continue;
      okCount += 1;
    }

    const note =
      typeof e.note === "string" && e.note.trim() ? e.note.trim().slice(0, 110) : DEFAULT_NOTES[category];

    found.push({ at: text.indexOf(current), item: { current, suggested, category, note, changed } });
  }

  found.sort((a, b) => a.at - b.at);
  const suggestions = found.slice(0, 8).map((f, i) => ({ id: i + 1, ...f.item }));

  const lowerText = text.toLowerCase();
  const toneFlags = (Array.isArray(data.toneFlags) ? data.toneFlags : [])
    .filter((t): t is string => typeof t === "string")
    .map((t) => t.trim())
    .filter((t) => t.length > 1 && t.length <= 40 && lowerText.includes(t.toLowerCase()))
    .filter((t, i, all) => all.findIndex((x) => x.toLowerCase() === t.toLowerCase()) === i)
    .slice(0, 6);

  const targetRole =
    typeof data.targetRole === "string"
      ? data.targetRole.replace(/<[^>]*>/g, "").replace(/[^A-Za-z0-9+#./ -]/g, "").trim().slice(0, 60)
      : "";

  return { targetRole, suggestions, toneFlags };
}
