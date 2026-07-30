# PHR-TECH-007 Engineer Report

Date: 2026-07-29
Features: `PHR-TECH-007`, authorized revision to `PHR-API-002`

## Outcome

One Piece thumbnails are operational from the official Bandai English card list. Authorized provider artwork is retained locally and served through Phronesis, reducing repeated provider requests and improving resilience at the August 1 card show.

## Implementation

- Added a bounded Bandai search/parser/normalizer that preserves official base, parallel, and SP asset identities.
- Replaced the pending One Piece identity adapter with the operational official provider.
- Added strict One Piece catalogue resolution that refuses ambiguous set, card-number, name, and qualifier matches.
- Added a same-origin durable image route backed by ignored `.data/artwork/` image and metadata pairs.
- Added exact host/path allowlisting, raster validation, size/time limits, redirect rejection, content hashing, atomic writes, and in-flight coalescing.
- Routed approved Scryfall, TCGdex, Lorcast, Bandai, and TCGplayer artwork through the cache without changing pricing authority.
- Prewarmed the 12 unique official artworks resolved by the current `luffy` event-data search.

## Implementation files

- `app/api/pricing/artwork/route.ts`
- `app/api/pricing/image/route.ts`
- `components/cards/CardImageCache.ts`
- `lib/artwork/DurableArtworkCache.ts`
- `lib/engines/identity/IdentityOrchestrator.ts`
- `lib/pricing/artwork.ts`
- `lib/providers/bandai/BandaiOnePieceNormalizer.ts`
- `lib/providers/bandai/BandaiOnePieceProvider.ts`
- `lib/providers/bandai/BandaiOnePieceTypes.ts`
- `tests/bandai-onepiece-provider.test.ts`
- `tests/card-image-cache.test.ts`
- `tests/durable-artwork-cache.test.ts`
- `tests/identity-platform.test.ts`
- `tests/snapshot-artwork.test.ts`

## Designer review

**CONFORMS — PRODUCT REVIEW READY.** Official artwork is visible without displacing price and identity hierarchy. Desktop remains the primary card-show layout; at 390px the same results adapt to one column without horizontal overflow. Placeholders remain legible for unmatched variants.

## Negative-effect declaration

No snapshot price, source SKU, condition, finish selection, evaluation engine, upstream schedule, Pricing Update Tool state, inventory, credential, external account, Riot asset, commit, push, deployment, or publication was changed. The local artwork cache is ignored and recoverable by refetching authorized assets.

## 2026-07-30 Remediation Report

- Added a stable Phronesis User-Agent to allowlisted provider image downloads, resolving Scryfall's `generic_user_agent` rejection without weakening cache security.
- Added provider-query derivation for Pokémon and Lorcana from the first exact single-card catalogue result. Lorcana name/version separators are converted to whitespace for Lorcast search only.
- Preserved strict set and collector-number attachment; no fuzzy image assignment was introduced.
- Added regression coverage for outbound request identity and the exact `Mulan - res` query transformation.
- Verified and prewarmed twelve representative Mox Opal and Mulan small/normal assets.

### Remediation files

- `app/api/pricing/artwork/route.ts`
- `lib/artwork/DurableArtworkCache.ts`
- `lib/pricing/artwork.ts`
- `tests/durable-artwork-cache.test.ts`
- `tests/snapshot-artwork.test.ts`
- PHR-TECH-007 specification, prompt, validation, review, release, Structure, registry, Atlas, changelog, handoff, and product-memory records

### Remediation negative-effect declaration

No price, condition, SKU, buying formula, inventory, upstream schedule, provider credential/account, public deployment, Riftbound boundary, or destructive cache operation changed. Unmatched catalogue identities continue to show placeholders.
