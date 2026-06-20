#!/usr/bin/env node
import { mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { buildEvalPack, renderBrief, summarizeEvalPack, validateEvalPack } from "../src/index.js";

function help() {
  console.log(`agent-eval-pack

Usage:
  agent-eval-pack init [--out dir]
  agent-eval-pack build <input.md...> [--out dir] [--stdout] [--summary] [--id-prefix text]
  agent-eval-pack validate <evals.json> [--require-commands]`);
}

const args = process.argv.slice(2);
const command = args[0];

if (!command || command === "--help" || command === "-h") {
  help();
  process.exit(0);
}

const outIndex = args.indexOf("--out");
const outDir = resolve(outIndex >= 0 ? args[outIndex + 1] : "eval-pack");
const idPrefixIndex = args.indexOf("--id-prefix");
const idPrefix = idPrefixIndex >= 0 ? args[idPrefixIndex + 1] : "";

function positionalInputs(values) {
  const inputs = [];
  const flagsWithValues = new Set(["--out", "--id-prefix"]);
  for (let index = 0; index < values.length; index += 1) {
    const value = values[index];
    if (flagsWithValues.has(value)) {
      index += 1;
      continue;
    }
    if (value.startsWith("--")) continue;
    inputs.push(value);
  }
  return inputs;
}

try {
  if (command === "init") {
    mkdirSync(outDir, { recursive: true });
    writeFileSync(join(outDir, "run-note.md"), `# Agent Run Note

## Scenario

Describe the task and the regression risk this note should preserve.

## Inputs

List prompts, files, fixtures, or commands used in the run.

## Expected Behavior

State what a future agent run should still do.

## Forbidden Behavior

State side effects, regressions, or unsafe actions the agent must avoid.

## Evidence

\`\`\`bash
npm run smoke
\`\`\`

## Rubric

Pass if the expected behavior is preserved and forbidden behavior is absent.

## Outcome

unknown
`);
    console.log(`initialized ${outDir}`);
  } else if (command === "build") {
    const inputValues = positionalInputs(args.slice(1));
    if (inputValues.length === 0) throw new Error("Missing input Markdown file.");
    const pack = buildEvalPack(inputValues, { idPrefix });
    if (args.includes("--summary")) {
      console.log(JSON.stringify(summarizeEvalPack(pack), null, 2));
      process.exit(0);
    }
    if (args.includes("--stdout")) {
      console.log(JSON.stringify(pack, null, 2));
      process.exit(0);
    }
    mkdirSync(outDir, { recursive: true });
    writeFileSync(join(outDir, "evals.json"), `${JSON.stringify(pack, null, 2)}\n`);
    writeFileSync(join(outDir, "review-brief.md"), renderBrief(pack));
    console.log(`wrote ${outDir}`);
  } else if (command === "validate") {
    const input = args[1];
    if (!input) throw new Error("Missing evals.json path.");
    const result = validateEvalPack(input, { requireCommands: args.includes("--require-commands") });
    console.log(JSON.stringify(result, null, 2));
    process.exit(result.valid ? 0 : 1);
  } else {
    throw new Error(`Unknown command: ${command}`);
  }
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
