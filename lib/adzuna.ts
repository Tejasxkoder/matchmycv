const BASE_URL = "https://api.adzuna.com/v1/api";
export const ADZUNA_COUNTRY = (process.env.ADZUNA_COUNTRY || "us").toLowerCase();
const CACHE_TTL_MS = 5 * 60 * 1000;
const MAX_CACHE_ENTRIES = 500;
const MAX_CONCURRENT_REQUESTS = 3;

type CachedResult = { expiresAt: number; result: AdzunaSearchResult };

const cache = new Map<string, CachedResult>();
const inFlight = new Map<string, Promise<AdzunaSearchResult>>();
const slotWaiters: Array<() => void> = [];
let activeRequests = 0;

export class AdzunaError extends Error {
  constructor(
    readonly status: number,
    message: string
  ) {
    super(`Adzuna search failed (${status}): ${message}`);
    this.name = "AdzunaError";
  }
}

function credentials() {
  const app_id = process.env.ADZUNA_APP_ID;
  const app_key = process.env.ADZUNA_APP_KEY;
  if (!app_id || !app_key) {
    throw new Error(
      "ADZUNA_APP_ID / ADZUNA_APP_KEY are not set. Register free at developer.adzuna.com and add both to .env.local — see .env.local.example."
    );
  }
  return { app_id, app_key };
}

export type AdzunaJob = {
  title: string;
  company: { display_name: string };
  location: { display_name: string };
  salary_min?: number;
  salary_max?: number;
  created: string;
  redirect_url: string;
  description: string;
};

export type AdzunaSearchResult = {
  count: number;
  results: AdzunaJob[];
};

async function acquireRequestSlot(): Promise<void> {
  if (activeRequests < MAX_CONCURRENT_REQUESTS) {
    activeRequests += 1;
    return;
  }
  await new Promise<void>((resolve) => slotWaiters.push(resolve));
}

function releaseRequestSlot(): void {
  const next = slotWaiters.shift();
  if (next) next();
  else activeRequests -= 1;
}

export async function searchJobs(params: {
  what: string;
  where?: string;
  resultsPerPage?: number;
  maxDaysOld?: number;
  titleOnly?: string;
}): Promise<AdzunaSearchResult> {
  const normalized = {
    what: params.what,
    where: params.where,
    resultsPerPage: params.resultsPerPage ?? 10,
    maxDaysOld: params.maxDaysOld,
    titleOnly: params.titleOnly,
  };
  const cacheKey = JSON.stringify([ADZUNA_COUNTRY, normalized]);
  const cached = cache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return cached.result;

  const pending = inFlight.get(cacheKey);
  if (pending) return pending;

  const { app_id, app_key } = credentials();
  const query = new URLSearchParams({
    app_id,
    app_key,
    results_per_page: String(normalized.resultsPerPage),
    what: normalized.what,
    "content-type": "application/json",
  });
  if (normalized.where) query.set("where", normalized.where);
  if (normalized.maxDaysOld) query.set("max_days_old", String(normalized.maxDaysOld));
  if (normalized.titleOnly) query.set("title_only", normalized.titleOnly);

  const request = (async () => {
    await acquireRequestSlot();
    try {
      const res = await fetch(`${BASE_URL}/jobs/${ADZUNA_COUNTRY}/search/1?${query.toString()}`);
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new AdzunaError(res.status, text);
      }
      const result = (await res.json()) as AdzunaSearchResult;
      for (const [key, entry] of cache) {
        if (entry.expiresAt <= Date.now()) cache.delete(key);
      }
      if (cache.size >= MAX_CACHE_ENTRIES) {
        const oldestKey = cache.keys().next().value;
        if (oldestKey !== undefined) cache.delete(oldestKey);
      }
      cache.set(cacheKey, { result, expiresAt: Date.now() + CACHE_TTL_MS });
      return result;
    } finally {
      releaseRequestSlot();
    }
  })();
  inFlight.set(cacheKey, request);

  try {
    return await request;
  } finally {
    if (inFlight.get(cacheKey) === request) inFlight.delete(cacheKey);
  }
}
