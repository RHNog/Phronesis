# PHR-WORKFLOW-006 — Event Cash Ledger

## Feature ID

`PHR-WORKFLOW-006`

## Status

Implemented — Product Review Pending

## Priority

Critical

## Category

Workflow / Database / Vendor Operations / Cash Control / Audit / UX

## Objective

Give an event operator one fast, shared ledger that begins with a declared cash float, records sales and purchases as they occur, and reconciles expected drawer cash to the closing count without requiring manual sales to exist in Inventory.

## Background

The original `PHR-WORKFLOW-006` records exact and Bulk event purchases through carts and immutable receipts. `PHR-WORKFLOW-008` converts those receipts into inventory intake, while `PHR-WORKFLOW-010` records disposition of known inventory lots. The Product Owner requires a broader event-operating surface: cash must begin at a known amount, sales and purchases must be recorded with minimal interaction, and walk-up sales must not depend on prior inventory registration.

## Problem Statement

The current purchase-only checkout cannot explain drawer cash. Sales can be recorded only by selecting an existing Inventory lot, which is too slow and incomplete for a live event. It also cannot group multiple manually described items into one customer sale or reconcile the drawer when the event closes.

## Proposed Solution

Evolve the existing event record into a single-currency Event Cash Ledger. A new event requires an opening cash amount. Operators record payment-method-aware Sale, Purchase, or Cash Adjustment entries directly into an append-only ledger. A Sale has one overall amount and one or more sold-item lines. Manual lines require only description and quantity; `PHR-WORKFLOW-012` additively permits an exact event-stock option link without requiring or mutating a global Inventory lot. Evaluated Vendor Workspace purchases continue to create immutable receipts and Inventory intake, and also create one linked ledger Purchase atomically.

The active Event Ledger shows opening cash, cash sales, cash purchases, cash adjustments, expected cash, gross sales, non-cash sales, purchase spend, and net event cash movement. Closing records the physical cash count and reports variance. The product never labels event cash movement as profit because manual sale items have no allocated cost basis.

## Functional Requirements

- Create one active event per workspace with name, date, optional location, event currency (`USD` or `BRL`), and non-negative opening cash.
- Preserve historical event and purchase-receipt evidence through additive migration; do not invent opening cash or payment method for legacy receipts.
- Record a manual Sale with a positive total amount, payment method, optional note, and between one and 25 sold-item lines.
- Require every manual sold-item line to contain a human-entered description and every sold-item line to contain a quantity from 1 through 1,000.
- Permit multiple sold-item lines in one Sale without requiring SKU, catalogue search, customer, global Inventory lot, or disposition; an exact event-stock link remains optional under `PHR-WORKFLOW-012`.
- Record a manual Purchase with positive amount, payment method, and optional description without fabricating Inventory identity.
- Continue exact/Bulk Vendor Workspace receipt checkout and Inventory intake; create its ledger Purchase in the same database transaction with the selected payment method.
- Default fast entry to Sale and Cash; after success clear transaction-specific inputs and keep the active event available.
- Treat Cash Sale as positive drawer movement and Cash Purchase as negative drawer movement. Card, Transfer, and Other transactions affect event totals but not expected drawer cash.
- Permit reasoned Cash In or Cash Out adjustments. Adjustments affect expected cash but are not sales, purchases, revenue, or expense.
- List ledger entries newest first with type, amount, payment method, item/description detail, timestamp, operator, linkage, and reversal state.
- Reverse eligible manual entries by appending a reasoned reversal; never delete the original. A linked purchase must be corrected through its receipt-void workflow so Inventory and cash evidence remain atomic.
- Close an active event with a non-negative physical closing count, calculate expected cash and over/short variance, and lock ordinary entry.
- Keep a closed event summary visible after reload and permit a new event only after the current event is closed.
- Expose closed-event reports from the full Event Ledger through the `PHR-UX-028` newest-first archive, exact read-only selection, and current-event return; do not create a second report store.
- Scope every read and mutation to the authorized workspace. Mutations require `VENDOR_WORKSPACE:OPERATE` and remain retry-safe through idempotency keys.
- Expose a Lite Quick Sale mode inside Vendor Workspace that records through the same active event ID, Route Handler, repository, summaries, and audit trail as `/event-ledger`.
- Keep event start, full activity, adjustment, reversal, close, and reconciliation exclusively in the full Event Ledger; the Lite surface may only summarize and record manual Sales.

## Non-Functional Requirements

### Performance

Recording an entry uses one bounded local transaction and returns the refreshed event snapshot without scanning catalogue or Inventory tables.

### Scalability

Entries and sold-item rows are normalized and indexed by workspace, event, and time. The UI requests a bounded recent ledger while summary queries remain event-scoped.

### Maintainability

Cash-ledger semantics remain separate from Inventory disposition and marketplace evidence. Existing receipt APIs remain backward compatible.

### Reliability

Writes are transactional and idempotent. Failed requests preserve the entered form. Duplicate taps cannot create duplicate entries or receipts.

### Accessibility

Every control has a stable accessible name, visible focus, keyboard operation, non-colour status, and at least a 44px touch target.

### Offline Support

The server remains authoritative. A failed or offline write is not optimistically represented as persisted; the form stays populated for explicit retry.

### Security

Route handlers independently authorize reads and mutations. Repository methods verify event/workspace ownership. No payment credential or customer secret is stored.

### Extensibility

Payment methods, item classification, and later reconciliation may extend the ledger without changing original entry facts.

### Responsiveness

