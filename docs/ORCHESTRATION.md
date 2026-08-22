# Orchestration

Use this tool after an agent run produces useful evidence or an instructive failure.

1. Save the local run note as Markdown.
2. Run `npm exec -- agent-eval-pack build <note.md> --out dist/eval-pack`.
3. Inspect `review-brief.md`.
4. Run `npm exec -- agent-eval-pack validate dist/eval-pack/evals.json`.
5. Commit only sanitized fixtures that are safe to share.

The tool performs local reads and writes only. It does not execute model evals, call external APIs, or upload artifacts.

Use the `npm exec --` form both in a repository checkout and after installing
the package in a consumer project; it resolves the project-local binary without
a global installation. Use the bare command only where npm has already added
project package binaries to `PATH`, such as an npm script.

For command-sensitive regressions, validate with `--require-commands` before committing the pack.
