# Inventory Disposition Ledger

## Feature ID

`PHR-WORKFLOW-010`

## Title

Inventory Disposition Ledger

## Status

Completed

## Priority

High

## Category

Workflow / Database / Inventory / Audit / UX

## Objective

Let authorized operators remove known quantities from an inventory lot through an explicit, auditable sale or disposition record without rewriting acquisition or physical-count evidence.

## Background

`PHR-WORKFLOW-008` creates receipt-backed inventory lots and `PHR-WORKFLOW-009` establishes their operational location and physical count. Phronesis still cannot explain why known inventory left the workspace.

## Problem Statement

Operators can count a lower quantity, but a count is only an observation. Treating a sale, loss, damage, transfer, or correction as a count would erase the business event and prevent reliable sales and inventory history.

## Proposed Solution

Add a workspace-scoped, append-only disposition ledger tied to exact inventory lots. A disposition atomically records its classification and evidence while decrementing operational on-hand quantity. A reasoned reversal restores quantity without deleting the original record. Acquisition quantity, total acquisition cost, receipt provenance, and prior counts remain immutable.

## Functional Requirements

- Supported classifications are `SALE`, `LOSS`, `DAMAGE`, `TRANSFER_OUT`, and `CORRECTION`.
- Every disposition identifies one active lot and a positive whole-unit quantity no greater than known on-hand quantity.
- Lots with unknown on-hand quantity require a physical count before disposition.
- Sales require a non-negative gross-proceeds amount and may record channel and counterparty.
- Transfers require a destination and may record counterparty.
- Every classification requires a reason between 1 and 240 characters.
- Disposition creation is idempotent by workspace-owned operation key.
- A reasoned reversal marks the original disposition reversed and restores its quantity atomically; records are never deleted.
- Reversal fails when a later physical count would make restoration ambiguous.
- Voided lots and cross-workspace lot or disposition identifiers fail closed.
- Inventory summaries expose net units disposed, active sales, and gross recorded sales.
- Operators can create and reverse dispositions from Inventory; view-only users see the ledger without mutation controls.

## Non-Functional Requirements

### Performance

Disposition reads use workspace, lot, and timestamp indexes and require no external provider.

### Scalability

The append-only record supports future receipts, sales analytics, channel settlement, and accounting export without changing intake evidence.

### Maintainability

The inventory repository owns classification validation, idempotency, quantity invariants, and transactions. The Route Handler remains a thin authorization boundary.

### Reliability

Ledger insertion or reversal and materialized operational quantity update commit together or roll back together.

### Accessibility

Disposition and reversal dialogs use labelled native controls, keyboard-operable actions, explicit validation, and live status/error feedback.

### Offline Support

The workflow uses the local Phronesis database and does not require a provider or marketplace.

### Security

Reads require `INVENTORY:VIEW`; mutations require `INVENTORY:OPERATE`; every resource is revalidated inside the authorized workspace.

### Extensibility

Gross proceeds are evidence, not net profit. Fees, taxes, settlement, payment method, customer identity, and accounting recognition remain future fields.

### Responsiveness

Desktop remains primary; disposition entry and ledger review must remain usable at 390px without horizontal overflow.

## User Stories

- As a show operator, I want to record a sale against the exact lot so inventory updates immediately.
- As an inventory manager, I want loss, damage, transfer, and correction to remain distinct so counts do not conceal operational events.
- As an owner, I want mistaken entries reversed rather than deleted so the audit trail remains trustworthy.

## Acceptance Criteria

- Creation, reversal, quantity update, and audit record are atomic and workspace-scoped.
- Oversell, unknown quantity, invalid classification data, duplicate idempotency key, voided lot, cross-workspace access, and post-count reversal are tested.
- Receipt quantity, acquisition cost, prior count, and source provenance remain invariant.
- Sale evidence is clearly gross proceeds and is never presented as settled revenue or profit.
- Desktop/mobile UI, full tests, standalone TypeScript, lint, production build, and diff hygiene pass.

## Edge Cases

- A disposition may reduce on-hand quantity to zero but never below zero.
- A duplicate create request returns the current snapshot without a second ledger entry.
- A reversed disposition is excluded from net disposed and gross-sales summaries.
- A reversal after a later count is rejected; the operator must record a new count or corrective disposition.
- Zero-dollar sales are accepted as explicit gross-sale evidence; negative values are rejected.
- Bulk without a known quantity must be counted before units can leave the lot.

## Dependencies

- `PHR-WORKFLOW-008` Receipt-Backed Inventory Intake.
- `PHR-WORKFLOW-009` Inventory Location And Count Reconciliation.
- `PHR-ARCH-011` module authorization.
- Local SQLite authorization database.

## Future Enhancements

- Payment methods, taxes, fees, settlement status, customer records, receipt generation, margin allocation, returns, marketplace synchronization, and accounting export.

## Technical Notes

Use an additive disposition table and a nullable materialized operational-quantity column. Intake remains the fallback until a count or disposition materializes current quantity. Physical counts overwrite operational quantity; dispositions decrement it. Reversals increment it only when no later count makes the result ambiguous.

## UI / UX Notes

Keep reconciliation and disposition as distinct actions. Default the disposition form to Sale, show only classification-relevant fields, keep gross proceeds prominent for sales, and disclose reversal history inline.

## Success Metrics

- Zero unexplained quantity mutations created by the disposition workflow.
- Zero deletion of acquisition, count, or disposition evidence.
- Zero cross-workspace or unauthorized disposition mutation.

## Open Questions

- Net margin and accounting recognition require a later cost-allocation and settlement specification.

## Traceability

- Originating work order: `PHR-STRUCT-20260730-012`.
- Related implementation prompt: `docs/prompts/PHR-WORKFLOW-010-inventory-disposition-ledger-prompt.md`.
- Related tests: `tests/inventory-disposition.test.ts`.
- Related release notes: `docs/release-notes/PHR-WORKFLOW-010.md`.
- Last modified: 2026-07-30.
- Modification reason: autonomous roadmap continuation.
