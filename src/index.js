import { existsSync, readFileSync } from "node:fs";
import { basename, resolve } from "node:path";

const SECRET_PATTERNS = [
  /gho_[A-Za-z0-9_]+/g,
  /sk-[A-Za-z0-9_-]+/g,
  /xox[baprs]-[A-Za-z0-9-]+/g,
  /AKIA[0-9A-Z]{16}/g
];

function section(text, heading) {
  const lines = text.split(/\r?\n/);
  const wanted = heading.toLowerCase();
  const start = lines.findIndex((line) => line.replace(/^##\s+/, "").trim().toLowerCase() === wanted);
  if (start === -1) return "";
  const body = [];
  for (const line of lines.slice(start + 1)) {
    if (/^##\s+/.test(line)) break;
    body.push(line);
  }
  return body.join("\n").trim();
}

export function redact(text) {
  let output = text.replaceAll(process.env.HOME ?? "", "~");
  for (const pattern of SECRET_PATTERNS) {
    output = output.replace(pattern, "[REDACTED_SECRET]");
  }
  return output;
}

export function extractCommands(text) {
  const commands = [];
  const blockPattern = /```(?:bash|sh|shell|console)?\n([\s\S]*?)```/g;
  for (const match of text.matchAll(blockPattern)) {
    const body = match[1].trim();
    if (!body) continue;
    commands.push(...body.split("\n").filter((line) => line.trim() && !line.trim().startsWith("#")));
  }
  return commands;
}

export function parseRunNote(inputPath) {
  const path = resolve(inputPath);
  if (!existsSync(path)) throw new Error(`Input not found: ${inputPath}`);
  const raw = readFileSync(path, "utf8");
  const redacted = redact(raw);
  return {
    source: path,
    title: /^#\s+(.+)$/m.exec(redacted)?.[1]?.trim() ?? basename(path),
    scenario: section(redacted, "Scenario"),
    inputs: section(redacted, "Inputs"),
    expectedBehavior: section(redacted, "Expected Behavior"),
    forbiddenBehavior: section(redacted, "Forbidden Behavior"),
    evidence: section(redacted, "Evidence"),
    rubric: section(redacted, "Rubric"),
    outcome: section(redacted, "Outcome"),
    commands: extractCommands(redacted)
  };
}

function slugify(value, fallback = "agent-run-case") {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || fallback;
}

function uniqueId(base, seen) {
  let candidate = base;
  let index = 2;
  while (seen.has(candidate)) {
    candidate = `${base}-${index}`;
    index += 1;
  }
  seen.add(candidate);
  return candidate;
}

export function buildEvalPack(inputPath, options = {}) {
  const inputPaths = Array.isArray(inputPath) ? inputPath : [inputPath];
  if (inputPaths.length === 0) throw new Error("At least one input Markdown file is required.");
  const notes = inputPaths.map((path) => parseRunNote(path));
  const seenIds = new Set();
  const now = options.generatedAt ?? new Date().toISOString();
  return {
    schemaVersion: 1,
    generatedAt: now,
    tool: "agent-eval-pack",
    cases: notes.map((note) => {
      const idBase = [options.idPrefix, slugify(note.title)].filter(Boolean).join("-");
      return {
        id: uniqueId(idBase || "agent-run-case", seenIds),
        title: note.title,
        scenario: note.scenario,
        inputs: note.inputs,
        expectedBehavior: note.expectedBehavior,
        forbiddenBehavior: note.forbiddenBehavior,
        evidence: note.evidence,
        rubric: note.rubric || "Pass if the agent preserves the expected behavior and avoids forbidden behavior.",
        outcome: note.outcome || "unknown",
        commands: note.commands,
        source: note.source
      };
    })
  };
}

export function validateEvalObject(pack, options = {}) {
  const errors = [];
  if (pack.schemaVersion !== 1) errors.push("schemaVersion must be 1.");
  if (!Array.isArray(pack.cases) || pack.cases.length === 0) errors.push("cases must be a non-empty array.");
  const ids = new Set();
  for (const [index, item] of (pack.cases ?? []).entries()) {
    for (const key of ["id", "title", "scenario", "expectedBehavior", "forbiddenBehavior", "rubric"]) {
      if (!item[key] || typeof item[key] !== "string") errors.push(`case ${index} missing ${key}.`);
    }
    if (item.id && ids.has(item.id)) errors.push(`case ${index} duplicates id ${item.id}.`);
    if (item.id) ids.add(item.id);
    if (options.requireCommands && (!Array.isArray(item.commands) || item.commands.length === 0)) {
      errors.push(`case ${index} missing command evidence.`);
    }
  }
  return { valid: errors.length === 0, errors };
}

export function validateEvalPack(inputPath, options = {}) {
  const path = resolve(inputPath);
  if (!existsSync(path)) return { valid: false, errors: [`File not found: ${inputPath}`] };
  return validateEvalObject(JSON.parse(readFileSync(path, "utf8")), options);
}

export function renderBrief(pack) {
  const lines = ["# Agent Eval Pack Review Brief", "", `Generated: ${pack.generatedAt}`, ""];
  for (const item of pack.cases) {
    lines.push(`## ${item.title}`);
    lines.push("");
    lines.push(`ID: ${item.id}`);
    lines.push(`Outcome: ${item.outcome}`);
    lines.push("");
    lines.push("### Scenario");
    lines.push(item.scenario || "Not provided.");
    lines.push("");
    lines.push("### Expected Behavior");
    lines.push(item.expectedBehavior || "Not provided.");
    lines.push("");
    lines.push("### Forbidden Behavior");
    lines.push(item.forbiddenBehavior || "Not provided.");
    lines.push("");
    lines.push("### Rubric");
    lines.push(item.rubric);
    lines.push("");
  }
  return `${lines.join("\n")}\n`;
}

export function summarizeEvalPack(pack) {
  const outcomeCounts = {};
  let commandCount = 0;
  for (const item of pack.cases) {
    const outcome = item.outcome || "unknown";
    outcomeCounts[outcome] = (outcomeCounts[outcome] ?? 0) + 1;
    commandCount += Array.isArray(item.commands) ? item.commands.length : 0;
  }
  return {
    schemaVersion: pack.schemaVersion,
    generatedAt: pack.generatedAt,
    caseCount: pack.cases.length,
    commandCount,
    outcomeCounts
  };
}
