# Roadmap

## Completed: Inventory Location And Count Reconciliation

- Completed: normalized workspace locations with explicit Unassigned state (`PHR-WORKFLOW-009`).
- Completed: atomic operator move/count reconciliation with reasoned append-only events.
- Completed: receipt, approximate, counted, and unknown on-hand quantity basis without source receipt or cost-basis mutation.
- Completed: operator-only management UI and recent activity with desktop-first/390px adaptation.
- Next inventory slice: explicit sale/disposition ledger; listing readiness follows owned-quantity disposition truth.

## Completed: Receipt-Backed Inventory Intake

- Completed: exact and Bulk event receipt lines create one workspace inventory lot each in the checkout transaction (`PHR-WORKFLOW-008`).
- Completed: exact printing, condition, quantity, unit/total cost, receipt/event/operator provenance, and truthful approximate Bulk evidence.
- Completed: idempotent historical reconciliation and audited receipt-void propagation without deletion.
- Completed: module-authorized `/inventory` workspace with desktop-first and mobile-adaptive summaries and filters.
- Next inventory slice requires CTO prioritization among locations/counts, disposition/sales, and listing readiness.

## Active: LigaMagic Brazilian Market Snapshot

- Completed: `PHR-API-005` dedicated authenticated collection-export profile, one supervised pilot, safe request capture, and complete non-scheduled dry-run snapshot.
- Verified snapshot: 37 collections; 329,976 advertised/exported cards; 329,903 source rows; 329,301 unique identities; 602 identical cross-collection duplicates; zero price conflicts.
- Confirmed semantics: `Compra` is consumer acquisition price; `Venda` is store buy offer.
- Gated next: exact LigaMagic/TCGplayer crosswalk, official USD/BRL conversion, landed-cost assumptions, and two-way arbitrage specification. Deferred: 03:00 scheduling and LigaPokémon until separately authorized.

## Accepted Remediation: Artwork And Provider Settings

- Completed: exact-name Magic artwork discovery and unique Store Championship set-label reconciliation.
- Completed: provider connection health and registration requirements in Settings.
- Completed: in-app employee-login readiness checklist with the exact private GitHub callback.
- Gated next slice: authenticated owner-only encrypted credential registration after Employee login is live.

## Accepted: Card-Show Operations

- Implemented: catalogue-first watch refresh, unique legacy identity reconciliation, truthful failure state, and secret-free provider health (`PHR-TECH-010`).
- Implemented: manual watch composer and immediate offer ladder (`PHR-UX-010`, `PHR-UX-011`).
- Implemented / activation gated: module-at-invite single-use employee activation (`PHR-ARCH-012`).
- Implemented: persistent exact/Bulk event cart and immutable receipts (`PHR-WORKFLOW-006`).
- Implemented: bounded artwork resolution and exact-SKU curated local images (`PHR-API-004`).
- Accepted locally at checkpoint `6c38c1f`. Required authentication and unconfigured external providers remain gated; GitHub publication is not part of this checkpoint.

## Active: Identity-Backed Price Monitoring

- Completed: `PHR-TECH-009` restored a 204/204 behavioral baseline with clean standalone TypeScript, lint, and production build gates.
- Implemented / activation gated: `PHR-ARCH-011` invite-only identity, sessions, workspace membership, roles, module entitlements, auditability, and server enforcement. Credentials, owner bootstrap, advisory disposition, and live callback verification remain external gates.
- Product Review ready: `PHR-WORKFLOW-005` user-scoped server persistence, one-action tracking, undo, deterministic legacy migration, and verified-checkpoint refresh.
- Implemented / external providers gated: `PHR-API-003` bounded JustTCG estimates, official eBay/CardTrader active listings, and first-party observed sales without scraping.
- Gate: explicit Product Review before canonical adoption and GitHub continuity.

## Product Review Candidate: Cross-Game Artwork-First Buying

