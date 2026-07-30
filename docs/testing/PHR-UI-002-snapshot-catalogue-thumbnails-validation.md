# PHR-UI-002 Validation Record

Date: 2026-07-29
Verdict: **READY FOR PRODUCT REVIEW**

## Data finding

Only one of 1,308,705 July 29 catalogue rows had a non-empty `Photo URL`. Repository-only thumbnails were therefore insufficient for the requested event workflow.

## Matching and failure behavior

- Magic enrichment uses the existing Scryfall identity provider after local pricing results render.
- Strict matching requires normalized set and collector identity, prefers an exact normalized name, tolerates only presentation suffix differences for a unique printing, and returns no image for ambiguity or mismatch.
- Pokémon and One Piece return `NOT_SUPPORTED` and render the canonical placeholder.
- Artwork requests are separately debounced and abortable. Provider failure never changes price results, selection, or decision state.
- Verified public Scryfall and TCGplayer image hosts bypass the Next.js optimizer because direct CDN responses succeeded while the local optimizer returned an upstream error.

## Visual evidence

- Desktop review at 928x1207: current July 29 freshness, 40 results, fixed thumbnail slots, real Magic images, stable placeholders, matching selected-evidence artwork, and zero horizontal overflow.
- Mobile review at 390x844: compact thumbnail rows, preserved result readability and touch targets, and zero horizontal overflow.
- Runtime DOM evidence: 23 image elements, 22 loaded provider images, and a selected image with natural width 146.
- Browser console errors: zero.

## Verification

- Focused event-readiness suite: **14/14 passed**.
- `npm run lint`: passed.
- Production evidence build: passed.
- `git diff --check`: passed.

## Limitations

Provider-backed artwork is operational for Magic only. Pokémon and One Piece remain useful for prices and decisions but show placeholders until an approved identity artwork provider is integrated. Bulk image downloads and guessed CDN URLs are intentionally excluded.
