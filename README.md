# agent-eval-pack-skill

Package local agent run notes into reusable regression eval fixtures.

The CLI extracts scenario, inputs, expected behavior, forbidden behavior, evidence, command lines, rubric, and outcome from structured Markdown. It writes a JSON eval pack and a Markdown review brief.

## Quickstart

```bash
npm install
npm run smoke
agent-eval-pack validate dist/smoke/evals.json
```

## CLI

```bash
agent-eval-pack init --out eval-pack
agent-eval-pack build fixtures/success-run.md --out dist/success
agent-eval-pack validate dist/success/evals.json
agent-eval-pack validate dist/success/evals.json --require-commands
```

## Run Note Format

Use Markdown headings:

- `## Scenario`
- `## Inputs`
- `## Expected Behavior`
- `## Forbidden Behavior`
- `## Evidence`
- `## Rubric`
- `## Outcome`

Fenced shell blocks inside evidence become command evidence.

See `docs/SCHEMA.md` for the generated JSON shape.

Use `--require-commands` when a regression case must include executable evidence.

## Safety Notes

The tool is local-first and performs no network calls. It redacts common token shapes and home paths, but users must review output before sharing.

## Limitations

This package prepares eval fixtures. It does not run model evals, grade agents, read live chat systems, or upload artifacts.
