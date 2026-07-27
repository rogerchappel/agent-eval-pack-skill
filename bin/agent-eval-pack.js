#!/usr/bin/env node
import { mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { buildEvalPack, renderBrief, summarizeEvalPack, validateEvalPack } from "../src/index.js";

const USAGE = `agent-eval-pack

Usage:
  agent-eval-pack init [--out dir]
  agent-eval-pack build <input.md...> [--out dir] [--stdout] [--summary] [--id-prefix text]
  agent-eval-pack validate <evals.json> [--require-commands]
`;

function help(stream = process.stdout) {
  stream.write(USAGE);
}

const args = process.argv.slice(2);
const command = args[0];

if (!command || command === "--help" || command === "-h") {
  help();
  process.exit(0);
}

function parseOptions(values, definitions) {
  const options = {};
  const positionals = [];
  for (let index = 0; index < values.length; index += 1) {
    const value = values[index];
    if (!value.startsWith("-")) {
      positionals.push(value);
      continue;
    }
    const kind = definitions[value];
    if (!kind) throw new Error(`Unknown option: ${value}`);
    if (kind === "value") {
      const optionValue = values[index + 1];
      if (!optionValue || optionValue.startsWith("-")) throw new Error(`Missing value for ${value}.`);
      options[value] = optionValue;
      index += 1;
    } else {
      options[value] = true;
    }
  }
  return { options, positionals };
}

try {
  if (command === "init") {
    const { options, positionals } = parseOptions(args.slice(1), { "--out": "value" });
    if (positionals.length > 0) throw new Error(`Unexpected argument: ${positionals[0]}`);
    const outDir = resolve(options["--out"] ?? "eval-pack");
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

## Risk Level

medium

## Tags

- regression
- local-first

## Outcome

unknown
`);
    console.log(`initialized ${outDir}`);
  } else if (command === "build") {
    const { options, positionals: inputValues } = parseOptions(args.slice(1), {
      "--out": "value",
      "--stdout": "boolean",
      "--summary": "boolean",
      "--id-prefix": "value"
    });
    if (inputValues.length === 0) throw new Error("Missing input Markdown file.");
    const pack = buildEvalPack(inputValues, { idPrefix: options["--id-prefix"] ?? "" });
    if (options["--summary"]) {
      console.log(JSON.stringify(summarizeEvalPack(pack), null, 2));
      process.exit(0);
    }
    if (options["--stdout"]) {
      console.log(JSON.stringify(pack, null, 2));
      process.exit(0);
    }
    const outDir = resolve(options["--out"] ?? "eval-pack");
    mkdirSync(outDir, { recursive: true });
    writeFileSync(join(outDir, "evals.json"), `${JSON.stringify(pack, null, 2)}\n`);
    writeFileSync(join(outDir, "review-brief.md"), renderBrief(pack));
    console.log(`wrote ${outDir}`);
  } else if (command === "validate") {
    const { options, positionals } = parseOptions(args.slice(1), { "--require-commands": "boolean" });
    const input = positionals[0];
    if (!input) throw new Error("Missing evals.json path.");
    if (positionals.length > 1) throw new Error(`Unexpected argument: ${positionals[1]}`);
    const result = validateEvalPack(input, { requireCommands: options["--require-commands"] });
    console.log(JSON.stringify(result, null, 2));
    process.exit(result.valid ? 0 : 1);
  } else {
    throw new Error(`Unknown command: ${command}`);
  }
} catch (error) {
  console.error(error.message);
  help(process.stderr);
  process.exit(1);
}