- Implemented: unified search across all registered catalogue categories with visible game ownership and per-category freshness.
- Implemented: artwork-first grouping, exact Finish-before-Condition selection, and exact-SKU evidence/evaluation continuity.
- Operational: Magic/Scryfall, Pokémon/TCGdex, Lorcana/Lorcast, and official One Piece/Bandai identity artwork paths.
- Operational reliability: approved provider images are retained through the ignored `PHR-TECH-007` same-origin cache; 12 current `luffy` results are prewarmed.
- Prepared: Lorcana and Riftbound verified receipt ingestion from the existing four-daily Pricing Update Tool schedule.
- External gate: Riot application approval/key for Riftbound. Scrydex is fallback-only after official Bandai activation.
- Gate: Product Review acceptance before canonical adoption, commit, push, deployment, or publication.

## Completed Product Slice: PHR-UX-009 Vendor Buying Intelligence Panel

- Completed: the selected-card decision area shows Asset Assessment, evidence coverage, confidence, business conclusion, primary signals, opportunities, risks, and current Decision Resolver action.
- Completed: detailed models reuse the established Intelligence Console through progressive disclosure.
- Preserved: no presentation-owned intelligence score, strategy, ladder, decision, provider request, or persistence path.
- Verified: focused 6/6, lint/build/diff, desktop, and 390px mobile checks pass; established baseline failures remain unchanged.

## Product Review Candidate: PHR-WORKFLOW-004 Snapshot-Powered Vendor Workspace

- Implemented: verified Pricing Update Tool completion observer, strict Magic/Pokémon/One Piece catalogue adapter, transactional local imports, four-per-day freshness/history, and last-good recovery.
- Implemented: desktop-first `/vendor` search/evidence/decision console with mobile adaptation and shared `/price-lookup` infrastructure.
- Activated: July 29 catalogues for all three supported games, persistent four-daily observation, and durable pre-import archives through `PHR-TECH-006`.
- Implemented initially through `PHR-UI-002`: fixed catalogue thumbnail slots and strict non-blocking Magic artwork. `PHR-API-002` now adds Pokémon/TCGdex, Lorcana/Lorcast, and official One Piece/Bandai artwork; `PHR-TECH-007` adds durable local retention. Riftbound retains its external authorization gate.
- Verified: full 792,927-row Magic import in under 15 seconds; focused tests, lint, build, diff, desktop, keyboard, and mobile checks pass.
- Gate: Product Owner acceptance before canonical adoption, publication, or deployment. Isolated review-data activation is already operational under explicit event-readiness authorization.

## Recently Completed: PHR-UX-006 Application Structure

- Completed: organized production navigation around Discover, Decide, Monitor, and Administer.
- Superseded by `PHR-WORKFLOW-008`: Manage is now operational through the module-authorized Inventory destination.
- Historical baseline: Opportunities, Vendor Workspace, Market Watch, and Settings were the original primary operational destinations before inventory intake.
- Completed: preserved Purchase Evaluation and opportunity details as contextual routes.
- Constraint retained for unimplemented Portfolio, Alerts, Cards, and Analytics; `PHR-WORKFLOW-008` separately authorized Inventory and responsive mobile adaptation.

## PHR-UX-005 Collector Presentation Rules

- Completed: Treatment and Printing terminology is centralized in the Presentation Layer.
- Completed: Standard Treatment and Regular/Normal/Nonfoil/provider-unavailable Printing are hidden from production UI.
- Completed: shared compact identity facts are used by Command Palette, Vendor results, and Watchlist.
- Completed: developer diagnostics retain hidden canonical values and visibility reasons.

## PHR-ARCH-009 Identity Presentation Layer

- Completed: centralized collector-facing Printing, Treatment, Finish, Market, and Condition vocabulary.
- Completed: Command Palette, Vendor results, Watchlist, capability labels, and developer translation diagnostics.
- Completed: Lorcast Cold Foil mapping audit; no incorrect mapping existed and no provider correction was required.
- Future: locate or restore the referenced PHR-ARCH-008 specification if it contains additional constraints.

## PHR-ARCH-007 Cross-Game Identity Ontology

- Completed: Gameplay, Printing, Physical Variant, and Market Identity are separate canonical contracts.
- Completed: printing-design facets and physical finish are separate; Lorcast rarity never creates physical finish.
- Completed: typed provider aliases, TCGplayer Product/SKU mapping, legacy identity migration, watchlist hydration, and replay/repository compatibility.

## PHR-ARCH-006 Identity Fidelity Follow-up

- Keep Lorcast Cold Foil treatment pending until an identity provider supplies an explicit discriminator; price fields must never be identity evidence.

