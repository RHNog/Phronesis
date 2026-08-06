# PHR-UX-017 Catalogue Verification Controls

## Feature ID

`PHR-UX-017`

## Title

Catalogue TCGplayer Cross-Check And Artwork Preview

## Status

Implemented — Product Review Ready

## Priority

High

## Category

UX / UI / Search / Artwork / External Verification / Accessibility

## Objective

Let a Vendor Workspace operator verify an exact selected catalogue result quickly by opening a prefilled TCGplayer search and by enlarging the current Phronesis artwork without leaving the selection workflow.

## Background

Phronesis intentionally fails closed when exact artwork cannot be attached, and some imported identities can temporarily retain a placeholder or an incorrect provider thumbnail pending reconciliation. Operators need fast visual and marketplace corroboration during an event.

## Problem Statement

The current result thumbnail is too small for confident card-art verification, and reaching the equivalent TCGplayer search requires retyping the card identity. This adds friction precisely when a thumbnail is missing or questionable.

## Proposed Solution

Add a reusable enlarged-preview layer to the canonical card-image component and add an explicit `Verify on TCGplayer` link to the selected Snapshot evidence. The preview consumes the same normalized artwork candidates and fallback as the thumbnail. The external link is a deterministic browser search assembled from the selected catalogue name, set, collector number, and product type; it does not call a TCGplayer API, write data, or claim identity confirmation.

## Functional Requirements

- Every Vendor Workspace catalogue-result thumbnail exposes an enlarged 5:7 preview on precise-pointer hover.
- The selected Snapshot evidence thumbnail exposes the same preview on hover and keyboard focus; touch activation may focus/toggle the preview without changing catalogue identity.
- The preview uses the canonical image candidate resolver and shows a Phronesis placeholder when no valid image is available.
- The preview is rendered above scroll containers, clamped inside the viewport, and cannot capture pointer events or interfere with result selection.
- Escape or loss of hover/focus dismisses the preview.
- The selected Snapshot evidence includes a minimum-44px `Verify on TCGplayer` link.
- The link opens TCGplayer in a new tab with a prefilled all-products search derived from the exact selected result.
- Changing the selected artwork identity changes the verification URL; finish-only variants may share the same TCGplayer product search because finish is selected on the marketplace product.
- The external link uses `noopener noreferrer`, visibly indicates external navigation, and never represents the TCGplayer result as automatically reconciled evidence.

## Non-Functional Requirements

### Performance

The preview must reuse the canonical image candidates and cache; hovering must not initiate provider discovery or a Phronesis search request. The larger size may request the candidate's normal image through the existing same-origin artwork cache.

### Scalability

The verification URL builder must accept any loaded game without maintaining a game-specific TCGplayer route registry.

### Maintainability

Preview behavior belongs to a reusable component under `components/cards/`; product modules must not independently select artwork.

### Reliability

Missing, failed, or malformed artwork remains a placeholder. A valid TCGplayer URL can still be opened when no artwork is available.

### Accessibility

The selected-image preview is keyboard reachable, Escape-dismissible, and described with an accessible label. The external link has an unambiguous accessible name and visible focus treatment.

### Offline Support

Cached Phronesis artwork may preview offline. The TCGplayer link remains visible but naturally requires network connectivity.

### Security

Only the fixed HTTPS TCGplayer search origin is allowed. Query values are encoded by the URL API. No credentials, referrer context, or catalogue data beyond the selected visible search terms are transmitted.

### Extensibility

Other Phronesis card surfaces may adopt the same preview component later without changing the image resolver.

### Responsiveness

The preview clamps to desktop and phone viewports without horizontal overflow. Hover is supplementary; the selected evidence remains the touch verification path.

## User Stories

- As an event buyer, I want to enlarge a thumbnail immediately so I can compare artwork details before choosing a card.
- As an event buyer, I want one-click TCGplayer corroboration so I do not have to retype the exact name, set, and collector number.

## Acceptance Criteria

- Hovering a result thumbnail shows a materially larger image without moving the result list or preventing selection.
- Focusing or touching the selected evidence thumbnail exposes the same preview and Escape dismisses it.
- `Verify on TCGplayer` opens a correctly encoded query for the selected card or sealed product.
- Missing artwork still offers the external verification link and never renders a broken image.
- Artwork-identity changes update both the displayed evidence and outbound query; finish-only changes preserve the same product-level marketplace search.
- Existing search, artwork grouping, keyboard selection, mobile layout, and purchase evaluation remain green.

## Edge Cases

- Names containing punctuation, apostrophes, slashes, Unicode, or periods are URL encoded safely.
- A missing collector number is omitted rather than represented as `null` or `undefined`.
- A placeholder preview remains truthful and is not labelled as verified artwork.
- Near viewport edges, the preview moves to the available side and clamps vertically.
- Coarse-pointer result selection remains one tap; it does not become a hover-only workflow.

## Dependencies

- `PHR-UI-001` canonical asset visual identity and image resolver.
- `PHR-UX-008` unified artwork-first catalogue search.
- `PHR-UX-016` intent-aware catalogue search.
- Current public TCGplayer all-products search URL.

## Future Enhancements

- Provider-specific direct product URLs when a durable licensed product URL is imported as evidence.
- Side-by-side Phronesis/provider artwork reconciliation and owner curation actions.

## Technical Notes

Use a pure URL builder so encoding and identity-field selection are deterministic and unit tested. Use a client portal for the fixed preview layer so the Vendor Workspace result scroll container cannot clip it. The preview remains presentation-only.

## UI / UX Notes

Use a 240px-class enlarged image on desktop, a viewport-bounded size on narrow screens, high stacking order, subtle cyan border/shadow, and concise `Larger card preview` labelling. Place the external verification control adjacent to selected identity evidence, not inside a catalogue-result selection button.

## Success Metrics

- One action from exact Phronesis selection to TCGplayer corroboration.
- Zero additional provider-discovery calls caused by preview interaction.
- Zero horizontal overflow at 390px and no keyboard regression.

## Open Questions

- None for this bounded increment.

## Traceability

- Originating request: Product Owner request for TCGplayer double-check and hover enlargement, 2026-08-01.
- Related implementation prompt: `docs/prompts/PHR-UX-017-catalogue-verification-controls-prompt.md`.
- Related tests: `tests/tcgplayer-verification-link.test.ts`, `tests/snapshot-vendor-workspace.test.ts`.
- Related release notes: `docs/release-notes/PHR-UX-017.md`.
- Last modified: 2026-08-01.
- Modification reason: Record delivered behavior, product-level TCGplayer search semantics, and verified canonical preview loading.
