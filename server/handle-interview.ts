import { fail, clientIp } from "./http-error";
import { buildInterviewSet } from "./interview/build-questions";
import { createRateLimiter, type RateLimiter } from "./rate-limit";

export const interviewLimiter = createRateLimiter(6, 10 * 60 * 1000);

type Deps = { build?: typeof buildInterviewSet; limiter?: RateLimiter };

function strings(value: unknown, max: number): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string").slice(0, max) : [];
}

export async function handleInterview(req: Request, deps: Deps = {}) {
  const build = deps.build ?? buildInterviewSet;
  const limiter = deps.limiter ?? interviewLimiter;

  const turn = limiter.take(clientIp(req));
  if (!turn.ok) return fail(429, "too_many_requests", `Too many requests. Try again in ${turn.retryInSeconds} seconds.`);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return fail(400, "bad_request", "Send a JSON body.");
  }
  if (typeof body.resumeText !== "string" || body.resumeText.trim().length < 100) {
    return fail(422, "no_resume", "Run an analysis first so questions can be built from your resume.");
  }

  try {
    const set = await build({
      analysisId: typeof body.analysisId === "string" ? body.analysisId : "unknown",
      resumeText: body.resumeText,
      targetRole: typeof body.targetRole === "string" ? body.targetRole.slice(0, 60) : "",
      skills: strings(body.skills, 30),
      missingSkills: strings(body.missingSkills, 10),
      repos: strings(body.repos, 6),
    });
    return { status: 200, body: { set } };
  } catch (err) {
    console.error("interview build failed", err);
    return fail(500, "internal", "Something went wrong on our side. Please try again.");
  }
}
