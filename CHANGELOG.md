# Changelog

## [Unreleased]

- Ship the documented example fixtures and execute them from a clean installed
  package during release checks.
- Return structured, positioned validation errors for malformed pack and case
  shapes instead of throwing a JavaScript type error.
- Pair `## Evidence` fences line by line so shell command evidence survives
  neighboring non-shell fences and prose between fences is never recorded as a
  command.
- Return structured validation errors for unparseable `validate` input on
  standard output with exit status 1, as documented, instead of printing a
  JavaScript parse error to standard error.
- Preserve input when `HOME` is unavailable and report missing CLI option values
  with controlled usage diagnostics.
- Add release-readiness checks for package metadata, pack contents, and CI verification.
All notable changes to this project will be recorded here.

This project follows a small, reviewable changelog format so release notes can be
prepared from merged pull requests without rewriting commit history.

## Unreleased

- Documented the current release-readiness checks for the local eval-pack CLI.
- Added the initial security policy for reporting issues and handling fixture data.

## 0.1.0

- Initial release-candidate package for building deterministic agent eval packs
  from structured run notes.
