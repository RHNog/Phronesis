# PHR-UX-015 Engineer Work Order — Vendor Workspace Quick Sale

## Project Context

Phronesis operates one active Event Cash Ledger per workspace. Vendor Workspace already sends evaluated purchase receipts into that ledger. `PHR-UX-015` adds a compact buyer-side Sale entry surface without introducing another ledger or weakening the full Event Ledger’s control ownership.

## Feature ID

`PHR-UX-015`

## Objective

Add an in-place Quick Sale mode to Vendor Workspace that records manual Sales into the canonical active Event Ledger and updates its returned cash summary immediately.

## Required Reading

- `docs/ux/PHR-UX-015-vendor-workspace-quick-sale.md`
- `docs/workflows/PHR-WORKFLOW-006-event-purchase-ledger.md`
- `docs/design/PHR-WORKFLOW-006-event-cash-ledger.md`
- `app/api/event-ledger/route.ts`
- `features/events/EventLedgerWorkspace.tsx`
- `features/vendor/components/VendorCheckout.tsx`

## Implementation Requirements

- Present Purchase intake and Quick sale as two modes of the Vendor Workspace Event station.
- Keep purchase mode as the initial state and preserve all existing purchase behavior.
- Build a Lite Sale component that reads and writes only through `/api/event-ledger`.
- Use the active event ID, canonical Sale draft shape, payment methods, multi-item constraints, and retry-stable idempotency.
- Show expected cash and gross sales from the returned canonical snapshot.
- Clear and refocus only after success; retain the complete draft after failure.
- Keep full control functions in `/event-ledger` and link there explicitly.
- Pass effective Operate access through Vendor page composition for presentation while preserving API authorization.

## Constraints

- No second repository, endpoint, cash calculation, event record, Inventory mutation, event-start form, reversal, adjustment, close, or activity implementation in Vendor Workspace.
- No change to purchase receipt/Inventory atomicity.
- No optimistic persistence, new dependency, external transaction, or public deployment.

## Expected Architecture

`VendorPage -> SnapshotVendorWorkspace -> VendorCheckout/Event station -> VendorEventSalePanel -> /api/event-ledger -> PurchaseLedgerRepository`.

The full Event Ledger follows the same Route Handler and repository. The two surfaces share persistence and summaries, not duplicated client state.

## Testing Expectations

- Extend source/integration coverage proving the Vendor Lite surface uses `record-sale` on `/api/event-ledger` with the active event.
- Preserve repository tests for multi-item, cash/non-cash totals, idempotency, Inventory separation, and authorization.
- Run focused and full tests, TypeScript, lint, production build, and diff checks.
- Review Purchase intake and Quick Sale at desktop and 390px, including live persistence into the full Event Ledger, touch targets, overflow, and console.

## Documentation Updates

- Update `PHR-WORKFLOW-006`, Designer direction, Feature Registry, Atlas, Roadmap, Decisions, Sprint/Prompt history, release notes, implementation/validation/conformance records, handoff, and conversation memory.

## Acceptance Criteria

- All `PHR-UX-015` acceptance criteria pass without regression to purchase intake or the full Event Ledger.

## Non-Goals

- New event control functions, Inventory reconciliation, customer records, payment processing, settlement, tax, accounting, cross-device live synchronization, or public release.

## Notes For AI Coding Agents

- Preserve the uncommitted Event Cash Ledger and responsive-navigation worktree.
- Keep edits inside the approved Event station and shared documentation boundary.
- Same-session conformance is not independent Product Owner acceptance.
