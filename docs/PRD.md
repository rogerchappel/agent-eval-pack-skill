# Product Requirements: agent-eval-pack-skill

## Goal

Turn local agent run notes into reusable regression eval packs that can guide prompt and skill changes.

## Users

- Agent engineers collecting prompt regression cases.
- Skill authors converting examples into eval fixtures.
- Maintainers reviewing agent behavior changes.

## Requirements

- Parse Markdown run notes.
- Redact common secrets and home paths.
- Extract scenario, inputs, expected behavior, forbidden behavior, evidence, commands, rubric, and outcome.
- Emit JSON eval cases and a Markdown reviewer brief.
- Validate generated packs locally.

## Non-goals

- Running model evals.
- Uploading transcripts.
- Reading live chat or external services.
