# PHR-TECH-008 Validation Record

Date: 2026-07-30
Verdict: **CONFORMS — CANONICAL ADOPTION PENDING**

## Pokémon evidence

- Added an explicit Pokémon-only TCGplayer/TCGdex set-alias registry covering verified equivalence families.
- The resolver still requires category, set, collector number, normalized name compatibility, and a unique printing; ambiguity and mismatches retain placeholders.
- Representative runtime measurement for `pikachu` improved from **12/40** mapped snapshot results to **25/40**.
- The 25 mapped SKUs represent 24 unique artworks; all 24 bounded small images returned HTTP 200 through the same-origin cache route.
- Remaining placeholders include provider-missing images, special stamped products, World Collection language variants, code cards, and product/set identities that are not safe aliases.

## Lorcana acquisition and ingestion

- Acquisition mode: catalogue-only TCGplayer export through the existing authenticated local session. No Pricing Update Tool pipeline, hide, pricing, review, publish, or unhide phase ran.
- Source: `.data/pricing-catalogues/20260730_lorcana_manual/catalog_lorcana.csv`.
- Source size: 4,518,692 bytes; 30,532 physical lines including header.
- SHA-256: `35cc2651ad5b88d6db9d32732652f6fe9dd03b1cf4220af728e4a1aec9cc2814`.
- Checkpoint: `2026-07-30T04:34:16.000Z`.
- Import: **30,531 rows**, **6,243 products**, **30,531 snapshots**.
- Replaying the identical receipt returned `ALREADY_IMPORTED` and recorded category sync status `CURRENT`.
- Representative searches: `mickey mouse` 40 singles; `elsa` 40 singles; `stitch` 40 singles and 2 sealed products.
- Lorcast strict mappings: Mickey Mouse 30, Elsa 33, Stitch 36 snapshot SKUs.

## Durable artwork remediation

- Runtime review found Lorcast AVIF mappings were valid but the durable cache rejected `image/avif` despite advertising it in the request `Accept` header.
- Added strict ISO-BMFF `ftyp` plus `avif`/`avis` brand validation.
- Invalid AVIF-shaped bytes remain rejected.
- Bounded Mickey Mouse prewarm retained 17 unique Lorcast images with metadata under ignored `.data/artwork/`; all returned HTTP 200.

## Automated verification

- Focused resolver/provider/catalogue/cache suite: **18/18 passed**.
- Supported full suite: **183 passed / 17 failed** out of 200. The 17 failures exactly reproduce the established repository baseline; the three additional passing tests come from this work item.
- `npm run lint`: passed.
- `npm run build`: passed, including application TypeScript validation and all 17 routes.
- `npx tsc --noEmit`: only the established **29 `TS5097` test-import configuration errors**; no application or new semantic TypeScript error.
- `git diff --check`: passed.

## Desktop and mobile review

- Desktop 1440×1000: four catalogues current, 17 mapped images in the rendered result set, 10 loaded in the viewport, zero failed image elements, and no horizontal overflow (`scrollWidth 1425 <= innerWidth 1440`).
- Mobile 390×844: four catalogues current, 17 mapped images, 8 loaded in the viewport, zero failed image elements, and no horizontal overflow (`scrollWidth 375 <= innerWidth 390`).
- Lazy offscreen images remain unloaded until scrolled into view; this is expected behavior rather than failure.

## Negative-effect declarations

- Riftbound was not changed or activated.
- The dirty Pricing Update Tool repository was not edited, staged, committed, pushed, or cleaned.
- No store visibility, inventory, price, pending-review, publication, schedule, account, or credential state was changed.
- No image provider changed snapshot prices, source SKUs, condition evidence, evaluation inputs, or buying decisions.
- No public deployment or external communication occurred.
