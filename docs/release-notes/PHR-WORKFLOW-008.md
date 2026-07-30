# Receipt-Backed Inventory Intake

## Added

- Automatic inventory intake from finalized event-purchase receipts.
- Exact printing, condition, quantity, unit-cost, total-cost, operator, event, and receipt provenance.
- Truthful aggregate Bulk lots with selected product lines, notes, approximate quantity/weight, and no fabricated card identity.
- Workspace Inventory destination, active cost-basis summary, filters, and responsive lot presentation.

## Reliability And Security

- Checkout and intake share one SQLite transaction and a unique receipt-line source identity.
- Existing receipt lines reconcile idempotently when the additive schema activates.
- Receipt void preserves and deactivates inventory lots transactionally.
- Page and API access require the assigned Inventory module; all reads are workspace-scoped.

## Deferred

- Storage locations, sales/dispositions, grading, listing readiness, repricing, aging, and inventory counts.
