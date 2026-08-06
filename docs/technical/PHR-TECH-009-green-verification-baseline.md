# PHR-TECH-009 — Green Verification Baseline

## Feature ID

`PHR-TECH-009`

## Status

Completed

## Priority

Critical

## Category

Technical / Testing / Reliability

## Objective

Restore a reproducible green repository baseline before identity-backed price-monitoring development begins.

## Background

The supported Node test command currently reports 187 passes and 17 failures. Standalone TypeScript validation reports 29 `TS5097` diagnostics because repository tests use explicit `.ts` import extensions while the no-emit TypeScript configuration does not permit them.

## Problem Statement

New product work would otherwise be layered over ambiguous behavioral contracts, nondeterministic provider tests, and a static-validation configuration that disagrees with the supported test runner.

## Proposed Solution

Permit explicit TypeScript import extensions under the existing `noEmit` contract, classify every behavioral failure against current specifications, repair production behavior or obsolete tests as evidence requires, and remove live-network dependencies from the deterministic suite.

## Functional Requirements

- `npm test` must pass all 204 established tests.
- `npx tsc --noEmit` must complete with zero diagnostics.
- Provider-bound tests must use deterministic fixtures or injected adapters and must not require live network access.
- Evaluation snapshots must preserve the documented append-only immutability contract.
- Market evidence, repository refresh, readiness, negotiation, and capability tests must agree with the current domain specifications.

## Non-Functional Requirements

### Maintainability

Corrections must preserve explicit domain boundaries and avoid test-only branches in production code.

### Reliability

The complete suite must be repeatable offline and must not depend on provider availability.

### Security

No credentials or environment-file contents may enter fixtures, diagnostics, or documentation.

## Acceptance Criteria

- 204/204 behavioral tests pass.
- Standalone TypeScript validation reports zero diagnostics.
- Lint, production build, and `git diff --check` pass.
- Every former failure is classified in the validation record as regression, obsolete assertion, fixture drift, external dependency, or specification ambiguity.
- No card-price tracking feature behavior is added in this slice.

## Edge Cases

- A test expectation that contradicts a current specification is corrected with documented rationale rather than preserved artificially.
- A live provider failure cannot fail the local suite.
- A TypeScript configuration correction cannot enable JavaScript emission.

## Dependencies

- `PHR-TECH-004` canonical repository reconciliation.
- Existing Market Intelligence, evaluation, replay, and identity contracts.

## Technical Notes

The existing `noEmit` configuration makes `allowImportingTsExtensions` an appropriate narrow compatibility setting for the Node test runner. Behavioral fixes remain evidence-driven and may touch tests, fixtures, or production code depending on the authoritative contract.

## Success Metrics

- Zero established test failures.
- Zero standalone TypeScript diagnostics.
- Zero network calls in the supported full suite.

## Traceability

- Origin: Product Owner approval on 2026-07-30.
- Implementation prompt: `docs/prompts/PHR-TECH-009-green-verification-baseline-prompt.md`.
- Validation: `docs/testing/PHR-TECH-009-green-verification-baseline-validation.md`.
- Validation: `docs/testing/PHR-TECH-009-green-verification-baseline-validation.md`.
- Engineer report: `docs/implementation-reports/PHR-TECH-009-green-verification-baseline-report.md`.
- Conformance review: `docs/reviews/PHR-TECH-009-green-verification-baseline-conformance-review.md`.
- Release notes: `docs/release-notes/PHR-TECH-009.md`.
- Last modified: 2026-07-30.
- Modification reason: Implementation and verification completed.
