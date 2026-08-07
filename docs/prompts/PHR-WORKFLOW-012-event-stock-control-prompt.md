# Implementation Prompt — PHR-WORKFLOW-012 Event Stock Control

## Project Context

Project Phronesis runs local, authorized Event Ledger and Inventory workflows on Next.js 16.2.12 with SQLite. Documentation is implementation and the existing dirty worktree contains Product Review candidates that must be preserved.

## Feature ID

`PHR-WORKFLOW-012`

## Objective

Implement Google-Sheet-sourced event stock ingestion, authorized collaborative Case Source preparation before event opening, inventory-backed Sale selection across both Event Ledger surfaces, atomic quantity movement/reversal, physical counts, and sold/leftover reports.

## Required Reading

- `docs/workflows/PHR-WORKFLOW-012-event-stock-control.md`
- `docs/database/PHR-WORKFLOW-012-event-stock-schema.md`
- `docs/workflows/PHR-WORKFLOW-006-event-purchase-ledger.md`
- `docs/ux/PHR-UX-015-vendor-workspace-quick-sale.md`
- `docs/workflows/PHR-WORKFLOW-010-inventory-disposition-ledger.md`
- Local Next.js Route Handler, data-security, and Server/Client Component guides.

## Implementation Requirements

- Add strict five-column CSV parsing and deterministic validation.
- Add server-only event-stock repository and additive schema.
- Add an authorized `/api/event-inventory` read/import/count/report boundary.
- Link optional stock identities to Sale items and apply Sale/reversal movements atomically in `PurchaseLedgerRepository`.
- Add one reusable stock selector to both Sale surfaces while preserving manual/untracked lines.
- Add full-ledger import, summary, reconciliation, and report controls.
- Preserve current Event Ledger cash semantics, Inventory evidence, and Quick Sale behavior.
- Move the Case Source Sheet address from client-public configuration to a validated server-only configuration getter with a bounded legacy fallback.
- Expose Case Source preparation before an event to `INVENTORY:OPERATE` or stronger members and never disclose the external URL to a viewer.
- Add a `Case preparation only` assignment preset plus an exact-email eligible-editor roster under People & access.
- Preserve Google as a second, native per-email Editor boundary. Do not enable anonymous or public link editing and do not imply that a Phronesis entitlement automatically changes Drive permissions.

## Constraints

- No live Google dependency during an event.
- No credential storage, Google OAuth, public Sheet, external transaction, payment processing, destructive migration, or new dependency.
- No automatic Google Drive permission mutation without a separately approved owner credential boundary.
- Do not allocate whole-Sale actual amount across items.
- Do not convert physical-count variance into an inferred Sale, Loss, or correction.

## Expected Architecture

Server-only Case Source configuration → `INVENTORY:OPERATE` disclosure → explicit-user Google Editor permission → native Google Sheet → versioned CSV → authorized Route Handler → strict parser → local event-stock repository. Both Sale clients select a stock DTO and submit its ID to the existing `record-sale` action. The Purchase Ledger transaction owns the Event Ledger entry and delegates append-only stock movements over the same database connection. Reports derive from immutable imports, Sale items, movements, and latest count observations.

## Testing Expectations

- Parser, import, idempotency, pre-sale supersession, post-sale lock, search, multi-item Sale, oversell rollback, retry, reversal, manual fallback, count, report, legacy, authorization, and source-contract tests.
- Server-only URL validation, Inventory Operate disclosure, viewer non-disclosure, Case preparation preset, eligible-editor roster, and no-public-sharing assertions.
- Full tests, TypeScript, lint, build, diff hygiene, private health, desktop and 390px live review.

## Documentation Updates

- Feature Registry, Atlas, Decisions, Roadmap, Sprint History, Changelog, Agent Handoff, conversation memory, implementation report, validation, conformance, release notes, and related Event Ledger/Inventory specifications.

## Acceptance Criteria

- All acceptance criteria in `PHR-WORKFLOW-012` pass with isolated live evidence and no persistent QA mutation.
- Native Drive metadata verifies explicit-user sharing only; no future editor is granted until that person has an approved active Phronesis membership and exact eligible email.

## Non-Goals

- Authenticated live Google Sheets synchronization, automatic Drive ACL mutation, global Inventory allocation, barcode/OCR, accounting, settlement, or public deployment.

## Notes For AI Coding Agents

- Preserve unrelated worktree changes.
- Keep the Sheet snapshot immutable once consumed.
- Treat untracked Sales and count variance as explicit review evidence.
