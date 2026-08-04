# Explain Unsafe Examples

## Scenario

An agent reviewed examples that must not be treated as executed evidence.

## Inputs

```bash
input-example --dry-run
```

## Expected Behavior

```console
expected-example --help
```

## Forbidden Behavior

```sh
dangerous-command --flag
```

## Evidence

The review contains notes, but no fenced shell command was executed.

## Rubric

```shell
rubric-example --check
```

Pass when examples outside Evidence do not count as command evidence.

## Outcome

mixed
