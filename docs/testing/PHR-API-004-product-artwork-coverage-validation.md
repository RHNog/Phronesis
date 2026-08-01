# PHR-API-004 — Product Artwork Coverage Validation

## Scope

Validate the 2026-08-01 Pokémon and One Piece event-readiness revision: commerce-title normalization, strict bulk resolution, durable exact mappings, truthful diagnostics, bounded provider enumeration, and bounded local image prefetch.

## Automated Evidence

- Focused provider/artwork/repository suite: 35/35 passed.
- Full repository suite: 300/300 passed.
- Standalone TypeScript: passed with `npx tsc --noEmit --incremental false`.
- ESLint: passed with no warnings.
- Diff whitespace validation: passed.
- Production Next.js build: passed.

## Active Catalogue Evidence

The idempotent readiness command ran against `.data/mobile-review.sqlite` with authoritative TCGdex metadata and the Product Owner-attested official Bandai English card list.

- Pokémon: 43,732 loaded single-product rows compared with 23,444 provider cards; 32,566 exact product mappings persisted.
- One Piece: 6,895 loaded single-product rows compared with 4,450 deduplicated provider cards across 60 collector-prefix queries; 3,224 exact product mappings persisted; 0 provider-query failures.
- Durable image hot set: 1,000 highest-priority unique sources requested; 1,000 cached; 0 failures.
- `Mega Dragonite ex` collector numbers 152, 271, 290, and 295 in `ME: Ascended Heroes` persist exact TCGdex image URLs.

The product-row denominator includes finish rows, code cards, World Championship deck cards, stamped/event products, serial-numbered cards, manga/parallel variants, sealed products, and other records for which the card providers do not expose a uniquely labelled matching asset. Those records remain placeholders by design.

## Fail-Closed Cases

- Pokémon Prize Pack, League/Championship, Shadowless, and other special-printing labels cannot bridge to a base-set asset merely because name and collector number are unique.
- One Piece serial-numbered, release-event, prerelease, championship, tournament, winner, premium-booster, and other special products cannot bridge to base artwork without explicit provider variant evidence.
- Unknown stacked parenthetical or bracketed descriptors remain unresolved.
- Sealed products without an authoritative catalogue image or exact curated SKU image remain placeholders.

## Runtime Evidence

- Private review service restarted successfully; local `/vendor` health returned HTTP 200 and the Tailscale mapping remained active.
- `/api/pricing/artwork?category=pokemon-en&q=Mega%20Dragonite` returned four exact same-origin image URL sets and `OPERATIONAL`.
- At a 390×844 viewport, the four exact `ME: Ascended Heroes` Dragonite thumbnails completed with natural width 245; Prize Pack and sealed rows retained placeholders; horizontal overflow was 0.
- The `Luffy` phone search rendered official Bandai images at natural width 600, retained special-product placeholders, produced 0 horizontal overflow, and logged no browser errors. Remaining below-viewport images were lazy, not failed.
