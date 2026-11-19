export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

export type OpenRouterErrorCode =
  | "missing_key"
  | "auth"
  | "rate_limited"
  | "timeout"
  | "upstream"
  | "empty";

export class OpenRouterError extends Error {
  code: OpenRouterErrorCode;
  status?: number;

  constructor(code: OpenRouterErrorCode, message: string, status?: number) {
    super(message);
    this.name = "OpenRouterError";
    this.code = code;
    this.status = status;
  }
}

export type ChatOptions = {
  apiKey?: string;
  models?: string[];
  maxTokens?: number;
  temperature?: number;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
};

const ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";

export const DEFAULT_MODELS = ["openrouter/free"];

export function modelsFromEnv(value: string | undefined): string[] {
  const list = (value ?? "")
    .split(",")
    .map((m) => m.trim())
    .filter(Boolean);
  return list.length ? list : DEFAULT_MODELS;
}

function errorText(body: unknown): string {
  const error = (body as { error?: { message?: unknown } } | null)?.error;
  return typeof error?.message === "string" ? error.message : "";
}

function errorFor(status: number, detail: string): OpenRouterError {
  if (status === 401 || status === 403) {
    return new OpenRouterError("auth", "OpenRouter rejected the API key. Check OPENROUTER_API_KEY.", status);
  }
  if (status === 402) {
    return new OpenRouterError(
      "auth",
      "OpenRouter reports a negative credit balance. Free models still need a balance of zero or more.",
      status
    );
  }
  if (status === 429) {
    return new OpenRouterError(
      "rate_limited",
      "Free models are rate limited right now (20 requests a minute, 50 a day on a free account).",
      status
    );
  }
  if (status === 404 && /data policy|privacy/i.test(detail)) {
    return new OpenRouterError(
      "upstream",
      "No free endpoint matches your OpenRouter privacy settings. Allow free endpoints under Settings, Privacy, then try again.",
      status
    );
  }
  return new OpenRouterError("upstream", `OpenRouter request failed (${status})${detail ? `: ${detail}` : ""}`, status);
}

