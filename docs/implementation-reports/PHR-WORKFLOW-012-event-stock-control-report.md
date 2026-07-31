# PHR-WORKFLOW-012 Engineer Report — Event Stock Control

Date: 2026-07-31

Status: **IMPLEMENTED — PRODUCT REVIEW PENDING**

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

This increment does not add live Google credential access, background Sheet synchronization, global Inventory allocation, payment processing, revenue allocation, cost basis, profit, settlement, external transactions, public deployment, commit, or push. The Google Sheet remains owner-scoped; the live event remains local after explicit CSV ingestion.
