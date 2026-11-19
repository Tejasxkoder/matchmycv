import type { AnalysisResult } from "../../lib/analysis-types";
import { extractJsonObject } from "../ai/json";
import { chatCompletion, OpenRouterError, type ChatMessage } from "../ai/openrouter";
import { JSON_RETRY_NUDGE, SYSTEM_PROMPT, buildUserPrompt } from "../ai/prompts";
import { buildChecks } from "./build-checks";
import { analyzeSignals, normalizeText } from "./signals";
import { normalizeAiOutput, type AiOutput } from "./validate";

export class AnalysisError extends Error {
  code: "too_short";

  constructor(code: "too_short", message: string) {
    super(message);
    this.name = "AnalysisError";
    this.code = code;
  }
}

type Chat = typeof chatCompletion;

async function askForJson(chat: Chat, text: string) {
  const messages: ChatMessage[] = [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: buildUserPrompt(text) },
  ];

  for (let attempt = 0; attempt < 2; attempt++) {
    const reply = await chat(messages);
    const json = extractJsonObject(reply.content);
    if (json) return { json, model: reply.model };
    messages.push(
      { role: "assistant", content: reply.content.slice(0, 2000) },
      { role: "user", content: JSON_RETRY_NUDGE }
    );
  }
  throw new Error("bad_json");
}

function failureNote(err: unknown): string {
  if (err instanceof OpenRouterError) return `AI rewrites unavailable. ${err.message}`;
  if (err instanceof Error && err.message === "bad_json") {
    return "AI rewrites skipped because the model did not return valid JSON twice. Run it again.";
  }
  return "AI rewrites unavailable because of an unexpected error. Run it again.";
}

export async function analyzeResume(
  input: { text: string; fileName: string },
  chat: Chat = chatCompletion
): Promise<AnalysisResult> {
  const started = Date.now();
  const text = normalizeText(input.text);

  if (text.length < 200) {
    throw new AnalysisError(
      "too_short",
      "We could not find enough text in that file. If it is a scanned PDF, use the Describe your experience tab and paste the text."
    );
  }

  const signals = analyzeSignals(text);
  const warnings: string[] = [];
  let ai: AiOutput = { targetRole: "", suggestions: [], toneFlags: [] };
  let model: string | null = null;

  try {
    const reply = await askForJson(chat, text);
    ai = normalizeAiOutput(reply.json, text);
    model = reply.model;
    if (ai.suggestions.length === 0) {
      warnings.push("The AI reply had no usable rewrite suggestions. Run it again for a fresh attempt.");
    }
  } catch (err) {
    warnings.push(failureNote(err));
  }

  return {
    id: globalThis.crypto.randomUUID(),
    source: "ai",
    fileName: input.fileName,
    createdAt: new Date().toISOString(),
    runtimeMs: Date.now() - started,
    model,
    targetRole: ai.targetRole || "software engineer",
    skills: signals.skills,
    resumeText: text,
    checks: buildChecks(signals, ai),
    suggestions: ai.suggestions,
    warnings,
  };
}
