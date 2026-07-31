# Inventory Location And Count Reconciliation

## Feature ID

`PHR-WORKFLOW-009`

## Title

Inventory Location And Count Reconciliation

## Status

Completed

## Priority

High

## Category

Workflow / Database / Inventory / Audit / UX

## Objective

Let authorized operators organize receipt-backed lots into workspace locations and record physical counts without rewriting acquisition evidence.

## Background

`PHR-WORKFLOW-008` creates immutable-provenance inventory lots from event receipts. The next inventory maturity step is knowing where each lot is and whether the physical quantity agrees with its receipt or approximate Bulk intake.

## Problem Statement

Inventory lots currently have no storage location and only their intake quantity. Operators cannot reconcile a shelf, case, or box against the system, and any direct quantity overwrite would destroy the distinction between acquisition evidence and later observation.

## Proposed Solution

Add workspace-owned locations, derived on-hand quantity, and append-only MOVE and COUNT events. “Unassigned” is the default state. A reconciliation action may move a lot and/or record a non-negative physical count atomically, with a mandatory reason and server-side `INVENTORY:OPERATE` authorization.

## Functional Requirements

- Authorized operators can create uniquely named workspace locations.
- Every active lot displays its current location; legacy and new lots default to Unassigned.
- A single reconciliation can change location, record physical count, or do both atomically.
- Every actual change appends an event containing lot, actor, previous/next value, reason, and timestamp.
- Receipt quantity, approximate Bulk intake, cost basis, and receipt provenance remain unchanged.
- Exact on-hand quantity defaults to receipt quantity until counted.
- Bulk on-hand quantity defaults to its approximate intake quantity and remains labelled approximate until counted.
- Counts accept zero and positive whole numbers; negative/fractional values fail closed.
- Voided lots cannot be moved or counted.
- Location IDs and lot IDs are verified inside the authorized workspace.
- Inventory shows location, on-hand basis, last count time, and recent reconciliation activity.

## Non-Functional Requirements

### Performance

Location and inventory-event queries use workspace and lot indexes and require no external provider.

### Scalability

Append-only events support future cycle counts, discrepancy reporting, and location history.

### Maintainability

The inventory repository owns validation and atomic mutations; Route Handlers remain thin authorization/input boundaries.

### Reliability

Multi-field reconciliation commits all lot and event changes together or rolls back completely.

### Accessibility

Management uses labelled native controls, explicit status text, keyboard-operable dialogs/forms, and live success/error feedback.

### Offline Support

The feature operates against the local Phronesis database and does not require network providers.

### Security

Reads require `INVENTORY:VIEW`; location and reconciliation writes require `INVENTORY:OPERATE`; resource ownership is rechecked server-side.

### Extensibility

Event semantics remain distinct from future SALE, TRANSFER, DAMAGE, LOSS, or other disposition events.

### Responsiveness

Desktop remains primary; lot management and activity remain usable at 390px without horizontal overflow.

## User Stories

- As an inventory operator, I want to place a purchased lot in a case, shelf, or box so I can find it.
- As a counter, I want to record what is physically present without erasing what the receipt originally said.
- As an owner, I want a reasoned event history so discrepancies remain accountable.

## Acceptance Criteria

- Location creation is normalized, unique per workspace, and authorized.
- Move/count reconciliation is atomic, workspace-scoped, and append-only audited.
- Intake quantity and cost basis remain invariant after reconciliation.
- Exact, Bulk, zero-count, invalid-count, no-op, voided-lot, and cross-workspace cases are tested.
- Desktop/mobile UI, TypeScript, lint, build, full tests, and diff hygiene pass.

## Edge Cases

- Two names differing only by case/spacing are duplicates.
- Moving to Unassigned is supported and audited.
- A no-op reconciliation is rejected rather than creating false activity.
- A location from another workspace cannot be attached.
- A zero physical count remains an active discrepancy, not an implicit sale or deletion.
- Count correction does not recalculate historical acquisition cost basis.

## Dependencies

- `PHR-WORKFLOW-008` Receipt-Backed Inventory Intake.
- `PHR-ARCH-011` module authorization.
- Local SQLite authorization database.

## Future Enhancements

- Cycle-count sessions, barcode-assisted moves, and discrepancy dashboards. The explicit disposition/sales ledger is completed by `PHR-WORKFLOW-010`.

## Technical Notes

Add additive location and event tables plus nullable location/reconciled-count columns on inventory lots. Use one repository transaction for a combined reconciliation. Return minimal inventory, location, and recent-event DTOs through the existing inventory route.

## UI / UX Notes

Keep browsing passive. “Manage lot” opens an inline modal/form with Location, Physical count, and Reason. Do not create activity until the operator submits a real change.

## Success Metrics

- Every location/count mutation has one corresponding event per changed dimension.
- Zero receipt fields are overwritten by reconciliation.
- Zero cross-workspace resource attachments.

## Open Questions

- Disposition reasons are completed by `PHR-WORKFLOW-010`; cost-basis allocation remains reserved for a later financial specification.

## Traceability

- Originating work order: `PHR-STRUCT-20260730-011`.
- Related implementation prompt: `docs/prompts/PHR-WORKFLOW-009-inventory-location-count-reconciliation-prompt.md`.
- Related tests: `tests/inventory-reconciliation.test.ts`.
- Related release notes: `docs/release-notes/PHR-WORKFLOW-009.md`.
- Last modified: 2026-07-30.
- Modification reason: autonomous roadmap continuation.
