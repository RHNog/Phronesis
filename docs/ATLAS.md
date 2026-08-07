# Project Atlas

## Event Consignment Ownership

- `PHR-WORKFLOW-006` now creates an optional event-specific product-owner roster atomically at event opening and treats that roster as immutable evidence.
- `PurchaseLedgerRepository` remains the sale authority: each sold-item row stores either null for house inventory or one same-event/same-workspace owner ID; hydrated activity and reports expose the preserved owner name.
- Full Event Ledger and Vendor Workspace Quick Sale share the same owner-aware Sale contract. Event Stock and Display Case canonicalization preserve the selected owner while retaining their existing stock/inventory effects.
- Owner attribution does not calculate commission, payout, profit, or settlement. Those results require a later per-line revenue-allocation and consignment-policy workflow.

## Settings Control Center

- `PHR-UX-029` replaces the vertically stacked Settings page with Overview plus five focused panels: Business profiles, Regional economics, Provider connections, People & access, and Temporary access.
- One typed metadata registry drives desktop navigation, phone selection, overview cards, labels, descriptions, and stable `?panel=` values.
- The protected Server Component retains runtime-data and authorization ownership; the client control center changes navigation/presentation only and preserves mounted panel state while inactive panels are hidden from layout and accessibility.
- Native history integration supports reload and Back/Forward without a server request for ordinary panel switching; unknown values fail safely to Overview.

## Past Event Ledger Reports

- `PHR-UX-028` makes closed Event Ledger evidence discoverable from the Event Ledger header instead of exposing only the active or latest closed event.
- `PurchaseLedgerRepository` remains authoritative: it returns a newest-first, latest-100 workspace index and one exact workspace-scoped closed-event snapshot; no duplicate report persistence exists.
- Historical reports reuse canonical cash summaries, preserved close reconciliation, Event Stock reports, and immutable activity while suppressing all write/start controls.
- Direct `eventId` URLs and browser history make a report returnable and shareable inside the authenticated private application.

## Dashboard Tool Hub And Shared Navigation

- `PHR-UX-027` reserves `/` for an authenticated, entitlement-aware Dashboard and moves Opportunities to `/opportunities` without changing the `INTELLIGENCE` gate.
- `PHR-UX-027` also owns origin-relative standalone installation metadata, approved browser/install/iOS icons, and non-overlapping Event Operations placement in Vendor Workspace.
- Dashboard cards and shared navigation derive from one server-filtered `ProductNavigation` model; Dashboard is a shell destination and never a substitute authorization module.
- Desktop navigation collapses to a persistent local icon rail while the phone retains the accessible modal drawer.
- The installed phone shell reserves `safe-area-inset-top` above a full 64-pixel toolbar. Full-screen mobile navigation is body-portalled, and navigation/help/search overlays consume device top and bottom safe-area insets.
- The approved `PHR-UI-001` application artwork is byte-identical to canonical commit `8d655f5` and supplies Dashboard, desktop/mobile shell, favicon, and Apple home-screen identity. CSS or generated substitutes are prohibited.

## Local Card Acquisition And Recognition

- `PHR-ARCH-015` treats scanning as one acquisition adapter into immutable frames and regions, not as a Vendor Workspace-only feature.
- Phronesis owns authorization, canonical identity, pricing, offers, and operator decisions. Native macOS/Windows agents own scanner sessions; an isolated local worker owns recognition.
- `PHR-TECH-013` first proves the actual fi-8170/ImageCaptureCore contract with a standalone Swift probe and low-value physical gate.
- `PHR-TECH-015` temporarily routes supported fi-8170 acquisition through Windows PaperStream, seals Windows-local frames into a hash-bound Parallels bundle, and requires a distrustful macOS import; it owns no identity or product state.
- `PHR-TECH-014` now provides immutable local evidence, deterministic corpus-bundle construction, split-leakage and recognition-use approval gates, corpus activation/rollback, Apple Vision evidence, English Pokémon game/language gating, name-plus-collector read-only retrieval, append-only reprocessing, sealed multi-metric benchmark qualification, candidate review, and abstention. Real licensed artwork indexing and auto-accept remain gated.
- `PHR-WORKFLOW-016` provides authenticated batch-folder intake, evidence review, durable latest-revision session reconciliation, explicit exact Pokémon SKU/variant selection, server-verified condition/finish and price binding, buying-preset binding, and local offer drafts without purchase or inventory mutation. Its conservative operator path is privately active at tailnet-only `:9444`.
- `PHR-API-015` exports a marketplace-neutral hash-bound recognized asset and pure TCGplayer/Liga draft rows. TCGPLAYER Tools, LigaMagic, and LigaPokémon remain independent consumers; none receives publication authority from recognition.
- `PHR-UX-026` provides normalized multi-region correction plus versioned local Vision region suggestions, top-left geometry, deterministic reading order, duplicate/container suppression, strict worker validation, and a sealed IoU benchmark. Suggestions remain outside active revisions; real binder qualification is pending.

## Arbitrage Data Continuity And Liga Recurrence

- `PHR-TECH-012` makes `.data/mobile-review.sqlite` the semantic operational pricing database unless a test/operator provides an explicit override. Runtime, observers, imports, artwork maintenance, and provider evidence no longer invent separate fallback files.
- The private runtime uses `scripts/start-phronesis.mjs`, supervising catalogue observation with Next.js. A newly imported Magic checkpoint rebuilds the last complete LigaMagic crosswalk exactly once.
- `PHR-API-013` generalizes the authenticated Liga export boundary without sharing profiles: LigaMagic and LigaPokemon keep separate hosts, Chrome profiles, debug ports, configuration, runs, hashes, receipts, and SQLite namespaces.
- Daily recurrence is sequential, overlap-safe, same-day idempotent, and status-bearing. Complete conflict-free LigaMagic snapshots rebuild the Magic crosswalk; one provider failure never deletes last-good evidence from another.
- LigaPokemon's official authenticated export route is confirmed, but its controls and bytes remain owner-authenticated evidence. Full acquisition requires a successful pilot and regional promotion remains deferred.
- The external TCG catalogue acquisition tool is a separate owner. Its intended 00:00/06:00/12:00/18:00 schedule is currently inactive; Phronesis can observe/import new checkpoints but cannot make stale upstream files current.

## GitHub Handoff Continuity

- `PHR-TECH-011` makes GitHub a verifier of committed repository truth, not a second Handoff author.
- Project validation installs the locked Node dependency graph before test, lint, build, and diff gates. Continuity validation checks the exact PR head with full history.
- Feature branches receive one pull-request run; direct pushes are limited to `main`, avoiding duplicate email-producing runs for the same feature commit.
- Local implementation commits remain distinct from the generated Handoff seal so stale or dirty continuity cannot be published as current.

## Assisted Sealed Artwork Recovery

- `PHR-UX-024` stages uncertain Pokémon sealed community-image metadata and runs a conservative versioned representative policy before exposing the genuine exceptions in Administration Settings.
- Active private coverage is 356 / 2,894 exact (12.30%) plus 118 assisted representatives, for 474 / 2,894 visible (16.38%). The manual exception queue now contains 901 products.
- `OWNER_APPROVED_REPRESENTATIVE` and `ASSISTED_REPRESENTATIVE` provenance remain separate from exact. Every representative is audited, reversible, and blocked by any current exact mapping.
- The earlier 47.51% figure is a theoretical queue ceiling, not a verified match rate. The v1 pass refuses 421 broad mixed-product guesses, 504 value-sensitive/composite variants, and 41 package variants; 1,519 unsupported/unmatched products still require another source or curated uploads.

## Community Pokémon Artwork Gap Fill

- `PHR-API-004` now consumes PokéFiles as a validated public catalogue snapshot and `1niceroli/ptcg-assets` as an immutable Git-tree manifest; no paid Scrydex API is required.
- PokéFiles resolves only exact English set, collector, and material artwork identity. `ptcg-assets` resolves only exact set, compatible sealed-product class, and unique descriptor evidence.
- The active database contains 31,286 / 43,732 mapped Pokémon single rows (71.54%) and 356 / 2,892 mapped sealed rows (12.31%). The sealed recovery pass added 165 exact mappings, an 86.4% relative increase.
- The 1,500 highest-priority unique sources are cached locally. One dead PokémonTCG source was replaced by exact TCGdex identity evidence; all final cache requests pass.
- Residual sealed uncertainty is explicit: 1,019 possible-but-non-exact and 1,517 unmatched/unsupported rows remain placeholders rather than receiving guessed product art.

## PriceCharting Multi-Game Daily Snapshots

- `PHR-API-012` extends the receipt/promotion architecture to versioned `magic-en` and `onepiece-en` profiles without altering Pokémon v9 or creating a second catalogue.
- PriceCharting `tcg-id` is not semantically compatible with the current Phronesis source-SKU namespace for the supplied Magic and One Piece files. It remains stored corroboration and is never a join or tie-breaker.
- Magic v2 accepts 109,841 of 129,485 eligible source singles (84.83%); One Piece v3 accepts 4,731 of 6,122 eligible English source singles (77.28%). The dry-run residual stays explicit: absent catalogues, sealed products, non-English records, ambiguous distributions, and source/target collisions are inactive.
- Daily acquisition reads encrypted owner-provided subscription download URLs, permits only HTTPS PriceCharting hosts, checks same-host redirects/content/schema/game, spaces CSV calls by ten minutes, stores immutable downloads, and activates each game independently only after a complete import.
- Per-game UTC-day state makes one-shot/watch operation restart-idempotent. No host scheduler is installed and no game is active until the owner supplies URLs and approves a supervised apply.

## PriceCharting Bulk Evidence

