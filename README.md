# agent-eval-pack-skill

Package local agent run notes into reusable regression eval fixtures.

The CLI extracts scenario, inputs, expected behavior, forbidden behavior, evidence, command lines, rubric, and outcome from structured Markdown. It writes a JSON eval pack and a Markdown review brief.

## Quickstart

```bash
npm install
npm run release:check
npm run smoke
agent-eval-pack validate dist/smoke/evals.json
```

## CLI

```bash
agent-eval-pack init --out eval-pack
agent-eval-pack build fixtures/success-run.md --out dist/success
agent-eval-pack build fixtures/success-run.md fixtures/mixed-run.md --out dist/nightly --id-prefix nightly
agent-eval-pack build fixtures/success-run.md --stdout
agent-eval-pack build fixtures/success-run.md fixtures/mixed-run.md --summary
agent-eval-pack validate dist/success/evals.json
agent-eval-pack validate dist/success/evals.json --require-commands
```

`--out` and `--id-prefix` require a value. If either value is omitted, the CLI
prints a concise error and the usage guide without a stack trace.
Unknown options and stray command arguments are rejected with a nonzero exit.

## Run Note Format

Use Markdown headings:

- `## Scenario`
- `## Inputs`
- `## Expected Behavior`
- `## Forbidden Behavior`
- `## Evidence`
- `## Rubric`
- `## Outcome`

Fenced shell blocks inside `## Evidence` become command evidence. Fenced blocks in
Inputs, Expected Behavior, Forbidden Behavior, Rubric, or any other section are
kept as note content but do not populate `commands`.

See `docs/SCHEMA.md` for the generated JSON shape.

Multiple input notes are packed into one `evals.json`. Duplicate titles receive stable numeric suffixes so review queues can keep one pack per run batch.

Use `--require-commands` when a regression case must include at least one command
fenced inside `## Evidence`.

## Safety Notes

The tool is local-first and performs no network calls. It redacts common token
shapes and home paths, including a configured `HOME` path. If `HOME` is unset or
empty, ordinary text is left unchanged. Users must still review output before
sharing.

Each generated case's `source` is a portable identifier, never an absolute
checkout, home, or temporary path. Inputs inside the caller's working directory
use a normalized caller-relative path; inputs outside it and Windows absolute
paths use the filename.

## Release Checks

Run the full local gate before opening a release PR:

```bash
npm run release:check
```

The gate runs syntax checks, tests, the build step, the fixture-backed smoke
command, and `npm pack --dry-run`.


## Verification

Run the local quality gates before opening a pull request:

```sh
npm run lint
npm test
npm run smoke
```

`npm run lint` is an alias for the repository static check so contributors can use the common npm workflow without guessing the project-specific command.

## Limitations

This package prepares eval fixtures. It does not run model evals, grade agents, read live chat systems, or upload artifacts.

## Local Verification

Run the committed test suite before publishing changes:

```sh
npm test
```
