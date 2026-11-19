import test from "node:test";
import assert from "node:assert/strict";
import { AdzunaError, searchJobs } from "../lib/adzuna";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

test("coalesces concurrent searches and caches successful results", async () => {
  const originalFetch = globalThis.fetch;
  const originalAppId = process.env.ADZUNA_APP_ID;
  const originalAppKey = process.env.ADZUNA_APP_KEY;
  process.env.ADZUNA_APP_ID = "test-app";
  process.env.ADZUNA_APP_KEY = "test-key";
  let calls = 0;
  globalThis.fetch = (async () => {
    calls += 1;
    await new Promise((resolve) => setTimeout(resolve, 10));
    return json({ count: 1, results: [] });
  }) as typeof fetch;

  try {
    const what = `cache-test-${Date.now()}`;
    const [first, second] = await Promise.all([
      searchJobs({ what, resultsPerPage: 1 }),
      searchJobs({ what, resultsPerPage: 1 }),
    ]);
    const cached = await searchJobs({ what, resultsPerPage: 1 });
    assert.deepEqual(first, { count: 1, results: [] });
    assert.deepEqual(second, first);
    assert.deepEqual(cached, first);
    assert.equal(calls, 1);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalAppId === undefined) delete process.env.ADZUNA_APP_ID;
    else process.env.ADZUNA_APP_ID = originalAppId;
    if (originalAppKey === undefined) delete process.env.ADZUNA_APP_KEY;
    else process.env.ADZUNA_APP_KEY = originalAppKey;
  }
});

test("does not cache failed searches so a later request can retry", async () => {
  const originalFetch = globalThis.fetch;
  const originalAppId = process.env.ADZUNA_APP_ID;
  const originalAppKey = process.env.ADZUNA_APP_KEY;
  process.env.ADZUNA_APP_ID = "test-app";
  process.env.ADZUNA_APP_KEY = "test-key";
  let calls = 0;
  globalThis.fetch = (async () => {
    calls += 1;
    return json({ error: "Too Many Requests" }, 429);
  }) as typeof fetch;

  try {
    const what = `rate-limit-test-${Date.now()}`;
    await assert.rejects(searchJobs({ what }), (err: unknown) =>
      err instanceof AdzunaError && err.status === 429
    );
    await assert.rejects(searchJobs({ what }), (err: unknown) =>
      err instanceof AdzunaError && err.status === 429
    );
    assert.equal(calls, 2);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalAppId === undefined) delete process.env.ADZUNA_APP_ID;
    else process.env.ADZUNA_APP_ID = originalAppId;
    if (originalAppKey === undefined) delete process.env.ADZUNA_APP_KEY;
    else process.env.ADZUNA_APP_KEY = originalAppKey;
  }
});

test("limits the number of simultaneous Adzuna requests", async () => {
  const originalFetch = globalThis.fetch;
  const originalAppId = process.env.ADZUNA_APP_ID;
  const originalAppKey = process.env.ADZUNA_APP_KEY;
  process.env.ADZUNA_APP_ID = "test-app";
  process.env.ADZUNA_APP_KEY = "test-key";
  let active = 0;
  let maxActive = 0;
  globalThis.fetch = (async () => {
    active += 1;
    maxActive = Math.max(maxActive, active);
    await new Promise((resolve) => setTimeout(resolve, 10));
    active -= 1;
    return json({ count: 0, results: [] });
  }) as typeof fetch;

  try {
    await Promise.all(
      Array.from({ length: 8 }, (_, index) =>
        searchJobs({ what: `concurrency-test-${Date.now()}-${index}` })
      )
    );
    assert.equal(maxActive, 3);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalAppId === undefined) delete process.env.ADZUNA_APP_ID;
    else process.env.ADZUNA_APP_ID = originalAppId;
    if (originalAppKey === undefined) delete process.env.ADZUNA_APP_KEY;
    else process.env.ADZUNA_APP_KEY = originalAppKey;
  }
});
