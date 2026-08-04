# Eval Pack Schema

```json
{
  "schemaVersion": 1,
  "generatedAt": "2026-06-20T00:00:00.000Z",
  "tool": "agent-eval-pack",
  "cases": [
    {
      "id": "fix-cli-smoke-failure",
      "title": "Fix CLI Smoke Failure",
      "scenario": "What happened",
      "inputs": "Starting context",
      "expectedBehavior": "Behavior to preserve",
      "forbiddenBehavior": "Behavior to prevent",
      "evidence": "Command results or notes",
      "rubric": "How to score future behavior",
      "riskLevel": "medium",
      "tags": ["cli", "smoke"],
      "outcome": "success",
      "commands": ["npm test"],
      "source": "fixtures/success-run.md"
    }
  ]
}
```

`riskLevel` and `tags` are optional note sections. Missing risk levels are stored as `unspecified`, and missing tags are stored as an empty array so review queues can group mixed packs predictably.

`validate` requires `id`, `title`, `scenario`, `expectedBehavior`, `forbiddenBehavior`, and `rubric` for every case. When present, `tags` must be an array.

`commands` contains non-comment lines from fenced shell blocks within the
`## Evidence` section only. Fenced blocks in other note sections do not populate
this field. `validate --require-commands` requires this array to contain at least
one Evidence command for every case.
