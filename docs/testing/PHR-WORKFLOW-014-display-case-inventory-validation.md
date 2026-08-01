# PHR-WORKFLOW-014 Display Case Inventory Validation

Date: 2026-07-31

Feature: `PHR-WORKFLOW-014`

Verdict: **PASS — PRODUCT REVIEW PENDING**

## Quantity And Transaction Verification

- Multi-lot allocation creates receipt/lot-linked Case items and append-only movements/prices while preserving total owned quantity.
- Case expected quantity derives from `ADD`, `REMOVE`, `SALE`, and `REVERSAL`; return-to-General is retry-safe and cannot exceed expected quantity.
- Both Sale surfaces consume one merged source-labelled Sale-options contract. A selected Case item supplies canonical item identity, available quantity, and current list-price snapshot.
- Case-linked Sale, underlying General Inventory decrement, Event Ledger Sale, sold-item row, and Case movement commit or roll back together.
- Reasoned reversal restores Case and General quantities only when the recorded General count revision is still current.
- Oversell, duplicate selection, foreign-workspace resources, inactive event mutations, later-count reversal, reserved disposition, below-reservation count, and dependent receipt void fail safely.
- Direct Vendor placement records `VENDOR_CHECKOUT` price provenance, enforces Case quantity from one through purchased quantity, and uses a nested SQLite savepoint so any Case error rolls back the outer receipt/Inventory transaction.

## Reporting And Source Verification

- Display Case presents prepared opening stock and receipt-backed Event Flip allocations together while retaining source labels and separate persistence.
- General Inventory exposes owned on-hand, reserved in Case, and available outside Case; allocation changes only the latter two values.
- Append-only physical counts preserve expected quantity and report variance as an observation rather than inferred Sale, Loss, or correction.
- Combined verification and CSV rows retain source, opening/added, sold, expected, counted, and variance evidence. Whole-Sale actual amount remains separate from Case intended/list price.

## Deterministic Gates

- Focused Event Flip/Display Case suite: 6/6 passed.
- Full behavioral suite: 290/290 passed.
- Standalone TypeScript: zero diagnostics.
- Repository-wide ESLint: zero warnings or errors.
- Next.js 16.2.12 production build: passed with `/api/display-case`, `/api/event-sale-options`, `/display-case`, and both existing Sale surfaces registered.
- `git diff --check`: passed.
- Private loopback route health: HTTP 200 after the final rebuild.

## Responsive And Safety Review

- Display Case and Event Flip were reviewed at 390 × 844 and desktop width with no horizontal overflow and at least 44px actions.
- Source sections, prices, quantities, verification state, and navigation remain readable without a separate phone data model.
- Browser console errors: zero.
- The persistent review event was not mutated; behavioral mutations ran only against disposable test databases.
- No provider request, external transaction, dependency, public deployment, commit, or push occurred.
