import { fail, clientIp } from "./http-error";
import { JdError, analyzeJd } from "./jd/analyze-jd";
import { createRateLimiter, type RateLimiter } from "./rate-limit";

export const jdLimiter = createRateLimiter(10, 10 * 60 * 1000);

type Deps = { analyze?: typeof analyzeJd; limiter?: RateLimiter };

export async function handleJd(req: Request, deps: Deps = {}) {
  const analyze = deps.analyze ?? analyzeJd;
  const limiter = deps.limiter ?? jdLimiter;

  const turn = limiter.take(clientIp(req));
  if (!turn.ok) return fail(429, "too_many_requests", `Too many comparisons. Try again in ${turn.retryInSeconds} seconds.`);

  let body: { resumeText?: unknown; jdText?: unknown; title?: unknown; company?: unknown };
  try {
    body = await req.json();
  } catch {
    return fail(400, "bad_request", "Send a JSON body with resumeText and jdText.");
  }
  if (typeof body.resumeText !== "string" || !body.resumeText.trim()) {
    return fail(422, "no_resume", "Run an analysis first so there is a resume to compare.");
  }
  if (typeof body.jdText !== "string" || !body.jdText.trim()) {
    return fail(422, "empty", "Paste a job description first.");
  }
  if (body.jdText.length > 20000) return fail(413, "too_long", "That job description is too long. Trim it to the essentials.");

  try {
    const jd = await analyze({
      resumeText: body.resumeText,
      jdText: body.jdText,
      title: typeof body.title === "string" ? body.title : undefined,
      company: typeof body.company === "string" ? body.company : undefined,
    });
    return { status: 200, body: { jd } };
  } catch (err) {
    if (err instanceof JdError) return fail(422, err.code, err.message);
    console.error("jd match failed", err);
    return fail(500, "internal", "Something went wrong on our side. Please try again.");
  }
}
