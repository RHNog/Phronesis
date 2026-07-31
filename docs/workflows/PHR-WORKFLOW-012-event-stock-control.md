# PHR-WORKFLOW-012 Event Stock Control

## Feature ID

`PHR-WORKFLOW-012`

## Title

Google-Sheet-Sourced Event Stock Control

## Status

Implemented — Product Review Pending

## Priority

Critical

## Category

Workflow / Database / Inventory / Event Operations / Audit / Reporting / UX

## Objective

Let event operators prepare sellable stock in a simple Google Sheet, ingest a verified snapshot into local SQLite, sell against the exact imported option from either Event Ledger surface, and reconcile sold and leftover quantities at the end of the event.

## Background

The Event Ledger records payment-aware Sales and manually described sold-item rows. Phronesis also has receipt-backed workspace Inventory, location/count reconciliation, and a disposition ledger. Event sellers nevertheless need a low-friction way to load the specific merchandise brought to a show, find it quickly at checkout, and verify what should remain after the show. That event allocation may include stock authored outside Phronesis and therefore cannot be assumed to have a purchase receipt or catalogue identity.

## Problem Statement

Manual Sale descriptions do not identify a prepared stock row and cannot decrement an expected event quantity. A closing cash count proves drawer variance but cannot explain which units sold, which should remain, or whether a physical leftover count exposes missed, lost, or mis-entered units.

## Proposed Solution

Treat Google Sheets as the human authoring surface and a versioned CSV export as the ingestion contract. Phronesis imports that file into an event-scoped stock manifest stored in the same local SQLite database as the Event Ledger. The Sheet is not queried during live selling.

Each imported row becomes one explicit sellable option distinguished by Item Name, Price, Quantity, Color, and Variation. Sellers search the active manifest and add one or more exact options to a Sale. The canonical Event Ledger Sale and append-only negative stock movements commit atomically. Reversal appends compensating positive movements. Expected leftover quantity is opening quantity plus active movements; physical counts remain separate append-only observations. Sold and leftover CSV reports are generated from that evidence.

This is an event allocation layer over Phronesis Inventory, not a competing enterprise inventory system. Future work may allocate receipt-backed Inventory lots into a manifest, but this feature does not rewrite acquisition or global Inventory evidence.

## Spreadsheet Contract

The canonical `Event Inventory` tab has exactly these five columns in this order:

1. `Item Name` — required text, 1–160 characters.
2. `Price` — required non-negative unit list price in the active event currency.
3. `Quantity` — required positive whole number, maximum 1,000,000.
4. `Color` — optional text, maximum 80 characters.
5. `Variation` — optional text, maximum 120 characters.

Blank trailing rows are ignored. Exact duplicate Item Name + Price + Color + Variation rows are rejected with source row numbers; quantity must be consolidated in the Sheet. CSV is capped at 2 MiB and 10,000 data rows. UTF-8 with an optional BOM and quoted commas/newlines are supported. Price parsing supports ordinary US and Brazilian decimal presentation but stores integer cents in the event currency.

## Functional Requirements

- Event Ledger exposes an Import Event Inventory control only when an event exists and the operator can Operate.
- Import accepts a `.csv` downloaded from the canonical Google Sheet template and records source filename, SHA-256, contract version, row count, total opening quantity, actor, and timestamp.
- The same hash is idempotent. A different import may supersede the active manifest only before the first inventory-linked Sale; after that, import is locked to protect baseline evidence.
- Stock search covers Item Name, Color, Variation, and formatted price; results show exact option attributes, list price, opening quantity, sold quantity, and expected remaining quantity.
- Full Event Ledger and Vendor Workspace Quick Sale both use the same stock-search component and active event manifest.
- A Sale may contain one to 25 stock-linked or manual lines. Duplicate stock selection inside one Sale is rejected or consolidated before submission.
- For a stock-linked row, the server owns the canonical description, color, variation, list price, and available quantity; client text cannot rewrite imported evidence.
- A stock-linked Sale and its quantity movements commit in the same database transaction as the Event Ledger entry.
- Overselling fails without writing the Sale or any movement.
- Retrying the same Sale operation cannot decrement stock twice.
- Reversing a stock-linked Sale appends compensating stock movements in the same transaction as the ledger reversal.
- Manual/untracked Sale rows remain available for exceptional stock but are counted and reported as untracked evidence.
- Operators can record an actual physical count against an imported option with a reason. Counts never rewrite opening quantity or movement history.
- Event stock summary exposes SKU options, opening units, sold units, expected leftover units, counted options, variance units, and untracked Sale units.
- Sold report includes Sale timestamp, ledger entry, payment method, actual whole-Sale amount, item option, quantity, imported unit list price, color, and variation. It must not allocate a multi-item Sale amount across rows or label list value as realized revenue.
- Leftover report includes option identity, opening quantity, sold quantity, expected remaining, latest physical count, variance, list price, color, and variation.
- Reports remain available for the latest closed event.

## Non-Functional Requirements

### Performance

Local search should return the best 40 event-stock options within 100 ms for a 10,000-row manifest on supported hardware. Import and reports remain bounded by the declared limits.

### Scalability

Import batches, items, movements, and counts are separate additive tables. Movement-derived remaining quantity supports future allocation from global Inventory without changing Sale history.

### Maintainability

CSV validation and event-stock invariants live in a server-only domain/repository boundary. Route Handlers remain thin authorization and DTO layers. Both Sale UIs reuse one stock selector.

### Reliability

Import is hash-idempotent. Sale/movement and reversal/compensation are atomic. Live selling reads only local SQLite and never depends on Google availability.

### Accessibility

