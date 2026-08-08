# PHR-ARCH-010: Phronesis Product Identity

## Feature ID

`PHR-ARCH-010`

## Title

Phronesis Product Identity and Repository Continuity

## Status

Completed

## 2026-08-07 Brand Boundary Amendment

`PHR-BRAND-001` records **LoreShard** as the intended future public master-brand candidate with **GO WITH CONDITIONS** status pending U.S. and Brazilian counsel clearance. This does not supersede the present-tense identity contract in this architecture record: Phronesis remains the internal codename, active build identity, package/repository identity, application title, and current user-facing name until an independently approved migration plan is executed.

No source, package, app, UI, repository, deployment, environment, domain, or public-asset rename is authorized by the LoreShard decision archive. Public launch remains separately gated.

## Priority

Critical

## Category

Architecture / Product / Technical / Release Notes

## Objective

Make Phronesis the single product and project identity throughout the repository while preserving the application's architecture, Git history, and user data contracts.

## Background

The repository used a legacy company-style name while newer architecture and documentation used Project Phronesis. Maintaining both names creates ambiguity for users, developers, AI agents, package tooling, provider identification, and project memory.

## Problem Statement

The legacy identity remained in UI copy, package metadata, provider user agents, browser-storage keys, documentation, Atlas configuration, and historical summaries.

## Proposed Solution

Use `Phronesis` as the canonical human-readable name and `phronesis-web` as the package name. Replace repository-content references to the legacy identity. Preserve Git history and runtime architecture; the identity migration does not authorize a rewrite.

## Functional Requirements

- User-facing product copy must say Phronesis.
- Package and Atlas metadata must identify Phronesis.
- Provider user agents must identify Phronesis.
- browser-storage namespaces must use Phronesis.
- Current and historical repository documentation must use Phronesis so search produces one canonical identity.
- A case-insensitive repository scan must find no legacy-name occurrences outside Git internals and generated dependencies.

## Non-Functional Requirements

### Maintainability

New documents and code must use the canonical identity.

### Reliability

The migration must not alter business logic, domain boundaries, or Git history.

### Security

The migration must not expose credentials or change provider authorization.

### Extensibility

Product identity must remain independent from provider and collectible-domain abstractions.

## User Stories

- As the product owner, I want one durable identity so that product, repository, and AI collaboration remain coherent.
- As a developer, I want package, UI, provider, and documentation names aligned so that no legacy ambiguity remains.

## Acceptance Criteria

- Repository content contains no case-insensitive legacy-name occurrence.
- The sidebar, README, package metadata, Atlas, provider user agents, and history namespace identify Phronesis.
- Lint, type checking, and relevant tests pass.

## Edge Cases

- The checkout directory and remote repository name may remain external legacy identifiers until they are renamed separately.
- Generated caches and Git history are not rewritten.
- Existing browser history stored under the former namespace is not guaranteed to migrate because the requirement prohibits retaining the former identifier in source.

## Dependencies

- `PHR-TECH-001` Documentation-First Development System.

## Future Enhancements

- Rename the external repository and local checkout after coordinating remotes and active tooling.

## Technical Notes

This is a mechanical identity migration. Do not reinterpret the architecture or introduce a second product brand.

## Success Metrics

- Zero repository-content matches for the retired identity.

## Open Questions

- Whether the external Git host repository and local checkout directory should be renamed in a separately coordinated operation.
- Which Phronesis identifiers should remain permanently internal if the LoreShard public migration is approved.

## Traceability

- Originating work order: CTO resumption and upkeep request, 2026-07-22.
- Related implementation prompt: `docs/prompts/PHR-ARCH-010-implementation-prompt.md`.
- Related tests: `docs/testing/PHR-ARCH-010-product-identity-validation.md`.
- Related release notes: `docs/release-notes/PHR-ARCH-010.md`.
- Last modified: 2026-08-07.
- Modification reason: Preserve Phronesis as the active technical identity while recording LoreShard as a confidential, counsel-gated future public-brand candidate.
