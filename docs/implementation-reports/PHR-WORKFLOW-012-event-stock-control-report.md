# PHR-WORKFLOW-012 Engineer Report — Event Stock Control

Date: 2026-07-31; authorized collaboration revision 2026-08-06

Status: **IMPLEMENTED AND PRIVATELY LIVE — PRODUCT REVIEW PENDING**

## 2026-08-06 Authorized Collaboration Revision

- Renamed the canonical native Sheet to [Phronesis Case Source — Opening Display Inventory](https://docs.google.com/spreadsheets/d/1yqGJMvyL_zzMuDQPOdnLi0UUuyIF1-B3-9iwpkEUv50/edit) without changing its file ID or five-column ingestion contract.
- Moved the Sheet address from a client-public `NEXT_PUBLIC_` variable to validated server-only configuration. Display Case and Event Ledger receive it only after an independent `INVENTORY:OPERATE` authorization decision.
- Added a pre-event Case Source preparation card to Display Case, plus a `Case preparation only` assignment preset and exact eligible-editor email roster in Settings → People & access.
- Preserved Google as a separate native authorization boundary. The owner grants Editor to the exact approved Phronesis email and removes that same Drive permission on revocation; Phronesis does not enable public/link editing or silently mutate Google permissions.
- Updated the Sheet Instructions tab with the same dual-gate access rule. Drive metadata confirms the only current permission is the explicit owner account, so no nonexistent future editor was pre-authorized.
- Verified all 446 tests, TypeScript, warning-free lint, Next.js 16.2.12 production build, diff hygiene, private HTTP 200, desktop and 390px no-overflow behavior, 44px actions, copy feedback, and zero browser-console entries.

## Delivered

- Created an owner-scoped native [Phronesis Event Inventory Template](https://docs.google.com/spreadsheets/d/1yqGJMvyL_zzMuDQPOdnLi0UUuyIF1-B3-9iwpkEUv50/edit) with Instructions and Event Inventory tabs, exact five-column headers, frozen headers, filtering, number validation, and CSV export guidance.
- Added strict UTF-8 CSV ingestion for `Item Name`, `Price`, `Quantity`, `Color`, and `Variation`, including exact cents, US/Brazilian price presentation, quoted fields, row/byte limits, duplicate rejection, and SHA-256 provenance.
- Added event-scoped SQLite imports, stock options, append-only movements, and physical counts without duplicating or rewriting global Inventory evidence.
- Added one shared exact-option picker to the full Event Ledger and Vendor Workspace Lite Event Ledger, while retaining an explicit untracked-item fallback.
- Made canonical Sale rows, stock decrements, retry behavior, oversell rejection, and reasoned reversal atomic in the existing `PurchaseLedgerRepository` transaction.
- Added opening/sold/expected/count/variance/untracked summaries plus truthful sold and leftover CSV reports.
- Kept physical verification collapsed until requested so large manifests do not push the live Sale form out of the seller's immediate path.
- Preserved local live-event operation: Google Sheets is the authoring surface, but every Sale, reversal, search, count, and report uses the immutable local snapshot after import.

## Evidence

The focused stock workflow and complete 284/284 behavioral suite pass, along with standalone TypeScript, warning-free lint, production build, diff hygiene, private-service health, and 390px no-overflow/clean-console review. A 10,000-option in-memory SQLite benchmark returned exact stock search in 28.12–33.99 ms, with a 29.93 ms median. An isolated API workflow imported three options/seven units, recorded a mixed multi-item Sale, produced three sold/four expected/untracked evidence, saved a negative physical variance, generated both reports, and restored seven expected units on reversal. See `docs/testing/PHR-WORKFLOW-012-event-stock-control-validation.md`.

## Boundaries

This increment does not add live Google credential access, background Sheet synchronization, automatic Drive ACL mutation, global Inventory allocation, payment processing, revenue allocation, cost basis, profit, settlement, external transactions, or public deployment. The Google Sheet remains explicit-user scoped; the live event remains local after explicit CSV ingestion.