- `PHR-API-011` extends the live `PHR-API-010` verifier with an immutable local bulk-evidence path; it does not create a parallel canonical catalogue.
- PriceCharting product ID is the provider Market Identity key. TCG ID, UPC, ASIN, and ePID are typed corroborating aliases and never stand alone as identity proof.
- A provider receipt is validated and resolved entirely in staging. Only collision-free one-to-one mappings may become active through one atomic receipt pointer; ambiguity, source/target collision, unsupported collectibles, malformed rows, and unmatched identities remain durable diagnostics.
- The earlier heuristic benchmark found 13,957 collision-free candidates. Implemented resolver v9 proves 33,379 one-to-one candidates, including 32,099 with graded evidence, through decorated-name/full-collector normalization, explicit set and physical-pattern rules, exact annotations, and sibling-proven finish semantics while still enforcing protected qualifiers. Its current residual includes 1,704 collision rows across 745 targets and 387 ambiguous rows; neither class can activate.
- PriceCharting observations never write TCGplayer-owned price lanes. TCG Direct Low precedence remains authoritative, PriceCharting Ungraded remains separately attributed corroboration, and the CSV supplies no artwork.
- Receipt, staging, promotion, evidence, and reporting infrastructure are provider/game neutral. The 2026-08-01 owner receipt is dry-run only and no active pointer exists. One Piece and Magic require separate audited identity profiles; recurring acquisition is a later orchestration layer over the same importer.

## Inventory Operations

- `InventoryRepository` converts finalized receipt lines into immutable-provenance lots, then separately owns operational locations, physical counts, and disposition evidence.
- Receipt quantity, approximate Bulk intake, acquisition cost, event/receipt/operator provenance, and prior counts are immutable source evidence.
- `current_quantity` is a materialized operational projection: counts establish it, active dispositions decrement it, and eligible reversals restore it atomically.
- `PHR-WORKFLOW-010` classifies inventory leaving as Sale, Loss, Damage, Transfer Out, or Correction. Gross sale proceeds remain evidence only—not profit or settlement.
- Disposition creation is workspace-idempotent. Reversal never deletes the original and is blocked after a later count revision would make restoration ambiguous.
- `/inventory` and `/api/inventory` require assigned module access; mutations independently require `INVENTORY:OPERATE` and DAL ownership checks.

## LigaMagic Authenticated Snapshot

- `PHR-API-005` launches a dedicated LigaMagic profile as ordinary Chrome for manual authentication, then relaunches and attaches Playwright over a local CDP port only after the saved session exists. It never automates login or copies Safari/default-profile cookies.
- LigaMagic collection export uses `Padrão LigaMagic CSV [Modelo para Coleções]`; the similarly named 13-column format contains no prices and is rejected.
- Collection labels count physical card quantity, while CSV rows are unique collection entries. Completeness reconciles the label against summed `Quantidade` and records row count separately.
- `Compra` is the consumer acquisition price from a store. `Venda` is the store buy offer to a consumer. Both remain distinct integer-centavo evidence lanes.
- The completed local dry run covers 37 collections and 329,976 cards with zero conflicting duplicate prices. Raw files, hashes, receipts, the manifest, and SQLite snapshot live under ignored `.data/ligamagic/`. The original `PHR-API-005` delivery had no schedule; `PHR-API-013` now owns the loaded 03:00 recurrence and crosswalk promotion.

## Regional Cross-Market Intelligence

- `RegionalIntelligenceRepository` joins LigaMagic and TCGplayer only through exact name, collector number, finish, and edition identity. Evidence-derived edition aliases additionally require two unique anchors, a single conflict-free target, structural compatibility, and language/treatment qualifier preservation.
- The accepted source pair maps 86,392 identities and provides 86,032 two-sided price pairs; 133,146 supported identities remain unmatched, zero ambiguous identities are adopted, and 109,763 Textless rows remain quarantined.
- US-to-Brazil analysis treats TCGplayer delivered/listing evidence as acquisition cost. Brazil-to-US analysis treats TCGplayer market/listing evidence as resale value. LigaMagic Compra remains Brazilian consumer retail evidence; Venda remains a dealer-buy benchmark.
- Official BCB PTAX is operational, but owner direction costs and real executable availability remain mandatory before an opportunity can become `ACTIONABLE`.

## Card-Show Operations

- `PHR-UX-020` keeps purchase corrections inside the canonical operator-owned open cart. Exact lines may change unit value and quantity; Bulk may change total value and optional approximate count. The server preserves line identity/evidence, finalization rejects unsaved UI drafts, and submitted receipt/ledger/Inventory/Case records remain immutable.
- `PHR-UX-019` places the canonical ready buying offer immediately above `Current purchase` in the single Event station. Its collapsed state shows the recommendation plus TCG Low/Market evidence; expansion reveals the existing opening, target, and walk-away ladder without introducing another calculation path.
- `PHR-API-009` owns one embedded grader registry. PSA may use its documented bearer-authenticated public API when configured; Beckett/BCCG, TAG, CGC, and SGC are explicit `OFFICIAL_API_REQUIRED` capabilities and never fall through to scraping.
- `PHR-UX-018` makes rapid purchase composition spatially primary: Catalogue results sit beside the single canonical Event station on desktop, while evidence and buying analysis remain in a second band. Phone DOM order is results, checkout, evidence, decision; no transaction owner or state is duplicated.

- `CatalogueWatchRefresh` resolves exact SKUs or a single physical identity from the current local catalogue; provider set-label drift cannot weaken collector/finish/language/product-type uniqueness.
- `PurchaseLedgerRepository` owns workspace/operator events, payment-aware ledger entries, sold-item rows, carts, idempotent immutable receipts, close snapshots, and append-only reversal/void audit in the ignored application database. `PHR-WORKFLOW-006` extends those records additively without rewriting receipt evidence.
- An Event begins with declared single-currency opening cash. Manual Sales carry one overall amount plus one or more required description/quantity sold-item rows and never require or mutate Inventory.
- Expected cash is opening cash plus active Cash Sales, minus active Cash Purchases, plus reasoned Cash Adjustments. Card, Transfer, and Other entries remain event totals without drawer effect. Closing records actual cash and variance; net cash movement is not profit.
- Evaluated Vendor Workspace purchases retain atomic receipt/Inventory intake and add one linked ledger Purchase in the same transaction. Manual-entry reversal is append-only; linked purchase correction stays receipt-owned.
- `PHR-UX-015` gives Vendor Workspace a Lite Quick Sale mode that posts to the same active Event Ledger API, repository, validation, idempotency, summary, and activity as `/event-ledger`; no parallel cash state exists.
- `PHR-WORKFLOW-012` adds event-scoped stock allocation from a strict five-column, SHA-256-recorded Google Sheet CSV snapshot. Both Sale surfaces use one exact-option picker; Sale/reversal movements and ledger rows commit atomically, while manual lines remain explicitly untracked.
- Event stock does not replace global Inventory. Opening quantities and imported option facts remain immutable after the first tracked Sale; expected leftover is derived from append-only movements, and physical counts remain separate variance evidence.
- Sold reports preserve the actual whole-Sale amount separately from imported unit list price. Leftover reports preserve opening, sold, expected, counted, and variance without inferring loss or another Sale.
- `PHR-WORKFLOW-013` derives Event Flip directly from finalized receipt-backed Inventory. Exact single-card lots can be quantity-selected and intended-price marked in batches; Vendor Workspace may instead mark an eligible cart line with a required Case price so receipt, lot, and reservation commit together. Sealed, aggregate Bulk, and description-only manual Purchases remain visible but General-only until separately itemized.
- `PHR-WORKFLOW-014` models Display Case as a reserved allocation over owned Inventory. Allocation changes reserved/general-available quantities but not total owned; a linked Sale atomically decrements Case and the underlying lot, and eligible reversal restores both.
- Display Case combines prepared opening stock and purchase-derived Case items only at the presentation/report boundary. One source-labelled Sale picker serves full and Lite Event Ledger, while actual whole-Sale revenue remains separate from imported or handler-entered list price.
- General Inventory exposes owned on-hand, Display Case reserved, and generally available quantities and rejects dispositions, counts, or receipt voids that would invalidate Case evidence. Binder Inventory is reserved as future `PHR-WORKFLOW-015` with no current route or schema.
- Vendor Workspace defaults to Purchase intake and exposes only incidental Sale capture plus current expected cash/gross sales. Event start, full activity, adjustment, reversal, correction, close, and reconciliation remain owned by `/event-ledger`.
- Employee activation codes are salted scrypt hashes and only unlock an invited identity ceremony; server module entitlements remain authoritative.
- `CuratedArtworkStore` binds validated local raster content to one category/SKU and serves it through the protected artwork boundary.
- `/event-ledger` is the primary event-control surface. `/vendor` presents the Offer Ladder and feeds both evaluated purchases and manual Quick Sales into that same active Event Ledger.

## Identity-Backed Price Monitoring And Market Evidence

- `PHR-API-008` dedicates a local 100-credit UTC-day PkmnPrices policy budget to `/v1/sealed`. Open Pokémon set metadata orders releases newest first; durable usage/cursors prevent restart overrun, and exact local name+set corroboration is required before artwork resolution. The worker remains dormant without a sealed-enabled provider key.
- `WatchlistRepository` owns user/workspace-scoped default lists, exact variant memberships, soft deletion, history, and deterministic legacy ownership in the shared ignored SQLite boundary.
- Vendor Workspace creates an exact artwork/finish/condition/language watch in one action; duplicate tracking is idempotent and newly created membership can be undone inline.
- Verified Pricing Update Tool receipts refresh matching watch entries from the local pricing repository without creating a second provider schedule.
- `MarketEvidenceRepository` keeps `MARKET_ESTIMATE`, `ACTIVE_LISTING`, and `OBSERVED_SALE` separate and user-owned.
- JustTCG enrichment is opt-in and budgeted. Official eBay Browse and CardTrader adapters are credential-gated and user-triggered; no provider runs on initial evidence load.
- Completed sales remain first-party observations until a licensed completed-transaction source is authorized. Active listings and aggregate estimates are never promoted into sold evidence.

