# PHR-TECH-011 — GitHub Handoff Continuity Verification

## Feature ID

`PHR-TECH-011`

## Title

GitHub Handoff Continuity Verification

## Status

Completed — Hosted Verification Passed

## Priority

Critical

## Category

Technical / Infrastructure / CI / Repository Continuity / Developer Workflow

## Objective

Make GitHub Actions validate the exact committed Phronesis implementation and its sealed Handoff package without false failures from an unprepared runner or false success from ephemeral regeneration.

## Background

The portable Handoff runtime was adopted on the active feature branch, but implementation continued after the last seal. The workflow also invoked `prepare-handoff` in a fresh GitHub runner before installing npm dependencies. Tests therefore could not import `jiti`, lint could not find `eslint`, and build could not find `next`. Because the workflow listened to unrestricted `push` and `pull_request`, every feature-branch update created two failing runs.

## Problem Statement

The existing check combines project verification with continuity preparation, omits dependency installation, checks the synthetic pull-request merge ref instead of the exact feature head, and produces duplicate branch notifications. It neither provides a valid project build environment nor proves that repository continuity was committed before publication.

## Proposed Solution

Split GitHub verification into two jobs:

1. `project-validation` checks out the GitHub event revision with official checkout v7, installs pinned Node 24 through official setup-node v7 with npm caching, runs `npm ci`, then executes the configured test, lint, build, and diff-hygiene commands.
2. `continuity` checks out the exact pull-request head or push SHA with official checkout v7 and full history, restores the event branch name over that exact detached SHA, and runs only `./handoff validate-continuity --json` against committed artifacts.

Feature branches run through `pull_request`; `push` is restricted to `main`. Local implementation closes from a clean implementation commit with bare `./handoff`, which performs validation and creates the generated seal commit.

## Functional Requirements

- Install repository dependencies before GitHub executes project validation.
- Pin the CI Node major version instead of relying on the runner default.
- Run tests, lint, production build, and `git diff --check` in GitHub.
- Validate, but never regenerate, committed Handoff artifacts in GitHub.
- Validate the exact pull-request head rather than GitHub's detached merge ref.
- Restore the GitHub event branch identity after exact-SHA checkout because Handoff verifies both branch and commit identity.
- Fetch sufficient history for generated-only seal ancestry checks.
- Produce one feature-branch workflow execution per revision.
- Continue verifying the merged repository on pushes to `main`.

## Non-Functional Requirements

### Performance

Use `actions/setup-node` npm caching; avoid installing dependencies in the continuity-only job.

### Scalability

Keep code validation and continuity verification independent so additional project checks do not weaken the continuity contract.

### Maintainability

Workflow commands must remain aligned with `handoff.toml` and `package-lock.json`.

### Reliability

Missing dependencies, stale manifests, expired validation, wrong branch/head, and dirty implementation state must fail with their actual diagnostic.

### Accessibility

Not applicable; no product interface changes.

### Offline Support

Local Handoff verification remains repository-native after dependencies are installed. GitHub dependency installation requires normal Actions package access.

### Security

The workflow uses read-only checkout behavior and requires no repository secret beyond GitHub's standard token. It must not commit, push, expose credentials, or activate public infrastructure.

### Extensibility

Future CI jobs may consume the same verified commit but cannot replace or bypass `validate-continuity`.

### Responsiveness

Not applicable.

## User Stories

- As the Product Owner, I want GitHub failures to identify actual project or continuity defects so that repeated false alarms do not obscure repository health.
- As a future agent, I want the committed Handoff package to match the exact implementation revision so that repository recovery does not follow an obsolete task.

## Acceptance Criteria

- A dependency-free clean runner succeeds after `npm ci` and all project gates pass.
- GitHub's official checkout and setup-node steps use current Node 24-compatible action runtimes without a Node 20 deprecation annotation.
- The current implementation is committed, canonical documents reflect its actual state, and bare `./handoff` creates a valid seal.
- `./handoff validate-continuity --json` reports zero errors from the sealed branch.
- PR #5 reports successful `project-validation` and `continuity` checks for the repair revision.
- One feature-branch update no longer produces both push and pull-request runs.

## Edge Cases

- A stale or expired validation report fails continuity even if application tests pass.
- A dirty local tree cannot be sealed; implementation and human-owned documentation must be committed first.
- A pull-request check uses the exact head SHA so GitHub's synthetic merge commit cannot manufacture a branch mismatch.
- GitHub's exact-SHA checkout is detached by design; the job creates only a runner-local branch at that unchanged SHA before validation.
- A later `main` merge that changes non-generated state may require a new mainline Handoff seal rather than ephemeral preparation.
- A dependency or lockfile failure is reported by `npm ci` before project validation.

## Dependencies

- Portable Handoff runtime and `handoff.toml`.
- `package-lock.json` and npm.
- GitHub Actions checkout and setup-node actions.
- Draft PR #5 on `codex/phr-price-monitoring-20260730`.

## Future Enhancements

- Add a deterministic mainline post-merge sealing policy if the repository adopts squash or merge commits that intentionally advance non-generated state after a reviewed feature seal.
- Add concurrency cancellation for superseded PR revisions after repository policy is defined.

## Technical Notes

CI is a verifier, not the author of repository continuity. `prepare-handoff` and bare `./handoff` mutate generated artifacts and belong in the controlled local closeout transaction. GitHub must inspect the already-committed package.

## UI / UX Notes

No product UI changes. GitHub check names should clearly distinguish project validation from repository continuity.

## Success Metrics

- Zero missing-package false failures after `npm ci`.
- Zero duplicate feature-branch workflow pairs.
- Zero Handoff validation errors on the sealed repair commit.

## Open Questions

- Whether the repository should later increase `max_age_hours` from 24 is a separate policy decision; this repair preserves the current strict contract.

## Traceability

- Originating work order: Product Owner request on 2026-08-03 to repair stale Handoff continuity and GitHub failures.
- Related implementation prompt: `docs/prompts/PHR-TECH-011-github-handoff-continuity-prompt.md`.
- Related tests: `docs/testing/PHR-TECH-011-github-handoff-continuity-validation.md`.
- Related release notes: `docs/release-notes/PHR-TECH-011.md`.
- Last modified: 2026-08-06.
- Modification reason: Revalidated the Mac Studio continuity seal and upgraded official GitHub actions to current v7 majors after the otherwise successful hosted run exposed a Node 20 action-runtime deprecation.
