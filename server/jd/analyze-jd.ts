import { extractJsonObject } from "../ai/json";
import { chatCompletion, OpenRouterError, type ChatMessage } from "../ai/openrouter";
import { detectSkills, normalizeText, stripBullet } from "../analysis/signals";
import { findSource } from "../analysis/validate";
import { scoreRequirements, type JdAnalysis, type JdRequirement, type JdVerdict } from "../../lib/jd-types";
import { JD_RETRY_NUDGE, JD_SYSTEM_PROMPT, buildJdPrompt } from "./prompts";
import { analyzeByRules, guessCompany, guessTitle } from "./rules";

export class JdError extends Error {
  code: "too_short";

  constructor(code: "too_short", message: string) {
    super(message);
    this.name = "JdError";
    this.code = code;
  }
}

type Chat = typeof chatCompletion;

type AiJd = { title: string; company: string; requirements: JdRequirement[] };

const VERDICTS: JdVerdict[] = ["match", "partial", "missing"];

export function normalizeAiJd(raw: unknown, resumeText: string): AiJd | null {
  if (!raw || typeof raw !== "object") return null;
  const data = raw as Record<string, unknown>;
  const entries = Array.isArray(data.requirements) ? data.requirements.slice(0, 15) : [];
  const lines = resumeText.split("\n").map((l) => stripBullet(l)).filter(Boolean);
  const requirements: JdRequirement[] = [];

  for (const entry of entries) {
    if (!entry || typeof entry !== "object") continue;
    const e = entry as Record<string, unknown>;
    if (typeof e.text !== "string" || !e.text.trim()) continue;
    let verdict = (typeof e.verdict === "string" ? e.verdict.toLowerCase() : "") as JdVerdict;
    if (!VERDICTS.includes(verdict)) continue;
    const evidence = typeof e.evidence === "string" && e.evidence.trim() ? findSource(e.evidence, resumeText, lines) : null;
    if (verdict === "match" && !evidence) verdict = "partial";
    else if (verdict === "partial" && !evidence) verdict = "missing";
    requirements.push(build(requirements.length, e, verdict, verdict === "missing" ? null : evidence));
  }

  if (requirements.length < 3) return null;
  return {
    title: typeof data.title === "string" ? data.title.trim().slice(0, 100) : "",
    company: typeof data.company === "string" ? data.company.trim().slice(0, 60) : "",
    requirements,
  };
}

function build(index: number, e: Record<string, unknown>, verdict: JdVerdict, evidence: string | null): JdRequirement {
  const fallback = verdict === "match" ? "Confirmed in your resume" : verdict === "partial" ? "Add more specific detail" : "Not found in resume.";
  return {
    id: index + 1,
    text: String(e.text).trim().slice(0, 200),
    kind: e.kind === "nice" ? "nice" : "required",
    verdict,
    evidence,
    note: typeof e.note === "string" && e.note.trim() ? e.note.trim().slice(0, 120) : fallback,
  };
}

async function askForJson(chat: Chat, resumeText: string, jdText: string) {
  const messages: ChatMessage[] = [
    { role: "system", content: JD_SYSTEM_PROMPT },
    { role: "user", content: buildJdPrompt(resumeText, jdText) },
  ];
  for (let attempt = 0; attempt < 2; attempt++) {
    const reply = await chat(messages, { maxTokens: 2500 });
    const json = extractJsonObject(reply.content);
    if (json) return { json, model: reply.model };
    messages.push(
      { role: "assistant", content: reply.content.slice(0, 2000) },
      { role: "user", content: JD_RETRY_NUDGE }
    );
  }
  throw new Error("bad_json");
}

export async function analyzeJd(
  input: { resumeText: string; jdText: string; title?: string; company?: string },
  chat: Chat = chatCompletion
): Promise<JdAnalysis> {
  const jdText = normalizeText(input.jdText);
  const resumeText = normalizeText(input.resumeText);
  if (jdText.length < 80) {
    throw new JdError("too_short", "That job description is too short to score. Paste the full posting.");
  }

  const warnings: string[] = [];
  let requirements: JdRequirement[] | null = null;
  let title = "";
  let company = "";
  let model: string | null = null;

  try {
    const reply = await askForJson(chat, resumeText, jdText);
    const ai = normalizeAiJd(reply.json, resumeText);
    if (ai) {
      requirements = ai.requirements;
      title = ai.title;
      company = ai.company;
      model = reply.model;
    } else {
      warnings.push("The AI reply had no usable requirements, so keyword matching was used instead.");
    }
  } catch (err) {
    warnings.push(
      err instanceof OpenRouterError
        ? `AI comparison unavailable, keyword matching was used instead. ${err.message}`
        : "AI comparison unavailable, keyword matching was used instead."
    );
  }

  const source: "ai" | "rules" = requirements ? "ai" : "rules";
  const final = requirements ?? analyzeByRules(jdText, resumeText);
  const { score } = scoreRequirements(final);

  return {
    id: globalThis.crypto.randomUUID(),
    title: input.title?.trim() || title || guessTitle(jdText),
    company: input.company?.trim() || company || guessCompany(jdText),
    jdText,
    score,
    createdAt: new Date().toISOString(),
    source,
    model,
    requirements: final,
    requiredSkills: detectSkills(jdText),
    warnings,
  };
}