## Internal Identity And Module Authorization

- `PHR-ARCH-016` adds Better Auth email/password registration without conflating identity with authority. New users receive one Phronesis-owned pending request and no membership; an authorized administrator verifies the person out of band and grants exact role/module/access pairs atomically. Pending and rejected accounts cannot enter protected modules.
- `PHR-TECH-016` prepares `access.phronesis.com` through a loopback custom-domain gateway. Restricted-public requests require permanent authenticated membership before optional compatibility or timed-worker evaluation and cannot transport-reach Settings, administration, developer, activation, or worker-login paths. Cloudflare/DNS activation remains gated; Tailscale private and event-worker transports remain unchanged.
- `PHR-UX-025` centralizes Phronesis copy actions behind an awaited modern Clipboard API, a direct-tap compatibility fallback, and an explicit selectable manual recovery field. Current worker-code, public-link, and activation-link controls never fail silently or log/persist copied values.
- `PHR-ARCH-011` uses Better Auth database sessions and permanent identity while keeping Phronesis workspace membership and module authorization application-owned. Email/password is enabled by `PHR-ARCH-016`; GitHub remains optional.
- `PHR-ARCH-014` permits account-free timed workers to receive only explicit operational modules. `ARTWORK_REVIEW` is independent from `ADMINISTRATION`: worker `OPERATE` covers manual candidate/gallery decisions, while refresh and assisted recovery remain permanent-identity `ADMIN` operations. Artwork Review alone creates an event-independent timed `TASK`; any transactional module forces active-event `EVENT` scope. Browser-only workers enter through an isolated public Funnel on port 10000 and a loopback gateway; owner Settings/permanent authentication are transport-blocked, public authorization accepts only valid timed sessions, and private owner Serve remains tailnet-only on 9443.
- `AuthorizationRepository` owns the single workspace, memberships, explicit entitlements, local invitations, and append-only audit records in ignored SQLite storage.
- Secure page, Route Handler, and mutation checks live in the server Data Access Layer. Next.js Proxy and filtered navigation are optimistic/user-experience controls only.
- Rollout modes are `DISABLED`, `OPTIONAL`, and `REQUIRED`; disabled is the default and preserves tailnet review. Email/password-required readiness needs a base URL and secret; GitHub remains optional. Restricted-public ingress is strict regardless of private mode.
- Activation remains gated by credentials/owner identity, live callback verification, and disposition of remaining Next transitive advisories.

## Green Verification Baseline

- `PHR-TECH-009` establishes `npm test` (204/204), standalone TypeScript, warning-free lint, production build, and diff validation as the clean product-development gate.
- `HistoryRepository` owns recursive immutability for stored and returned evaluation snapshots.
- `MarketRefreshScheduler` resolves only the evidence domains required by requested fields when choosing capable providers.
- Card finish signals distinguish `Nonfoil` from `Foil`; deterministic provider cases normalize certified local fixtures through the production adapter.

## Visible Buying Intelligence

- `PHR-UX-009` exposes the intelligence explanation already created by the canonical Snapshot purchase evaluation.
- `BuyingIntelligencePanel` derives presentation-only assessment, evidence, confidence, driver, opportunity, risk, and current-action data from `ReadyPurchaseEvaluation`.
- `IntelligenceConsole` remains the detailed model surface; the Vendor panel progressively discloses it rather than defining model-specific UI or another score.
- Asset Assessment, Business Profile, Strategy, Offer Ladder, and Decision Resolver remain engine owners. The panel cannot recalculate or persist their output.
- Desktop keeps intelligence inside the buying-decision column; mobile preserves one-column order without horizontal overflow.

## Cross-Game Snapshot Search And Artwork

- `PHR-TECH-008` activates Lorcana snapshot pricing, raises strict Pokémon set reconciliation through an explicit alias registry, and adds validated Lorcast AVIF retention. Magic, Pokémon, One Piece, and Lorcana are now loaded catalogue games; Riftbound is deferred.
- `PricingRepository.searchAll` owns unified local catalogue search; the API remains backward compatible with category-specific requests.
- `PHR-UX-016` keeps retrieval and scoring on one escaped intent plan. `pricing_search_aliases` stores only reproducible high-confidence One Piece code-to-title discovery aliases derived from exact collector rows; it never changes canonical products or selected identity.
- `groupSearchMatchesByArtwork` creates deterministic category/name/set/collector/language artwork groups while preserving alternate-art descriptors and sealed products.
- Vendor Workspace selects a group, then an exact Finish SKU, then Condition; only that exact snapshot record reaches `evaluatePurchase`.
- `/api/pricing/artwork` dispatches Magic to Scryfall, Pokémon to TCGdex, Lorcana to Lorcast, and One Piece to the official Bandai English card list. Riftbound returns an explicit authorization state.
- `/api/pricing/image` is the fail-closed same-origin boundary for approved provider rasters. It validates exact hosts/paths and content, then reuses ignored `.data/artwork/` image/metadata pairs.
- Identity-provider artwork is presentation evidence only. Catalogue snapshots remain price evidence and provider results never mutate local catalogue records.
- `PHR-UX-009` now reads `evaluation.cardProfile.intelligenceModels` and `assetAssessment` through the visible buying-intelligence panel.

## Application Structure

`PHR-UX-006` defines the lifecycle map used by the production shell, and `PHR-UX-014` makes that map reachable at phone widths:

```text
Discover   -> Opportunities       -> / and /opportunities/[id]
Decide     -> Vendor Workspace    -> /vendor and /evaluate
Monitor    -> Market Watch        -> /watchlists
Administer -> Settings            -> /settings
Manage     -> Event Ledger        -> /event-ledger
Manage     -> Event Flip          -> /event-flip
Manage     -> Display Case        -> /display-case
Manage     -> General Inventory   -> /inventory
```

Primary navigation ownership lives in `lib/navigation/ProductNavigation.ts`. `AppShell` passes one server entitlement-filtered list to the persistent desktop sidebar and the accessible phone drawer; responsive renderers never own permission logic. Developer routes are intentionally outside this map.

## Product Development Governance

- Canonical product identity: Phronesis (`PHR-ARCH-010`).
- Canonical workflow: shared `MASTER-CANONICAL-WORKFLOW` revision 1.2.0 through `.agents/WORKFLOW.md`; `PHR-WORKFLOW-002` is historical and `PHR-WORKFLOW-003` records adoption.
- Canonical repository root: `/Volumes/JarvisSSD/Projects/Phronesis` (`PHR-TECH-003`). The former checkout is rollback-only.
- Durable conversation-derived memory: `docs/product-development/CONVERSATION_HISTORY.md` (`PHR-TECH-002`).
- Role contracts: `.agents/roles/`.
- Documentation review: `docs/reviews/2026-07-22-documentation-practices-review.md`.
- Continuation decision: evolve the current tested architecture; do not restart without a separate evidence-backed CTO decision.

## Snapshot-Powered Vendor Workspace

`PHR-WORKFLOW-004` makes `/vendor` the desktop-first card-show buying station. A read-only observer follows verified Pricing Update Tool catalogue completions for Magic, Pokémon, and One Piece, a strict adapter imports them into the local SQLite pricing repository, and both `/vendor` and `/price-lookup` consume that shared data. Vendor Workspace converts an exact product/finish/condition selection into the existing Business Profile, evaluation, offer-ladder, and decision pipeline; it does not implement a second recommendation engine. Failed imports preserve last-good data, and unchanged later downloads advance freshness without duplicating history.

Event-readiness revision `PHR-TECH-006` activated the July 29 18:20 catalogues and added pre-import archival for future transient receipts. `PHR-UI-002` added fixed thumbnail slots and strict, non-blocking Scryfall enrichment for Magic. `PHR-API-002` subsequently added Pokémon/TCGdex, Lorcana/Lorcast, and authorized official Bandai One Piece artwork; `PHR-TECH-007` retains approved images locally. Riftbound remains authorization gated.

The 2026-07-30 `PHR-TECH-007` remediation identifies Phronesis on provider image downloads so Scryfall-backed Magic images can enter the durable cache, and derives Lorcast queries from exact catalogue names while retaining strict set/collector attachment.

Atlas is the permanent project knowledge base for Phronesis and Project Phronesis (Engineering Initiative).

Project Phronesis is the internal engineering identity for the initiative building an evidence-driven decision intelligence platform for collectible markets. It is not necessarily the future customer-facing product name.

## Cross-Game Identity Ontology

`PHR-ARCH-007` implements four linked identity layers: Gameplay Identity, Printing Identity, Physical Variant Identity, and Market Identity. Market Observation, Inventory Instance, and OwnershipRelationship remain separate state. Lorcast rarity is Printing Identity, Scryfall finishes are Physical Variant availability, and TCGplayer Product/SKU identifiers are Market Identity. Provider field names never determine semantics by themselves.

## Identity Presentation Layer

`PHR-ARCH-009` keeps PHR-ARCH-007 immutable while translating canonical concepts into collector vocabulary. With PHR-UX-005, production surfaces say Set, Treatment, Printing, Market, and Condition. Developer diagnostics show both the canonical source and presentation translation. Lorcast Enchanted presents as Treatment; its provider-unavailable Printing is suppressed. Cold Foil is never inferred from rarity, treatment, or price lanes.

