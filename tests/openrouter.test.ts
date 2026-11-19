import test from "node:test";
import assert from "node:assert/strict";
import { OpenRouterError, chatCompletion, modelsFromEnv } from "../server/ai/openrouter";

const messages = [{ role: "user" as const, content: "hi" }];

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

function ok(content: unknown, model = "vendor/model:free") {
  return jsonResponse({ model, choices: [{ message: { content } }] });
}

async function failsWith(promise: Promise<unknown>, code: string) {
  await assert.rejects(promise, (err: unknown) => err instanceof OpenRouterError && err.code === code);
}

test("returns the reply and the model that answered", async () => {
  const result = await chatCompletion(messages, { apiKey: "k", fetchImpl: async () => ok("hello") });
  assert.deepEqual(result, { content: "hello", model: "vendor/model:free" });
});

test("sends the key, one model as model, several as models", async () => {
  let seen: { headers: Record<string, string>; body: Record<string, unknown> } | null = null;
  const spy = async (_url: unknown, init?: RequestInit) => {
    seen = { headers: init?.headers as Record<string, string>, body: JSON.parse(String(init?.body)) };
    return ok("x");
  };
  await chatCompletion(messages, { apiKey: "secret", models: ["a/b:free"], fetchImpl: spy as typeof fetch });
  assert.equal(seen!.headers.Authorization, "Bearer secret");
  assert.equal(seen!.body.model, "a/b:free");
  assert.equal("models" in seen!.body, false);

  await chatCompletion(messages, { apiKey: "secret", models: ["a/b:free", "c/d:free"], fetchImpl: spy as typeof fetch });
  assert.deepEqual(seen!.body.models, ["a/b:free", "c/d:free"]);
  assert.equal("model" in seen!.body, false);
});

test("defaults to the free router", () => {
  assert.deepEqual(modelsFromEnv(undefined), ["openrouter/free"]);
  assert.deepEqual(modelsFromEnv(" a/b:free , c/d:free "), ["a/b:free", "c/d:free"]);
  assert.deepEqual(modelsFromEnv(""), ["openrouter/free"]);
});

test("missing key", async () => {
  const saved = process.env.OPENROUTER_API_KEY;
  delete process.env.OPENROUTER_API_KEY;
  await failsWith(chatCompletion(messages, { fetchImpl: async () => ok("x") }), "missing_key");
  if (saved) process.env.OPENROUTER_API_KEY = saved;
});

test("maps http errors", async () => {
  const run = (status: number, body: unknown = {}) =>
    chatCompletion(messages, { apiKey: "k", fetchImpl: async () => jsonResponse(body, status) });
  await failsWith(run(401), "auth");
  await failsWith(run(402), "auth");
  await failsWith(run(429), "rate_limited");
  await failsWith(run(503), "upstream");
});

test("explains the privacy setting problem", async () => {
  const body = { error: { message: "No endpoints found matching your data policy (Free model training)" } };
  await assert.rejects(
    chatCompletion(messages, { apiKey: "k", fetchImpl: async () => jsonResponse(body, 404) }),
    (err: unknown) => err instanceof OpenRouterError && /privacy settings/.test(err.message)
  );
});

test("treats an error inside a 200 as an error", async () => {
  const body = { error: { code: 429, message: "Provider returned error" } };
  await failsWith(chatCompletion(messages, { apiKey: "k", fetchImpl: async () => jsonResponse(body) }), "rate_limited");
});

test("empty replies are errors, content parts are joined", async () => {
  await failsWith(chatCompletion(messages, { apiKey: "k", fetchImpl: async () => ok("   ") }), "empty");
  await failsWith(chatCompletion(messages, { apiKey: "k", fetchImpl: async () => ok(null) }), "empty");
  const joined = await chatCompletion(messages, {
    apiKey: "k",
    fetchImpl: async () => ok([{ text: "{\"a\":" }, { text: "1}" }]),
  });
  assert.equal(joined.content, '{"a":1}');
});

test("network failure and timeout", async () => {
  await failsWith(
    chatCompletion(messages, {
      apiKey: "k",
      fetchImpl: async () => {
        throw new TypeError("fetch failed");
      },
    }),
    "upstream"
  );

  const hang = (_url: unknown, init?: RequestInit) =>
    new Promise<Response>((_resolve, reject) => {
      init?.signal?.addEventListener("abort", () => {
        const err = new Error("aborted");
        err.name = "AbortError";
        reject(err);
      });
    });
  await failsWith(chatCompletion(messages, { apiKey: "k", timeoutMs: 20, fetchImpl: hang as typeof fetch }), "timeout");
});
