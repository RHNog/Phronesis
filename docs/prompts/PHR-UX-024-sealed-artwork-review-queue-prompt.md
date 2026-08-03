# PHR-UX-024 Implementation Prompt

## Project Context

Project Phronesis is an evidence-driven collectible-market operating system. Documentation is part of implementation. Follow `docs/ux/PHR-UX-024-sealed-artwork-review-queue.md` before changing code.

## Feature ID

`PHR-UX-024`

## Objective

Implement a conservative Phronesis-assisted Pokémon sealed artwork recovery pass plus an owner-governed local exception queue. Convert only evidence-backed candidates into explicitly labelled and reversible representative artwork decisions.

## Required Reading

- `docs/ux/PHR-UX-024-sealed-artwork-review-queue.md`
- `docs/api/PHR-API-004-product-artwork-coverage.md`
- `docs/technical/PHR-TECH-007-durable-artwork-cache.md`
- `docs/ux/PHR-UX-021-secure-provider-registration.md`
- `node_modules/next/dist/docs/01-app/01-getting-started/15-route-handlers.md`
- `node_modules/next/dist/docs/01-app/02-guides/data-security.md`

## Implementation Requirements

- Add idempotent review-candidate, append-only review-event, and active representative-provenance persistence.
- Add deterministic staging from the pinned `ptcg-assets` source without downloading image bytes.
- Add a versioned assisted-selection policy that only accepts exact-set, compatible-class, non-value-sensitive representative candidates.
- Add dry-run/apply operations with considered, applied, already-applied, blocked, and skipped counts.
- Add Administration API reads and mutations with minimal DTOs and source allow-list validation.
- Add a responsive Settings review panel with assisted recovery, search, state filters, lazy images, and approve/reject/restore/undo controls.
- Preserve exact mappings and label owner-approved versus Phronesis-assisted representative artwork in the Vendor Workspace response/UI.
- Return separate exact, owner-representative, assisted-representative, and total visible coverage.

## Constraints

- Do not overwrite exact or curated artwork.
- Do not call paid providers, scrape pages, add dependencies, deploy, commit, or push.
- Do not claim representative artwork is exact.
- Do not automatically adopt mixed-product candidates, edition/case/composite ambiguity, explicit artwork variants, or any policy row without exact set and compatible product-class evidence.
- Preserve unrelated PriceCharting and community-import changes already in the worktree.

## Expected Architecture

`PtcgAssetsArtworkSource` produces deterministic candidate metadata. `SealedArtworkReview` owns a pure, versioned assisted-selection policy and operational orchestration. `PricingRepository` owns idempotent transactions, provenance, and audit events. Dedicated scripts expose staging and assisted dry-run/apply operations. A node Route Handler authorizes and returns safe DTOs. A narrow Client Component owns exception review interactions. Existing artwork reads return an adjunct provenance map for truthful rendering.

## Testing Expectations

- Candidate staging is idempotent and preserves decisions.
- Assisted selection is deterministic, refuses unsafe fixtures, and is idempotent after apply.
- Accept is transactional, identity-guarded, and exact-resolution safe.
- Reject/restore/undo survive repository restart.
- Unsafe source URLs and stale identities fail closed.
- Queue pagination/search/status and summary counts are deterministic.
- Responsive source assertions, full tests, TypeScript, lint, build, and diff hygiene pass.

## Documentation Updates

- Feature Registry, Atlas, Decisions, Roadmap, Prompt History, Release Notes, testing record, implementation report, conformance review, CTO Structure, and Conversation History.

## Acceptance Criteria

- Phronesis automatically recovers the defensible representative subset, and the owner can review only the remaining exceptions in Settings. All decisions remain reversible and audited.

## Non-Goals

- Broad or confidence-only bulk approval, new external image sources, exact-coverage reclassification, public deployment, or paid requests.

## Notes For AI Coding Agents

- Preserve unrelated user changes.
- Keep exact and representative metrics semantically separate.
- Present future automation ideas separately.