PHR-UX-005 applies collector density rules: Physical Finish is presented as Printing, while published set identity is presented as Set. Standard Treatment and Regular/Normal/Nonfoil/provider-unavailable Printing are hidden. Enchanted remains visible as Treatment; Cold Foil remains visible only as Printing. Hidden values and reasons remain available in developer mode.

## Identity Fidelity and Treatment

`PHR-ARCH-006` established the current Treatment compatibility model and its provenance diagnostics. The later `PHR-ARCH-007` semantic audit identifies a necessary refinement: Lorcast rarity-derived Standard, Enchanted, Promo, and Iconic values describe printing rarity/design, not proven physical finish. Until the proposed migration is implemented, these remain current compatibility projections rather than authoritative Physical Variant Identity. Market fields are never identity evidence.

## Documentation Index

Planning documents are separated by responsibility:

- Documentation-first development system: `docs/DOCUMENTATION_FIRST_DEVELOPMENT.md`
- Feature registry: `docs/FEATURE_REGISTRY.md`
- Feature specification template: `docs/templates/FeatureSpecificationTemplate.md`
- Implementation prompt template: `docs/templates/ImplementationPromptTemplate.md`
- PHR-TECH-001 specification: `docs/technical/PHR-TECH-001-documentation-first-development-system.md`
- PHR-TECH-001 implementation prompt: `docs/prompts/PHR-TECH-001-implementation-prompt.md`
- Project Phronesis founding charter: `docs/PROJECT_PHRONESIS_FOUNDING_CHARTER.md`
- PHR-ARCH-001 founding charter specification: `docs/architecture/PHR-ARCH-001-founding-charter.md`
- Foundation index: `FOUNDATION/FOUNDATION_INDEX.md`
- Foundation engineering philosophy: `FOUNDATION/ENGINEERING_PHILOSOPHY.md`
- Foundation product philosophy: `FOUNDATION/PRODUCT_PHILOSOPHY.md`
- Foundation business philosophy: `FOUNDATION/BUSINESS_PHILOSOPHY.md`
- Foundation decision principles: `FOUNDATION/DECISION_PRINCIPLES.md`
- Foundation communication principles: `FOUNDATION/COMMUNICATION_PRINCIPLES.md`
- PHR-ARCH-002 foundation governance specification: `docs/architecture/PHR-ARCH-002-foundation-governance.md`
- Corporate Foundation organization: `docs/architecture/PHR-ARCH-003-corporate-foundation-organization.md`
- Brand production brief: `FOUNDATION/02_Brand/Brand_Production_Brief_v1.0.md`
- Partnership submission package: `FOUNDATION/PARTNERSHIP_SUBMISSION_PACKAGE/README.md`
- PHR-UX-001 executive partnership deck: `docs/ux/PHR-UX-001-executive-partnership-deck.md`
- PHR-WORKFLOW-001 Market Watch MVP: `docs/workflows/PHR-WORKFLOW-001-market-watch-mvp.md`
- TCGplayer executive partnership deck source: `docs/business/TCGPLAYER_EXECUTIVE_PARTNERSHIP_DECK.md`
- Project Phronesis: `docs/PROJECT_PHRONESIS.md`
- Brand philosophy: `docs/BRAND_PHILOSOPHY.md`
- Engineering roadmap: `docs/ROADMAP.md`
- Product roadmap: `docs/PRODUCT_ROADMAP.md`
- Business strategy: `docs/BUSINESS_STRATEGY.md`
- Partnership strategy: `docs/business/PARTNERSHIP_STRATEGY.md`
- IP strategy: `docs/business/IP_STRATEGY.md`
- Partner disclosure policy: `docs/business/PARTNER_DISCLOSURE_POLICY.md`
- TCGplayer partnership proposal: `docs/business/TCGPLAYER_PARTNERSHIP_PROPOSAL.md`
- Idea ledger: `docs/IDEA_LEDGER.md`
- Monetization possibilities: `docs/MONETIZATION.md`
- Platform v1.0 release freeze: `docs/releases/Platform-v1.0.md`
- Architecture: `docs/ARCHITECTURE.md`
- Decisions: `docs/DECISIONS.md`
- Sprint history: `docs/SPRINT_HISTORY.md`
- Agent handoff: `docs/AGENT_HANDOFF.md`

Rule:

Engineering, product, and business planning should evolve independently. Product ideas should not be promoted into engineering work until they are scoped into an engineering roadmap item or work order.

Documentation-first rule:

Every meaningful change must be classified, documented with a permanent Feature ID, and kept traceable through specifications, prompts, implementation notes, release notes, and dependent documentation. Implementation follows documentation. The initial system record is `PHR-TECH-001`.

## Documentation-First Development Registration

Registered system:

- Feature ID: `PHR-TECH-001`
- Name: Documentation-First Development System
- Status: Completed
- Source of truth: `docs/DOCUMENTATION_FIRST_DEVELOPMENT.md`
- Specification: `docs/technical/PHR-TECH-001-documentation-first-development-system.md`
- Implementation prompt: `docs/prompts/PHR-TECH-001-implementation-prompt.md`
- Templates: `docs/templates/FeatureSpecificationTemplate.md` and `docs/templates/ImplementationPromptTemplate.md`
- Agent rule: `AGENTS.md`

Documentation taxonomy:

- `docs/backlog/`
- `docs/prd/`
- `docs/architecture/`
- `docs/technical/`
- `docs/database/`
- `docs/api/`
- `docs/ui/`
- `docs/ux/`
- `docs/workflows/`
- `docs/business-rules/`
- `docs/testing/`
- `docs/roadmap/`
- `docs/release-notes/`
- `docs/future/`
- `docs/prompts/`

## Lightweight Watch History Registration

- Feature ID: `PHR-UX-004`
- Model/calculations: `features/watchlist/WatchHistory.ts`
- Details: `features/watchlist/WatchDetails.tsx`
- Sparkline: `features/watchlist/WatchSparkline.tsx`
- Ownership: watchlist membership only
- Initial value: first value captured at membership creation/migration
- Observation append: successful valuation refresh only
- Retention: latest 32 watch-owned observations
- Excluded: pre-watch provider history, analytics routes, forecasting, full charts

Rule: Market Since Added compares current valuation with initial watch valuation and never uses target price.

## Capability-Aware Workflows Registration

- Feature ID: `PHR-UX-003`
- Registry: `lib/capabilities/PlatformCapabilityRegistry.ts`
- Resolver: `lib/capabilities/PlatformCapabilityResolver.ts`
- Shared UI: `components/ui/CapabilityCard.tsx`, `components/ui/StatusBadge.tsx`
- Market Watch lifecycle: Create, View, Edit, Remove, Confirm, Undo
- Membership scope: `watchlistId`; current default is `default`
- Removal boundary: WatchlistStorage only
- Protected data: canonical identity, repository observations, replay fixtures, market history
- Magic: Identity and Market Operational
- Lorcana: Gameplay/Printing/Artwork/Printing Design Operational; Physical Variant Unavailable from provider; Market Pending
- Acquisition rule: non-operational market capability never invokes refresh

Rule: unknown evidence and unavailable capability are distinct states and must never share misleading presentation.

## Identity Platform Registration

- Feature ID: `PHR-ARCH-004`
- Orchestrator: `lib/engines/identity/IdentityOrchestrator.ts`
- Registry: `lib/engines/identity/IdentityProviderRegistry.ts`
- Selection: explicit game → parsed/search context → user preference → Magic fallback.
- Canonical model: PHR-ARCH-007 ontology contracts in `types/identityOntology.ts`, composed by `CanonicalIdentityModel` in `IdentityProviderAdapter.ts`.
- Mapping repository: typed provider aliases in `IdentityMappingRepository.ts`.
- Operational: Magic → Scryfall; Lorcana → Lorcast; Pokémon → TCGdex; One Piece → Bandai official English card list.
- Pending: Flesh and Blood.
- Outcomes: Operational, No Match, Provider Pending, Provider Not Configured, Provider Offline.
- Boundary: identity never requests prices, valuations, observations, or market evidence.

Rule: application and UI layers consume Identity Orchestrator output and never import a concrete identity provider.

### Lorcast Capability

- Feature ID: `PHR-API-001`
- Domain: Identity only
- Endpoint: `GET /v0/cards/search`
- Search mode: `unique=prints`
- Cache: 24-hour in-memory query cache with in-flight coalescing
- Request pacing: 75ms minimum spacing
- Artwork: API-returned digital small/normal/large URIs
- Excluded: `prices.usd`, `prices.usd_foil`, valuation, market evidence
- Errors: no match, malformed query, rate limited, provider offline, network failure

## Global Command Palette Registration

- Feature ID: `PHR-UX-002`
- Shell entry: `components/ui/Topbar.tsx`
- Orchestrator: `components/search/CommandPalette.tsx`
- Routing boundary: `components/search/CommandPaletteRouter.ts`
- Current mode: Cards
- Search flow: Identity API → Eligibility Engine → identity → printing → finish → condition.
- Context actions: Market Watch owns entry creation; Vendor Workspace owns purchase-evaluation continuation.
- Request economy: palette search never calls market snapshots or JustTCG.

Rule: the command palette routes typed selections and never owns workflow business logic.

## Asset Visual Identity Registration

- Feature ID: `PHR-UI-001`
- Canonical component: `components/cards/CardThumbnail.tsx`
- Image presentation: `components/cards/CardImage.tsx`
- Resolution cache: `components/cards/CardImageCache.ts`
- Fallback: `components/cards/CardImagePlaceholder.tsx`
- Source order: Repository, Replay, Provider, then Placeholder; repeated resolutions report Cached.
- Performance boundary: UI resolution cache owns URL selection; Next.js and browser HTTP caches own image bytes.
- Extension boundary: `CardThumbnailPreview` attaches viewport-clamped hover/focus enlargement to existing image candidates; contextual overlays and quick actions remain future extensions.

