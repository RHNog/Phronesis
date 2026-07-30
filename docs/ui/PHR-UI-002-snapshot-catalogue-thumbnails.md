# PHR-UI-002 — Snapshot Catalogue Thumbnails

## Feature ID

`PHR-UI-002`

## Status

Product Review Ready

## Priority

Critical

## Category

UI / UX / Identity / Local Integration

## Objective

Add fast, recognizable card thumbnails to Snapshot-Powered Vendor Workspace results and selected evidence without making price lookup dependent on an artwork provider.

## Problem Statement

The snapshot repository retains `Photo URL`, but the July 29 catalogues contain only one non-empty URL across 1,308,705 rows. Rendering that field alone would leave virtually every result without artwork.

## Approved Solution

- Reuse the canonical `CardThumbnail` and image-candidate priority from `PHR-UI-001`.
- Render a fixed-size thumbnail for every result and the selected evidence header.
- Prefer a repository `Photo URL` when present.
- For Magic, request artwork through the existing operational Scryfall identity provider after local price results are already visible, using one provider search per stabilized query and strict printing matching.
- Match only exact normalized name plus set/collector evidence, or exact collector plus normalized set when the provider and TCGplayer names differ only in presentation suffixes.
- Keep Pokémon and One Piece on the canonical placeholder until an operational identity artwork provider is approved; do not guess TCGplayer product images from condition-level SKU IDs.
- Provider failure, rate limiting, no match, or offline operation leaves a stable placeholder and never blocks search, selection, prices, or buying decisions.

## Performance And Reliability

- Local pricing results render first.
- Artwork enrichment is debounced separately and is abortable on query/category changes.
- No more than one Scryfall search is initiated per stabilized query; existing provider caching is reused.
- Images remain lazy-loaded through the existing Next.js image component and configured remote host allowlist.

## Accessibility And Responsiveness

- Thumbnail alternatives identify the product and set.
- Result rows remain keyboard selectable and preserve visible focus.
- Desktop rows remain compact; mobile rows retain 44px targets and no horizontal overflow.
- Placeholder state remains meaningful when images are unavailable.

## Acceptance Criteria

- Every catalogue result has a thumbnail slot without layout shift.
- Verified Magic printings show provider artwork when available.
- Selected evidence repeats the same artwork consistently.
- An artwork request failure does not alter local result content or error state.
- Desktop and 390px mobile review show no horizontal overflow.
- Focused matching, component, lint, build, and visual checks pass.

## Non-Goals

- Bulk image downloads, OCR, barcode scanning, camera capture, or image recognition.
- New Pokémon or One Piece identity-provider integrations.
- Guessed TCGplayer CDN URLs.
- Making external artwork a prerequisite for event operation.

## Traceability

- Origin: Product Owner thumbnail direction on 2026-07-29.
- Implementation prompt: `docs/prompts/PHR-UI-002-snapshot-catalogue-thumbnails-prompt.md`.
- Related workflow: `PHR-WORKFLOW-004`.
- Last modified: 2026-07-29.
