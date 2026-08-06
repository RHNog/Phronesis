# PHR-UX-015 Vendor Workspace Quick Sale Validation

Date: 2026-07-31

Feature: `PHR-UX-015`

Verdict: **PASS — PRODUCT REVIEW PENDING**

## Shared Ledger Contract

- Vendor Workspace resolves `VENDOR_WORKSPACE:VIEW` at the page boundary and passes its effective `OPERATE` capability into the Event station presentation.
- Quick Sale reads and writes `/api/event-ledger`; it does not introduce another repository, endpoint, drawer calculation, or event identifier.
- Every write sends `record-sale`, the active event ID, one overall positive amount, payment method, one to 25 sold-item rows, optional note, and a retry-stable idempotency key.
- The returned canonical snapshot replaces the Lite summary immediately after success.
- Each transition back into Quick Sale refreshes the canonical snapshot without unmounting or discarding an unsaved Sale draft.
- Source-contract verification confirms the Lite component does not call `/api/purchases` or `/api/inventory`.

## Deterministic Verification

- Focused Event Cash Ledger suite: 6/6 passed.
- Full behavioral suite: 279/279 passed.
- Standalone TypeScript: zero diagnostics.
- Repository-wide ESLint: zero warnings or errors.
- Next.js 16.2.12 production build: passed with all 34 application routes generated or registered.
- `git diff --check`: passed.
- Private review service: loopback HTTP 200 and tailnet mapping healthy after the final rebuild.

## Isolated Cross-Surface Workflow

- Validation used a disposable SQLite authorization/event database and isolated production server on loopback port 3101. No persistent user event or external transaction was changed.
- Started `PHR-UX-015 QA` with $100.00 opening Cash in the full Event Ledger.
- Opened Vendor Workspace at 390 × 844, switched the Event station from Purchase intake to Quick Sale, and recorded one $25.50 Cash Sale containing `QA sold card` and `QA sealed pack`.
- The Lite summary immediately reported $125.50 expected cash and $25.50 gross sales.
- Reloading `/event-ledger` showed the same one active Sale, both item descriptions, $25.50 gross sales, $25.50 net cash movement, and $125.50 expected cash.
- Purchase intake remained the default on reload and retained its existing exact/Bulk purchase interface.

## Responsive And Accessibility Review

- The 390px Vendor Workspace had no horizontal overflow.
- Purchase intake and Quick Sale mode buttons each measured 44px high.
- Total sale amount measured 56px high, Add another item measured 44px, and Record Sale measured 48px.
- Desktop 1440 × 900 remained overflow-free and exposed both station modes without layout regression.
- Browser console review returned zero warnings or errors at phone and desktop widths.

## Negative-Effect Declaration

No second ledger, Inventory mutation, payment processing, settlement, tax, accounting export, customer CRM, public deployment, dependency, persistent QA record, external transaction, Git commit, or push was introduced by this feature.

`PHR-WORKFLOW-012` subsequently adds optional local event-stock links through the same editor/API/repository path; global Inventory remains unchanged and manual fallback remains supported.