Rule: product modules must not independently render or select card artwork.

## Market Watch MVP Registration

Registered workflow:

- Feature ID: `PHR-WORKFLOW-001`
- Name: Market Watch MVP
- Status: Completed
- Workflow specification: `docs/workflows/PHR-WORKFLOW-001-market-watch-mvp.md`
- Implementation prompt: `docs/prompts/PHR-WORKFLOW-001-implementation-prompt.md`
- Validation: `docs/testing/PHR-WORKFLOW-001-market-watch-validation.md`
- Release note: `docs/release-notes/PHR-WORKFLOW-001.md`
- Feature registry: `docs/FEATURE_REGISTRY.md`

Request economy rule:

Market Watch is a repository-first workflow. Initial load must not call providers. Manual refresh targets one entry and delegates repository/provider selection to the existing Market Refresh Scheduler. Developer diagnostics must explain repository hit, provider hit, replay, cache age, observation age, API saved, and provider-request justification.

## Executive Partnership Deck Registration

Registered artifact:

- Feature ID: `PHR-UX-001`
- Name: TCGplayer Executive Partnership Deck
- Status: Completed
- Source proposal: `docs/business/TCGPLAYER_ECOSYSTEM_PARTNERSHIP_PROPOSAL.md`
- Deck source: `docs/business/TCGPLAYER_EXECUTIVE_PARTNERSHIP_DECK.md`
- PPTX: `docs/business/TCGPLAYER_EXECUTIVE_PARTNERSHIP_DECK.pptx`
- Google Slides compatible PPTX: `docs/business/TCGPLAYER_EXECUTIVE_PARTNERSHIP_DECK.google-slides-compatible.pptx`
- DOCX: `docs/business/TCGPLAYER_EXECUTIVE_PARTNERSHIP_DECK.docx`
- PDF: `docs/business/TCGPLAYER_EXECUTIVE_PARTNERSHIP_DECK.pdf`
- Validation: `docs/testing/PHR-UX-001-deck-validation.md`

Communication rule:

The executive deck should remove obstacles between the reader and the core message. Design exists to improve comprehension, not to decorate the proposal.

## Project Phronesis Registration

Registered identity:

- Name: Project Phronesis
- Type: Engineering Identity
- Role: internal engineering initiative
- Philosophy: practical judgment, evidence before conclusions, explainable intelligence, observations separated from reasoning, and transparent business decisions
- Brand rule: not the selected commercial product name
- Partnership language: the internal engineering initiative responsible for building an evidence-driven decision intelligence platform for collectible markets

## Founding Charter Registration

Registered charter:

- Feature ID: `PHR-ARCH-001`
- Name: Project Phronesis Founding Charter
- Status: Completed
- Charter: `docs/PROJECT_PHRONESIS_FOUNDING_CHARTER.md`
- Specification: `docs/architecture/PHR-ARCH-001-founding-charter.md`
- Release note: `docs/release-notes/PHR-ARCH-001.md`

Charter rule:

The charter is the durable philosophy and operating standard for Project Phronesis. Future contributors should use it to make decisions consistent with the engineering organization when founders are not present.

## Foundation Governance Registration

Registered governing foundation:

- Feature ID: `PHR-ARCH-002`
- Name: Project Phronesis Foundation Governance System
- Status: Completed
- Foundation index: `FOUNDATION/FOUNDATION_INDEX.md`
- Founding charter: `FOUNDATION/PROJECT_PHRONESIS_FOUNDING_CHARTER.md`
- Engineering philosophy: `FOUNDATION/ENGINEERING_PHILOSOPHY.md`
- Product philosophy: `FOUNDATION/PRODUCT_PHILOSOPHY.md`
- Business philosophy: `FOUNDATION/BUSINESS_PHILOSOPHY.md`
- Decision principles: `FOUNDATION/DECISION_PRINCIPLES.md`
- Communication principles: `FOUNDATION/COMMUNICATION_PRINCIPLES.md`
- Specification: `docs/architecture/PHR-ARCH-002-foundation-governance.md`
- Release note: `docs/release-notes/PHR-ARCH-002.md`

Foundation rule:

Every future work order begins with Foundation Check, then Architecture Check, then Implementation. The Foundation governs engineering, product, business, partnership, brand, and communication decisions.

## Corporate Foundation Organization Registration

Registered organization:

- Feature ID: `PHR-ARCH-003`
- Name: Corporate Foundation Organization
- Status: Completed
- Foundation root: `FOUNDATION/`
- Founding documents: `FOUNDATION/01_Founding/`
- Brand documents: `FOUNDATION/02_Brand/`
- Business documents: `FOUNDATION/03_Business/`
- Partnership documents: `FOUNDATION/04_Partnerships/`
- Templates: `FOUNDATION/05_Templates/`
- Presentations: `FOUNDATION/06_Presentations/`
- Submission package: `FOUNDATION/PARTNERSHIP_SUBMISSION_PACKAGE/`
- Specification: `docs/architecture/PHR-ARCH-003-corporate-foundation-organization.md`
- Validation: `docs/testing/PHR-ARCH-003-foundation-organization-validation.md`

No duplicate maintenance rule:

Canonical documents should be updated first. The partnership submission package contains copies and should be refreshed by copying from canonical documents before use.

## Partnership Documentation Registration

Registered business documentation:

- Project Phronesis Partnership Strategy: `docs/business/PARTNERSHIP_STRATEGY.md`
- IP Strategy: `docs/business/IP_STRATEGY.md`
- Disclosure Policy: `docs/business/PARTNER_DISCLOSURE_POLICY.md`
- TCGplayer Partnership Proposal: `docs/business/TCGPLAYER_PARTNERSHIP_PROPOSAL.md`

Partnership rule:

Business value may be transparent while proprietary implementation details remain confidential. External materials should position Project Phronesis as the internal engineering initiative, not the commercial brand.

## Platform v1.0 Planning Split

Platform v1.0 freezes the current architecture while creating permanent planning lanes:

- Engineering owns implementation sequencing and platform infrastructure.
- Product owns customer-facing capabilities and product surface evolution.
- Business owns customers, value proposition, growth strategy, monetization philosophy, and open strategic questions.

## Sprint 31D Synchronization

Market Evidence Layer:

- Layer: `MarketEvidenceLayer`
- Aggregation: `EvidenceAggregator`
- Selection: `EvidenceResolver` and `EvidenceSelection`
- Priority: `EvidencePriority`
- Provenance: `EvidenceProvenance`
- Coverage: `EvidenceCoverage`
- Fallback: `EvidenceFallback`

Architecture rule:

Every provider contributes evidence. Repository snapshots store layered evidence. The evidence layer selects the best available value per field. A provider that lacks a field must never erase a value supplied by another provider or by an existing repository snapshot.

Developer diagnostics:

- Evidence stack
- Selected provider
- Fallback reason
- Provider priority
- Freshness
- Coverage

Production rule:

Vendor Workspace continues to display selected market values without exposing provider internals, implementation notes, or evidence stack diagnostics.

## JustTCG Provider Data Model

JustTCG responses are documented in `docs/providers/JUSTTCG_DATA_MODEL.md`.

Provider model rule:

JustTCG fields are not UI fields. The provider returns raw card observations, raw variant observations, price observations, price history observations, and provider-supplied derived statistics. The platform must store raw observations as evidence and derive Market Intelligence internally.

Condition-specific representation:

JustTCG represents condition-specific market data as separate variant objects with fields such as `condition`, `printing`, `language`, `price`, `lastUpdated`, `tcgplayerSkuId`, and `priceHistory`. Near Mint, Lightly Played, Moderately Played, Heavily Played, and Damaged variants must not be collapsed into a generic market snapshot.

Observed special product coverage includes Judge Promos, Buy-A-Box Promos, FNM Promos, Secret Lair Drop Series, Special Guests, and Masterpiece Series: Kaladesh Inventions.

## Sprint 31C Synchronization

Market Truth Model:

- Engine: `MarketTruthEngine`
- Validation: `ProviderEvidenceValidator` and `ProviderMatchValidator`
- Scoring: `ProviderEvidenceScore`
- Classification: `ProviderPricingClassifier`
- Mapping: `ProviderFieldMapping`
- Reports: `ProviderConsistencyReport` and `MarketTruthReport`

Architecture rule:

The repository stores attributed provider evidence, not unexamined provider truth. Provider responses must be normalized, matched to the selected printing, classified by price concept, scored for confidence and coverage, and validated before repository writes.

Validated fields:

- Canonical card identity
- Printing
- Collector number
- Finish
- Condition
- Language
- Game
- Product identifier
- Provider timestamp

Deferred:

Multi-provider consensus remains future architecture. Sprint 31C does not add extra providers, cache redesign, Asset Assessment changes, recommendation changes, Strategy changes, Negotiation changes, or Decision changes.

## Sprint 31B Synchronization

Market Intelligence Repository:

- Repository Health: tracked through `MarketRepositoryDiagnostics`
- Average Freshness: ratio of fresh fields across snapshots
- Cache Hit Rate: cache hits divided by total cache reads
- Provider Usage: snapshot count grouped by provider
- Estimated API Cost Saved: repository hits that avoided provider calls
- Oldest Snapshot: oldest repository update timestamp
- Newest Snapshot: newest repository update timestamp

Architecture rule:

Providers update the repository. Asset Session and business logic consume repository snapshots. Application market routes call `MarketRefreshScheduler`, not providers directly.

Refresh policy:

