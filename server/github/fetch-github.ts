import type { GithubRepo, GithubSnapshot } from "../../lib/github-types";

export class GithubError extends Error {
  code: "not_found" | "rate_limited" | "upstream";

  constructor(code: GithubError["code"], message: string) {
    super(message);
    this.name = "GithubError";
    this.code = code;
  }
}

type Fetch = typeof fetch;

const API = "https://api.github.com";
const ACTIVITY_WINDOW_DAYS = 90;

async function getJson(send: Fetch, path: string): Promise<unknown> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "matchmycv",
  };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  let res: Response;
  try {
    res = await send(`${API}${path}`, { headers });
  } catch {
    throw new GithubError("upstream", "Could not reach GitHub. Check your connection and try again.");
  }
  if (res.status === 404) throw new GithubError("not_found", "No GitHub user with that name.");
  if (res.status === 403 || res.status === 429) {
    throw new GithubError("rate_limited", "GitHub is rate limiting this server. Try again in a few minutes, or set GITHUB_TOKEN.");
  }
  if (!res.ok) throw new GithubError("upstream", `GitHub request failed (${res.status}).`);
  return res.json();
}

type RawRepo = {
  name?: string;
  description?: string | null;
  stargazers_count?: number;
  language?: string | null;
  html_url?: string;
  topics?: string[];
  fork?: boolean;
};

type RawEvent = { created_at?: string; type?: string; payload?: { size?: number } };

export function bucketActivity(events: RawEvent[], now: number = Date.now()): Record<string, number> {
  const activity: Record<string, number> = {};
  const cutoff = now - ACTIVITY_WINDOW_DAYS * 86400000;
  for (const event of events) {
    if (!event.created_at) continue;
    const at = new Date(event.created_at).getTime();
    if (Number.isNaN(at) || at < cutoff) continue;
    const day = event.created_at.slice(0, 10);
    const weight = event.type === "PushEvent" ? Math.max(1, event.payload?.size ?? 1) : 1;
    activity[day] = (activity[day] ?? 0) + weight;
  }
  return activity;
}

export async function fetchGithub(username: string, send: Fetch = fetch): Promise<GithubSnapshot> {
  if (!/^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})$/.test(username)) {
    throw new GithubError("not_found", "That is not a valid GitHub username.");
  }
  const user = encodeURIComponent(username);
  const profile = (await getJson(send, `/users/${user}`)) as {
    login?: string;
    name?: string | null;
    public_repos?: number;
    followers?: number;
    html_url?: string;
  };
  const [repos, events1, events2] = await Promise.all([
    getJson(send, `/users/${user}/repos?per_page=100&sort=pushed`) as Promise<RawRepo[]>,
    getJson(send, `/users/${user}/events/public?per_page=100&page=1`).catch(() => []) as Promise<RawEvent[]>,
    getJson(send, `/users/${user}/events/public?per_page=100&page=2`).catch(() => []) as Promise<RawEvent[]>,
  ]);

  const own = (Array.isArray(repos) ? repos : []).filter((r) => !r.fork);
  const languages: Record<string, number> = {};
  const topics: Record<string, number> = {};
  let totalStars = 0;
  for (const repo of own) {
    totalStars += repo.stargazers_count ?? 0;
    if (repo.language) languages[repo.language] = (languages[repo.language] ?? 0) + 1;
    for (const topic of repo.topics ?? []) topics[topic] = (topics[topic] ?? 0) + 1;
  }

  const topRepos: GithubRepo[] = [...own]
    .sort((a, b) => (b.stargazers_count ?? 0) - (a.stargazers_count ?? 0))
    .slice(0, 4)
    .map((r) => ({
      name: r.name ?? "",
      description: r.description ?? "",
      stars: r.stargazers_count ?? 0,
      language: r.language ?? null,
      url: r.html_url ?? "",
    }));

  const events = [...(Array.isArray(events1) ? events1 : []), ...(Array.isArray(events2) ? events2 : [])];

  return {
    username: profile.login ?? username,
    name: profile.name ?? null,
    profileUrl: profile.html_url ?? `https://github.com/${username}`,
    publicRepos: profile.public_repos ?? own.length,
    followers: profile.followers ?? 0,
    totalStars,
    topRepos,
    languages,
    topics,
    activity: bucketActivity(events),
    activityDays: ACTIVITY_WINDOW_DAYS,
    fetchedAt: new Date().toISOString(),
  };
}
