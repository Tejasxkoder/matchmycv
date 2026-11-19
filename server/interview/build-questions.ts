import { extractJsonObject } from "../ai/json";
import { chatCompletion, OpenRouterError, type ChatMessage } from "../ai/openrouter";
import { normalizeText } from "../analysis/signals";
import type { InterviewQuestion, InterviewSet, QuestionCategory, QuestionLevel } from "../../lib/interview-types";
import { INTERVIEW_RETRY_NUDGE, INTERVIEW_SYSTEM_PROMPT, buildInterviewPrompt } from "./prompts";
import { templateQuestions } from "./templates";

type Chat = typeof chatCompletion;

const CATEGORIES: QuestionCategory[] = ["Behavioral", "Technical", "System Design"];
const LEVELS: QuestionLevel[] = ["EASY", "MEDIUM", "HARD"];

export function normalizeQuestions(raw: unknown): InterviewQuestion[] {
  if (!raw || typeof raw !== "object") return [];
  const list = (raw as { questions?: unknown }).questions;
  if (!Array.isArray(list)) return [];
  const out: InterviewQuestion[] = [];
  for (const item of list.slice(0, 12)) {
    if (!item || typeof item !== "object") continue;
    const e = item as Record<string, unknown>;
    const cat = CATEGORIES.find((c) => c.toLowerCase() === String(e.cat).toLowerCase());
    const lvl = LEVELS.find((l) => l === String(e.lvl).toUpperCase()) ?? "MEDIUM";
    if (!cat || typeof e.q !== "string" || typeof e.a !== "string" || !e.q.trim() || !e.a.trim()) continue;
    out.push({
      id: out.length + 1,
      cat,
      lvl,
      src: typeof e.src === "string" && e.src.trim() ? e.src.trim().slice(0, 60) : undefined,
      q: e.q.trim().slice(0, 300),
      hint: typeof e.hint === "string" ? e.hint.trim().slice(0, 300) : "",
      a: e.a.trim().slice(0, 1200),
    });
  }
  return out;
}

export async function buildInterviewSet(
  input: {
    analysisId: string;
    resumeText: string;
    targetRole: string;
    skills: string[];
    missingSkills: string[];
    repos: string[];
  },
  chat: Chat = chatCompletion
): Promise<InterviewSet> {
  const resumeText = normalizeText(input.resumeText);
  const warnings: string[] = [];
  let questions: InterviewQuestion[] = [];

  try {
    const messages: ChatMessage[] = [
      { role: "system", content: INTERVIEW_SYSTEM_PROMPT },
      {
        role: "user",
        content: buildInterviewPrompt({
          resumeText,
          targetRole: input.targetRole,
          missingSkills: input.missingSkills,
          repos: input.repos,
        }),
      },
    ];
    for (let attempt = 0; attempt < 2 && questions.length < 5; attempt++) {
      const reply = await chat(messages, { maxTokens: 3500, timeoutMs: 55000 });
      questions = normalizeQuestions(extractJsonObject(reply.content));
      if (questions.length < 5) {
        messages.push(
          { role: "assistant", content: reply.content.slice(0, 2000) },
          { role: "user", content: INTERVIEW_RETRY_NUDGE }
        );
      }
    }
  } catch (err) {
    warnings.push(err instanceof OpenRouterError ? `AI questions unavailable. ${err.message}` : "AI questions unavailable.");
  }

  if (questions.length < 5) {
    if (!warnings.length) warnings.push("The AI reply had too few usable questions.");
    warnings.push("Showing general practice questions with answer outlines instead.");
    return {
      analysisId: input.analysisId,
      createdAt: new Date().toISOString(),
      source: "template",
      questions: templateQuestions({ skills: input.skills, missingSkills: input.missingSkills, repos: input.repos }),
      warnings,
    };
  }

  return { analysisId: input.analysisId, createdAt: new Date().toISOString(), source: "ai", questions, warnings };
}
