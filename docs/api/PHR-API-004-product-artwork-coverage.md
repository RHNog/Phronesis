# PHR-API-004 — Product Artwork Coverage

## Feature ID

`PHR-API-004`

## Status

Completed — CTO Accepted; Community Pokémon Sealed Recovery Applied

## Priority

High

## Category

API / Artwork / Identity / Local Storage

## Objective

Extend honest, durable artwork coverage to Pokémon and One Piece catalogue singles, sealed products, and special products without attaching images to uncertain identities. Make tomorrow's event catalogue resilient by resolving and retaining as many exact card identities as the authoritative providers permit before the event begins.

## Proposed Solution

Separate card-art resolution from product-art resolution. Normalize commerce-only title suffixes before provider discovery, prefer an authoritative catalogue photo, then an exact provider match, then an owner-curated local image bound to the exact catalogue SKU. Query bounded visible Pokémon and One Piece artwork identities independently so an unrelated result cannot starve later singles. Persist only verified SKU-to-provider resolutions and retain their image bytes in the durable local cache. Retain placeholders when exact identity is unavailable.

An operator-invoked readiness command may enumerate authoritative provider metadata and compare it with locally loaded Pokémon and One Piece singles. It may persist exact resolutions for the full local catalogue while prefetching image bytes only for a configurable, bounded, high-priority subset. This metadata index and bounded byte prewarm are not permission for speculative matching, an unbounded image crawl, or provider redistribution.

The 2026-08-02 community gap-fill revision adds two explicitly lower-authority sources without weakening that model. PokéFiles is consumed as a public catalogue snapshot rather than as image ownership: Phronesis retains the upstream URL declared for each exact English card record. `1niceroli/ptcg-assets` is consumed at an immutable Git commit without cloning its approximately 2 GB repository; the recursive tree supplies candidate sealed assets and raw commit URLs. Community mappings fill only missing or identity-stale rows and never replace a valid resolution for the same complete identity.

## Functional Requirements

- Preserve existing strict Magic, Pokémon, Lorcana, and One Piece card-art paths.
- Remove bounded trailing collector/card-number decorations from provider discovery names while preserving the original catalogue identity for exact resolution.
- Resolve bounded visible result groups rather than one first-name or raw-user query per category.
- Query One Piece by exact visible card identities/card numbers, not only the free-text search phrase.
- Persist verified resolution metadata by category, SKU, and complete artwork identity; ignore a persisted record when that identity changes.
- Reuse persisted resolutions on later searches and after process restarts.
- Report `NO_MATCH` when a provider is healthy but no exact visible identity resolves; reserve `OPERATIONAL` for responses that contain artwork.
- Provide an idempotent readiness command that indexes authoritative Pokémon and One Piece card metadata, stores exact local mappings, ranks mapped products by current value, and prefetches no more image assets than its explicit limit.
- Return repository-provided sealed URLs immediately when present.
- Add an exact-SKU curated artwork registry and protected upload/import boundary.
- Serve curated files through the existing same-origin durable cache safeguards.
- Never infer TCGplayer CDN URLs from SKU.
- Keep Riftbound deferred.
- Discover PokéFiles' public client catalogue without persisting its anonymous client credential, validate the Supabase project identity, and fetch sets/cards with bounded deterministic pagination.
- Normalize PokéFiles records into Pokémon card identities and resolve only exact set, collector-number, and material-name matches.
- Treat staff, stamped, prize, prerelease, winner, league, event, championship, and similar descriptors as material artwork evidence that cannot fall back to a generic card scan.
- Pin the `ptcg-assets` source to one commit SHA and derive sealed candidates from image blobs only; exclude `_to_sort`, logos, symbols, banners, and unrelated media.
- Match community sealed artwork only when set identity is exact, product class is compatible, and one candidate has unique descriptor proof. Generic products may use a generic source asset only when that class has exactly one candidate in the set.
- Persist an ignored local run report with source revisions, input counts, accepted mappings, already-covered identities, ambiguous/unmatched counts, and bounded samples for human review.
- Prefetch only an explicit bounded number of highest-value accepted or persisted community image URLs.
- Recognize deterministic repository packaging conventions, including plural `mini-tins`, `tins`, `decks`, and `collections` folders, without treating work folders or loose promotional scans as sealed products.
- Normalize only documented exact catalogue labels such as Scarlet & Violet 151, Scarlet & Violet Base Set, Sword & Shield Base Set, and Ascended Heroes to their unique English set identities.
- Permit promo-card identifiers embedded in sealed asset filenames to contribute descriptor evidence only when an exact public card record proves the enclosed Pokémon/card name; never use a promo identifier alone across multiple products.

## Non-Functional Requirements

