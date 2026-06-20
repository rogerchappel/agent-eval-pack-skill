# Contributing

Keep eval fixtures small, sanitized, and deterministic.

## Development

```bash
npm test
npm run check
npm run smoke
```

## Fixture Rules

- Do not commit private transcripts.
- Prefer one behavior per fixture.
- Include expected and forbidden behavior.
- Include command evidence when the original run depended on commands.
