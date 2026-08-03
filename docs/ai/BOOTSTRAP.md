<!-- handoff: {"branch":"codex/phr-price-monitoring-20260730","config_digest":"24af9188f29175240948655dcb0825cf42575569652aa5b2f688a4110d8542af","document":"BOOTSTRAP","generated":true,"generated_at":"2026-08-03T19:11:38Z","generation_id":"0282c2727af1587175db","head":"be12e29608e3f43e73189eaa6c73f00291b005a9","schema_version":"1","worktree_fingerprint":"e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"} -->
# Bootstrap Package

Use this instruction in a new AI session:

> Acquire Handoff

## Deterministic resume data

- **Repository:** `Phronesis`
- **Branch:** `codex/phr-price-monitoring-20260730`
- **Commit:** `be12e29608e3f43e73189eaa6c73f00291b005a9`
- **Generation ID:** `0282c2727af1587175db`
- **Worktree fingerprint:** `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`

## Objective

Finish and preserve the isolated public event-worker gateway implementation, repair GitHub Handoff validation, and publish a fresh committed continuity seal without activating public ingress.

## Completed work

- Confirmed the canonical repository, branch, pull request, hosted failure, and stale seal from Git and GitHub evidence.
- Replaced CI-side Handoff preparation with separate dependency-backed project validation and committed-state continuity verification.
- Added the governed specification, work order, release notes, architecture decision, roadmap, atlas, and continuity records for `PHR-TECH-011`.
- Passed 376/376 tests, standalone TypeScript, warning-free lint, Next.js 16.2.12 production build, launch-definition validation, secret-pattern review, and diff hygiene.
- Created implementation commit `7474790` and Handoff seal `27af62a`; local continuity passed with zero errors/warnings and remote SHA equality passed.
- Hosted run `30844457778` created only one pull-request execution and passed dependency-backed project validation. Continuity exposed the exact-SHA checkout's detached branch identity, so the workflow now restores the event branch locally at the unchanged SHA.

## Remaining work

- Commit and seal the hosted branch-identity remediation, push, and verify both pull-request jobs.
- Present public event-worker activation as a separate Product Owner decision after the repair is green.

## Blockers

- No implementation blocker is currently known.
- Public Funnel activation remains intentionally blocked on explicit Product Owner approval and a bounded event window.

## Validation

- **Status:** PASSED
- **Report:** [validation-latest.json](reports/validation-latest.json)

## Important decisions

Read [DECISIONS.md](../DECISIONS.md) before implementation.

## Exact next action

Commit the detached-runner remediation, create a replacement Handoff seal, and verify the next hosted pull-request run.

## Resume protocol

1. Confirm this file's branch, commit, configuration digest, and worktree
   fingerprint with `validate-continuity`.
2. Read [PROJECT_STATE.md](../PROJECT_STATE.md),
   [ARCHITECTURE.md](../ARCHITECTURE.md), and
   [DECISIONS.md](../DECISIONS.md).
3. Read [ACTIVE_TASK.md](ACTIVE_TASK.md) and [HANDOFF.md](HANDOFF.md).
4. Execute the exact next action.
5. Commit verified project state and close with **Handoff** (`handoff`).

The machine-readable equivalent is
[`bootstrap-latest.json`](reports/bootstrap-latest.json).
