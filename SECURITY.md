# Security Policy

## Supported Versions

This repository is in a release-candidate stage. Security fixes are prepared from
the default branch until a stable version support policy is published.

## Reporting a Vulnerability

Please report suspected vulnerabilities through GitHub private vulnerability
reporting when it is available for this repository, or by opening a minimal issue
that avoids secrets, private run notes, customer data, or exploit details.

Include:

- affected version or commit
- command used to reproduce the issue
- sanitized fixture or run-note shape
- expected and actual behavior

## Data Handling

`agent-eval-pack-skill` is local-first and performs no network calls. It reads
Markdown run notes and writes eval fixtures on disk. Do not place real tokens,
private transcripts, customer records, or unreleased incident details in fixtures
unless they have been sanitized for public review.

Before publishing generated packs, review the JSON and Markdown outputs for:

- private names, account ids, or internal URLs
- bearer tokens, API keys, cookies, and session identifiers
- home-directory paths or machine-local paths
- proprietary prompt text or customer content
