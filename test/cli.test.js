import assert from "node:assert/strict";
import { existsSync, rmSync } from "node:fs";
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

test("cli reports missing input", () => {
  const result = spawnSync("node", ["bin/agent-eval-pack.js", "build"], {
    encoding: "utf8"
  });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Missing input/);
});
