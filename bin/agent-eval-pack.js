#!/usr/bin/env node
import { mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { buildEvalPack, renderBrief, validateEvalPack } from "../src/index.js";

function help() {
  console.log(`agent-eval-pack

Usage:
  agent-eval-pack init [--out dir]
  agent-eval-pack build <input.md> [--out dir] [--stdout]
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

try {
  if (command === "init") {
    mkdirSync(outDir, { recursive: true });
    writeFileSync(join(outDir, "run-note.md"), "# Agent Run Note\n\n## Scenario\n\nDescribe the task.\n");
    console.log(`initialized ${outDir}`);
  } else if (command === "build") {
    const input = args[1];
    if (!input) throw new Error("Missing input Markdown file.");
    const pack = buildEvalPack(input);
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
