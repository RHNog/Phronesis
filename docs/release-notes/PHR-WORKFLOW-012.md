# PHR-WORKFLOW-012 — Event Stock Control

## 2026-07-31 — Product Review Ready

- Added an owner-scoped native Google Sheet template with exact Item Name, Price, Quantity, Color, and Variation columns plus local CSV ingestion.
- Added immutable event-stock manifests, exact option search, atomic Sale decrements, retry/oversell protection, reversal restoration, manual fallback, and append-only physical counts.
- Added one shared stock picker to the full Event Ledger and Vendor Workspace Quick Sale so both surfaces update the same event stock and cash control.
- Added opening/sold/expected/count/variance/untracked summaries and truthful sold/leftover CSV reports.
- Kept end-of-event verification collapsed until needed so large manifests do not obstruct live checkout.
- Verified 284/284 tests, TypeScript, lint, production build, diff hygiene, private health, a complete disposable import/Sale/count/report/reversal workflow, 29.93 ms median search over 10,000 options, and 390px no-overflow/clean-console behavior.