async function callGemini(
  apiKey: string,
  messages: ChatMessage[],
  opts: ChatOptions
): Promise<{ content: string; model: string }> {
  const systemMsg = messages.find((m) => m.role === "system");
  const chatMsgs = messages.filter((m) => m.role !== "system");

  const contents = chatMsgs.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const model = process.env.GEMINI_MODEL || "gemini-3.8-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const body: Record<string, unknown> = {
    contents,
    generationConfig: {
      temperature: opts.temperature ?? 0.2,
      maxOutputTokens: opts.maxTokens ?? 4000,
      responseMimeType: "application/json",
    },
  };

  if (systemMsg) {
    body.systemInstruction = {
      parts: [{ text: systemMsg.content }],
    };
  }

  const send = opts.fetchImpl ?? fetch;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), opts.timeoutMs ?? 50000);

  let res: Response;
  try {
    res = await send(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (err) {
    if ((err as { name?: string })?.name === "AbortError") {
      throw new OpenRouterError("timeout", "Gemini took too long to respond.");
    }
    throw new OpenRouterError("upstream", "Could not reach Gemini. Check your connection.");
  } finally {
    clearTimeout(timer);
  }

  const rawText = await res.text().catch(() => "");
  let data: any = null;
  try {
    data = rawText ? JSON.parse(rawText) : null;
  } catch {
    data = null;
  }

  if (!res.ok) {
    const msg = data?.error?.message || `Gemini request failed (${res.status})`;
    if (res.status === 400 || res.status === 403) {
      throw new OpenRouterError("auth", `Gemini API key error: ${msg}`, res.status);
    }
    if (res.status === 429) {
      throw new OpenRouterError("rate_limited", `Gemini rate limit exceeded: ${msg}`, res.status);
    }
    throw new OpenRouterError("upstream", `Gemini error: ${msg}`, res.status);
  }

  const content = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  if (!content.trim()) {
    throw new OpenRouterError("empty", "Gemini returned an empty reply.");
  }

  return { content, model: `gemini/${model}` };
}

async function callGroq(
  apiKey: string,
  messages: ChatMessage[],
  opts: ChatOptions
): Promise<{ content: string; model: string }> {
  const model = process.env.GROQ_MODEL || "openai/gpt-oss-120b";
  const url = "https://api.groq.com/openai/v1/chat/completions";
  const body = {
    model,
    messages,
    temperature: opts.temperature ?? 0.2,
    max_tokens: opts.maxTokens ?? 3000,
    response_format: { type: "json_object" },
  };

  const send = opts.fetchImpl ?? fetch;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), opts.timeoutMs ?? 50000);

  let res: Response;
  try {
    res = await send(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (err) {
    if ((err as { name?: string })?.name === "AbortError") {
      throw new OpenRouterError("timeout", "Groq took too long to respond.");
    }
    throw new OpenRouterError("upstream", "Could not reach Groq. Check your connection.");
  } finally {
    clearTimeout(timer);
  }

  const rawText = await res.text().catch(() => "");
  let data: any = null;
  try {
    data = rawText ? JSON.parse(rawText) : null;
  } catch {
    data = null;
  }

  if (!res.ok) {
    const msg = data?.error?.message || `Groq request failed (${res.status})`;
    throw new OpenRouterError("upstream", `Groq error: ${msg}`, res.status);
  }

  const content = data?.choices?.[0]?.message?.content ?? "";
  if (!content.trim()) throw new OpenRouterError("empty", "Groq returned an empty reply.");
  return { content, model: `groq/${model}` };
}

export async function chatCompletion(
  messages: ChatMessage[],
  opts: ChatOptions = {}
): Promise<{ content: string; model: string }> {
  if (process.env.GEMINI_API_KEY && !opts.apiKey) {
    return callGemini(process.env.GEMINI_API_KEY, messages, opts);
  }
  if (process.env.GROQ_API_KEY && !opts.apiKey) {
    return callGroq(process.env.GROQ_API_KEY, messages, opts);
  }

  const apiKey = opts.apiKey ?? process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new OpenRouterError("missing_key", "OPENROUTER_API_KEY or GEMINI_API_KEY is not set. Add it to .env.local and restart the server.");
  }

  const models = opts.models?.length ? opts.models : modelsFromEnv(process.env.OPENROUTER_MODELS);
  const send = opts.fetchImpl ?? fetch;

  const body: Record<string, unknown> = {
    messages,
    temperature: opts.temperature ?? 0.2,
    max_tokens: opts.maxTokens ?? 4000,
  };
  if (models.length === 1) body.model = models[0];
  else body.models = models;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), opts.timeoutMs ?? 50000);

  let res: Response;
  try {
    res = await send(ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "X-Title": "MatchMyCV",
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (err) {
    if ((err as { name?: string })?.name === "AbortError") {
      throw new OpenRouterError("timeout", "The AI model took too long to respond.");
    }
    throw new OpenRouterError("upstream", "Could not reach OpenRouter. Check your internet connection.");
  } finally {
    clearTimeout(timer);
  }

  const rawText = await res.text().catch(() => "");
  let data: unknown = null;
  try {
    data = rawText ? JSON.parse(rawText) : null;
  } catch {
    data = null;
  }

  if (!res.ok) throw errorFor(res.status, errorText(data) || rawText.slice(0, 200));

  const inBody = (data as { error?: { code?: unknown } } | null)?.error;
  if (inBody) {
    const code = Number(inBody.code);
    throw errorFor(Number.isFinite(code) && code >= 400 ? code : 502, errorText(data));
  }

  const message = (data as { choices?: { message?: { content?: unknown } }[] } | null)?.choices?.[0]?.message;
  let content = "";
  if (typeof message?.content === "string") {
    content = message.content;
  } else if (Array.isArray(message?.content)) {
    content = (message.content as { text?: unknown }[])
      .map((part) => (typeof part?.text === "string" ? part.text : ""))
      .join("");
  }
  if (!content.trim()) throw new OpenRouterError("empty", "The AI model returned an empty reply.");

  const used = (data as { model?: unknown } | null)?.model;
  return { content, model: typeof used === "string" ? used : models[0] };
}
