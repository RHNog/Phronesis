# PHR-UX-020 Implementation Report

## Outcome

Every unsubmitted Vendor Workspace cart line remains editable in place, and an event buyer can now clear the complete owned draft or attach one private purchase photo before checkout.

## Implementation

- Added a dedicated update validator for positive purchase value plus exact quantity or optional Bulk approximate count.
- Added an owner-scoped active-event repository update that preserves every identity and market-evidence field and rewrites only the existing cart payload.
- Added the authorized `update-line` action to the canonical purchase route.
- Added inline Unit purchase price/Purchase quantity editors for exact products and Bulk total paid/Approximate count editors for Bulk.
- Added per-line Save changes, prominent Remove item, dirty-state feedback, checkout protection, and pending Case-quantity clamping.
- Added an active-event/operator-scoped `Clear cart` transaction with count-specific confirmation, cancellation, audit evidence, and local dirty/Case-state reset only after success.
- Added one optional private JPEG, PNG, WebP, GIF, or AVIF image per exact or Bulk line, capped at 8 MB and validated from its byte signature rather than its filename.
- Added an application-owned private object store with opaque UUIDs, SHA-256 integrity metadata, atomic writes, bounded deletion, and an optional `PHRONESIS_PURCHASE_EVIDENCE_PATH` override.
- Added authorized upload, retrieval, replacement, and removal methods. Draft deletion retires its object; checkout copies metadata into the immutable receipt line so authorized receipt evidence remains available.
- Corrected the intake placement after Product Owner review: the open Bulk form now exposes its optional picture picker and preview before `Add Bulk`. Submission creates one line, attaches the selected file to that returned line, and reports a photo-only failure without duplicating the purchase.

## Evidence

- Focused tests pass 19/19; full suite passes 472/472.
- TypeScript, warning-free ESLint, diff hygiene, production build, private runtime health, 390×844 no-overflow/44px checks, pre-add Bulk selection through saved-line preview, cancel/confirm clearing, object retirement, and clean browser-console checks pass.

## Scope Boundaries

No schema migration, receipt editing, identity change, ledger correction, Inventory mutation, payment change, external transaction, dependency, or public deployment was introduced. Photo metadata uses existing cart/receipt JSON; image bytes remain outside the database and public asset tree.
