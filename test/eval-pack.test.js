import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";
import {
  buildEvalPack,
  extractCommands,
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

test("validation rejects blank required strings and malformed tags", () => {
  const pack = buildEvalPack("fixtures/mixed-run.md");
  Object.assign(pack.cases[0], {
    id: "   ",
    title: "\t",
    scenario: "\n",
    expectedBehavior: " ",
    forbiddenBehavior: "\r\n",
    rubric: "  ",
    tags: ["regression", " ", 42, null]
  });

  assert.deepEqual(validateEvalObject(pack), {
    valid: false,
    errors: [
      "case 0 missing id.",
      "case 0 missing title.",
      "case 0 missing scenario.",
      "case 0 missing expectedBehavior.",
      "case 0 missing forbiddenBehavior.",
      "case 0 missing rubric.",
      "case 0 tag 1 must be a non-empty string.",
      "case 0 tag 2 must be a non-empty string.",
      "case 0 tag 3 must be a non-empty string."
    ]
  });
});

for (const [heading, field] of [
  ["Scenario", "scenario"],
  ["Expected Behavior", "expectedBehavior"],
  ["Forbidden Behavior", "forbiddenBehavior"]
]) {
  test(`built packs identify a missing ${heading} section`, () => {
    const directory = mkdtempSync(join(tmpdir(), "agent-eval-pack-incomplete-"));
    const notePath = join(directory, "run-note.md");
    const note = readFileSync("fixtures/success-run.md", "utf8").replace(
      new RegExp(`\\n## ${heading}\\n[\\s\\S]*?(?=\\n## )`),
      ""
    );
    writeFileSync(notePath, note);
    try {
      const pack = buildEvalPack(notePath, { generatedAt: "2026-08-25T00:00:00.000Z" });
      assert.deepEqual(validateEvalObject(pack), {
        valid: false,
        errors: [`case 0 missing ${field}.`]
      });
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });
}

test("validation rejects non-object pack roots with a stable error", () => {
  for (const pack of [null, [], "pack", 1, true]) {
    assert.deepEqual(validateEvalObject(pack), {
      valid: false,
      errors: ["eval pack must be an object."]
    });
  }
});

test("validation rejects missing and unsupported schema versions with a stable error", () => {
  const validCase = buildEvalPack("fixtures/success-run.md").cases[0];
  for (const pack of [
    { cases: [validCase] },
    { schemaVersion: 2, cases: [validCase] }
  ]) {
    assert.deepEqual(validateEvalObject(pack), {
      valid: false,
      errors: ["schemaVersion must be 1."]
    });
  }
});

test("validation rejects a non-array cases field without iterating it", () => {
  assert.deepEqual(validateEvalObject({ schemaVersion: 1, cases: {} }), {
    valid: false,
    errors: ["cases must be a non-empty array."]
  });
});

test("validation positions errors for non-object case entries", () => {
  assert.deepEqual(validateEvalObject({ schemaVersion: 1, cases: [null, "case", 1, [], true] }), {
    valid: false,
    errors: [
      "case 0 must be an object.",
      "case 1 must be an object.",
      "case 2 must be an object.",
      "case 3 must be an object.",
      "case 4 must be an object."
    ]
  });
});

test("can require command evidence", () => {
  const pack = buildEvalPack("fixtures/failure-run.md");
  assert.equal(validateEvalObject(pack, { requireCommands: true }).valid, false);
});

test("validation rejects malformed command entries with positioned errors", () => {
  const pack = buildEvalPack("fixtures/success-run.md");
  pack.cases[0].commands = ["npm test", " ", null, 42];

  assert.deepEqual(validateEvalObject(pack), {
    valid: false,
    errors: [
      "case 0 command 1 must be a non-empty string.",
      "case 0 command 2 must be a non-empty string.",
      "case 0 command 3 must be a non-empty string."
    ]
  });
});

test("require-commands accepts only arrays containing non-empty command strings", () => {
  const pack = buildEvalPack("fixtures/success-run.md");
  for (const commands of [undefined, [], null, [""], [" \t"], [false]]) {
    pack.cases[0].commands = commands;
    assert.equal(validateEvalObject(pack, { requireCommands: true }).valid, false);
  }
  pack.cases[0].commands = ["npm test"];
  assert.equal(validateEvalObject(pack, { requireCommands: true }).valid, true);
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

test("extracts shell commands from Evidence with non-shell fences before them", () => {
  const pack = buildEvalPack("fixtures/mixed-fences.md");
  assert.deepEqual(pack.cases[0].commands, ["npm test"]);
  assert.equal(validateEvalObject(pack, { requireCommands: true }).valid, true);
});

test("unlabeled Evidence fences contribute command lines like shell fences", () => {
  const evidence = "```\nnpm run smoke\n```";
  assert.deepEqual(extractCommands(evidence), ["npm run smoke"]);
});

test("non-shell Evidence fences contribute no commands and cannot corrupt pairing", () => {
  const evidence = "```json\n{ \"passing\": true }\n```\nprose stays out\n```bash\nnpm test\n```";
  assert.deepEqual(extractCommands(evidence), ["npm test"]);
});

test("extracts the same mixed-fence Evidence commands with LF and CRLF", () => {
  const note = readFileSync("fixtures/mixed-fences.md", "utf8");
  assert.deepEqual(extractCommands(note.replaceAll("\n", "\r\n")), extractCommands(note));
});

test("extracts the same fenced Evidence commands with LF and CRLF", () => {
  const evidence = "```bash\nnpm run smoke\nnpm test\n```";
  assert.deepEqual(extractCommands(evidence.replaceAll("\n", "\r\n")), extractCommands(evidence));
});

test("builds and validates CRLF command evidence with --require-commands", () => {
  const directory = mkdtempSync(join(tmpdir(), "agent-eval-pack-crlf-"));
  const notePath = join(directory, "run-note.md");
  const outPath = join(directory, "pack");
  const note = readFileSync("fixtures/success-run.md", "utf8").replaceAll("\n", "\r\n");
  writeFileSync(notePath, note);
  try {
    const build = spawnSync(process.execPath, ["bin/agent-eval-pack.js", "build", notePath, "--out", outPath], {
      encoding: "utf8"
    });
    assert.equal(build.status, 0, build.stderr);
    const validation = spawnSync(process.execPath, [
      "bin/agent-eval-pack.js",
      "validate",
      join(outPath, "evals.json"),
      "--require-commands"
    ], { encoding: "utf8" });
    assert.equal(validation.status, 0, validation.stderr || validation.stdout);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
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
