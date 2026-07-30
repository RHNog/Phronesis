# Implementation Prompt — Inventory Location And Count Reconciliation

## Project Context

Phronesis now intakes purchase receipts into audited inventory lots. This increment adds physical organization and count observations while preserving receipt evidence.

## Feature ID

`PHR-WORKFLOW-009`

## Objective

Implement workspace locations and audited, atomic lot move/count reconciliation with a low-friction responsive Inventory workflow.

## Required Reading

- `docs/workflows/PHR-WORKFLOW-009-inventory-location-count-reconciliation.md`
- `docs/workflows/PHR-WORKFLOW-008-receipt-backed-inventory-intake.md`
- `docs/architecture/PHR-ARCH-011-internal-identity-module-authorization.md`
- Local Next.js Route Handler, mutation, and data-security guides.

## Implementation Requirements

- Add additive location/event schema and lot reconciliation columns.
- Preserve receipt quantity, approximate intake, cost basis, and provenance.
- Implement validated workspace location creation and atomic move/count reconciliation.
- Require `INVENTORY:OPERATE` on every mutation and verify lot/location workspace ownership.
- Extend Inventory DTO/UI with locations, on-hand quantity basis, management form, and recent activity.
- Add deterministic repository, authorization-wiring, and UI contract tests.

## Constraints

- No direct receipt mutation, silent quantity overwrite, or implicit disposition.
- No new dependency, authentication activation, external provider, transaction, public deployment, or LigaMagic schedule.
- Preserve unrelated branch state.

## Expected Architecture

`InventoryRepository` is the DAL and transaction owner. `POST /api/inventory` is a thin action switch with fresh authorization and input validation. Client UI receives only the inventory snapshot DTO and refreshes after successful mutation.

## Testing Expectations

- Location uniqueness, move, count, combined atomic mutation, zero count, no-op, invalid count, voided lot, and workspace isolation.
- Route/page authorization contracts.
- Supported full suite, standalone TypeScript, warning-free lint, production build, diff checks, desktop and 390px runtime review.

## Documentation Updates

- Registry, prompts, roadmaps, Atlas, changelog, testing evidence, release notes, Engineer report, conformance review, Structure, and Conversation History.

## Acceptance Criteria

- All specification acceptance criteria pass with no unresolved data-integrity or authorization defect.

## Non-Goals

- Sales, transfers between workspaces, damage/loss disposition, location archiving, barcode scanning, or cost-basis reallocation.

## Notes For AI Coding Agents

- Preserve unrelated user changes.
- Keep edits scoped to the specification.
- Present improvement suggestions separately from implementation.
