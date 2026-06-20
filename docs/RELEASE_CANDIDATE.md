# Release Candidate Notes

## Classification

Ship.

## Included

- Local `agent-eval-pack` CLI.
- Markdown run-note parser.
- Secret and home-path redaction.
- JSON eval pack and Markdown brief renderers.
- Optional stdout JSON mode for automation.
- Fixture-backed tests and smoke workflow.

## Verification

```bash
npm test
npm run check
npm run build
npm run smoke
bash scripts/validate.sh
```

## 2026-06-20 Local Evidence

- First verification found a Markdown final-section parsing bug.
- Parser was replaced with line-based heading extraction.
- `npm test` passed with 9 tests after the fix.
- `npm run check` passed syntax checks.
- `npm run build` wrote `dist/package-check.txt`.
- `npm run smoke` wrote `dist/smoke`.
- `bash scripts/validate.sh` reran tests, checks, build, smoke, and JSON validation successfully.

## Known Limits

- Input notes should use documented headings.
- Redaction is heuristic and requires human review before sharing.