The complete start, entry, activity, adjustment, and close workflow must work at 390px without horizontal scrolling. Desktop may place quick entry beside the live ledger.

## User Stories

- As an event operator, I want to declare opening cash so I always know what the drawer should contain.
- As a seller, I want to enter the amount and what was sold, including several items in one sale, without searching Inventory.
- As a buyer, I want Vendor Workspace purchases to affect the same event ledger without entering them twice.
- As a buyer who makes an incidental Sale, I want to record it without leaving Vendor Workspace or creating a second event record.
- As an owner, I want a closing cash variance and immutable audit trail so discrepancies are visible.
- As an owner, I want to reopen any past Event Ledger report from the ledger itself so older closeouts never become hidden behind a newer event.

## Acceptance Criteria

- A new event cannot start without explicit valid opening cash and currency.
- One Sale can persist multiple manual or event-stock-linked item lines and one total amount without any global Inventory reference or mutation.
- A Cash sale increases expected cash; a Cash purchase decreases it; non-cash entries leave expected cash unchanged.
- An evaluated receipt checkout creates exactly one linked Purchase ledger entry and one Inventory intake, atomically and idempotently.
- A manual-entry reversal preserves the original and restores its cash effect exactly once.
- Closing stores actual cash and displays exact expected/actual variance while preventing further ordinary entries.
- Every returned closed event can be selected from the authorized Event Ledger archive and reopened read-only through an exact workspace-scoped URL.
- The UI is fast, keyboard-accessible, and complete at 390px.
- A Sale recorded through Vendor Workspace Quick Sale updates the same expected-cash/gross-sales summary and appears in the same full Event Ledger as a Sale recorded directly there.
- Vendor Workspace purchase intake remains the default Event station mode and retains its existing receipt/Inventory behavior.
- Repository tests cover calculations, multi-item sale persistence, payment methods, idempotency, linkage, reversal, closing, authorization ownership, and legacy migration.

## Edge Cases

- Zero opening cash is valid; negative opening cash is not.
- Zero-value sales and purchases are rejected.
- Empty or duplicate-looking sold-item descriptions remain separate only when the operator entered separate lines; blank lines are rejected.
- A retry with the same idempotency key returns the original entry.
- An event cannot be closed twice or accept entries after closing.
- A manual line does not decrement event stock or global Inventory even if its description resembles a known product; only an explicit validated `PHR-WORKFLOW-012` option link moves event stock.
- Voiding a linked purchase receipt appends the corresponding cash reversal and preserves both histories.
- Legacy events with unknown opening cash remain historical and are not silently assigned a balance.
- Active, unknown, and foreign-workspace IDs cannot be opened as historical reports and expose no event metadata.

## Dependencies

- `PHR-ARCH-011`
- `PHR-WORKFLOW-008`
- `PHR-WORKFLOW-010`
- `PHR-WORKFLOW-012`
- Existing application-owned SQLite and module authorization

## Future Enhancements

- Optional later reconciliation or allocation to global Inventory without changing the original Sale.
- Configurable quick-item presets and event-specific categories.
- Multi-currency drawers, taxes, payment settlement, and accounting export under separate specifications.

## Technical Notes

Use additive columns on `phronesis_purchase_event` plus normalized ledger-entry and sold-item tables. Store positive transaction amounts and an explicit signed cash effect. Reversal rows refer to the original entry and negate its cash effect. Summaries exclude reversed originals from business totals while retaining both records in activity.

## UI / UX Notes

- Make `/event-ledger` a primary operational destination.
- Keep `Past event reports` visible in the Event Ledger header and open selected closeouts in the same canonical report presentation.
- Present Vendor Workspace event operations as one Event station with default `Purchase intake` and secondary `Quick sale` modes.
- Keep the Lite Quick Sale to current expected cash, gross sales, manual Sale entry, and a link to the full Event Ledger.
- Start view contains only event identity, currency, and opening cash.
- Active view leads with expected cash and a Sale/Purchase segmented control.
- Sale entry always shows one `Item sold` row and an `Add another item` action; quantity defaults to one.
- Payment defaults to Cash. Amount and sold-item descriptions are the only required Sale facts.
- Advanced notes and cash adjustments stay secondary.
- Success returns focus to fast entry and exposes a visible reasoned Undo action.
- The closing surface must call the result `Net cash movement`, never `Profit`.

## Success Metrics

- A one-item cash Sale requires only description, amount, and one Record action.
- Zero sales require Inventory lookup.
- Zero duplicate ledger entries from retry or double tap.
- Expected cash and closing variance reproduce exactly from stored entries.

## Open Questions

- None blocking. Event currency is one currency per event; multi-currency handling is explicitly deferred.

## Traceability

- Origin: Product Owner approval and multi-item Sale amendment, 2026-07-31.
- Related implementation prompt: `docs/prompts/PHR-WORKFLOW-006-event-purchase-ledger-prompt.md`.
- Related database design: `docs/database/PHR-WORKFLOW-006-event-purchase-ledger-schema.md`.
- Related design direction: `docs/design/PHR-WORKFLOW-006-event-cash-ledger.md`.
- Related tests: `tests/event-cash-ledger.test.ts` and existing purchase/inventory tests.
- Related release notes: `docs/release-notes/PHR-WORKFLOW-006-event-cash-ledger.md`.
- Last modified: 2026-07-31.
- Modification reason: Product Owner approved opening-cash, frictionless Sale/Purchase entry, multi-item manual sales, closing reconciliation, a Vendor Workspace Lite Quick Sale, and the additive `PHR-WORKFLOW-012` event-stock option link feeding the same event control.
