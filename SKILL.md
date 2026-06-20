# agent-eval-pack-skill

Use this skill when an agent needs to turn a completed local agent run, failure note, or command-evidence transcript into a reusable prompt or skill regression eval pack.

## Required Inputs

- A local Markdown run note or transcript.
- The behavior that future agents should preserve.
- Any behavior that future agents must avoid.

## Required Tools

- Node.js 20 or newer.
- Local shell access.
- Filesystem read access to the run note and write access to the output directory.

## Side-Effect Boundaries

The workflow reads local Markdown and writes local JSON/Markdown output. Do not upload transcripts, publish repos, push branches, or send eval packs externally without explicit approval. Review redaction output before sharing.

## Workflow

1. Create or inspect the run note.
2. Run `agent-eval-pack build <input.md> --out <dir>`.
3. Run `agent-eval-pack validate <dir>/evals.json`.
4. Review `review-brief.md` for missing scenario, expected behavior, forbidden behavior, or rubric.

## Examples

```bash
agent-eval-pack build fixtures/success-run.md --out dist/success
agent-eval-pack validate dist/success/evals.json
```

## Verification

Run `npm test`, `npm run check`, `npm run build`, `npm run smoke`, and `bash scripts/validate.sh`.

## Limitations

The parser expects structured Markdown headings. Redaction covers common token shapes but cannot guarantee removal of every sensitive value.