- Artwork never changes pricing or decision identity.
- Unsupported or ambiguous products retain honest placeholders.
- File type, size, and exact SKU ownership are validated.
- Provider metadata enumeration and image prefetch use bounded pagination/concurrency, emit auditable counts, and continue safely when an individual query or asset fails.
- The readiness command can be rerun without duplicating resolution rows or cache assets.
- Public-client discovery, pagination, source manifests, and matching are deterministic and independently testable with injected fetch implementations.
- Source URLs are pinned or recorded with enough provenance to reproduce an accepted mapping.

## Acceptance Criteria

- One unmatched result cannot prevent other visible Pokémon singles from resolving.
- A TCGplayer title such as `Mega Dragonite ex - 152/217` discovers the `Mega Dragonite ex` provider family and resolves only the exact set/collector printing.
- One Piece visible results are discovered by their own exact identities and retain base/parallel/SP ambiguity safeguards.
- Exact provider mappings survive a service restart and are invalidated by an identity change.
- A provider with no exact match returns `NO_MATCH`, not a false operational success.
- One readiness run can resolve the locally loaded Pokémon and One Piece singles and prefetch a bounded high-priority subset for offline/local event reliability.
- Sealed catalogue URLs render where supplied.
- An owner can bind a validated local image to an exact sealed or special-product SKU.
- First Partner results remain placeholders unless exact artwork is verified or curated.
- A valid existing same-identity mapping is never replaced by PokéFiles or `ptcg-assets`; an identity-stale row may be repaired.
- A generic booster pack with multiple packshot candidates remains unresolved.
- A stamped or staff promo without matching material artwork descriptors remains unresolved.
- A unique exact sealed product-class and descriptor match may be persisted and served through the durable local cache.
- One operator run reports before/after Pokémon singles and sealed coverage percentages.

## Dependencies

- `PHR-API-002`
- `PHR-TECH-007`
- `PHR-TECH-008`
- PokéFiles public web catalogue.
- `1niceroli/ptcg-assets` public Git repository.
- Pokémon TCG set metadata already used by the sealed pipeline.

## Non-Goals

- Guessing artwork from similarly named cards.
- Unbounded or recurring provider-wide image downloads. Full source metadata enumeration is allowed for exact local identity indexing; image-byte prefetch remains explicitly bounded.
- Guessing a sealed-product image from a condition SKU or card artwork.
- Riftbound artwork.
- Treating PokéFiles as the copyright owner or using the paid Scrydex API.
- Automatically adopting assets from `_to_sort` or attaching one arbitrary booster wrapper from several artworks.

## Traceability

- Origin: Product Owner artwork request, 2026-07-30.
- Related implementation prompt: `docs/prompts/PHR-API-004-product-artwork-coverage-prompt.md`.
- Related tests: `docs/testing/PHR-CARD-SHOW-OPERATIONS-20260730-validation.md`.
- Last modified: 2026-08-02.
- Community revision: Product Owner authorized immediate maximum-safe use of PokéFiles and `ptcg-assets` after declining paid Scrydex access. Existing exact mappings retain priority; ambiguous source evidence remains quarantined.
- Community execution evidence: 31,286 / 43,732 Pokémon single-product rows (71.54%) and 356 / 2,892 sealed-product rows (12.31%) now have exact community-backed artwork mappings in the active pricing database. The 1,500 highest-priority sources are locally cached with zero final failures.
- Residual evidence: 1,019 sealed rows have possible but non-exact source candidates and 1,517 are unmatched or unsupported; no arbitrary booster wrapper, case, edition, Pokémon Center/retail variant, year, or package form was adopted.
- Runtime remediation: a dead PokémonTCG URL was replaced through an exact TCGdex card identity, while a verified 13.86 MB GitHub PNG was cached through a command-scoped 16 MiB ceiling and signature-sniffed only for allowlisted community binary responses.
- Sealed recovery revision: Product Owner challenged the initial 6.60% result. Audit proved that 205 known-set image files were omitted by singular-only package classification, 664 mixed-root files had not been evaluated, and several exact TCGplayer set labels were not normalized. Plural package paths, exact set aliases, promo-ID/card-name evidence, exact mixed filenames, component suffixes, and explicit half-display classification raise exact sealed coverage to 12.31% while retaining the same fail-closed identity boundary.
- Remediation: Magic provider queries now use exact visible card names, and unique name/collector identity may bridge provider set-label drift without weakening Pokémon or ambiguous-printing safeguards.
- Event-readiness revision: Product Owner requested a single-pass Pokémon and One Piece coverage hardening for the 2026-08-02 event. The revision authorizes authoritative metadata enumeration, persistent exact resolution indexing, and explicitly bounded high-priority image prefetch while preserving fail-closed identity matching.
