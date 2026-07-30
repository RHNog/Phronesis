# PHR-UX-010 — Watch Entry Composer

## Feature ID

`PHR-UX-010`

## Status

Completed — CTO Accepted

## Priority

High

## Category

UX / Workflow / Market Watch

## Objective

Let users configure an intentional manually added watch before it enters Market Watch while preserving the Vendor Workspace one-action shortcut.

## Proposed Solution

Command-palette and Market Watch additions open a compact composer populated with exact catalogue identity. Target price is required unless the user explicitly selects “No target”; notes and reason are optional. Vendor Workspace keeps one-action tracking and offers an immediate optional configuration continuation.

## Functional Requirements

- Manual addition resolves an exact catalogue SKU before submission.
- Show printing, finish, condition, language, and current reference.
- Require a positive target or an explicit no-target choice.
- Capture optional notes and reason added.
- Vendor Workspace remains one action with idempotency and undo.
- Existing edit behavior remains available after creation.

## Non-Functional Requirements

- Keyboard operable, labelled, dismissible, and usable at 390px.
- No duplicate watch membership from repeated submission.
- No mandatory watchlist selection in this release.

## Acceptance Criteria

- A command-palette selection does not create a watch before confirmation.
- Configured fields persist server-side.
- Vendor Workspace one-action tracking remains intact.

## Dependencies

- `PHR-WORKFLOW-005`
- `PHR-TECH-010`

## Non-Goals

- Multiple-watchlist UI.
- Notification delivery.

## Traceability

- Origin: Product Owner request, 2026-07-30.
- Related implementation prompt: `docs/prompts/PHR-UX-010-watch-entry-composer-prompt.md`.
- Related tests: `docs/testing/PHR-CARD-SHOW-OPERATIONS-20260730-validation.md`.
- Last modified: 2026-07-30.
