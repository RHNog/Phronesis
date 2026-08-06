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

## 2026-08-02 Community Pokémon Gap-Fill Validation

- Focused community sealed recovery suite: 13/13 passed.
- Full repository test run: 362/362 passed.
- `npx tsc --noEmit`: passed.
- `npm run lint`: passed without warnings.
- `npm run build`: Next.js 16.2.12 production build passed.
- `git diff --check`: passed.
- Active pricing database before the first apply: 0 / 43,732 mapped Pokémon single rows and 0 / 2,892 mapped sealed rows.
- Active pricing database after recovery apply: 31,286 / 43,732 singles (71.54%) and 356 / 2,892 sealed (12.31%). The recovery added 165 mappings over the initial 191.
- PokéFiles snapshot: 20,009 source cards, 20,008 usable records, 173 sets, 19,467 PokémonTCG-hosted records, and 541 Scrydex-hosted records.
- `ptcg-assets`: immutable commit `3744b0ab766cb6fcea9ac6f353913b64b40bf9a0`, 4,326 source files, 949 eligible sealed assets, and 174 source sets.
- Final priority cache: 1,500 requested, 1,500 cached, 0 failures. One dead PokémonTCG source was repaired by exact TCGdex ID; one 13.86 MB trusted GitHub PNG was validated by raster signature under the import-only 16 MiB ceiling.
- Idempotency: the verification rerun stored 0 new PokéFiles mappings and 0 new `ptcg-assets` mappings.
- Recovery source audit: 1,468 eligible assets across 176 source identities; deterministic package and filename rules accepted 356 exact catalogue mappings.
- Quarantine: 1,019 sealed identities retain possible but non-exact candidates and 1,517 remain unmatched/unsupported. Multi-art packs, cases, edition-specific products, regular-versus-Pokémon-Center ETBs, half/full displays, years, and distribution variants retain placeholders without proof.
- Full accepted, ambiguous, and bounded unmatched evidence is retained under ignored `.data/community-artwork/`; the final report is `.data/community-artwork/runs/2026-08-02T19-21-03-113Z.json`.
