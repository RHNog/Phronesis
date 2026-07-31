# Inventory Location And Count Reconciliation

## Added

- Workspace inventory locations with normalized duplicate protection.
- Atomic lot management that can move a lot and/or record a physical count.
- On-hand quantity with explicit Receipt, Approximate, Counted, or Unknown basis.
- Append-only MOVE and COUNT activity with actor, reason, timestamp, and before/after evidence.
- Operator-only location/reconciliation controls and a responsive recent-activity view.

## Integrity And Security

- Receipt quantity, Bulk intake evidence, and acquisition cost basis remain unchanged.
- Zero counts are visible discrepancies, not implicit deletions or dispositions.
- All mutations require `INVENTORY:OPERATE` and verify lot/location workspace ownership.

## Subsequent Delivery

- Sales/dispositions, damage/loss semantics, and transfer-out are completed by `PHR-WORKFLOW-010`.
- Cycle-count sessions, location archiving, and barcode workflows remain deferred.
