import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const html = await readFile(new URL("../dist/index.html", import.meta.url), "utf8");
const js = await readFile(new URL("../dist/app.js", import.meta.url), "utf8");

test("ships the official Pollinations wallet component", () => {
  assert.match(html, /<polli-connect/);
  assert.match(html, /budget="2"/);
  assert.match(html, /Quest #19181/);
});

test("uses the visitor key for a Pollinations model call", () => {
  assert.match(js, /Authorization: `Bearer \$\{connect\.apiKey\}`/);
  assert.match(js, /openai\/gpt-5\.4-nano/);
  assert.match(js, /reasoning_effort: "low"/);
});

test("includes an offline interactive science explorer", () => {
  assert.match(js, /Why coral reefs bleach/);
  assert.match(js, /renderMap\(\)/);
  assert.match(js, /renderQuiz\(\)/);
});

