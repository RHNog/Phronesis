# PHR-TECH-004: Canonical Repository Reconciliation

## Feature ID

`PHR-TECH-004`

## Status

Completed

## Priority

Critical

## Category

Technical / Documentation / Developer Workflow

## Objective

Make the JarvisSSD checkout the sole active development repository, reconcile documentation and local artifacts, create an intentional Git checkpoint, and align GitHub with accepted local history.

## Requirements

- Operate only from `/Volumes/JarvisSSD/Projects/Phronesis`.
- Preserve the old checkout and migration backups as rollback.
- Close `PHR-TECH-003` and register `PHR-WORKFLOW-003`.
- Treat npm as canonical; preserve but do not commit pnpm artifacts.
- Exclude `.DS_Store` noise from the checkpoint.
- Verify documentation, lint, supported tests, TypeScript baseline, Git integrity, and diff hygiene.
- Commit intentional changes and publish `main` without rewriting history.

## Acceptance Criteria

- Working tree is clean except intentionally ignored local artifacts.
- `main` contains the accepted July checkpoint and reconciliation artifacts.
- `origin/main` equals local `main` after ordinary push.
- Known 17 behavioral failures and 27 `TS5097` errors remain disclosed.

## Traceability

- Related prompt: `docs/prompts/PHR-TECH-004-canonical-repository-reconciliation-prompt.md`.
- Related tests: `docs/testing/PHR-TECH-004-canonical-repository-reconciliation-validation.md`.
- Related release notes: `docs/release-notes/PHR-TECH-004.md`.
- Last modified: 2026-07-28.
