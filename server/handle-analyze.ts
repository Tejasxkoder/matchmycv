import { AnalysisError, analyzeResume } from "./analysis/analyze";
import { ParseError, extractResumeText, defaultExtractors, type Extractors } from "./parsing/extract-text";
import { analyzeLimiter, type RateLimiter } from "./rate-limit";

const MAX_TEXT_CHARS = 20000;

type Deps = {
  analyze?: typeof analyzeResume;
  extractors?: Extractors;
  limiter?: RateLimiter;
};

function fail(status: number, code: string, message: string) {
  return { status, body: { error: { code, message } } };
}

export async function handleAnalyze(req: Request, deps: Deps = {}) {
  const analyze = deps.analyze ?? analyzeResume;
  const extractors = deps.extractors ?? defaultExtractors;
  const limiter = deps.limiter ?? analyzeLimiter;

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "local";
  const turn = limiter.take(ip);
  if (!turn.ok) {
    return fail(429, "too_many_requests", `You have run a lot of analyses. Try again in ${turn.retryInSeconds} seconds.`);
  }

  const type = req.headers.get("content-type") ?? "";
  let text = "";
  let fileName = "pasted-experience.txt";

  try {
    if (type.includes("multipart/form-data")) {
      const form = await req.formData();
      const file = form.get("file");
      const pasted = form.get("text");
      if (file instanceof File && file.size > 0) {
        fileName = file.name;
        const bytes = new Uint8Array(await file.arrayBuffer());
        text = await extractResumeText({ name: file.name, bytes }, extractors);
      } else if (typeof pasted === "string") {
        text = pasted;
      }
    } else if (type.includes("application/json")) {
      const body = (await req.json()) as { text?: unknown };
      if (typeof body.text === "string") text = body.text;
    } else {
      return fail(415, "unsupported_type", "Send the resume as a file upload or as text.");
    }

    if (!text.trim()) return fail(422, "empty", "Add a resume file or paste some text first.");
    if (text.length > MAX_TEXT_CHARS) {
      return fail(413, "too_long", "That resume is longer than we can read in one go. Trim it to two pages.");
    }

    const analysis = await analyze({ text, fileName });
    return { status: 200, body: { analysis } };
  } catch (err) {
    if (err instanceof ParseError) {
      const status = err.code === "too_large" ? 413 : err.code === "unsupported" ? 415 : 422;
      return fail(status, err.code, err.message);
    }
    if (err instanceof AnalysisError) return fail(422, err.code, err.message);
    console.error("analyze failed", err);
    return fail(500, "internal", "Something went wrong on our side. Please try again.");
  }
}
