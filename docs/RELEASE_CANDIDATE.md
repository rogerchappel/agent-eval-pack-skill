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

## Known Limits

- Input notes should use documented headings.
- Redaction is heuristic and requires human review before sharing.