This is the engineering roadmap. Product-facing ideas now live in `docs/PRODUCT_ROADMAP.md`. Business strategy lives in `docs/BUSINESS_STRATEGY.md`. Monetization options live in `docs/MONETIZATION.md`. Unscoped ideas live in `docs/IDEA_LEDGER.md`.

## Current Event Readiness: PHR-TECH-008

- Implementation verified: explicit Pokémon set aliases improve strict artwork coverage from 12/40 to 25/40 for the representative Pikachu search.
- Implementation verified: Lorcana catalogue receipt imported 30,531 rows and 6,243 products; Lorcast artwork and AVIF local retention are operational.
- Deferred: Riftbound.
- Completed next increment: `PHR-UX-009` exposes the existing layered Phronesis Intelligence outputs inside the Snapshot Vendor Workspace without creating a new engine.

Project Phronesis (Engineering Initiative) is the engineering identity for this roadmap. It does not rename the repository, package, app, or future commercial product.

## Current Sprint: Sprint 36

### PHR-UX-004 Lightweight Watch History

- Membership creation metadata, successful refresh observations, watch age, market-since-added change, sparkline, and expandable details are complete.
- Full historical analytics remains explicitly outside Market Watch v1.0.

### PHR-UX-003 Capability-Aware Workflows

- Market Watch membership Create/View/Edit/Remove, confirmation, persistence, and undo are complete.
- Shared game capability/status resolution is connected to Market Watch presentation and refresh guards.
- Multiple-watchlist UI and provider administration remain future work; membership is already scoped by `watchlistId`.

### PHR-ARCH-004 Identity Platform

- Provider-agnostic orchestration, registry, selection, canonical normalization, diagnostics, and lifecycle-aware errors are complete.
- Magic/Scryfall, Lorcana/Lorcast, Pokémon/TCGdex, and One Piece/Bandai official are operational. Flesh and Blood remains pending.

### PHR-API-001 Lorcast Identity Provider

- Real Lorcana identity, printing, artwork, collector, language, ink/type, and canonical metadata are connected.
- Durable offline identity repository synchronization remains future work.

### PHR-UX-002 Global Command Palette

- Connected the global shell to the existing Universal Asset Picker and context-aware Market Watch/Vendor Workspace actions.
- Current Cards mode is complete; Watchlists, Collections, Inventory, Commands, and Settings remain future modes.

### PHR-UI-001 Asset Visual Identity

- Canonical card imagery is complete for Market Watch and Universal Asset Picker surfaces.
- Future modules must reuse `CardThumbnail`; hover preview content and durable offline caching remain future work.

Market Watch MVP introduces the first production-ready workflow intended for daily use.

- Connected: `/watchlists` Market Watch workspace, watchlist storage, target price tracking, target progress math, refresh priority, developer diagnostics, and single-entry manual refresh.
- Request economy: initial load uses repository/local observations and performs zero provider requests; manual refresh is the only refresh action.
- Repository-first philosophy: refreshes use the existing market snapshot API and scheduler, so fresh repository evidence is reused before any provider request is considered.
- Verified: seeded Mox Opal, Lightning Bolt, Collected Company, and Lorcana example entries load in the workspace.
- Deferred: notifications, alerts, charts, automation, bulk refresh, and server-side watchlist persistence.
- Compatibility: Repository, Replay, Market Intelligence, Assessment, Strategy, Negotiation, and Decision behavior remain unchanged.

## Recently Completed: Sprint 34

Market Intelligence now interprets provider observations into explainable market profiles.

- Connected: Market Intelligence Engine, reasoning model, signal registry, market health, buying opportunity, confidence, trend interpretation, and volatility interpretation.
- Verified: replay-only market intelligence generation for Mox Opal, Chrome Mox, Lightning Bolt, Black Lotus, Collected Company, and Urza's Saga.
- Deferred: provider connections, repository redesign, ontology redesign, business-profile influence, negotiation behavior, BUY/PASS decisions, and UI redesign.
- Compatibility: the engine consumes repository observations and replay-normalized observations; providers remain acquisition-only and business engines remain downstream.

## Recently Completed: Sprint 33

Provider Replay lets development replay certified provider observations without using live APIs.

