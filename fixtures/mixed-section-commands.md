# Verify Evidence Boundaries

## Scenario

An agent documented example commands alongside one executed check.

## Inputs

```bash
example-command --input
```

## Expected Behavior

Only the executed Evidence command should be collected.

## Forbidden Behavior

```bash
forbidden-example --never-run
```

## Evidence

The surrounding prose describes the result.

```bash
npm test
```

The command passed.

## Rubric

Pass when the Evidence command is retained and other fenced blocks are ignored.

## Outcome

success
