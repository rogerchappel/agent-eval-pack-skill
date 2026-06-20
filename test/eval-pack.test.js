import assert from "node:assert/strict";
import test from "node:test";
import { buildEvalPack, parseRunNote, redact, renderBrief, summarizeEvalPack, validateEvalObject } from "../src/index.js";

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

test("can require command evidence", () => {
  const pack = buildEvalPack("fixtures/failure-run.md");
  assert.equal(validateEvalObject(pack, { requireCommands: true }).valid, false);
});

test("renders a reviewer brief", () => {
  const pack = buildEvalPack("fixtures/success-run.md");
  assert.match(renderBrief(pack), /Expected Behavior/);
});

test("redact handles common secret shapes", () => {
  assert.equal(redact("sk-abc123 token"), "[REDACTED_SECRET] token");
});

test("builds multi-case packs with unique ids", () => {
  const pack = buildEvalPack(["fixtures/success-run.md", "fixtures/success-run.md"], {
    generatedAt: "2026-06-20T00:00:00.000Z",
    idPrefix: "nightly"
  });
  assert.equal(pack.generatedAt, "2026-06-20T00:00:00.000Z");
  assert.equal(pack.cases.length, 2);
  assert.deepEqual(
    pack.cases.map((item) => item.id),
    ["nightly-fix-cli-smoke-failure", "nightly-fix-cli-smoke-failure-2"]
  );
});

test("summarizes pack volume for review queues", () => {
  const pack = buildEvalPack(["fixtures/success-run.md", "fixtures/mixed-run.md"], {
    generatedAt: "2026-06-20T00:00:00.000Z"
  });
  assert.deepEqual(summarizeEvalPack(pack), {
    schemaVersion: 1,
    generatedAt: "2026-06-20T00:00:00.000Z",
    caseCount: 2,
    commandCount: 4,
    outcomeCounts: {
      success: 1,
      mixed: 1
    }
  });
});

test("validation rejects duplicate case ids", () => {
  const pack = buildEvalPack("fixtures/success-run.md");
  pack.cases.push({ ...pack.cases[0] });
  assert.equal(validateEvalObject(pack).valid, false);
});
