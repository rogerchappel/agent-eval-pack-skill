# Orchestration

Use this tool after an agent run produces useful evidence or an instructive failure.

1. Save the local run note as Markdown.
2. Run `agent-eval-pack build <note.md> --out dist/eval-pack`.
3. Inspect `review-brief.md`.
4. Run `agent-eval-pack validate dist/eval-pack/evals.json`.
5. Commit only sanitized fixtures that are safe to share.

The tool performs local reads and writes only. It does not execute model evals, call external APIs, or upload artifacts.

For command-sensitive regressions, validate with `--require-commands` before committing the pack.
