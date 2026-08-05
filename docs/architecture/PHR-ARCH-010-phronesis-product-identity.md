# PHR-ARCH-010: Phronesis Product Identity

## Feature ID

`PHR-ARCH-010`

## Title

Phronesis Product Identity and Repository Continuity

## Status

Completed — Dedicated Application Icon

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
- The approved July 2026 raster logo must be recovered into one stable repository asset path with its source provenance and hash recorded.
- The application shell and mobile navigation must use that canonical asset without removing the readable Phronesis wordmark.
- Browser and iOS app-icon metadata must resolve from the Product Owner-supplied dedicated application mark rather than the full wordmark or a generic framework favicon.
- The full recovered Phronesis logo remains the canonical readable navigation identity; the dedicated application mark must not silently replace it in the shell.

## Non-Functional Requirements

### Maintainability

New documents and code must use the canonical identity.

### Reliability

The migration must not alter business logic, domain boundaries, or Git history.

The original full-logo raster bytes must be preserved exactly. The dedicated application-icon source must retain the Product Owner-supplied composition and may only be deterministically converted or resized for platform metadata assets.

### Security

The migration must not expose credentials or change provider authorization.

Recovered assets must come from local Product Owner material or repository history, not an unverified network result.

### Extensibility

Product identity must remain independent from provider and collectible-domain abstractions.

## User Stories

- As the product owner, I want one durable identity so that product, repository, and AI collaboration remain coherent.
- As a developer, I want package, UI, provider, and documentation names aligned so that no legacy ambiguity remains.

## Acceptance Criteria

- Repository content contains no case-insensitive legacy-name occurrence.
- The sidebar, README, package metadata, Atlas, provider user agents, and history namespace identify Phronesis.
- Lint, type checking, and relevant tests pass.
- The canonical full-logo asset retains SHA-256 `29062e6fb7657458e17f594290380e50670431c0116824393b922a460ca54984`.
- Desktop sidebar and mobile navigation trigger/drawer continue using the readable full-logo identity.
- A canonical repository PNG derived from the supplied 1254×1254 JPEG application mark records the source provenance and SHA-256.
- Next.js emits a 512×512 browser application icon, a 180×180 Apple touch icon, and a real 32×32 root `favicon.ico` from that dedicated mark.
- Browser metadata identifies the icon formats and intrinsic sizes, and the production routes return the intended image bytes.

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

The recovered full-logo source is the Product Owner's `/Users/ramonnogueira/Downloads/Phronesis Logo.png`, created 2026-07-09, 1254×1254 PNG without alpha. The dedicated app-icon source is the Product Owner attachment supplied on 2026-08-05, a 1254×1254 JPEG with SHA-256 `e0373e63b8d8e0b7e68f23742e2c9397396db353c4a8f53fc0d28019e55656d9`. Store a deterministic canonical PNG under `public/brand/` and purpose-sized static metadata files under `app/`, following the installed Next.js icon conventions.

## Success Metrics

- Zero repository-content matches for the retired identity.

## Open Questions

- Whether the external Git host repository and local checkout directory should be renamed in a separately coordinated operation.

## Traceability

- Originating work order: CTO resumption and upkeep request, 2026-07-22.
- Related implementation prompt: `docs/prompts/PHR-ARCH-010-implementation-prompt.md`.
- Related tests: `docs/testing/PHR-ARCH-010-product-identity-validation.md`.
- Related release notes: `docs/release-notes/PHR-ARCH-010.md`.
- Last modified: 2026-08-05.
- Modification reason: Adopt the Product Owner-supplied dedicated mark as the browser favicon and iOS application icon while preserving the full logo in navigation.
