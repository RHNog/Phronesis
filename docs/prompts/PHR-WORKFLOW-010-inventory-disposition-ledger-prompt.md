# PHR-WORKFLOW-010 Inventory Disposition Ledger — Engineer Prompt

## Project Context

Project Phronesis is the internal engineering initiative responsible for evidence-driven collectible-market operations. Documentation is part of implementation.

## Feature ID

`PHR-WORKFLOW-010`

## Objective

Implement an authorized, lot-specific disposition ledger that explains and atomically applies inventory leaving Phronesis while preserving intake and count evidence.

## Required Reading

- `docs/workflows/PHR-WORKFLOW-010-inventory-disposition-ledger.md`
- `docs/workflows/PHR-WORKFLOW-009-inventory-location-count-reconciliation.md`
- `docs/workflows/PHR-WORKFLOW-008-receipt-backed-inventory-intake.md`
- `docs/architecture/PHR-ARCH-011-internal-identity-module-authorization.md`
- Next.js 16 local Route Handler and data-security guides.

## Implementation Requirements

- Add an append-only, workspace-scoped disposition record for sale, loss, damage, transfer out, and correction.
- Materialize current operational quantity without altering receipt quantity, approximate intake, acquisition cost, prior count, or provenance.
- Validate classification-specific evidence, known/available quantity, active lot, workspace ownership, and a mandatory reason inside the repository.
- Make creation idempotent and creation/reversal atomic.
- Preserve reversed records, restore quantity, and reject ambiguous reversal after a later count.
- Extend safe inventory DTOs and summaries with disposition evidence.
- Add operator-only disposition/reversal controls and a viewable recent ledger to Inventory.

## Constraints

- No marketplace transaction, payment capture, accounting recognition, listing workflow, public deployment, authentication activation, new dependency, or destructive migration.
- Do not infer fees, taxes, profit, customer identity, or cost allocation.
- Do not delete or rewrite acquisition, reconciliation, or disposition evidence.
- Preserve unrelated working-tree state.

## Expected Architecture

The existing inventory DAL owns schema migration, validation, materialized quantity, idempotency, and transactions. `/api/inventory` remains a thin authenticated Route Handler. The client consumes minimal DTOs and never supplies workspace or actor authority.

## Testing Expectations

- Deterministic repository tests for all types, partial/zero depletion, idempotency, reversal, later-count rejection, insufficient/unknown quantity, invalid evidence, voided lots, and workspace isolation.
- Static authorization and accessible UI contract tests.
- Full supported suite, standalone TypeScript, lint, production build, and diff checks.
- Private desktop and 390px browser review with console and overflow checks.

## Documentation Updates

- Feature Registry, Prompt History, Atlas, Product and Engineering Roadmaps.
- Validation record, implementation report, conformance review, release note, changelog, Current Structure, and Conversation History.

## Acceptance Criteria

The specification acceptance criteria pass with reproducible evidence and private runtime verification.

## Non-Goals

- Margin accounting, settlement, payment methods, customer management, returns, receipt generation, external marketplace synchronization, or listing readiness.

## Notes For AI Coding Agents

- Preserve unrelated changes.
- Keep financial labels exact: gross recorded proceeds are not profit or settled revenue.
- Return to Chief Architect conformance review automatically after implementation.
