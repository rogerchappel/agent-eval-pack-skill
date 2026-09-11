import { existsSync, readFileSync } from "node:fs";
import { basename, isAbsolute, relative, resolve, win32 } from "node:path";

const SECRET_PATTERNS = [
  /gho_[A-Za-z0-9_]+/g,
  /sk-[A-Za-z0-9_-]+/g,
  /xox[baprs]-[A-Za-z0-9-]+/g,
  /AKIA[0-9A-Z]{16}/g
];

const HOME_PATH_PATTERNS = [
  /\/Users\/[A-Za-z0-9._-]+/g,
  /\/home\/[A-Za-z0-9._-]+/g
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
  const home = process.env.HOME;
  let output = home ? text.replaceAll(home, "~") : text;
  for (const pattern of HOME_PATH_PATTERNS) {
    output = output.replace(pattern, "~");
  }
  for (const pattern of SECRET_PATTERNS) {
    output = output.replace(pattern, "[REDACTED_SECRET]");
  }
  return output;
}

const SHELL_FENCE_LABELS = new Set(["bash", "sh", "shell", "console"]);

export function extractCommands(text) {
  const commands = [];
  let insideFence = false;
  let shellFence = false;
  for (const line of text.split(/\r?\n/)) {
    if (line.trimStart().startsWith("```")) {
      if (insideFence) {
        insideFence = false;
        shellFence = false;
        continue;
      }
      const label = line.trim().slice(3).trim();
      insideFence = true;
      shellFence = label === "" || SHELL_FENCE_LABELS.has(label);
      continue;
    }
    if (!insideFence || !shellFence) continue;
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) commands.push(line);
  }
  return commands;
}

export function portableSource(inputPath, cwd = process.cwd()) {
  if (isAbsolute(inputPath)) {
    const callerRelative = relative(cwd, inputPath).replaceAll("\\", "/");
    return callerRelative && !callerRelative.startsWith("../") ? callerRelative : basename(inputPath);
  }
  if (win32.isAbsolute(inputPath)) return win32.basename(inputPath);
  const callerRelative = inputPath.replaceAll("\\", "/").replace(/^\.\//, "");
  return callerRelative.startsWith("../") ? basename(callerRelative) : callerRelative;
}

export function parseRunNote(inputPath) {
  const path = resolve(inputPath);
  if (!existsSync(path)) throw new Error(`Input not found: ${inputPath}`);
  const raw = readFileSync(path, "utf8");
  const redacted = redact(raw);
  return {
    source: portableSource(inputPath),
    title: /^#\s+(.+)$/m.exec(redacted)?.[1]?.trim() ?? basename(path),
    scenario: section(redacted, "Scenario"),
    inputs: section(redacted, "Inputs"),
    expectedBehavior: section(redacted, "Expected Behavior"),
    forbiddenBehavior: section(redacted, "Forbidden Behavior"),
    evidence: section(redacted, "Evidence"),
    rubric: section(redacted, "Rubric"),
    riskLevel: section(redacted, "Risk Level"),
    tags: parseTags(section(redacted, "Tags")),
    outcome: section(redacted, "Outcome"),
    commands: extractCommands(section(redacted, "Evidence"))
  };
}

function slugify(value, fallback = "agent-run-case") {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || fallback;
}

function parseTags(value) {
  return value
    .split(/,|\n/)
    .map((item) => item.trim().replace(/^-+\s*/, ""))
    .filter(Boolean);
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
        riskLevel: note.riskLevel || "unspecified",
        tags: note.tags,
        outcome: note.outcome || "unknown",
        commands: note.commands,
        source: note.source
      };
    })
  };
}

export function validateEvalObject(pack, options = {}) {
  const errors = [];
  if (pack === null || typeof pack !== "object" || Array.isArray(pack)) {
    return { valid: false, errors: ["eval pack must be an object."] };
  }
  if (pack.schemaVersion !== 1) errors.push("schemaVersion must be 1.");
  if (!Array.isArray(pack.cases) || pack.cases.length === 0) errors.push("cases must be a non-empty array.");
  const ids = new Set();
  for (const [index, item] of (Array.isArray(pack.cases) ? pack.cases : []).entries()) {
    if (item === null || typeof item !== "object" || Array.isArray(item)) {
      errors.push(`case ${index} must be an object.`);
      continue;
    }
    for (const key of ["id", "title", "scenario", "expectedBehavior", "forbiddenBehavior", "rubric"]) {
      if (typeof item[key] !== "string" || item[key].trim().length === 0) {
        errors.push(`case ${index} missing ${key}.`);
      }
    }
    const validId = typeof item.id === "string" && item.id.trim().length > 0;
    if (validId && ids.has(item.id)) errors.push(`case ${index} duplicates id ${item.id}.`);
    if (validId) ids.add(item.id);
    if (item.commands !== undefined && !Array.isArray(item.commands)) {
      errors.push(`case ${index} commands must be an array.`);
    } else if (Array.isArray(item.commands)) {
      for (const [commandIndex, command] of item.commands.entries()) {
        if (typeof command !== "string" || command.trim().length === 0) {
          errors.push(`case ${index} command ${commandIndex} must be a non-empty string.`);
        }
      }
    }
    if (options.requireCommands && (item.commands === undefined || (Array.isArray(item.commands) && item.commands.length === 0))) {
      errors.push(`case ${index} missing command evidence.`);
    }
    if (item.tags !== undefined && !Array.isArray(item.tags)) {
      errors.push(`case ${index} tags must be an array.`);
    } else if (Array.isArray(item.tags)) {
      for (const [tagIndex, tag] of item.tags.entries()) {
        if (typeof tag !== "string" || tag.trim().length === 0) {
          errors.push(`case ${index} tag ${tagIndex} must be a non-empty string.`);
        }
      }
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
    lines.push(`Risk Level: ${item.riskLevel || "unspecified"}`);
    if (Array.isArray(item.tags) && item.tags.length > 0) lines.push(`Tags: ${item.tags.join(", ")}`);
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
  const riskCounts = {};
  const tagCounts = {};
  let commandCount = 0;
  for (const item of pack.cases) {
    const outcome = item.outcome || "unknown";
    outcomeCounts[outcome] = (outcomeCounts[outcome] ?? 0) + 1;
    const risk = item.riskLevel || "unspecified";
    riskCounts[risk] = (riskCounts[risk] ?? 0) + 1;
    for (const tag of item.tags ?? []) {
      tagCounts[tag] = (tagCounts[tag] ?? 0) + 1;
    }
    commandCount += Array.isArray(item.commands) ? item.commands.length : 0;
  }
  return {
    schemaVersion: pack.schemaVersion,
    generatedAt: pack.generatedAt,
    caseCount: pack.cases.length,
    commandCount,
    outcomeCounts,
    riskCounts,
    tagCounts
  };
}
