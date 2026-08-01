# Implementation Prompt — PHR-WORKFLOW-014 Display Case Inventory

Execution status: **Completed — Product Review Pending**

## Project Context

Phronesis has receipt-backed General Inventory, prepared Google-Sheet event stock, and one canonical Event Cash Ledger. Documentation is implementation. Display Case must combine visible operational truth without duplicating ownership or allocating whole-Sale revenue.

## Feature ID

`PHR-WORKFLOW-014`

## Objective

Implement receipt-linked Display Case allocation, merged Sale search, atomic Case/General quantity reduction and reversal, price/return/count controls, combined verification, and General Inventory reservation visibility.

## Required Reading

- `docs/workflows/PHR-WORKFLOW-014-display-case-inventory.md`
- `docs/database/PHR-WORKFLOW-014-display-case-schema.md`
- `docs/workflows/PHR-WORKFLOW-012-event-stock-control.md`
- `docs/workflows/PHR-WORKFLOW-010-inventory-disposition-ledger.md`
- `docs/workflows/PHR-WORKFLOW-006-event-purchase-ledger.md`
- Local Next.js Route Handler, data-security, and Server/Client Component guides.

## Implementation Requirements

- Add additive Case batch/item/movement/price/count persistence and Sale-item linkage.
- Add authorized Event Flip, Display Case, and merged Event Sale-options APIs.
- Coordinate Case-linked Sale and reversal with underlying General Inventory in `PurchaseLedgerRepository`.
- Coordinate Vendor receipt finalization, Inventory intake, initial Case allocation, and handler-entered Case price in the same Purchase transaction.
- Prevent General dispositions/counts/receipt voids from violating Case reservations.
- Add Event Flip and Display Case routes and rename existing Inventory presentation to General Inventory through shared navigation metadata.
- Present prepared stock and event-flip Case stock together with source labels and one verification report.

## Constraints

- Prepared stock remains separate from receipt-backed ownership.
- Whole-Sale actual amount cannot be allocated across item rows.
- Case price is intended/list evidence, not realized revenue.
- No duplicate quantity, negative quantity, provider dependency, destructive migration, public deployment, Binder implementation, commit, or push.

## Expected Architecture

Display Case is a reserved allocation ledger over Inventory lots. Event Stock remains the prepared source. One merged Sale-options DTO searches both. The Purchase Ledger owns Sale atomicity and delegates Case/Inventory movements over the same SQLite connection.

## Testing Expectations

- Allocation, price, return, count, report, merged search, Sale, retry, oversell, reversal, later-count guard, receipt-void guard, disposition reservation, legacy, authorization, and responsive tests.
- Full tests, TypeScript, lint, production build, diff hygiene, private health, desktop, and 390px workflow review.

## Documentation Updates

- Feature Registry, Atlas, Decisions, Roadmap, Sprint History, Changelog, related Inventory/Event specs, validation, implementation report, conformance, release notes, handoff, and product memory.

## Acceptance Criteria

- Every `PHR-WORKFLOW-014` criterion passes with isolated evidence and no persistent user-data mutation.

## Non-Goals

- Binder implementation, Bulk itemization, settlement, accounting, marketplace publication, public deployment, commit, or push.

## Completion Evidence

- Implemented in `app/display-case`, `app/api/display-case`, `app/api/event-sale-options`, `features/events/DisplayCaseWorkspace.tsx`, and the server-only Display Case repository.
- Verified by `tests/display-case-control.test.ts`, the full deterministic suite, TypeScript, lint, production build, private health, and responsive browser review.
- Conformance record: `docs/reviews/PHR-WORKFLOW-014-display-case-inventory-conformance-review.md`.