- Connected: replay fixture infrastructure, fixture validation, replay sessions, replay diagnostics, JustTCG fixture replay, and optional fixture recording.
- Verified: seeded replay fixtures for Mox Opal, Chrome Mox, Lightning Bolt, Black Lotus, Collected Company, and Urza's Saga compile through the provider path.
- Deferred: production replay mode, repository-specific fixture awareness, business engine changes, and provider administration UI.
- Compatibility: production remains live; repository and business engines receive the same provider-shaped observations regardless of live or replay source.

## Recently Completed: Sprint 32

Market Ontology now defines what each market evidence domain means and which providers can answer each domain.

- Connected: evidence domains, provider capability matrix, evidence question resolution, domain coverage, JustTCG supported/unsupported domains, scheduler provider eligibility, and validation filtering.
- Connected: coverage-driven market refresh so fresh snapshots still fetch missing evidence domains.
- Verified: known-card ontology resolution for Mox Opal, Chrome Mox, Black Lotus, Lightning Bolt, Collected Company, and Urza's Saga.
- Deferred: multi-provider consensus, Atlas visual capability matrix, production provenance UI, new live providers, and recommendation changes.
- Compatibility: Current Market Estimate temporarily projects JustTCG Variant Valuation until the Market Intelligence Engine owns the field directly.

## Recently Completed: Sprint 31D

Market Evidence Layer now selects best available market evidence from layered provider contributions.

- Connected: evidence aggregation, resolver, provider priority, provenance, coverage, fallback chains, and repository selection.
- Verified: known-card evidence stacking preserves populated fields and adds new provider fields.
- Deferred: provider consensus, production provenance UI, new providers, and Assessment/Strategy/Negotiation changes.

## Recently Completed: Sprint 31C

Market Truth Model is now the validation layer for provider evidence.

- Connected: provider match validation, price classification, evidence scoring, and Market Truth reports.
- Verified: known-card evidence validation for Mox Opal, Chrome Mox, Black Lotus, Lightning Bolt, Collected Company, and Urza's Saga.
- Deferred: multi-provider consensus, cache redesign, additional live providers, Assessment changes, recommendation changes, and production UI exposure.

## Previously Completed: Sprint 31B

Market Intelligence Repository is now the infrastructure owner for market snapshots.

- Connected: local repository persistence and per-field refresh policy.
- Verified: first request provider call, second request repository hit, and independent expired-field refresh.
- Deferred: database-backed persistence, distributed background workers, and repository admin UI.

## Previously Completed: Sprint 31A

JustTCG is connected through the official `justtcg-js` SDK as the first live provider connection.

- Connected: official SDK initialization with `JUSTTCG_API_KEY`.
- Verified: known-card Mox Opal request, normalized response, provider diagnostics, and developer-only inspection page.
- Deferred: caching, retries, Assessment integration, Strategy integration, Negotiation integration, Decision integration, and production UI exposure.

## Provider Backlog

- Add Atlas visual capability matrix for Market Ontology domains and providers.
- Remove Transitional Evidence Projection when the Market Intelligence Engine owns Current Market Estimate.
- Add consensus rules for domains with multiple connected providers.
- Add domain-level provider priority configuration once provider administration exists.
- Add future Market Consensus Engine after multiple validated providers are available.
- Add production-safe provider provenance display if a future product surface needs it.
- Expand provider identity evidence coverage for collector number, language, product identifiers, and provider timestamps.
- Add retry policy through Provider SDK hooks.
- Add provider cache through Provider SDK cache hooks.
- Expand known-card connectivity into provider-backed card lookup flows.
- Keep raw SDK responses restricted to development-only tooling.

## Completed Or Mostly Completed

