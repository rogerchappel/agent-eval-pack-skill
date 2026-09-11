# Mixed Fence Run

## Scenario

Evidence holds a JSON summary block before the real shell block.

## Inputs

A run log mixing JSON and shell fences.

## Expected Behavior

Only non-comment lines from fenced shell blocks become command evidence.

## Forbidden Behavior

Prose between fences must never be recorded as a command.

## Evidence

```json
{ "suite": "unit", "passing": true }
```

Re-ran the suite afterwards:

```bash
npm test
```

## Rubric

Pass if the pack records npm test and nothing else.

## Outcome

success
