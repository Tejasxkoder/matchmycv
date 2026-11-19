import test from "node:test";
import assert from "node:assert/strict";
import { extractJsonObject } from "../server/ai/json";

test("reads a plain object", () => {
  assert.deepEqual(extractJsonObject('{"a":1}'), { a: 1 });
});

test("reads an object inside code fences", () => {
  assert.deepEqual(extractJsonObject('```json\n{"a":1}\n```'), { a: 1 });
});

test("skips prose before and after the object", () => {
  assert.deepEqual(extractJsonObject('Sure! Here you go:\n{"a":{"b":2}}\nHope that helps.'), { a: { b: 2 } });
});

test("drops think blocks", () => {
  assert.deepEqual(extractJsonObject('<think>{"x":1} maybe</think>{"a":3}'), { a: 3 });
});

test("repairs trailing commas", () => {
  assert.deepEqual(extractJsonObject('{"a":[1,2,],"b":"c",}'), { a: [1, 2], b: "c" });
});

test("ignores braces inside strings", () => {
  assert.deepEqual(extractJsonObject('{"a":"} not the end {","b":1}'), { a: "} not the end {", b: 1 });
});

test("returns null when there is no object", () => {
  assert.equal(extractJsonObject("no json here"), null);
  assert.equal(extractJsonObject('{"a": '), null);
  assert.equal(extractJsonObject("{not: valid}"), null);
});