Every field owns its own TTL. Fresh fields are preserved when another field expires. Slightly stale cached data can be returned immediately while a background refresh updates the repository.

Storage:

Sprint 31B uses local JSON persistence only. The boundary is designed for SQLite, PostgreSQL, Redis, or cloud storage migration.

## Sprint 31A Synchronization

JustTCG live provider connection:

- Provider Registry entry: `justtcg`
- Provider Status: Active
- SDK: `justtcg-js@0.2.1`
- Authentication Status: `JUSTTCG_API_KEY` configured through `.env.local`
- Connection Status: known-card Mox Opal request succeeded during Sprint 31A validation
- Required environment variables: `JUSTTCG_API_KEY`
- Developer inspection: `/dev/justtcg` in development mode only

Architecture rule:

Application code routes through Provider SDK -> JustTCG Adapter -> official JustTCG SDK -> JustTCG API. Application code must not call the SDK directly.

Why the official SDK was selected:

The official SDK owns API versioning, environment authentication, typed card and variant models, usage metadata, pagination metadata, and SDK-level error handling. A custom HTTP client would duplicate provider responsibilities already supplied by JustTCG.

Sprint limits:

No caching, retries, Assessment changes, Strategy changes, Negotiation changes, Decision changes, or production UI changes.

## Sprint 30 Synchronization

TCGplayer Market Intelligence:

- Primary Market Intelligence provider
- SDK-backed adapter
- Normalized `MarketSnapshot.marketIntelligence`
- Raw provider responses remain private to the provider layer

Tracked Atlas fields:

- Provider Coverage
- Provider Health
- Provider Latency
- Evidence Coverage
- Last Synchronization
- API Status

Generated evidence:

- Liquidity
- Inventory Health
- Sales Velocity
- Spread
- Market Confidence
- Volatility
- Market Stability
- Demand Momentum

Rule:

TCGplayer evidence can feed Market Intelligence and Asset Assessment. Business Profiles continue consuming Assessment only, and Negotiation consumes strategy/card-profile outputs without provider coupling.

## Sprint 29 Synchronization

Provider SDK architecture:

- Provider Client
- Provider Adapter
- Provider Evidence
- Provider Health
- Provider Coverage
- Provider Metadata
- Provider Registry
- Provider Diagnostics
- Provider Cache
- Provider Result

Prepared provider metadata:

- EDHREC
- PSA
- BGS
- CGC
- Cardmarket
- TCGplayer
- Melee
- MTGO
- LigaMagic
- eBay

SDK responsibilities:

- Normalization
- Health
- Caching hooks
- Diagnostics
- Evidence mapping
- Confidence contribution
- Provider metadata
- Retry hooks
- Validation hooks

Rule:

Providers supply data only. The SDK owns lifecycle behavior. Planned providers are metadata-only until approved integration paths exist.

## Sprint 28 Synchronization

Asset Assessment architecture:

- Asset Assessment Engine
- Asset Assessment
- Assessment Evidence
- Assessment Reasoning
- Assessment Confidence
- Assessment Summary
- Assessment Registry

Registered assessment outputs:

- Overall Assessment
- Overall Confidence
- Evidence Coverage
- Primary Drivers
- Supporting Drivers
- Risk Factors
- Opportunity Factors
- Business Summary

Dependency graph:

Intelligence Models -> Evidence Sufficiency -> Asset Knowledge Graph -> Asset Assessment Engine -> Business Profile -> Strategy -> Negotiation Ladder -> Decision Resolver.

Rule:

Intelligence models provide evidence. Assessment interprets evidence. Business Profiles and Strategies consume Assessment. Negotiation consumes Strategy output. Decision evaluates the validated offer.

## Asset Knowledge Graph Synchronization

Registered architecture:

- Asset Knowledge Graph
- Knowledge Node
- Knowledge Edge
- Knowledge Query
- Knowledge Graph Registry
- Relationship Registry
- Relationship Resolver

Relationship model:

- Roles
- Mechanics
- Themes
- Archetypes
- Strategies
- Color Identity
- Tribes
- Keywords
- Families
- Universes Beyond
- Reserved List
- Premium Printings
- Formats

Integration points:

- Playability consumes graph relationships for role-aware demand reasoning.
- Certification consumes graph collector relationships for certification relevance.
- Atlas owns future graph diagnostics and implementation details.

Rule:

The graph is semantic infrastructure. It does not decide BUY/PASS, strategy, negotiation, or production presentation.

## Sprint 26 Synchronization

Playability Intelligence maturity:

- Previous: Level 2 Meaningful Intelligence.
- Current: Level 3 Explainable Demand Intelligence.

Registered architecture:

- Playability Provider Adapter
- Demand Model
- Card Role Model

Future provider adapters:

- EDHREC
- MTGGoldfish
- Melee
- MTGO
- Tournament APIs

Rule:

Provider adapters normalize external evidence. Card roles remain provider-independent. Playability measures player demand only.

## Sprint 25.1 Synchronization

Evidence Sufficiency Framework:

- EvidenceRequirement
- EvidenceStatus
- EvidenceScore
- EvidenceReport
- EvidenceSufficiencyEngine

Unknown state:

- Unknown is not failure.
- Unknown means required evidence is insufficient.
- Missing evidence must not become negative evidence.

Evidence status values:

- SUFFICIENT
- PARTIAL
- INSUFFICIENT
- UNKNOWN
- WAITING_FOR_PROVIDER

Atlas owns evidence diagnostics:

- Missing evidence.
- Future provider dependencies.
- Evidence explanation.
- Evidence status.

## Sprint 25 Synchronization

Playability Intelligence maturity:

- Previous: Level 1 Framework.
- Current: Level 2 Meaningful Intelligence.

Playability now measures:

- Why the card is played.
- Where demand comes from.
- Whether demand is Commander, competitive, casual, broad, stable, or meta-dependent.

Future providers:

- EDHREC
- MTGGoldfish
- Melee
- MTGO
- Tournament APIs

Architecture rule:

Playability measures demand. Collector measures collectability. Certification measures certification characteristics. Strategies interpret intelligence. Negotiation consumes strategies.

## Sprint 24.2 Synchronization

Final Intelligence Console UI Contract:

- Grade
- Model-specific Confidence
- Business Conclusion
- Key Signals
- Supporting Evidence

Rules:

- Summary and What This Means are removed from production panels.
- Confidence below High must include a plain-language reason.
- Key Signals are limited to four items.
- Supporting Evidence contains factual support only.
- Expanded tile state persists for the current browser session.
- Atlas remains the exclusive owner of implementation details.

## Sprint 24.1 Synchronization

Layered Information Architecture:

- Layer 1: Decision
- Layer 2: Explanation
- Layer 3: Evidence
- Layer 4: Implementation

Vendor Workspace owns Layers 1-3.

Atlas Inspector owns Layer 4:

- Provider Health
- Provider Status
- Version
- Implementation Details
- Future Dependencies
- Internal Signals
- Debug Information

Nothing is lost. Implementation details are relocated out of production UI.

## Sprint 24 Synchronization

Certification Intelligence is registered as a first-class Asset Intelligence model.

Dependency rule:

Certification Intelligence → Collector Intelligence → Strategy → Negotiation Ladder → Decision Resolver.

Provider abstraction:

- `CertificationProvider`
- `CertificationRegistry`
- Placeholder provider for PSA, BGS, and CGC.
- Future providers: TAG, SGC, ARS.

Backlog:

- Official provider-backed population data.
- Cross-grading indicators.
- Population growth indicators.
- Provider health diagnostics.

Technical debt:

- Certification population, gem population, and gem rate are placeholders until official provider data exists.
- Estimated certification premium is metadata-based and must remain labeled as placeholder.

## Continuity Rule

Every future sprint must update:

- Documentation
- Sprint history
- Roadmap
- Decision log
- Architecture documentation
- Agent handoff
- Backlog changes
- New architectural patterns
- Technical debt

No sprint is complete until Atlas has been synchronized.

## Knowledge Base

- Phronesis is a Decision Operating System for professional TCG buying.
- Vendor Workspace should minimize time from search to decision to next card.
- Vendor Workspace VX should feel closer to a command palette than a traditional form.
- Identity Providers answer what a card is.
- Market Providers answer what a selected printing and finish is worth.
- Card Intelligence produces reusable signals, not recommendations.
- Asset Intelligence models wrap reusable indicators behind a shared framework contract.
- Intelligence Console is the shared presentation layer for all Asset Intelligence models.
- Intelligence Tiles use grade mapping for quick scanning while confidence remains separate.
- Business Profiles make recommendations business-aware.
- Business Profiles supply costs, targets, and assumptions without querying providers.
- Business Profiles own Offer Policy for Offer Ladder consumption.
- System Readiness validates prerequisites before business engines execute.
- Readiness Reports distinguish configuration, data, business rule, calculation, and internal failures.
- Pipeline Inspector identifies the first invalid or unavailable evaluation stage.
- Zero-valued Offer Ladder outputs are invalid unless explicitly intended.
- Playability Intelligence measures play demand and never chooses BUY / PASS.
- Playability providers plug into a registry before strategies consume normalized outputs.
- Workflow Command Processor controls workflow progression and diagnostics.
- Context Invalidation Engine clears downstream dependencies from commands.
- Asset Context owns the current evaluation identity, printing, variant, condition, market, card profile, offer ladder, decision, and generation.
- Atlas Inspector owns developer diagnostics.
- Market Provider data always has precedence over future inferred condition pricing.
- Completed evaluations become immutable Evaluation Snapshots.
- Strategies interpret signals.
- Negotiation Ladder converts strategy into negotiation guidance.
- Offer Ladder Validator checks negotiation math before decisions.
- Decision Resolver compares asking price against the Negotiation Ladder.
- Business engines own decisions; UI renders normalized data.

