# Implementation Prompt — Receipt-Backed Inventory Intake

## Project Context

Project Phronesis is an evidence-driven collectible-market decision platform. Documentation is part of implementation and receipt evidence must remain authoritative.

## Feature ID

`PHR-WORKFLOW-008`

## Objective

Create automatic, audited inventory lots from finalized event-purchase receipts and expose a module-authorized workspace inventory view.

## Required Reading

- `docs/workflows/PHR-WORKFLOW-008-receipt-backed-inventory-intake.md`
- `docs/workflows/PHR-WORKFLOW-006-event-purchase-ledger.md`
- `docs/architecture/PHR-ARCH-011-internal-identity-module-authorization.md`
- Local Next.js 16 server/client, Route Handler, and data-security guides.

## Implementation Requirements

- Add a server-only workspace-scoped inventory repository and additive SQLite schema.
- Atomically create one lot per exact or Bulk receipt line during checkout.
- Reconcile legacy receipts idempotently and propagate receipt voids to lots transactionally.
- Add a read-only authorized inventory API, Inventory page, responsive presentation, and module-aware navigation.
- Update inventory capability status and all documentation/evidence.

## Constraints

- Preserve receipt immutability and unrelated branch work.
- Do not fabricate Bulk item identities or unknown quantities.
- Do not activate authentication, LigaMagic scheduling, public deployment, external transactions, or new dependencies.
- Do not add arbitrary browser-authored inventory intake in this slice.

## Expected Architecture

`PurchaseLedgerRepository` remains checkout orchestration. `InventoryRepository` owns lot schema, mapping, reconciliation, void propagation, and reads. Checkout and void use one SQLite transaction. A read-only route returns a minimal workspace DTO after `INVENTORY:VIEW` authorization. UI consumes that DTO.

## Testing Expectations

- Exact, Bulk, mixed, idempotent, legacy reconciliation, and void propagation tests.
- API authorization and workspace-isolation tests.
- Navigation and responsive component coverage.
- Full supported tests, standalone TypeScript, warning-free lint, production build, and diff checks.

## Documentation Updates

- Feature Registry, Prompt History, Roadmaps, Atlas, release notes, testing evidence, implementation report, review, Current Structure, and Conversation History.

## Acceptance Criteria

- The specification acceptance criteria pass with no critical regression or unresolved data-integrity risk.

## Non-Goals

- Locations, sales/dispositions, grading, repricing, inventory counts, public deployment, or schedule activation.

## Notes For AI Coding Agents

- Preserve unrelated user changes.
- Keep edits scoped to the specification.
- Present improvement suggestions separately from implementation.
