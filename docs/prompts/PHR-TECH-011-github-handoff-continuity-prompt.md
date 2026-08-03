# PHR-TECH-011 — GitHub Handoff Continuity Implementation Prompt

## Project Context

Phronesis uses repository-native Handoff artifacts as durable session continuity. GitHub Actions must validate both application health and the exact committed Handoff package without regenerating repository truth inside an ephemeral runner.

## Feature ID

`PHR-TECH-011`

## Objective

Repair the failing and duplicate Handoff workflow, reconcile canonical human-owned continuity inputs with the current implementation, create a valid local Handoff seal, publish the ordinary feature-branch commits, and verify PR #5 checks.

## Required Reading

- `docs/technical/PHR-TECH-011-github-handoff-continuity.md`
- `handoff.toml`
- `docs/ARCHITECTURE.md`
- `docs/DECISIONS.md`
- `docs/ai/ACTIVE_TASK.md`
- `.github/workflows/handoff-continuity.yml`

## Implementation Requirements

- Preserve every existing uncommitted Phronesis implementation file.
- Configure one PR workflow execution per feature revision and main-only push execution.
- Add Node 24 setup, npm caching, `npm ci`, tests, lint, build, and diff checks.
- Validate the committed PR head with full history and `./handoff validate-continuity --json`.
- Remove `prepare-handoff` from GitHub Actions.
- Reconcile `PROJECT_STATE`, `BACKLOG`, `ACTIVE_TASK`, current Structure, product memory, architecture, decisions, changelog, registry, roadmap, Atlas, and traceability artifacts.
- Commit verified implementation and human-owned documents before running bare `./handoff`.
- Push through ordinary history and verify the remote SHA and GitHub checks.

## Constraints

- Do not discard, stash, overwrite, or split away existing owner work.
- Do not force-push, rewrite history, merge PR #5, activate Tailscale Funnel, deploy publicly, or disclose credentials.
- Do not hand-edit generated files under `docs/ai/`.
- Do not treat local same-session review as independent Product Owner approval.

## Expected Architecture

GitHub project validation owns clean-runner reproducibility. The continuity job owns verification of already-sealed repository evidence. Local bare Handoff owns validation-report generation, operational-document rendering, manifest creation, and the generated seal commit.

## Testing Expectations

- `npm run test`
- `npx tsc --noEmit`
- `npm run lint`
- `npm run build`
- `git diff --check`
- `./handoff validate-continuity --json` after sealing
- GitHub PR checks for the published head

## Documentation Updates

- `docs/technical/PHR-TECH-011-github-handoff-continuity.md`
- `docs/testing/PHR-TECH-011-github-handoff-continuity-validation.md`
- `docs/implementation-reports/PHR-TECH-011-github-handoff-continuity-report.md`
- `docs/reviews/PHR-TECH-011-github-handoff-continuity-conformance-review.md`
- `docs/release-notes/PHR-TECH-011.md`
- Canonical Handoff inputs and product-development memory

## Acceptance Criteria

- Local deterministic gates pass.
- The implementation commit is clean before bare Handoff.
- Handoff creates a separate valid seal commit.
- The remote feature head matches local.
- PR #5 project and continuity checks pass without duplicate push/PR runs.

## Non-Goals

- Handoff runtime redesign.
- Application feature changes beyond preserving and sealing the existing public event gateway implementation.
- Public gateway/Funnel activation.
- PR merge or release deployment.

## Notes For AI Coding Agents

- Preserve unrelated user changes.
- Keep edits scoped to this specification and the already-documented active implementation.
- Report any residual GitHub or external-provider failure separately.