## Dependency Graph

Vendor Workspace

→ Workflow Command Processor

→ Context Invalidation Engine

→ Asset Context

→ Asset Context Validator

→ Query / Identity / Intent / Constraint Engines

→ Variant Resolution Policy

→ Condition Resolution

→ Market Provider

→ Condition-Aware Market Snapshot

→ Business Profile

→ System Readiness

→ Market Context

→ Asset Intelligence Framework

→ Intelligence Console

→ Intelligence Tile

→ Playability Intelligence

→ Playability Provider Registry

→ Card Intelligence Engine

→ Strategy Signal Weights

→ Business-Aware Cost Model

→ Offer Policy

→ Pipeline Inspector

→ Negotiation Ladder Engine

→ Offer Ladder Validator

→ Purchase Evaluation Engine

→ Decision Resolver

→ Evaluation History Engine

## Playability Intelligence

Current source: Scryfall legalities.

Provider roadmap:

- EDHREC for Commander deck penetration.
- MTGGoldfish for format popularity and trend.
- Melee, MTGO, and Top8 for competitive metagame results.

Playability dependency rule:

Playability Intelligence → Strategy → Negotiation Ladder → Offer Ladder Validator → Decision Resolver.

Playability must not skip directly to negotiation or decision.

## Intelligence Console

The Intelligence Console replaces bespoke Card Profile intelligence cards.

Tile rule:

- Collapsed tiles show name, grade, confidence, and expand affordance only.
- Expanded tiles show full intelligence detail.
- One tile expands at a time by default.
- Every current and future Intelligence Model uses this same tile contract.

Grade mapping is presentation-only. Engines retain numeric scores and confidence remains separate from grade.

## Business Profiles

Business Profiles define what a card is worth to a specific business.

Current built-in examples:

- Prime Time Retail
- Convention Buying
- Cash Only
- Online Marketplace

Marketplace templates:

- TCGplayer
- eBay
- CardTrader
- Facebook Marketplace
- Discord
- Local Cash
- Convention Sales
- Direct Store

Dependency rule:

Market Estimate → Business Profile → Offer Policy → Strategy → Offer Ladder → Offer Ladder Validation → Decision Resolver.

Business Profile must not query providers, make BUY / PASS decisions, or bypass the Offer Ladder.

Offer Policy fields:

- minimum ROI
- minimum profit
- desired margin
- negotiation aggressiveness
- maximum capital exposure

## System Readiness

System Readiness validates every prerequisite before Strategy, Offer Ladder, or Decision Resolver execution.

Pipeline:

Asset Context → Business Profile → Market Snapshot → Card Intelligence → Strategy → Offer Ladder → Decision.

Readiness states:

- READY
- PARTIAL
- WAITING_FOR_CONFIGURATION
- WAITING_FOR_PROVIDER
- WAITING_FOR_MARKET_DATA
- INVALID
- ERROR

Readiness failure classes:

- Configuration Problem
- Missing Data
- Business Rule Failure
- Calculation Failure
- Internal Error

Production UI should show user-safe blockers such as "Configure Target ROI" or "Market estimate unavailable." Atlas Inspector owns detailed dependency diagnostics.

## Pipeline Integrity

Pipeline Inspector executes the complete purchase evaluation path and records the first invalid stage.

Pipeline:

Asset → Market → Business → Cost Profile → Offer Policy → Strategy → Offer Ladder → Decision.

Each stage captures received inputs, calculated outputs, validation status, fallbacks used, missing fields, execution time, and reason. The first non-READY stage terminates the pipeline.

Business invariant:

If Market Estimate, Costs, Profit, Strategy, and Offer Policy are valid, then Opening Offer, Target Offer, Maximum Buy Price, and Recommended Offer must be positive. A zero-valued ladder is a blocked evaluation, not a PASS decision.

Atlas Inspector may show Pipeline Trace in developer mode. Production users must not see pipeline, trace, undefined, fallback, or zero-default terminology.

→ Immutable Evaluation Snapshot

→ Decision Drivers

→ Debounced Vendor Workspace Presentation

→ Presentation Components

## Architectural Patterns

### Decision-First Workspace

Keep the recommendation visible while the user explores candidate printings.

### Sticky Decision Panel

Desktop Vendor Workspace uses a sticky right-side panel. The printing list remains scrollable and non-sticky.

### Decision Drivers

Business-facing recommendation reasons are generated by `lib/engines/decision/DecisionDrivers.ts`. They explain why the decision was made without repeating visible metrics.

### Dense Printing Rows

Printing rows should show enough information to select confidently without opening a detail view: thumbnail, set, collector number, language, finish, printing style, release year, and match score.

### Chip-First Refinement

Common buyer refinements should be buttons before free-text fields. This keeps fast workflows discoverable and reduces typing during in-person buying.

### Automatic Debounced Evaluation

Vendor Workspace should update decisions automatically after a short input debounce. UI may debounce user input, but pricing, profit, ROI, confidence, and recommendation logic remain engine-owned.

### Keyboard-Safe Shortcuts

ESC can reset the workflow globally. Arrow and Enter shortcuts should only act when the user is not typing into an input, textarea, or select.

### Workflow Command Architecture

Vendor Workspace progression is deterministic and tracked through `types/VendorWorkflowState.ts` and `lib/workflow/commands/WorkflowCommandProcessor.ts`.

Commands describe intent:

- `SearchCards`
- `LoadSearchResults`
- `HighlightCard`
- `SelectCard`
- `SelectPrinting`
- `SelectVariant`
- `SelectCondition`
- `ChangeStrategy`
- `EnterAskingPrice`
- `Evaluate`
- `ResetWorkspace`
- `ReportWorkflowError`

Workflow states:

- `Idle`
- `Searching`
- `CandidatesFound`
- `IdentityHighlighted`
- `IdentitySelected`
- `PrintingsLoaded`
- `PrintingSelected`
- `VariantResolved`
- `ConditionResolved`
- `ReadyForEvaluation`
- `Evaluating`
- `EvaluationComplete`
- `Error`

Workflow invariant:

Every successful identity selection must reach either `ReadyForEvaluation` or `Error`.

Identity rows must preserve three distinct meanings:

- Suggested: a search candidate.
- Highlighted: current keyboard or navigation target.
- Selected: committed identity for printing and evaluation.

Single Printing Rule:

If a selected identity has exactly one printing, Vendor Workspace should auto-select that printing, resolve the finish variant and condition, load market intelligence, and prepare evaluation. If the printing, market estimate, or supported finish cannot be resolved, the workflow should enter `Error`.

### Workflow Ownership

Workflow owns:

- Highlighted Identity
- Selected Identity
- Selected Printing
- Selected Variant
- Selected Condition
- Market Context
- Selected Strategy
- Asking Price

UI components may dispatch workflow commands. They must render workflow context and must not own selected workflow state.

### Asset Context Integrity

Asset Context is the generated reference chain for one purchase evaluation:

Identity

→ Printing

→ Variant

→ Condition

→ Market Context

→ Market Snapshot

→ Card Profile

→ Offer Ladder

→ Decision

Workflow Command Processor owns Asset Context and increments `generation` whenever upstream context changes. Objects from older generations are stale automatically.

`lib/workflow/AssetContextValidator.ts` classifies context as:

- `Valid`
- `Invalid`
- `Incomplete`

Business invariants:

- Selected identity must own the selected printing.
- Selected printing must own the selected variant.
- Market snapshot must match selected printing and variant.
- Card Profile, Offer Ladder, and Decision ids must reference the same generation.
- Stale market snapshots are rejected before they can drive evaluation.

### Condition Pricing Lifecycle

Condition changes are Asset Context changes.

Flow:

ChangeCondition command

→ New Asset Context generation

→ Downstream invalidation

→ Market Provider request

→ Market Snapshot attached to matching generation

→ Existing condition-aware market snapshot pipeline

→ Card Intelligence

→ Offer Ladder

→ Decision Resolver

Provider precedence rule:

If a Market Provider can supply real pricing data, that data must be used. Future Condition Intelligence may only fill gaps when provider data is unavailable, and it must never override provider data.

TODO:

- Add provider-native condition price support when marketplaces expose it.
- Add Condition Intelligence fallback only for missing provider data.
- Add provider-vs-inference trace snapshots to Atlas Inspector.

### Atlas Inspector

Developer diagnostics live in Atlas Inspector, not production Vendor Workspace.

Activation:

- Cmd+Shift+D on macOS
- Ctrl+Shift+D elsewhere

Panels:

- Workflow
- Asset Context
- Query Parser
- Canonical Resolution
- Intent Resolution
- Printing Resolution
- Card Intelligence
- Offer Ladder
- Decision Trace
- Performance
- Provider Trace

### Intelligence History Platform

Every completed `READY` evaluation is historical intelligence.

Snapshot lifecycle:

Completed Evaluation

→ Snapshot Factory

→ Snapshot Validator

→ History Repository

→ Immutable Evaluation Snapshot

Snapshots capture:

- timestamp
- Asset Context generation
- identity
- printing
- variant
- condition
- Market Context
- Buying Strategy
- Market Estimate
- Offer Ladder
- Decision
- confidence
- Card Intelligence indicators

Rules:

- Snapshots are immutable.
- History is append-only.
- Incomplete snapshots are rejected.
- Business engines never mutate history.
- Vendor Workspace reads current state only.

Future systems consume this history:

- Backtesting
- Strategy Replay
- Market Replay
- Signal Validation
- Simulation Platform
- Personal Buying History
- Portfolio Tracking

### Context Invalidation

