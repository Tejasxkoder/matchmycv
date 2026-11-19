import { fail, clientIp } from "./http-error";
import { GithubError, fetchGithub } from "./github/fetch-github";
import { createRateLimiter, type RateLimiter } from "./rate-limit";

export const githubLimiter = createRateLimiter(20, 10 * 60 * 1000);

type Deps = { fetchSnapshot?: typeof fetchGithub; limiter?: RateLimiter };

export async function handleGithub(req: Request, deps: Deps = {}) {
  const fetchSnapshot = deps.fetchSnapshot ?? fetchGithub;
  const limiter = deps.limiter ?? githubLimiter;

  const turn = limiter.take(clientIp(req));
  if (!turn.ok) return fail(429, "too_many_requests", `Too many lookups. Try again in ${turn.retryInSeconds} seconds.`);

  const username = new URL(req.url).searchParams.get("user")?.trim() ?? "";
  if (!username) return fail(422, "empty", "Enter a GitHub username.");

  try {
    return { status: 200, body: { github: await fetchSnapshot(username) } };
  } catch (err) {
    if (err instanceof GithubError) {
      const status = err.code === "not_found" ? 404 : err.code === "rate_limited" ? 429 : 502;
      return fail(status, err.code, err.message);
    }
    console.error("github lookup failed", err);
    return fail(500, "internal", "Something went wrong on our side. Please try again.");
  }
}
