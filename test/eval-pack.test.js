import assert from "node:assert/strict";
import test from "node:test";
import {
  buildEvalPack,
  parseRunNote,
  portableSource,
  redact,
  renderBrief,
  summarizeEvalPack,
  validateEvalObject
} from "../src/index.js";

test("builds an eval pack from a successful run note", () => {
  const pack = buildEvalPack("fixtures/success-run.md");
  assert.equal(pack.schemaVersion, 1);
  assert.equal(pack.cases[0].outcome, "success");
  assert.equal(pack.cases[0].riskLevel, "medium");
  assert.deepEqual(pack.cases[0].tags, ["cli", "smoke", "regression"]);
  assert.deepEqual(pack.cases[0].commands, ["npm run smoke", "npm test"]);
});

test("redacts tokens and home paths", () => {
  const note = parseRunNote("fixtures/failure-run.md");
  assert.match(note.inputs, /\[REDACTED_SECRET\]/);
  assert.doesNotMatch(note.inputs, /\/Users\/roger/);
});

test("uses portable source metadata for absolute POSIX paths", () => {
  const pack = buildEvalPack(`${process.cwd()}/fixtures/success-run.md`);
  assert.equal(pack.cases[0].source, "fixtures/success-run.md");
  assert.doesNotMatch(pack.cases[0].source, /^\/|\/private\/tmp|\/Users\//);
});

test("reduces absolute Windows paths to a portable source name", () => {
  assert.equal(portableSource("C:\\Users\\roger\\runs\\success-run.md"), "success-run.md");
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

test("ignores fenced command blocks outside Evidence", () => {
  const pack = buildEvalPack("fixtures/excluded-command-blocks.md");
  assert.deepEqual(pack.cases[0].commands, []);
  assert.equal(validateEvalObject(pack, { requireCommands: true }).valid, false);
});

test("extracts commands only from mixed Evidence content", () => {
  const pack = buildEvalPack("fixtures/mixed-section-commands.md");
  assert.deepEqual(pack.cases[0].commands, ["npm test"]);
  assert.equal(validateEvalObject(pack, { requireCommands: true }).valid, true);
});

test("renders a reviewer brief", () => {
  const pack = buildEvalPack("fixtures/success-run.md");
  assert.match(renderBrief(pack), /Expected Behavior/);
});

test("redact handles common secret shapes", () => {
  assert.equal(redact("sk-abc123 token"), "[REDACTED_SECRET] token");
});

test("redact preserves ordinary text without a configured HOME", () => {
  const originalHome = process.env.HOME;
  try {
    delete process.env.HOME;
    assert.equal(redact("plain text"), "plain text");
    process.env.HOME = "";
    assert.equal(redact("plain text"), "plain text");
  } finally {
    if (originalHome === undefined) delete process.env.HOME;
    else process.env.HOME = originalHome;
  }
});

test("redact replaces the configured home path on any platform", () => {
  const originalHome = process.env.HOME;
  try {
    process.env.HOME = "/custom/profile";
    assert.equal(redact("read /custom/profile/project/file.md"), "read ~/project/file.md");
  } finally {
    if (originalHome === undefined) delete process.env.HOME;
    else process.env.HOME = originalHome;
  }
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
    },
    riskCounts: {
      medium: 1,
      unspecified: 1
    },
    tagCounts: {
      cli: 1,
      smoke: 1,
      regression: 1
    }
  });
});

test("validation rejects duplicate case ids", () => {
  const pack = buildEvalPack("fixtures/success-run.md");
  pack.cases.push({ ...pack.cases[0] });
  assert.equal(validateEvalObject(pack).valid, false);
});
