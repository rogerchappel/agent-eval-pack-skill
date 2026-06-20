import assert from "node:assert/strict";
import test from "node:test";
import { buildEvalPack, parseRunNote, redact, renderBrief, validateEvalObject } from "../src/index.js";

test("builds an eval pack from a successful run note", () => {
  const pack = buildEvalPack("fixtures/success-run.md");
  assert.equal(pack.schemaVersion, 1);
  assert.equal(pack.cases[0].outcome, "success");
  assert.deepEqual(pack.cases[0].commands, ["npm run smoke", "npm test"]);
});

test("redacts tokens and home paths", () => {
  const note = parseRunNote("fixtures/failure-run.md");
  assert.match(note.inputs, /\[REDACTED_SECRET\]/);
  assert.doesNotMatch(note.inputs, /\/Users\/roger/);
});

test("validates required eval fields", () => {
  const pack = buildEvalPack("fixtures/mixed-run.md");
  assert.equal(validateEvalObject(pack).valid, true);
  assert.equal(validateEvalObject({ schemaVersion: 1, cases: [{}] }).valid, false);
});

test("renders a reviewer brief", () => {
  const pack = buildEvalPack("fixtures/success-run.md");
  assert.match(renderBrief(pack), /Expected Behavior/);
});

test("redact handles common secret shapes", () => {
  assert.equal(redact("sk-abc123 token"), "[REDACTED_SECRET] token");
});
