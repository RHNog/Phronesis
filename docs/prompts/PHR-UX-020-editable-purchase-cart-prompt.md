# Implementation Prompt — PHR-UX-020 Editable Purchase Cart

## Project Context

Project Phronesis is the internal evidence-driven decision operating system for collectible-card event operations. Documentation is part of implementation.

## Feature ID

`PHR-UX-020`

## Objective

Add secure inline value/quantity correction and visible removal to each unsubmitted Vendor Workspace purchase-cart line without weakening receipt or inventory integrity.

## Required Reading

- `docs/ux/PHR-UX-020-editable-purchase-cart.md`
- `docs/workflows/PHR-WORKFLOW-006-event-purchase-ledger.md`
- `features/vendor/components/VendorCheckout.tsx`
- `lib/purchases/domain.ts`
- `lib/purchases/PurchaseLedgerRepository.ts`
- `app/api/purchases/route.ts`
- `node_modules/next/dist/docs/01-app/02-guides/forms.md`
- `node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md`

## Implementation Requirements

- Add a dedicated cart-line update validator and owner-scoped active-event repository mutation.
- Expose the mutation through the existing authorized purchase route.
- Preserve immutable identity/evidence fields while updating only price and quantity/count.
- Render labelled inline editors with per-line Save and Remove controls.
- Prevent checkout with unsaved editor changes and clamp pending Case quantity after a saved reduction.

## Constraints

- Do not edit receipts or create another cart store.
- Do not change purchase calculations beyond using the persisted corrected value/quantity.
- Do not change identity, condition, evidence, payment, ledger, Inventory, Display Case, or authorization ownership.
- Do not add dependencies, deploy publicly, commit, or push.

## Testing Expectations

- Repository tests for exact and Bulk updates, totals, persistence, invalid input, and owner isolation.
- Route/UI structure tests for the authorized update action, labelled editors, Save, Remove, and unsaved-change guard.
- Full tests, TypeScript, warning-free lint, production build, diff hygiene, and live desktop/390px review.

## Documentation Updates

- Feature specification, validation record, implementation report, conformance review, release note, Feature Registry, Atlas, Roadmap, Prompt History, Project State, Agent Handoff, Current CTO Structure, and Conversation History.

## Acceptance Criteria

- Every criterion in `PHR-UX-020` passes with reproducible evidence.

## Non-Goals

- Post-checkout editing, receipt void workflow changes, identity editing, or external publication.