File input, stock search, result choices, selected lines, count controls, report actions, and status/error output use explicit labels and keyboard-operable controls with 44px minimum targets.

### Offline Support

After CSV ingestion, the entire selling, reversal, count, and report workflow is local and offline-capable.

### Security

Reads require `VENDOR_WORKSPACE:VIEW`; import, count, Sale, and reversal require `VENDOR_WORKSPACE:OPERATE`. Event and stock ownership are rechecked in the server repository. No Google credential or Sheet URL is stored in this slice.

### Extensibility

The manifest can later accept authenticated Sheets synchronization, barcode/SKU fields, global Inventory allocation, labels, or images through separately versioned contracts.

### Responsiveness

Import, stock selection, summary, count, and reports must remain usable at 390px without horizontal overflow. Dense report review may use stacked cards on phone and tables/CSV on desktop.

## User Stories

- As an event seller, I can find the exact stocked option and record its Sale without typing the item again.
- As a buyer making an incidental Sale in Vendor Workspace, I decrement the same event stock as the seller panel.
- As an event manager, I can compare what should remain with what was physically counted.
- As an owner, I can audit the exact Sheet snapshot, Sales, reversals, counts, and discrepancies without trusting mutable spreadsheet state.

## Acceptance Criteria

- Canonical five-column CSV validation, locale-aware price parsing, duplicate detection, limits, and hash idempotency are deterministic and tested.
- Import creates one active event manifest and cannot silently replace a consumed baseline.
- Stock-linked Sale, multi-item Sale, retry, oversell rejection, reversal, manual fallback, and cross-workspace failure are tested.
- Both Event Ledger Sale surfaces use the same stock search and canonical `record-sale` path.
- Sold and leftover reports truthfully distinguish whole-Sale actual amount from imported per-item list price.
- Physical count and variance are append-only and do not alter expected quantity.
- TypeScript, lint, full tests, production build, diff hygiene, private runtime, desktop, and 390px workflow review pass.

## Edge Cases

- A Sheet with reordered, missing, duplicated, or extra headers fails closed with the expected contract.
- A comma-decimal price inside quoted CSV parses to exact cents; ambiguous or negative price text fails.
- Two visually similar options with different Color, Variation, or Price remain separate selectable rows.
- A second import with the same bytes returns the original manifest; different bytes after a tracked Sale are rejected.
- Concurrent Sales for the last unit serialize under the database transaction; one succeeds and the other fails.
- A reversed Sale restores expected quantity but remains visible in the audit and sold-report history as reversed.
- An untracked manual Sale is visible in the event report and does not pretend to reduce imported stock.
- Physical count may be zero. Variance can be positive or negative and is never silently converted to a Sale, Loss, or correction.
- Closing the cash ledger does not delete or hide the event-stock report.

## Dependencies

- `PHR-WORKFLOW-006` Event Cash Ledger.
- `PHR-UX-015` Vendor Workspace Quick Sale.
- `PHR-WORKFLOW-008` through `PHR-WORKFLOW-010` Inventory evidence principles.
- `PHR-ARCH-011` module authorization.
- Local SQLite authorization/event database.

## Future Enhancements

- Authenticated Google Sheets read/sync after owner credential-vault activation.
- Allocation from receipt-backed global Inventory and automatic post-event return-to-location.
- Barcode, QR, image, and custom SKU columns through contract version 2.
- Batch physical-count scanner and printable count sheets.

## Technical Notes

Use additive `phronesis_event_stock_import`, `phronesis_event_stock_item`, `phronesis_event_stock_movement`, and `phronesis_event_stock_count` tables plus a nullable `event_stock_item_id` on Sale item rows. Remaining quantity is derived from opening quantity and non-destructive movements. The Purchase Ledger repository coordinates Sale and reversal transactions with a shared event-stock repository over the same `DatabaseSync` connection.

## UI / UX Notes

Place Event Inventory below the event cash summary and before transaction entry. When a manifest exists, lead Sale entry with stock search; preserve an explicit `Add untracked item` escape hatch. Use a compact summary, import provenance, search/results, and report downloads. Keep the physical-verification list collapsed until requested; when opened, counts default to expected quantity and require a reason only when saved, minimizing typing while retaining audit evidence.

## Success Metrics

- Zero stock-linked Sales that fail to update expected remaining quantity.
- Zero duplicate decrements from retries.
- Zero live-event dependency on Google network access after import.
- Every discrepancy is visible as expected, counted, and variance rather than hidden as a quantity overwrite.

## Open Questions

- None blocking for the CSV snapshot workflow. Authenticated live Sheet synchronization is intentionally deferred to secure connector work.

## Traceability

- Originating direction: Product Owner request on 2026-07-31 under `PHR-STRUCT-20260731-005`.
- Related implementation prompt: `docs/prompts/PHR-WORKFLOW-012-event-stock-control-prompt.md`.
- Related database design: `docs/database/PHR-WORKFLOW-012-event-stock-schema.md`.
- Related tests: `tests/event-stock-control.test.ts` and `tests/event-cash-ledger.test.ts`.
- Related validation: `docs/testing/PHR-WORKFLOW-012-event-stock-control-validation.md`.
- Related implementation report: `docs/implementation-reports/PHR-WORKFLOW-012-event-stock-control-report.md`.
- Related conformance review: `docs/reviews/PHR-WORKFLOW-012-event-stock-control-conformance-review.md`.
- Related release notes: `docs/release-notes/PHR-WORKFLOW-012.md`.
- Last modified: 2026-07-31.
- Modification reason: implementation, deterministic/performance verification, native Sheet validation, and private responsive review completed.