- Application shell
- Hot Opportunities
- Watchlists
- Vendor Workspace
- Opportunity Engine
- Profit Engine
- Ranking Engine
- Strategy Engine
- Search Engine
- Query Engine
- Knowledge Platform
- Scryfall Identity Provider
- Canonical Resolution
- Intent Resolution
- Entity Resolution
- Constraint Satisfaction
- Prefix Matching and Progressive Query Resolution
- Progressive printing refinement
- Scryfall Market Provider v1
- Vendor Workspace daily market estimates
- Variant Resolution Policy
- BUY / NEGOTIATE / PASS purchase evaluation
- Decision-first Vendor Workspace
- Vendor Workspace VX optimization
- Card Intelligence Platform
- Asset Intelligence Framework
- Intelligence Console v2
- Intelligence Tile pattern
- Intelligence grade mapping
- Business Profiles Platform
- System Readiness Platform
- Pipeline Integrity
- Pipeline Inspector
- Offer Policy extraction
- Certification Intelligence Platform
- Layered Intelligence Console information architecture
- Final Intelligence Console UI contract
- Playability Intelligence Level 2
- Evidence Sufficiency Framework
- Playability Intelligence Level 3
- Asset Knowledge Graph
- Relationship Registry
- Asset Assessment Engine
- Assessment Registry
- Assessment Drivers
- Risk Factors
- Evidence Coverage
- Intelligence Provider SDK
- Provider SDK Registry
- Provider SDK Diagnostics
- TCGplayer Market Intelligence Provider
- Provider-backed Market Intelligence evidence
- Certification Provider Registry
- Placeholder PSA, BGS, and CGC certification provider coverage
- Marketplace Profile templates
- Cost Profile assumptions
- Playability Intelligence Platform
- Playability Provider Registry
- Scryfall legalities as first Playability provider source
- Condition Resolution
- Market Context foundation
- Negotiation Ladder Engine
- Offer Ladder Validator
- Decision Resolver
- Vendor Workflow State Machine
- Context Invalidation Engine
- Project Atlas

## Near-Term Roadmap

Sprint 25: Live Hot Opportunities

Sprint 26: Live Marketplace Listings

Sprint 27: Printing Descriptor Engine

## Future Roadmap

Future engineering roadmap items:

- Additional Market Provider integrations through the Provider SDK
- Provider SDK migration for existing Scryfall identity and market providers
- Pricing normalization
- Currency engine
- Market Context Engine
- Persisted Business Profiles
- Business Profile import / export
- Persisted Pipeline Reports for failed evaluations
- Pipeline Report snapshots in Evaluation History
- Business Profile policy validation before save
- Asset Intelligence model health dashboard
- Official certification population providers
- Certification cross-grading indicator
- Certification population growth indicator
- Intelligence Console keyboard and visual regression coverage
- Liquidity Engine
- EDHREC Playability Provider
- MTGGoldfish Playability Provider
- Melee / MTGO / Top8 competitive metagame providers
- Provider-backed Knowledge Graph relationship enrichment
- Relationship confidence calibration from approved providers
- Assessment provider/source weighting controls
- Assessment driver calibration from historical outcomes
- Tournament API Playability Provider
- Deck Penetration indicator implementation
- Meta Stability and Trend provider implementation
- Historical Analytics Engine
- Regional valuation
- Currency normalization
- Import cost modeling
- Regional demand and format popularity
- BR to USA arbitrage
- ARIA active-descendant keyboard refinement for printing rows
- Persisted Vendor Workflow diagnostics behind a development-only surface
- Workflow command analytics for failed or abandoned in-person evaluations
- Persisted Atlas Inspector snapshots for replaying stale-context bugs
- Asset Context generation audit trail
- Condition Intelligence model for provider data gaps only
- Provider-vs-inference audit trail for condition pricing
- Historical intelligence browser
- Backtesting engine over Evaluation Snapshots
- Strategy Replay over immutable history
- Market Replay over historical snapshots
- Signal Validation against outcomes
- Simulation Platform powered by Evaluation History
- Historical backtesting that consumes Evaluation Trace
- Simulation engine for purchase scenarios
- Strategy replay and Evaluation replay
- Market Context replay
- Shared Workflow Command primitives for future workspaces
- Development-only workflow context inspector
- Persisted Vendor Workspace preferences
- Full browser visual regression checks once Playwright browsers are installed
- Knowledge Feedback Engine
- Behavior Engine
- Vendor Intelligence Engine
- Personal vocabulary
- Community vocabulary
- AI Knowledge Curator

Product-facing future ideas have moved to `docs/PRODUCT_ROADMAP.md`, including Inventory Management, Portfolio Tracking, Watchlists, Alerts, CRM, Marketplace Integrations, Mobile, Analytics, Collection Management, Future AI Assistant, and Future Multi-store Support.

## Roadmap Rule

When priorities change, update this file in the same sprint.
