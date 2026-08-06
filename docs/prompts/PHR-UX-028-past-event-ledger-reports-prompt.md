# PHR-UX-028 — Past Event Ledger Reports Implementation Prompt

## Project Context

Project Phronesis is a private evidence-driven collectible-market and event-operations platform. Documentation is implementation. Follow the originating feature specification before changing code.

## Feature ID

`PHR-UX-028`

## Objective

Expose a searchable, authorized archive of closed Event Ledger reports directly inside the canonical Event Ledger and allow exact read-only report reopening through a durable URL.

## Required Reading

- `docs/ux/PHR-UX-028-past-event-ledger-reports.md`
- `docs/workflows/PHR-WORKFLOW-006-event-purchase-ledger.md`
- `docs/workflows/PHR-WORKFLOW-012-event-stock-control.md`
- `docs/architecture/PHR-ARCH-012-employee-activation-module-access.md`
- Relevant guides under `node_modules/next/dist/docs/`.

## Implementation Requirements

- Add a bounded workspace-scoped list of closed-event report summaries to `PurchaseLedgerRepository`.
- Add a workspace-scoped exact-event snapshot method that rejects unknown and foreign event IDs generically.
- Extend authorized Event Ledger GET behavior with an optional exact `eventId` and the closed-report index.
- Add a prominent archive action, local search, report cards, direct selection, durable URL state, Back/Forward support, and one-click current-event restoration.
- Reuse the existing summary, reconciliation, Event Stock, and immutable activity presentation.
- Keep all past reports read-only even when the operator has `OPERATE` access.

## Constraints

- Do not create another ledger, report database, or client-owned financial calculation.
- Do not weaken `EVENT_LEDGER:VIEW` authorization or workspace isolation.
- Do not change active-event write behavior, close semantics, reversal rules, or Event Stock persistence.
- Do not invent values for legacy events.
- Preserve unrelated user changes.

## Expected Architecture

`PurchaseLedgerRepository` owns report discovery and exact-event snapshot assembly. `/api/event-ledger` validates authorization and untrusted query input, returning bounded DTOs. `EventLedgerWorkspace` owns interactive archive presentation and navigation while continuing to render the canonical snapshot contract.

## Testing Expectations

- Repository tests for ordering, exact selection, closed-only index behavior, and workspace isolation.
- Route and UI contract tests for authorization, query handling, archive discoverability, and read-only selection.
- Full TypeScript, lint, build, and regression suite.
- Browser validation on desktop and 390-pixel phone width, including direct link and Back/Forward behavior.

## Documentation Updates

- `docs/FEATURE_REGISTRY.md`
- `docs/ATLAS.md`
- `docs/ROADMAP.md`
- `docs/product-development/CURRENT_CTO_STRUCTURE.md`
- `docs/product-development/CONVERSATION_HISTORY.md`
- Implementation report, validation, conformance review, and release notes for `PHR-UX-028`.

## Acceptance Criteria

- Every acceptance criterion in `docs/ux/PHR-UX-028-past-event-ledger-reports.md` passes with evidence.

## Non-Goals

- PDF generation, accounting integration, event comparison, report mutation, or pagination beyond the bounded latest-100 archive.

## Notes For AI Coding Agents

- Preserve unrelated user changes.
- Keep edits scoped to the specification.
- Present improvement suggestions separately from implementation.
