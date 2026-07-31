# PHR-UX-015 Engineer Report — Vendor Workspace Quick Sale

Date: 2026-07-31

Status: **IMPLEMENTED — PRODUCT REVIEW PENDING**

## Delivered

- Reframed Vendor Checkout as an Event station with `Purchase intake` and `Quick sale` modes while preserving Purchase intake as the default.
- Added a compact Lite Event Ledger that displays expected cash and gross sales for the active event.
- Added manual multi-item Sale entry with one overall amount, Cash/Card/Transfer/Other payment, optional note, quantities, add/remove rows, and 25-row enforcement.
- Routed Quick Sale through the same authorized `/api/event-ledger`, active event ID, validation, repository, idempotency behavior, summary, and immutable activity used by the full Event Ledger.
- Preserved failed drafts and retry identity, clearing the form only after confirmed persistence.
- Refreshed the shared ledger summary whenever Quick Sale is reopened while keeping the mounted draft intact.
- Kept full event start, activity, adjustment, reversal, correction, close, and reconciliation in `/event-ledger`, linked directly from the Lite panel.
- Projected effective Operate capability into Vendor Workspace while keeping Route Handler authorization authoritative.

## Evidence

Focused 6/6 and full 279/279 tests, standalone TypeScript, warning-free lint, production build, diff hygiene, and private-service health pass. An isolated 390px workflow recorded a two-item $25.50 Cash Sale in Vendor Workspace and proved the same Sale and $125.50 expected drawer in the full Event Ledger. Phone and desktop overflow, 44px targets, mode preservation, and browser console checks pass. See `docs/testing/PHR-UX-015-vendor-workspace-quick-sale-validation.md`.

## Boundaries

The Lite surface does not create events, mutate Inventory, duplicate event persistence, expose full audit controls, process payment, or claim profit. No persistent QA data, external transaction, commit, or push was created.

Subsequent additive extension: `PHR-WORKFLOW-012` replaces duplicate manual-only item editors with one shared exact event-stock picker while preserving this surface's canonical ledger boundary and explicit untracked fallback. It does not mutate global Inventory.
