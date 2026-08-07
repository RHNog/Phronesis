# PHR-WORKFLOW-012 — Event Stock Control

## 2026-08-06 — Authorized Case Source Preparation

- Renamed the canonical native Sheet to `Phronesis Case Source — Opening Display Inventory` and documented its explicit-email collaboration rule inside the Sheet.
- Added a pre-event Case Source preparation card for Inventory Operators in Display Case and retained the edit action in Event Ledger.
- Added a `Case preparation only` access preset plus an exact eligible-editor email roster in Settings → People & access.
- Moved the Sheet URL to validated server-only configuration and independently authorization-gated each disclosure surface.
- Kept native Google Editor permission as a second gate and retained owner-only Drive metadata until a real approved member is available; public/link editing remains prohibited.
- Verified 446/446 tests, TypeScript, lint, production build, diff hygiene, private runtime, 1280px/390px no-overflow layouts, 44px actions, Copy feedback, and zero browser-console entries.

## 2026-07-31 — Product Review Ready

- Added an owner-scoped native Google Sheet template with exact Item Name, Price, Quantity, Color, and Variation columns plus local CSV ingestion.
- Added immutable event-stock manifests, exact option search, atomic Sale decrements, retry/oversell protection, reversal restoration, manual fallback, and append-only physical counts.
- Added one shared stock picker to the full Event Ledger and Vendor Workspace Quick Sale so both surfaces update the same event stock and cash control.
- Added opening/sold/expected/count/variance/untracked summaries and truthful sold/leftover CSV reports.
- Kept end-of-event verification collapsed until needed so large manifests do not obstruct live checkout.
- Verified 284/284 tests, TypeScript, lint, production build, diff hygiene, private health, a complete disposable import/Sale/count/report/reversal workflow, 29.93 ms median search over 10,000 options, and 390px no-overflow/clean-console behavior.
