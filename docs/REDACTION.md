# Redaction

The CLI redacts common token prefixes and local home paths before writing eval packs.

Covered examples:

- GitHub tokens beginning with `gho_`.
- OpenAI-style tokens beginning with `sk-`.
- Slack tokens beginning with `xoxb-`, `xoxa-`, `xoxp-`, `xoxr-`, or `xoxs-`.
- AWS access key IDs beginning with `AKIA`.
- The current user's home directory path.

Limitations:

- Custom secrets may not match these patterns.
- Private project names can still appear in plain text.
- Review generated output before committing or sharing.
