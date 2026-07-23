# PHR-ARCH-010 Implementation Prompt

## Project Context

Phronesis is an evidence-driven decision intelligence platform for collectible markets. Documentation is part of implementation.

## Feature ID

`PHR-ARCH-010`

## Objective

Replace the retired repository identity with Phronesis without changing domain behavior or rewriting history.

## Required Reading

- `docs/architecture/PHR-ARCH-010-phronesis-product-identity.md`
- `docs/DOCUMENTATION_FIRST_DEVELOPMENT.md`
- Relevant local Next.js documentation under `node_modules/next/dist/docs/`

## Implementation Requirements

- Update UI, package metadata, provider user agents, browser storage, Atlas, and documentation.
- Verify a case-insensitive content search has no retired-name matches.
- Preserve unrelated changes and application behavior.

## Constraints

- Do not rewrite Git history, rename external remotes, or rebuild architecture.
- Do not modify generated dependency content.

## Testing Expectations

- Run lint, type checking, relevant tests, and the identity scan.

## Documentation Updates

- Feature Registry, Decisions, Atlas, handoff, release note, validation record, changelog, and conversation ledger.

## Acceptance Criteria

- All criteria in `PHR-ARCH-010` pass.

## Non-Goals

- Commercial repositioning or architecture redesign.
