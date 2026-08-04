import assert from "node:assert/strict";
import { existsSync, readFileSync, rmSync } from "node:fs";
import { spawnSync } from "node:child_process";
import test from "node:test";

test("cli builds and validates a pack", () => {
  const out = "/tmp/agent-eval-pack-cli-test";
  rmSync(out, { force: true, recursive: true });
  const build = spawnSync("node", ["bin/agent-eval-pack.js", "build", "fixtures/success-run.md", "--out", out], {
    encoding: "utf8"
  });
  assert.equal(build.status, 0);
  assert.equal(existsSync(`${out}/evals.json`), true);
  assert.equal(existsSync(`${out}/review-brief.md`), true);

  const validate = spawnSync("node", ["bin/agent-eval-pack.js", "validate", `${out}/evals.json`], {
    encoding: "utf8"
  });
  assert.equal(validate.status, 0);
});

test("init template includes review triage fields", () => {
  const out = "/tmp/agent-eval-pack-init-test";
  rmSync(out, { force: true, recursive: true });
  const init = spawnSync("node", ["bin/agent-eval-pack.js", "init", "--out", out], {
    encoding: "utf8"
  });
  assert.equal(init.status, 0);
  const template = readFileSync(`${out}/run-note.md`, "utf8");
  assert.match(template, /## Risk Level/);
  assert.match(template, /## Tags/);
});

test("cli reports missing input", () => {
  const result = spawnSync("node", ["bin/agent-eval-pack.js", "build"], {
    encoding: "utf8"
  });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Missing input/);
});

for (const flag of ["--out", "--id-prefix"]) {
  test(`cli reports a missing value for ${flag} without a stack trace`, () => {
    const result = spawnSync("node", ["bin/agent-eval-pack.js", "build", "fixtures/success-run.md", flag], {
      encoding: "utf8"
    });
    assert.equal(result.status, 1);
    assert.match(result.stderr, new RegExp(`Missing value for ${flag}`));
    assert.match(result.stderr, /Usage:/);
    assert.doesNotMatch(result.stderr, /\n\s+at |ERR_INVALID_ARG_TYPE|TypeError/);
  });
}

for (const [name, cliArgs, message] of [
  ["unknown build options", ["build", "fixtures/success-run.md", "--typo"], /Unknown option: --typo/],
  ["build-only options on init", ["init", "--stdout"], /Unknown option: --stdout/],
  ["build-only options on validate", ["validate", "one.json", "--out", "pack"], /Unknown option: --out/],
  ["stray init values", ["init", "unexpected"], /Unexpected argument: unexpected/],
  ["stray validate values", ["validate", "one.json", "two.json"], /Unexpected argument: two.json/]
]) {
  test(`cli rejects ${name}`, () => {
    const result = spawnSync("node", ["bin/agent-eval-pack.js", ...cliArgs], { encoding: "utf8" });
    assert.equal(result.status, 1);
    assert.match(result.stderr, message);
  });
}

test("cli help documents build, init, and validate commands", () => {
  const result = spawnSync("node", ["bin/agent-eval-pack.js", "--help"], {
    encoding: "utf8"
  });
  assert.equal(result.status, 0);
  assert.match(result.stdout, /Usage:/);
  assert.match(result.stdout, /agent-eval-pack build/);
  assert.match(result.stdout, /agent-eval-pack init/);
  assert.match(result.stdout, /agent-eval-pack validate/);
});

test("cli can print JSON to stdout", () => {
  const result = spawnSync("node", ["bin/agent-eval-pack.js", "build", "fixtures/success-run.md", "--stdout"], {
    encoding: "utf8"
  });
  assert.equal(result.status, 0);
  assert.equal(JSON.parse(result.stdout).tool, "agent-eval-pack");
});

test("cli can print multi-file summaries", () => {
  const result = spawnSync(
    "node",
    [
      "bin/agent-eval-pack.js",
      "build",
      "fixtures/success-run.md",
      "fixtures/mixed-run.md",
      "--summary",
      "--id-prefix",
      "nightly"
    ],
    { encoding: "utf8" }
  );
  assert.equal(result.status, 0);
  const summary = JSON.parse(result.stdout);
  assert.equal(summary.caseCount, 2);
  assert.equal(summary.outcomeCounts.success, 1);
  assert.equal(summary.outcomeCounts.mixed, 1);
});

test("cli require-commands rejects fenced blocks outside Evidence", () => {
  const out = "/tmp/agent-eval-pack-excluded-commands-test";
  rmSync(out, { force: true, recursive: true });
  const build = spawnSync(
    "node",
    ["bin/agent-eval-pack.js", "build", "fixtures/excluded-command-blocks.md", "--out", out],
    { encoding: "utf8" }
  );
  assert.equal(build.status, 0);

  const validate = spawnSync(
    "node",
    ["bin/agent-eval-pack.js", "validate", `${out}/evals.json`, "--require-commands"],
    { encoding: "utf8" }
  );
  assert.equal(validate.status, 1);
  assert.deepEqual(JSON.parse(validate.stdout), {
    valid: false,
    errors: ["case 0 missing command evidence."]
  });
});

test("cli require-commands accepts commands fenced in Evidence", () => {
  const out = "/tmp/agent-eval-pack-evidence-commands-test";
  rmSync(out, { force: true, recursive: true });
  const build = spawnSync(
    "node",
    ["bin/agent-eval-pack.js", "build", "fixtures/mixed-section-commands.md", "--out", out],
    { encoding: "utf8" }
  );
  assert.equal(build.status, 0);
  const pack = JSON.parse(readFileSync(`${out}/evals.json`, "utf8"));
  assert.deepEqual(pack.cases[0].commands, ["npm test"]);

  const validate = spawnSync(
    "node",
    ["bin/agent-eval-pack.js", "validate", `${out}/evals.json`, "--require-commands"],
    { encoding: "utf8" }
  );
  assert.equal(validate.status, 0);
  assert.equal(JSON.parse(validate.stdout).valid, true);
});
