# Implementation Prompt — PHR-UX-020 Editable Purchase Cart

## Project Context

Project Phronesis is the internal evidence-driven decision operating system for collectible-card event operations. Documentation is part of implementation.

## Feature ID

`PHR-UX-020`

## Objective

Extend the secure editable Vendor Workspace purchase cart with a guarded full-cart clear action and one durable private purchase photo per exact or Bulk line without weakening receipt, inventory, or authorization integrity.

## Required Reading

- `docs/ux/PHR-UX-020-editable-purchase-cart.md`
- `docs/workflows/PHR-WORKFLOW-006-event-purchase-ledger.md`
- `features/vendor/components/VendorCheckout.tsx`
- `lib/purchases/domain.ts`
- `lib/purchases/PurchaseLedgerRepository.ts`
- `app/api/purchases/route.ts`
- `app/api/purchases/evidence/route.ts`
- `lib/purchases/PurchaseEvidenceStore.ts`
- `node_modules/next/dist/docs/01-app/02-guides/forms.md`
- `node_modules/next/dist/docs/01-app/01-getting-started/15-route-handlers.md`
- `node_modules/next/dist/docs/01-app/01-getting-started/12-images.md`
- `node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md`

## Implementation Requirements

- Add a dedicated cart-line update validator and owner-scoped active-event repository mutation.
- Expose the mutation through the existing authorized purchase route.
- Preserve immutable identity/evidence fields while updating only price and quantity/count.
- Render labelled inline editors with per-line Save and Remove controls.
- Prevent checkout with unsaved editor changes and clamp pending Case quantity after a saved reduction.
- Add an owner- and active-event-scoped repository clear operation plus an existing-route `clear-cart` action. Return the deleted line count and audit the bounded mutation.
- Require an inline, cancelable confirmation before clearing and reset local dirty/Case/photo state only after server success.
- Add a private raster object store with an 8 MB maximum, exact file-signature validation, SHA-256 metadata, atomic writes, opaque identifiers, and bounded deletion.
- Add authorized upload, retrieval, replacement, and removal route methods. Bind each operation to one exact cart line; retrieval may continue from the immutable workspace-owned receipt reference after checkout.
- Store only bounded attachment metadata in cart/receipt JSON. Do not expose local paths or inline base64 data.
- Render a responsive image preview and a phone-friendly `Take or upload photo` control on every cart line, emphasizing Bulk evidence without restricting exact lines.

## Constraints

- Do not edit submitted receipts or create another cart store. Checkout may copy the already-attached immutable photo reference with its source line.
- Do not change purchase calculations beyond using the persisted corrected value/quantity.
- Do not change identity, condition, evidence, payment, ledger, Inventory, Display Case, or authorization ownership.
- Do not use public/static asset paths, client-supplied filenames, SVG, or remote object storage.
- Do not add dependencies or publicly deploy. Commit and push the completed bounded task under the Product Owner's standing delivery instruction.

## Testing Expectations

- Repository tests for exact and Bulk updates, totals, persistence, invalid input, and owner isolation.
- Repository/store tests for scoped clear, foreign-operator isolation, photo validation, replacement/removal, receipt persistence, and private retrieval authorization.
- Route/UI structure tests for the authorized clear and evidence actions, confirmation, labelled upload/preview, Save, Remove, and unsaved-change guard.
- Full tests, TypeScript, warning-free lint, production build, diff hygiene, and live desktop/390px review.

## Documentation Updates

- Feature specification, validation record, implementation report, conformance review, release note, Feature Registry, Atlas, Roadmap, Prompt History, Project State, Agent Handoff, Current CTO Structure, and Conversation History.

## Acceptance Criteria

- Every criterion in `PHR-UX-020` passes with reproducible evidence.

## Non-Goals

- Post-checkout editing, multiple images per line, OCR/bulk recognition, receipt void workflow changes, identity editing, or external publication.
