# PHR-WORKFLOW-006 Engineer Work Order

## Feature ID

`PHR-WORKFLOW-006`

## Objective

Add an authorized, persistent event cart and append-only purchase ledger with exact-product and Bulk lines.

## Required Reading

- `docs/workflows/PHR-WORKFLOW-006-event-purchase-ledger.md`
- `docs/architecture/PHR-ARCH-011-internal-identity-module-authorization.md`
- `docs/ux/PHR-UX-011-offer-first-buying-decision.md`
- Local Next.js route-handler, server/client, and forms guides.

## Implementation Requirements

- Add application-owned ledger tables and repository boundaries.
- Persist one active cart per workspace/operator/event and finalize idempotent immutable receipts.
- Add exact selected products and mixed supported-game Bulk lines.
- Require actual paid price; retain decision-time recommendation and evidence reference.
- Enforce Vendor Workspace operation permission and audit corrections/voids.

## Constraints

- No payment processing, inventory auto-intake, accounting export, seller CRM, or Riftbound.

## Testing Expectations

- Repository, authorization, API, cart, finalization, idempotency, Bulk, and responsive workflow tests.

## Documentation Updates

- Database/architecture notes, shared validation, release note, report, conformance, registry, roadmap, and memory.

## Acceptance Criteria

- The specification acceptance criteria pass.
