# PHR-WORKFLOW-006 — Event Cash Ledger Engineer Work Order

## Project Context

Project Phronesis is the internal evidence-driven operating system for collectible-market decisions. Documentation is part of implementation. This work revises the accepted Event Purchase Ledger without weakening its receipt or Inventory evidence.

## Feature ID

`PHR-WORKFLOW-006`

## Objective

Implement the approved single-currency Event Cash Ledger with opening cash, frictionless manual Sale/Purchase entry, multi-item manual sales, receipt-linked purchases, audited reversal, and closing cash variance.

## Required Reading

- `docs/workflows/PHR-WORKFLOW-006-event-purchase-ledger.md`
- `docs/database/PHR-WORKFLOW-006-event-purchase-ledger-schema.md`
- `docs/design/PHR-WORKFLOW-006-event-cash-ledger.md`
- `docs/workflows/PHR-WORKFLOW-008-receipt-backed-inventory-intake.md`
- `docs/workflows/PHR-WORKFLOW-010-inventory-disposition-ledger.md`
- Local Next.js Route Handler, server/client component, form, and data-security guides.

## Implementation Requirements

- Add only additive SQLite migration and preserve all existing receipt/inventory evidence.
- Extend the purchase/event domain with event currency, opening/closing cash, payment method, ledger entry, sold-item, summary, and snapshot types plus strict validators.
- Add repository operations for start, snapshot, multi-item Sale, manual Purchase, Cash Adjustment, reasoned reversal, and close.
- Make entry and close mutations workspace-owned, idempotent where retry can occur, and transactional.
- Extend receipt checkout with payment method and atomically create one linked Purchase ledger entry; reverse it when an administrator voids the receipt.
- Add `/api/event-ledger` with independent read/mutation authorization and bounded DTOs.
- Add a dedicated `/event-ledger` page and primary navigation destination.
- Implement a 390px-complete workspace with fast Sale/Purchase switching, one required sold-item row, add/remove item rows, Cash default, activity, adjustments, and close reconciliation.
- Keep manual Sale independent from Inventory and never call cash movement profit.
- Replace embedded event creation in Vendor Checkout with the canonical Event Ledger start path while preserving exact/Bulk purchase workflows.

## Constraints

- No payment processing, tax calculation, settlement, accounting export, customer CRM, or public deployment.
- No automatic Inventory decrement or fabricated Inventory identity for manual Sales.
- No destructive migration or rewriting of existing receipts.
- Do not weaken authorization, workspace ownership, idempotency, receipt immutability, or Inventory intake.
- Preserve unrelated worktree changes and operational databases.

## Expected Architecture

Client components call authorized Next.js Route Handlers. Route Handlers validate untrusted input and delegate to the server-only repository. SQLite remains authoritative. The existing purchase repository retains receipt compatibility and coordinates ledger linkage in the same transaction; the Event Ledger surface consumes only bounded domain DTOs.

## Testing Expectations

- Domain validation for currency, payment method, amounts, sold-item cardinality/descriptions/quantities, and cash calculations.
- Repository tests for multi-item sales, non-cash behavior, manual purchases, adjustments, idempotency, reversal, close lock, and legacy migration.
- Integration tests for atomic purchase receipt/Inventory/ledger linkage and receipt-void reversal.
- Authorization and UI contract tests, including primary navigation and no Inventory dependency for manual sales.
- Full test suite, standalone TypeScript, warning-free lint, production build, diff hygiene, desktop review, and 390px no-overflow review.

## Documentation Updates

- Workflow, database, Atlas, Registry, Roadmap, Current CTO Structure, conversation history, validation, implementation report, conformance review, and release notes.

## Acceptance Criteria

- Every criterion in `docs/workflows/PHR-WORKFLOW-006-event-purchase-ledger.md` passes with reproducible evidence.

## Non-Goals

- Multi-currency events, profit calculation, payment settlement, external transaction submission, automatic sale-to-Inventory reconciliation, or accounting recognition.

## Notes For AI Coding Agents

- Preserve unrelated user changes.
- Keep edits scoped to this approved revision.
- Present future improvement ideas separately.
