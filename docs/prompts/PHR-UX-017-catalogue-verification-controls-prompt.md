# Implementation Prompt — PHR-UX-017 Catalogue Verification Controls

## Project Context

Project Phronesis is a private evidence-driven collectible-market decision platform. Documentation is implementation, and external marketplace content is corroboration rather than automatically adopted identity.

## Feature ID

`PHR-UX-017`

## Objective

Add an exact-result TCGplayer cross-check link and reusable enlarged artwork preview to Vendor Workspace catalogue verification.

## Required Reading

- `docs/ux/PHR-UX-017-catalogue-verification-controls.md`
- `docs/ui/PHR-UI-001-asset-visual-identity.md`
- `docs/ux/PHR-UX-008-unified-artwork-first-catalogue-search.md`
- `features/vendor/components/SnapshotVendorWorkspace.tsx`
- `components/cards/CardImage.tsx`
- `node_modules/next/dist/docs/01-app/03-api-reference/02-components/image.md`

## Implementation Requirements

- Add a pure, tested builder for fixed-origin TCGplayer all-product search URLs using selected visible identity fields.
- Add a reusable thumbnail preview that uses canonical `CardImage` candidates and a client portal.
- Show the preview on result-thumbnail hover and selected-thumbnail hover/focus without nesting interactive controls.
- Clamp the fixed preview to the viewport and dismiss it on leave, blur, or Escape.
- Add a selected-evidence `Verify on TCGplayer` external link with safe target/rel behavior and a 44px touch target.
- Preserve exact artwork-identity selection, product-level finish semantics, and missing-artwork fallback.

## Constraints

- Do not call a TCGplayer API, scrape TCGplayer, or persist external results.
- Do not infer that the external result verifies or changes canonical identity.
- Do not bypass `CardImage`, `CardThumbnail`, or `CardImageCache`.
- Do not make hover trigger provider discovery or mutate artwork.
- Preserve existing result-button keyboard behavior and phone selection flow.
- No dependency, database, authentication, public deployment, commit, or push.

## Expected Architecture

`SearchMatch` visible identity → pure TCGplayer URL builder → ordinary external anchor. Existing normalized image candidates → `CardThumbnail` plus reusable portal preview → same `CardImage` resolution/fallback and browser cache.

## Testing Expectations

- Unit-test exact URL origin/path, encoded punctuation, collector inclusion, sealed/missing-field behavior, and absence of `undefined` values.
- Extend Vendor Workspace structure coverage for preview and external-link safety.
- Run focused tests, full suite, standalone TypeScript, warning-free lint, production build, and diff hygiene.
- Verify desktop hover/focus and 390px touch/overflow/console behavior in the private runtime.

## Documentation Updates

- `docs/testing/PHR-UX-017-catalogue-verification-controls-validation.md`
- `docs/implementation-reports/PHR-UX-017-catalogue-verification-controls-report.md`
- `docs/reviews/PHR-UX-017-catalogue-verification-controls-conformance-review.md`
- `docs/release-notes/PHR-UX-017.md`
- Feature Registry, Atlas, Roadmap, Prompt History, Agent Handoff, CTO Structure, and Conversation History.
- Amend `PHR-UI-001` to record the reusable hover-preview extension as delivered.

## Acceptance Criteria

- Every criterion in `docs/ux/PHR-UX-017-catalogue-verification-controls.md` passes with reproducible evidence.

## Non-Goals

- Direct TCGplayer product-ID routing without a durable imported URL.
- Automatic identity reconciliation, marketplace pricing ingestion, curation, or thumbnail repair.
- Rollout to every card surface in this increment.

## Notes For AI Coding Agents

- Preserve unrelated dirty-worktree changes.
- Keep the fixed external origin explicit and URL-encode all query values.
- Report same-session conformance honestly; Product Owner acceptance remains separate.
