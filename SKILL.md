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

In a repository checkout or a consumer project that has installed the package,
invoke the local package binary as `npm exec -- agent-eval-pack`. A bare
`agent-eval-pack` command requires the package binary to already be on `PATH`,
as it is inside an npm script.

1. Create or inspect the run note.
2. Run `npm exec -- agent-eval-pack build <input.md...> --out <dir>`.
3. Run `npm exec -- agent-eval-pack validate <dir>/evals.json`. Add `--require-commands` when
   every case must contain a fenced shell command in its `## Evidence` section;
   fenced blocks in other sections do not count.
4. Review `review-brief.md` for missing scenario, expected behavior, forbidden behavior, or rubric.
5. For batch review queues, run `npm exec -- agent-eval-pack build <input.md...> --summary` and compare case/outcome counts before sharing.

## Examples

```bash
npm exec -- agent-eval-pack build fixtures/success-run.md --out dist/success
npm exec -- agent-eval-pack build fixtures/success-run.md fixtures/mixed-run.md --out dist/nightly --id-prefix nightly
npm exec -- agent-eval-pack validate dist/success/evals.json
```

## Verification

Run `npm test`, `npm run check`, `npm run build`, `npm run smoke`, and `bash scripts/validate.sh`.

## Limitations

The parser expects structured Markdown headings. Redaction covers common token shapes but cannot guarantee removal of every sensitive value.

See `docs/REDACTION.md` before sharing generated packs outside the local workspace.