`lib/workflow/commands/ContextInvalidationEngine.ts` clears downstream dependencies automatically.

Invalidation rules:

- Changing Identity invalidates Printing, Variant, Condition, Market Estimate, Card Intelligence, Offer Ladder, Decision, and Evaluation.
- Changing Printing invalidates Variant, Condition, Market Estimate, Card Intelligence, Offer Ladder, Decision, and Evaluation.
- Changing Variant invalidates Market Estimate, Card Intelligence, Offer Ladder, Decision, and Evaluation.
- Changing Condition invalidates Market Estimate, Card Intelligence, Offer Ladder, Decision, and Evaluation.
- Changing Market Context invalidates Market Estimate, Card Intelligence, Offer Ladder, Decision, and Evaluation.
- Changing Strategy invalidates Offer Ladder, Decision, and Evaluation.
- Changing Asking Price invalidates Decision and Evaluation.

Rejected workflow commands must leave workflow context unchanged.

### Card Intelligence Signals

Signals are measurements. They must not contain BUY, NEGOTIATE, PASS, offer, or walk-away decisions.

Current Signal Registry:

- Investment Potential
- Flip Potential
- Grading Potential
- Collector Appeal
- Liquidity
- Volatility
- Scarcity
- Demand
- Playability
- Reprint Risk
- Market Confidence
- Historical Stability

Signal statuses:

- `estimated`: deterministic estimate from current normalized data.
- `placeholder`: reserved for future provider depth.
- `future`: reserved for unavailable analytics.
- `live`: future provider-backed signal.

### Market Context

Market Context records country, region, currency, marketplace, language, tax model, and shipping model. The current default is United States, USD, English, Scryfall Market Provider.

Future Market Context Engine responsibilities:

- Regional valuation
- Currency normalization
- Marketplace selection
- Shipping assumptions
- Tax models
- Import costs
- Regional liquidity
- Regional demand
- Format popularity
- Marketplace-specific multipliers

### Negotiation Ladder

Negotiation Ladder is the single source of truth for negotiation.

It returns:

- Opening Offer
- Target Offer
- Maximum Buy Price
- Walk Away Price

The Decision Resolver must never contradict the Negotiation Ladder.

### Decision Invariants

- Asking price less than or equal to Target Offer must produce BUY.
- Asking price greater than Target Offer and less than or equal to Maximum Buy Price must produce NEGOTIATE.
- Asking price greater than Maximum Buy Price must produce PASS.
- Opening Offer must be less than or equal to Target Offer.
- Target Offer must be less than or equal to Maximum Buy Price.
- Recommended Offer must be less than or equal to Maximum Buy Price.
- Decision Resolver may execute only when Maximum Buy Price exists and the Offer Ladder is valid.
- Missing calculations must be represented as unavailable or invalid, never as fallback zero.
- Condition can change the market estimate, ladder, and decision.
- Card Intelligence cannot make a recommendation by itself.

### Evaluation Integrity

Evaluation pipeline:

Card → Printing → Variant → Condition → Market Context → Asset Intelligence → Strategy → Offer Ladder → Offer Ladder Validation → Decision Resolver → Vendor Workspace.

`lib/engines/negotiation/OfferLadderValidator.ts` validates the Offer Ladder before any decision can be resolved. It checks missing values, impossible values, negative values, ordering, recommended offer bounds, and negotiation margin warnings.

Evaluation Trace records:

- Market Estimate
- Profit Before Costs
- Costs
- Profit After Costs
- Card Intelligence Signals
- Strategy Inputs
- Offer Ladder
- Decision Zone
- Decision
- Validation Status

Production UI must show user-safe unavailable messages. Development UI may expose trace details.

### Signal Versioning

Every Card Intelligence signal includes version, confidence, contributing factors, supporting data sources, and generation timestamp. Future signal improvements should add versions instead of breaking the `Signal` contract.

### Asset Intelligence Framework

Every future intelligence platform must register an Intelligence Model under `lib/intelligence/framework/`.

Model contract:

- id
- name
- version
- status
- confidence
- lastUpdated
- inputs
- outputs
- indicators
- supporting sources
- health
- explanation
- dependency graph

Indicator contract:

- id
- name
- score
- confidence
- version
- status
- data sources
- contributing factors
- last updated
- explanation
- future dependencies

Indicator statuses:

- LIVE
- ESTIMATED
- PLACEHOLDER
- WAITING_FOR_PROVIDER
- DISABLED
- UNKNOWN

Model health:

- Healthy
- Partial
- Missing Data
- Unavailable
- Deprecated
- Experimental

Current and future registered models:

- Market Intelligence
- Collector Intelligence
- Investment Intelligence
- Liquidity Intelligence
- Reprint Risk
- Market Confidence
- Playability Intelligence
- Grading Intelligence
- Regional Intelligence
- Behavior Intelligence
- Historical Intelligence
- Volatility Intelligence
- Demand Intelligence
- Scarcity Intelligence

Dependency graph metadata is included on each model so future Atlas visualizations can show provider and model dependencies.

## Receipt-Backed Inventory Intake (`PHR-WORKFLOW-008`)

Inventory is now an operational Manage-area module. Finalized event receipts create immutable-provenance exact or aggregate Bulk lots inside the checkout transaction. Exact cost basis is unit acquisition cost multiplied by quantity; Bulk cost basis is aggregate and never implies individual card identity. Receipt voids retain and deactivate lots. Workspace/module authorization is enforced at the page and API boundaries. Future inventory work should extend through explicit location, count, disposition, valuation, or listing events rather than editing source receipts.

## Inventory Location And Count Reconciliation (`PHR-WORKFLOW-009`)

Workspace locations and physical counts extend lots through append-only observations. Current on-hand basis is RECEIPT, APPROXIMATE, COUNTED, or UNKNOWN. MOVE and COUNT events retain actor, reason, timestamp, and before/after evidence; a combined reconciliation is atomic. Count discrepancy never rewrites receipt quantity or acquisition cost and does not imply SALE, LOSS, DAMAGE, or TRANSFER. Those future disposition types require a separate ledger.

## Backlog

1. Add marketplace-neutral listing readiness (`PHR-WORKFLOW-011`) without publication, payment, shipping, or automatic repricing.
2. Add live marketplace listings and recent sales.
3. Add EDHREC provider for Commander deck penetration.
4. Add MTGGoldfish provider for format popularity and trend.
5. Add Melee, MTGO, and Top8 providers for competitive metagame results.
6. Add Deck Penetration implementation with percentage, sample size, confidence, and status.
7. Add Meta Stability and Trend provider implementations.
8. Add Intelligence Console keyboard and visual regression coverage.
9. Persist Business Profiles.
10. Add Business Profile import and export.
11. Validate Offer Policy before Business Profiles are saved.
12. Persist Readiness Reports with Evaluation Snapshots.
13. Persist Pipeline Reports for failed evaluations.
14. Add readiness browser diagnostics for historical failed evaluations.
15. Add Pipeline Trace replay UI.
16. Add a Printing Descriptor Engine for provider-neutral printing labels.
17. Add development-only Vendor Workflow transition inspector.
18. Add Evaluation Trace replay UI.
19. Add workflow context inspector.
20. Add historical backtesting.
21. Add simulation engine.
22. Add strategy replay and Market Context replay.
23. Add Asset Intelligence model diagnostics UI.
24. Add Liquidity Engine as an Asset Intelligence model.
25. Add Historical Analytics Engine as an Asset Intelligence model.
26. Add Market Context Engine.
27. Add camera, OCR, and barcode entry.
28. Add ARIA active-descendant support for richer keyboard highlighting.
29. Add persisted buyer preferences for finish defaults.
30. Add saved Vendor Workspace chip presets.
31. Add visual regression coverage for 13-inch and 14-inch laptop viewports.

## Technical Debt

- Playwright is available as a package, but the browser binary is not installed in this environment.
- Purchase evaluation still uses fixed marketplace fees and shipping constants.
- Printing style labels still use normalized provider fields until the Printing Descriptor Engine exists.
- Scryfall market data remains daily estimates, not live inventory.
- Printing navigation currently uses button selection and global shortcuts; richer roving focus can be added later.
- Chip filters are local UI state and are not yet persisted between sessions.
- Card Intelligence signals are deterministic estimates until live provider and historical data exist.
- Condition multipliers are fixed seed values and should become strategy or marketplace configurable.
- Market Context is a static default until the Market Context Engine exists.
- Negotiation Ladder uses fixed fee and shipping assumptions inherited from the current Profit Engine setup.
- Asset Intelligence model outputs are deterministic wrappers around existing signals until live providers exist.
- Playability currently uses Scryfall legalities only; deck penetration, trend, and meta stability need future providers.
- Canadian Highlander playability is registered but waits for a provider.
- Intelligence Console has build-level coverage and grade mapping tests, but no browser interaction regression test yet.
- Business Profile Settings are in-memory only until persistence is added.
- Business Profile settings validate numeric inputs locally but do not yet enforce full Offer Policy save-time invariants.
- Readiness Reports are runtime evaluation objects and are not yet persisted into history snapshots.
- Pipeline Reports are runtime evaluation objects and are not yet persisted into history snapshots.
- Model health is currently derived from registration status and indicator status.
- Vendor Workflow diagnostics are rendered in the workspace for development visibility and should later move behind a development-only inspector.
- Keyboard highlighting uses component state today; richer ARIA active-descendant focus management remains future work.
- Evaluation Trace is in-memory only until replay and persistence infrastructure exists.
- Offer Ladder Validator uses deterministic local rules; future marketplace-specific constraints may extend validation.
- Workflow context currently stores ids and primitive UI workflow values; future shared workspaces may add typed context adapters.
