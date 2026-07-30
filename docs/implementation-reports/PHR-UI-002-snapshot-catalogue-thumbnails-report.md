# PHR-UI-002 Engineer And Designer Report

## Outcome

Vendor Workspace now shows stable thumbnails in catalogue result rows and selected evidence on desktop and mobile. Magic uses strict non-blocking Scryfall enrichment when the catalogue has no image; Pokémon and One Piece retain the canonical placeholder.

## Implementation

- Reused `CardThumbnail` and canonical image candidates.
- Added a Magic-only artwork API behind the existing identity provider and local snapshot identity.
- Added strict set/collector/name resolution that declines ambiguous or mismatched artwork.
- Kept enrichment separately debounced, abortable, cached, and independent from local pricing errors.
- Added the verified TCGplayer image host and direct-CDN handling for hosts that fail through the local image optimizer.

## Designer review

**CONFORMS — PRODUCT REVIEW READY.** Desktop and 390px mobile renders show compact fixed image slots, recognizable Magic artwork, honest placeholders, consistent selected artwork, visible pricing evidence, and no page-level horizontal overflow. The image is supporting identity evidence and does not overpower the decision workflow.

## Limitations

No reliable Pokémon or One Piece artwork source is connected. The catalogue's own image coverage is effectively empty, so those games deliberately show placeholders rather than guessed printings.

No bulk image acquisition, new provider integration, price behavior change, commit, push, deployment, or public release occurred.
