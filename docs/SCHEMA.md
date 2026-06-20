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
      "outcome": "success",
      "commands": ["npm test"],
      "source": "/absolute/path"
    }
  ]
}
```

`validate` requires `id`, `title`, `scenario`, `expectedBehavior`, `forbiddenBehavior`, and `rubric` for every case.
