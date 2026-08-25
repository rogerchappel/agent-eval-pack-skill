# Fixture Guide

Good run-note fixtures include:

- A short title.
- `## Scenario` for the task shape.
- `## Inputs` for starting context.
- `## Expected Behavior` for the regression target.
- `## Forbidden Behavior` for failure modes.
- `## Evidence` with command blocks where available.
- `## Rubric` for future scoring.
- `## Outcome` as `success`, `failure`, or `mixed`.

Build-time validation requires non-empty `## Scenario`, `## Expected Behavior`,
and `## Forbidden Behavior` sections in every note. A missing required section
fails the whole single- or multi-note build before stdout, summary output, or
output-directory creation.

Review generated output before sharing it outside the local workspace.
