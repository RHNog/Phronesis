# Inventory Disposition Ledger

## Added

- Lot-specific Sale, Loss, Damage, Transfer Out, and Correction records.
- Atomic operational-quantity decrement with retry-safe creation.
- Gross recorded sale evidence with optional channel and counterparty.
- Required transfer destination and reasoned evidence for every classification.
- Non-destructive reversal that restores quantity while retaining the original ledger record.
- Inventory summaries for disposed units, sold units, and gross recorded sales.
- Operator-only responsive disposition and reversal workflows.

## Integrity And Security

- Receipt quantity, acquisition cost, prior physical counts, and provenance remain immutable.
- Unknown, insufficient, voided, and cross-workspace quantities fail closed.
- Later physical counts prevent ambiguous reversal.
- Every mutation requires `INVENTORY:OPERATE`; gross proceeds are not represented as profit or settled revenue.

## Deferred

- Fees, taxes, settlement, payments, customers, returns, margin allocation, accounting export, external marketplace mutation, and listing readiness.
