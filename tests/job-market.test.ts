import test from "node:test";
import assert from "node:assert/strict";

test("shows at most ten fresh 40%+ matches and formats India salaries", async () => {
  const originalFetch = globalThis.fetch;
  const originalAppId = process.env.ADZUNA_APP_ID;
  const originalAppKey = process.env.ADZUNA_APP_KEY;
  const originalCountry = process.env.ADZUNA_COUNTRY;
  process.env.ADZUNA_APP_ID = "test-app";
  process.env.ADZUNA_APP_KEY = "test-key";
  process.env.ADZUNA_COUNTRY = "IN";
  const { GET } = await import("../app/api/job-market/route");
  const requestedUrls: URL[] = [];
  const created = new Date().toISOString();
  const jobs = Array.from({ length: 12 }, (_, index) => ({
    title: "Junior Full Stack Developer",
    company: { display_name: `Test Co ${index}` },
    location: { display_name: "Testland" },
    salary_min: 300000,
    salary_max: 400000,
    created: new Date(Date.now() - index * 86400000).toISOString(),
    redirect_url: `https://example.test/jobs/${index}`,
    description:
      index < 5
        ? "Build applications with React and Node.js."
        : index < 11
        ? "Build applications with React and Python."
        : "Build applications with Python and Java.",
  }));
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = new URL(String(input));
    requestedUrls.push(url);
    return new Response(
      JSON.stringify({
        count: 1,
        results: jobs,
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  }) as typeof fetch;

  try {
    const response = await GET(
      new Request(
        "http://localhost/api/job-market?role=full%20stack%20developer&where=Testland&skills=React%2CNode.js"
      )
    );
    const body = await response.json();
    const mainQuery = requestedUrls.find((url) => url.searchParams.get("results_per_page") === "50");

    assert.equal(response.status, 200);
    assert.ok(mainQuery);
    assert.equal(mainQuery.searchParams.get("what"), "full stack developer");
    assert.equal(mainQuery.searchParams.get("title_only"), "full stack developer");
    assert.equal(mainQuery.searchParams.get("max_days_old"), "30");
    assert.ok(requestedUrls.every((url) => url.searchParams.get("where") === "Testland"));
    assert.ok(!requestedUrls.some((url) => url.searchParams.get("what") === "Go"));
    assert.equal(body.currency, "INR");
    assert.equal(body.matchCount, 10);
    assert.equal(body.listings.length, 10);
    assert.ok(body.listings.every((job: { matchPercent: number }) => job.matchPercent >= 40));
    assert.equal(body.listings[0].matchPercent, 100);
    assert.equal(body.listings[5].matchPercent, 50);
    assert.equal(body.listings[0].salaryMin, 300000);
    assert.equal(body.salaryBands[0].min, 300000);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalAppId === undefined) delete process.env.ADZUNA_APP_ID;
    else process.env.ADZUNA_APP_ID = originalAppId;
    if (originalAppKey === undefined) delete process.env.ADZUNA_APP_KEY;
    else process.env.ADZUNA_APP_KEY = originalAppKey;
    if (originalCountry === undefined) delete process.env.ADZUNA_COUNTRY;
    else process.env.ADZUNA_COUNTRY = originalCountry;
  }
});
