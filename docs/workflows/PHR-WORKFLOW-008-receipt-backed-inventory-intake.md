# Receipt-Backed Inventory Intake

## Feature ID

`PHR-WORKFLOW-008`

## Title

Receipt-Backed Inventory Intake

## Status

Completed

## Priority

High

## Category

Workflow / Database / Inventory / Audit / UX

## Objective

Turn every finalized card-show purchase into truthful, auditable inventory cost-basis lots without adding a second data-entry step.

## Background

`PHR-WORKFLOW-006` already records exact-card and Bulk purchases as immutable receipts. Inventory intake is the next roadmap capability and should reuse that authoritative event evidence.

## Problem Statement

Purchased products are ledgered but do not become inventory. Operators would otherwise need to re-enter printing, condition, quantity, cost, and provenance, creating friction and reconciliation errors.

## Proposed Solution

Create workspace-scoped inventory lots atomically with receipt checkout. Exact purchase lines retain catalogue identity, condition, quantity, unit cost, total cost, and receipt provenance. Bulk lines become aggregate Bulk lots with selected product lines, approximate quantity/weight, notes, and total cost. Voiding a receipt voids its lots without deleting audit evidence.

## Functional Requirements

- Finalizing a receipt creates exactly one inventory lot per receipt line in the same database transaction.
- Exact lots preserve SKU, category, name, set, collector number, variant, language, product type, condition, quantity, unit cost, and total cost.
- Bulk lots preserve product lines, notes, approximate quantity/weight, and total cost; they never manufacture individual card identities.
- Intake is idempotent by workspace, source receipt, and source line position.
- Existing receipts are reconciled into missing lots through an idempotent migration.
- Receipt void is transactional and marks linked lots voided with the supplied reason.
- Users with `INVENTORY:VIEW` may see workspace inventory; navigation visibility never replaces server authorization.
- Inventory presents active cost basis, exact units, Bulk lot count, acquisition time, source receipt, and void status.

## Non-Functional Requirements

### Performance

Workspace inventory reads use indexed acquisition and status fields and require no external request.

### Scalability

The lot model supports future location, disposition, sale, and valuation events without rewriting purchase receipts.

### Maintainability

Inventory persistence is server-owned and separate from UI components; receipt data remains the source record.

### Reliability

Checkout, receipt lines, inventory lots, cart clearing, and audit creation succeed or roll back together.

### Accessibility

Inventory uses semantic headings, tables/cards, text status labels, and keyboard-accessible filters.

### Offline Support

No new offline mutation path is introduced. Previously persisted local-server inventory remains readable while external providers are unavailable.

### Security

All queries are workspace-scoped and the inventory API requires `INVENTORY:VIEW`. The browser cannot submit arbitrary intake records in this slice.

### Extensibility

Lot provenance and stable IDs support future sales, locations, grading, valuation, and reconciliation.

### Responsiveness

Desktop is primary; the view collapses into readable lot cards on narrow mobile screens.

## User Stories

- As a show buyer, I want checkout to intake purchases automatically so I never enter the same card twice.
- As an inventory operator, I want exact cost basis and receipt provenance so I can audit every lot.
- As an owner, I want Bulk recorded honestly as an aggregate so reported inventory does not imply nonexistent item-level precision.

## Acceptance Criteria

- Exact and Bulk receipt lines create correct, idempotent lots atomically.
- Voided receipts leave visible but inactive lots with an audit reason.
- Existing non-voided and voided receipts reconcile without duplicates.
- Unauthorized users cannot read the inventory API or page.
- Navigation, responsive UI, tests, TypeScript, lint, build, and diff hygiene pass.

## Edge Cases

- Repeated checkout idempotency keys return the original receipt and do not duplicate lots.
- A rollback leaves neither a receipt nor inventory lots.
- A repeated void fails without changing the first void evidence.
- Zero or missing approximate Bulk quantity remains unknown rather than inferred.
- Old receipts with no inventory record are backfilled once.

## Dependencies

- `PHR-WORKFLOW-006` Event Purchase Ledger.
- `PHR-ARCH-011` Internal Identity And Module Authorization.
- Local SQLite authorization database.

## Future Enhancements

- Grading, cycle-count sessions, valuation, and repricing. Basic locations/counts and the sale/disposition ledger were completed by `PHR-WORKFLOW-009` and `PHR-WORKFLOW-010`.

## Technical Notes

Use a server-only `InventoryRepository`. Its schema owns immutable source fields plus nullable void metadata. `PurchaseLedgerRepository` invokes inventory writes inside its existing transaction and upgrades receipt voiding to a transaction. The inventory API is read-only in this slice.

## UI / UX Notes

Lead with total active cost basis and exact units. Clearly distinguish Exact, Sealed, and Bulk. Show source receipt identifiers in compact form with full value available to copy or inspect.

## Success Metrics

- 100% of finalized receipt lines have one corresponding lot.
- Zero duplicate lots for idempotent checkout or migration.
- Zero manual steps between checkout and inventory visibility.

## Open Questions

- Sale/disposition semantics were completed by `PHR-WORKFLOW-010`; cost-basis allocation remains a future financial product decision.

## Traceability

- Originating work order: `PHR-STRUCT-20260730-010`.
- Related implementation prompt: `docs/prompts/PHR-WORKFLOW-008-receipt-backed-inventory-intake-prompt.md`.
- Related tests: `tests/inventory-intake.test.ts` and navigation/authorization coverage.
- Related release notes: `docs/release-notes/PHR-WORKFLOW-008.md`.
- Last modified: 2026-07-30.
- Modification reason: roadmap implementation authorization.
