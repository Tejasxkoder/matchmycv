export function createRateLimiter(limit: number, windowMs: number) {
  const hits = new Map<string, number[]>();

  return {
    take(key: string, now: number = Date.now()) {
      const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
      if (recent.length >= limit) {
        hits.set(key, recent);
        return { ok: false, retryInSeconds: Math.ceil((recent[0] + windowMs - now) / 1000) };
      }
      recent.push(now);
      hits.set(key, recent);
      return { ok: true, retryInSeconds: 0 };
    },
  };
}

export type RateLimiter = ReturnType<typeof createRateLimiter>;

export const analyzeLimiter = createRateLimiter(6, 10 * 60 * 1000);
