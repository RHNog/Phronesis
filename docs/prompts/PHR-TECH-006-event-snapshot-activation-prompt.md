# PHR-TECH-006 Implementation Prompt

## Objective

Activate the July 29 catalogue snapshot and make future verified Pricing Update Tool receipts durable through the August 1 event.

## Required Reading

- `docs/technical/PHR-TECH-006-event-snapshot-activation.md`
- `docs/workflows/PHR-WORKFLOW-004-snapshot-powered-vendor-workspace.md`
- `lib/pricing/tcgplayerObserver.ts`
- `lib/pricing/tcgplayerCatalog.ts`

## Implementation Requirements

- Preserve the already imported July 29 live review data and source archives.
- Archive each completed upstream CSV before import and verify the copied hash.
- Normalize the observed composite Magic export by configured Product Line without accepting unknown lines.
- Keep archive/import behavior idempotent and transactional.
- Add focused tests for composite filtering, unknown-line rejection, archive hashing, and repeated receipts.

## Constraints

- Read-only access to the adjacent Pricing Update Tool.
- No upstream edits, schedule changes, credential access, marketplace run, price publication, inventory mutation, commit, push, deployment, or destructive cleanup.
- Preserve unrelated working-tree changes.

## Acceptance

Return exact files, snapshot counts/times/hashes, commands, verification results, remaining failures, and negative-effect declarations to Chief Architect review.
