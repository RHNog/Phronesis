# Event Cash Ledger Validation

Date: 2026-07-31
Feature: `PHR-WORKFLOW-006`
Verdict: **PASS — PRODUCT REVIEW PENDING**

## Ledger Integrity

- A $100.00 opening drawer plus active Cash Sale, Card Sale, Cash Purchase, Transfer Purchase, and Cash Out adjustment reproduced the exact expected-cash and all-channel totals.
- One Sale persisted two distinct sold-item rows under one overall amount; a same-key retry returned the original entry without duplicating items.
- Manual Sales and Purchases created zero Inventory lots.
- Reasoned reversal retained the original, restored its cash effect exactly once, and rejected a second reversal.
- A foreign workspace could not mutate the event.
- Closing stored expected cash, physical count, and exact variance, rejected ordinary post-close entry, and allowed an idempotent same-count retry.
- Legacy events migrated additively with null currency/opening evidence and no invented expected cash.

## Receipt And Inventory Integration

- Exact/Bulk checkout creates one immutable receipt, Inventory intake, and linked ledger Purchase in one transaction.
- Checkout retry returns the same receipt and does not duplicate Inventory or ledger evidence.
- Receipt void deactivates Inventory and appends one linked ledger reversal.
- A post-close administrative receipt void updates active ledger truth without rewriting the stored close-time expected cash or variance.

## Authorization And Presentation

- `/api/event-ledger` requires `VENDOR_WORKSPACE:VIEW` for reads and `VENDOR_WORKSPACE:OPERATE` for mutation.
- `/event-ledger` is entitlement-filtered primary navigation and preserves view-only presentation.
- `PHR-UX-015` adds a Lite Quick Sale surface inside Vendor Workspace that uses the same active event ID, Route Handler, domain validation, repository, idempotency, summary, and activity as `/event-ledger`.
- An isolated $100.00 opening drawer plus two-item $25.50 Vendor Quick Sale reproduced $125.50 expected cash and the same Sale/items in the full Event Ledger. Purchase intake remained the default and no Inventory mutation occurred.
- The original workflow review exposed a shared-shell defect: the desktop sidebar disappeared below `md` without a phone replacement. `PHR-UX-014` now exposes the complete permission-filtered Phronesis navigation from the phone header, and all six live destinations were rechecked at 390px.
- Live 390px review completed event start, a two-item $125.50 Cash Sale, a $25.00 Card Purchase, and a $624.50 close against $625.50 expected cash.
- The Card Purchase changed Purchase Spend and Net Cash Movement without changing expected drawer cash.
- The closed view reported `Short` and `-$1.00`; its expected value remained visible.
- Measured content width equalled viewport content width with no horizontal overflow; all Event Ledger inputs/buttons/selects measured at least 44px high.
- Desktop review at 1440px showed primary navigation, full-width closed activity, close reconciliation, and next-event setup without dead layout space.
- Browser console inspection returned zero warnings or errors. Disposable local QA records were removed after review; no user data or external transaction was created.

## Deterministic Verification

- Full suite after Vendor Quick Sale integration: 279/279 passed.
- Standalone TypeScript: zero diagnostics.
- ESLint: zero warnings/errors.
- Next.js 16.2.12 production build: passed with `/event-ledger` and `/api/event-ledger` routes.
- Private loopback service: HTTP 200; tailnet mapping healthy.
- `git diff --check`: passed.

## Negative-Effect Declaration

No payment processing, tax, settlement, accounting export, customer CRM, public deployment, automatic manual-sale Inventory mutation, external transaction, new dependency, destructive schema migration, force push, or history rewrite was introduced.

## 2026-08-06 Consignment Ownership Revision

- Repository coverage proves atomic event/roster creation, case-insensitive duplicate-name denial, immutable roster retrieval, house-owned defaults, and rejection of foreign-event or foreign-workspace owner IDs.
- Full Event Ledger and Vendor Workspace Quick Sale coverage prove owner IDs reach the same canonical Sale repository path.
- Event Stock and Display Case coverage prove tracked item canonicalization preserves the selected owner rather than silently falling back to house inventory.
- Historical snapshot coverage proves the owner name remains visible after closing and reopening a report; legacy events expose an empty roster without invented owner data.
- Isolated 390×844 browser validation added `Ana Collection · Booth B12`, opened the event, selected that owner on `Consigned test card`, recorded a $10.00 Cash Sale, closed balanced at $10.00, and reopened the archive. Both active and closed activity displayed `Ana Collection`.
- The live pre-existing active event correctly remains `House inventory only`, because its roster was fixed before this revision; no live ledger evidence was mutated during validation.
- Full supported repository suite: 441/441 pass.
- TypeScript, warning-free lint, Next.js 16.2.12 production build, `git diff --check`, private HTTP 200, desktop/phone no-overflow checks, and zero browser-console errors pass.
- Online live-database backup and `PRAGMA integrity_check` passed before the additive migration; the resulting table/column are present and the existing event has zero invented owner rows.
