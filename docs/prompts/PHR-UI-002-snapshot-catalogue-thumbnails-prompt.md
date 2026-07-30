# PHR-UI-002 Implementation Prompt

## Objective

Add non-blocking, provider-verified thumbnails to Snapshot-Powered Vendor Workspace results and selected evidence.

## Required Reading

- `docs/ui/PHR-UI-002-snapshot-catalogue-thumbnails.md`
- `docs/ui/PHR-UI-001-asset-visual-identity.md`
- `components/cards/CardThumbnail.tsx`
- `lib/providers/identity/ScryfallProvider.ts`
- Local Next.js Image and Route Handler documentation.

## Implementation Requirements

- Reuse `CardThumbnail`; do not create a parallel image system.
- Preserve local search as the primary response and fetch artwork separately.
- Use the existing Scryfall provider only for Magic and one request per stabilized query.
- Apply strict, testable printing matching and return only public artwork URLs keyed to snapshot SKU.
- Render consistent result and selected-evidence thumbnails with canonical placeholders.
- Verify desktop and mobile behavior.

## Constraints

- No guessed artwork URLs, new provider integration, bulk image crawl, API key use, recommendation change, or decision-engine change.
- Artwork failures must be silent to the pricing workflow and must not replace useful local error states.
- No commit, push, deployment, or public release.

## Acceptance

Return focused tests, provider-failure behavior, lint/build results, visual evidence, remaining limitations, and negative-effect declarations to Chief Architect review.
