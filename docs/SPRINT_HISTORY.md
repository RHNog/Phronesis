# Sprint History

## 2026-07-30 — PHR-UX-009 Visible Buying Intelligence

Exposed the canonical Asset Assessment and current Decision Resolver action inside the Snapshot Vendor Workspace, with evidence coverage, confidence, business conclusion, bounded opportunities/risks, and progressively disclosed Intelligence Console models. Focused, full-baseline, lint/build/diff, desktop, and 390px mobile checks passed without changing intelligence or buying formulas.

## 2026-07-30 — Pokémon And Lorcana Event Readiness

Added explicit fail-closed Pokémon set aliases, raising representative Pikachu artwork coverage from 12/40 to 25/40. Acquired and imported 30,531 Lorcana rows and 6,243 products through a catalogue-only receipt, repaired strict Lorcast AVIF local caching, and prewarmed bounded event-search artwork. Desktop and 390px review pass; Riftbound remains deferred.

## 2026-07-29 — Official One Piece Artwork And Local Cache

Activated the official Bandai English card list under Product Owner authorization, added strict base/parallel/SP catalogue matching, and routed approved provider images through a durable ignored same-origin cache. Prewarmed 12 event-search images and verified desktop/phone rendering. Same-session implementation, Designer, and Chief Architect gates are complete; Product Review acceptance and canonical adoption remain pending.

## 2026-07-29 — Cross-Game Artwork-First Buying

Removed manual catalogue switching, added globally ranked five-category search, collapsed finish-only duplicates by deterministic artwork identity, and made Finish an explicit choice before Condition. Connected Pokémon thumbnails through TCGdex, retained Scryfall/Lorcast, registered Lorcana/Riftbound receipt ingestion, and documented the external authorization gates for One Piece and Riftbound. Same-session implementation, Designer, and Chief Architect gates are complete; Product Review acceptance and canonical adoption remain pending.

## 2026-07-29 — Event Snapshot Activation And Thumbnails

Activated July 29 Magic, Pokémon, and One Piece catalogues for the August 1 event, preserved raw and normalized recovery evidence, and left a persistent observer following the four-daily upstream cycle. Hardened imports with atomic hash-verified archival and composite-export filtering. Added strict, non-blocking Magic artwork enrichment with fixed desktop/mobile thumbnail slots; unsupported games remain honest placeholders. Implementation and same-session conformance are complete; Product Review and canonical adoption remain pending.

## 2026-07-29 — PHR-WORKFLOW-004 Product Review Candidate

Merged the former Vendor Workspace concept with snapshot pricing into a desktop-first card-show station. Added verified completion observation for four-daily Pricing Update Tool catalogues, strict multi-game normalization, optimized transactional persistence, shared lookup APIs, exact condition evidence, and direct reuse of the existing Phronesis evaluation and negotiation pipeline. Mobile remains a responsive backup. Implementation and conformance are complete; Product Review acceptance and canonical adoption remain pending.

## PHR-UX-004 — Lightweight Watch History

- Added stable watch creation, initial observation, last-successful refresh, refresh source, reason, and bounded observation metadata.
- Added independent market-since-added absolute/percentage calculations and human watch age.
- Added compact accessible SVG movement sparklines and expandable desktop/mobile details.
- Excluded full repository/provider history and historical analytics.

## PHR-UX-003 — Capability-Aware Workflows

- Completed Market Watch entry CRUD with target/notes edit, overflow removal, confirmation, persistence, and undo.
- Added default watchlist membership scope in preparation for multiple watchlists.
- Added shared platform capability registry, resolver, CapabilityCard, and StatusBadge.
- Prevented unsupported Lorcana market refresh and replaced zero/unknown technical states with capability explanations.
- Preserved identity, repository observations, replay fixtures, and history during membership removal.

## Epic 2 — PHR-ARCH-004 Identity Platform

- Moved provider selection behind Identity Orchestrator and Registry.
- Registered Magic/Scryfall operationally and initially established four pending game slots.
- Added canonical provider metadata, capability matrix, selection diagnostics, and distinct lifecycle errors.
- Migrated identity API, Vendor Workspace initialization, and Identity Explorer away from direct Scryfall construction.

## PHR-API-001 — Lorcast Identity Provider

- Promoted Lorcana from pending to operational through the Identity Provider Registry.
- Added Lorcast transport, raw types, normalization, canonical adapter, diagnostics, 24-hour cache, request coalescing, and pacing.
- Used all-print search and API-returned artwork while excluding Lorcast prices.
- Live-validated Elsa, Mulan, Mickey Mouse, Belle, Maleficent, and unchanged Mox Opal/Scryfall routing.

## PHR-UX-002 Global Command Palette

- Replaced passive shell search with a debounced, keyboard-first Cards palette.
- Reused Identity, Eligibility, printing variants, condition profiles, and canonical artwork.
- Routed completed selections to workflow-owned Market Watch and Vendor Workspace boundaries without market acquisition during search.

This file records logical product milestones. Sprint numbers may not perfectly match commit history.

## Sprint 36

Introduced Market Watch MVP as the first production-ready daily workflow.

- Added `features/watchlist/` with workspace, table, card, toolbar, storage, and refresh engine modules.
- Replaced the `/watchlists` surface with an information-dense Market Watch dashboard.
- Added target selling price math, difference, percent to target, market status, refresh status, observation source, and refresh priority.
- Preserved repository-first behavior by routing manual single-entry refreshes through the existing market snapshot API and `MarketRefreshScheduler`.
- Added request economy diagnostics for repository hit, provider hit, replay, cache age, observation age, API saved, and provider-request justification.
- Seeded daily-use examples for Mox Opal, Lightning Bolt, Collected Company, and a Lorcana asset.
- Preserved Repository, Replay, Market Intelligence, Assessment, Strategy, Negotiation, Decision, notifications, charts, and automation boundaries.

## Sprint 34

Introduced the first Market Intelligence Engine.

- Added `lib/market/intelligence/` for market reasoning, health, opportunity, confidence, trend, volatility, and signal interpretation.
- Consumes repository observations and normalized replay observations without provider calls.
- Generates explainable market signals such as Low Volatility, Healthy Uptrend, Cooling Demand, Near Historical Low, Near Historical High, Market Consolidation, Provider Confidence High, and Evidence Coverage Moderate.
- Produces Market Health, Liquidity, Price Stability, Volatility, Momentum, Buying Opportunity, Confidence, and Reasoning.
- Uses Evidence Sufficiency for confidence, where confidence reflects coverage, freshness, provider quality, and observation density rather than market attractiveness.
- Added replay-only test coverage for Mox Opal, Chrome Mox, Lightning Bolt, Black Lotus, Collected Company, and Urza's Saga.
- Preserved providers, repository design, ontology design, business profiles, strategy, negotiation, decision, and UI presentation.

## Sprint 33

Introduced Provider Replay & Fixture Infrastructure.

- Added `lib/providers/replay/` with replay provider, recorder, loader, registry, metadata, diagnostics, mode, and session modules.
- Added `LIVE`, `REPLAY`, and `AUTO` provider modes controlled by `.env.local`.
- Added fixture validation for provider, schema version, SDK version, timestamp, payload presence, and optional checksum.
- Integrated JustTCG replay inside the provider implementation so repository and business engines remain unaware of live versus replay source.
- Added seeded JustTCG fixtures under `fixtures/providers/justtcg/magic/`.
- Extended `/dev/justtcg` diagnostics with replay mode, fixture status, fixture age, recorded source, SDK version, skipped live request, and quota saved.
- Preserved Market Ontology, Repository, Asset Assessment, Business Profiles, Strategy, Negotiation, Decision, and Intelligence Console behavior.

## Sprint 32

Introduced the Market Ontology.

- Added `lib/market/ontology/` with market evidence domains, evidence capabilities, provider capabilities, capability registry, evidence questions, resolver, domain coverage, and ontology facade.
- Defined Variant Valuation, Listing Intelligence, Transaction Intelligence, Historical Pricing, Inventory Intelligence, Price Trend, Volatility, Market Liquidity, Market Confidence, and Provider Metadata.
- Registered JustTCG as supporting Variant Valuation, Historical Pricing, Price Trend, Volatility, Market Confidence, and Provider Metadata.
- Marked JustTCG Listing Intelligence, Transaction Intelligence, and Inventory Intelligence unsupported.
- Added capability-aware provider selection so unsupported providers are skipped for requested evidence domains.
- Added capability-aware evidence validation so unsupported provider fields cannot become repository evidence.
- Updated fallback language away from generic unavailable states and away from JustTCG listing/sales ownership.
- Added ontology regression coverage for Mox Opal, Chrome Mox, Black Lotus, Lightning Bolt, Collected Company, and Urza's Saga.
- Preserved Vendor Workspace, Asset Assessment, Business Profiles, Strategy, Negotiation, Decision, and Intelligence Console behavior.

## Sprint 32.1

Added the Transitional Evidence Projection Layer.

- Added an internal projection flag for Current Market Estimate when JustTCG Variant Valuation is selected.
- Preserved Sprint 32 ontology and provider capability enforcement.
- Kept Lowest Listing restricted to Listing Intelligence.
- Kept Recent Sales restricted to Transaction Intelligence.
- Added developer diagnostics for requested UI field, resolved evidence domain, evidence source, and projection usage.
- Documented that the bridge should be removed when the Market Intelligence Engine owns Current Market Estimate directly.

## Sprint 32.2

Added coverage-driven market refresh scheduling.

- Scheduler now checks both freshness and evidence-domain coverage before returning repository snapshots.
- Added an Evidence Coverage Map for asset, printing, finish, condition, coverage status, and domain freshness.
- Fresh but incomplete snapshots now fetch only missing refreshable evidence domains.
- Existing evidence is merged with new provider evidence rather than replaced.
- Unsupported domains do not trigger provider requests or errors.
- Developer diagnostics now expose coverage, freshness, missing evidence, providers queried, providers skipped, and merge result.

## Sprint 31D

Introduced the Market Evidence Layer.

- Added `MarketEvidenceLayer`, `EvidenceAggregator`, `EvidenceResolver`, `EvidencePriority`, `EvidenceProvenance`, `EvidenceCoverage`, `EvidenceFallback`, and `EvidenceSelection`.
- Changed repository market writes to preserve layered evidence instead of replacing a field with one provider's sparse response.
- Added configurable provider priority per market field.
- Added fallback chains for current market estimate, lowest listing, listing count, recent sales, spread, liquidity, sales velocity, volatility, and market confidence.
- Added internal provenance for provider, retrieved at, confidence, classification, freshness, and priority.
- Added provider coverage reporting by field.
- Extended developer-only JustTCG diagnostics with Market Evidence Layer output.
- Verified known-card evidence stacking for Mox Opal, Chrome Mox, Black Lotus, Urza's Saga, Collected Company, and Lightning Bolt.
- Preserved Vendor Workspace, Asset Assessment, Business Profiles, Strategy, Negotiation, Decision, and Intelligence Console presentation.

## Sprint 31C

Introduced the Market Truth Model.

- Added provider evidence validation under `lib/market/`.
- Added provider match validation for canonical card identity, printing, collector number, finish, condition, language, game, product identifier, and provider timestamp.
- Added price classification for Market Price, Lowest Listing, Lowest NM Listing, Direct Price, Average Sale, Recent Sale, Suggested Price, and Unknown.
- Added evidence scoring so stored provider values retain provider name, retrieval time, confidence, classification, freshness, and coverage.
- Added Market Truth reports and provider consistency reports before repository writes.
- Extended the developer-only JustTCG inspection page with Market Truth validation output.
- Added regression coverage for Mox Opal, Chrome Mox, Black Lotus, Lightning Bolt, Collected Company, and Urza's Saga.
- Deferred consensus logic, extra providers, cache redesign, Assessment changes, and recommendation changes.

## Sprint 31B

Introduced the Market Intelligence Repository.

- Added `lib/market/` with repository, snapshot, metadata, refresh policy, scheduler, freshness, validator, statistics, and diagnostics contracts.
- Made the Market Snapshot API consume repository snapshots through `MarketRefreshScheduler`.
- Centralized provider communication inside market infrastructure so application code no longer calls market providers directly.
- Added per-field TTLs for card metadata, printing metadata, market price, lowest listing, listing count, recent sales, spread, liquidity, sales velocity, volatility, market confidence, provider health, and provider capabilities.
- Added local JSON persistence with a storage boundary that can migrate to SQLite, PostgreSQL, Redis, or cloud storage.
- Added repository statistics for cache hits, cache misses, provider calls, API calls saved, average refresh time, repository size, and average snapshot age.
- Added regression coverage for first request provider usage, second request repository usage, and independent field refresh after TTL expiration.

## Sprint 31A

Established the first live provider connection through the official JustTCG JavaScript/TypeScript SDK.

- Added `justtcg-js` as the official SDK dependency.
- Added `lib/providers/justtcg/` with Provider, Adapter, Normalizer, and Diagnostics modules.
- Wrapped the SDK behind the Provider SDK so application code does not call JustTCG directly.
- Verified `JUSTTCG_API_KEY` authentication with a known-card Mox Opal request.
- Normalized JustTCG card, variant, price, price history, statistics, usage, and pagination fields.
- Added a temporary developer-only `/dev/justtcg` inspection page for raw SDK response, normalized response, latency, authentication status, and diagnostics.
- Preserved Assessment, Strategy, Negotiation, Decision, and UI business logic.

## Sprint 30

Integrated TCGplayer as the primary Market Intelligence provider.

- Added `TCGplayerIntelligenceProvider` using the Provider SDK.
- Converted provider-shaped market data into normalized Market Intelligence evidence.
- Produced evidence for Liquidity, Inventory Health, Sales Velocity, Spread, Market Confidence, Volatility, Market Stability, and Demand Momentum.
- Fed provider-backed market evidence into signals and Asset Assessment without changing Assessment architecture.
- Improved negotiation through provider-backed liquidity, spread, and market confidence.
- Added Atlas tracking for provider coverage, health, latency, evidence coverage, last synchronization, and API status.

## Sprint 29

Introduced the reusable Intelligence Provider SDK.

- Added `lib/providers/sdk/` contracts for provider client, adapter, evidence, health, coverage, metadata, registry, diagnostics, cache, and results.
- Centralized provider lifecycle responsibilities for normalization, health, caching hooks, diagnostics, evidence mapping, confidence contribution, metadata, retry hooks, and validation hooks.
- Registered planned SDK adapters for EDHREC, PSA, BGS, CGC, Cardmarket, TCGplayer, Melee, MTGO, LigaMagic, and eBay.
- Kept all new providers metadata-only with no live integrations, scraping, or unofficial API usage.
- Added Atlas Inspector Provider SDK diagnostics for health, coverage, evidence contribution, lifecycle status, outputs, and gaps.

## Sprint 28

Introduced the Asset Assessment Engine as the canonical synthesis layer for asset understanding.

- Added `lib/assessment/` with assessment, evidence, reasoning, confidence, summary, registry, and engine contracts.
- Registered Asset Assessment as a first-class Asset Intelligence model.
- Generated overall assessment, overall confidence, evidence coverage, primary drivers, supporting drivers, risk factors, opportunity factors, and business summary.
- Differentiated weak assets from unknown assets by reducing confidence for unknown evidence without reducing quality.
- Routed Strategy scoring through Asset Assessment evidence while preserving existing signal-weight compatibility.
- Added Business Profile assessment context before negotiation.
- Added Intelligence Console support for the Asset Assessment tile without redesigning existing tiles.

## Asset Knowledge Graph Sprint

Introduced the Asset Knowledge Graph as a reusable semantic layer for Intelligence models.

- Added `lib/knowledge/` with graph, node, edge, query, registry, relationship registry, and resolver contracts.
- Modeled card relationships for roles, mechanics, themes, archetypes, strategies, color identity, tribes, keywords, families, Universes Beyond, Reserved List, premium printings, and formats.
- Added configured semantic relationships for Mox Opal, Sol Ring, Collected Company, Counterspell, and Black Lotus.
- Integrated Playability Intelligence with graph relationships for richer role-aware reasoning without UI changes.
- Integrated Certification Intelligence with graph collector relationships for certification relevance while preserving provider gaps for population data.
- Added regression coverage for graph generation and Intelligence consumption.

## Sprint 26

Playability Intelligence matured from Level 2 to Level 3.

- Added a provider-ready Playability Provider Adapter.
- Added a normalized Demand Model with Commander, competitive, casual, combo, staple, diversity, stability, ban risk, meta dependency, resilience, and future readiness dimensions.
- Added a provider-independent Card Role Model.
- Added role-aware business conclusions and key signals.
- Added Mox Opal regression coverage.
- Preserved Evidence Sufficiency and Unknown behavior when provider evidence remains inadequate.

## Sprint 25.1

Introduced the Evidence Sufficiency Framework.

- Added framework contracts for Evidence Requirement, Evidence Status, Evidence Score, Evidence Report, and Evidence Sufficiency Engine.
- Required every Intelligence model to declare required, optional, and future evidence.
- Added Unknown as a non-failing grade state when evidence is insufficient.
- Differentiated missing evidence from negative evidence.
- Reduced confidence when evidence is partial or insufficient.
- Integrated evidence reports into Playability, Certification, Collector, Investment, Market, Liquidity, Regional, Historical, Behavior, and Volatility models.
- Added Atlas Inspector evidence diagnostics.

## Sprint 25

Playability Intelligence matured from Level 1 Framework to Level 2 Meaningful Intelligence.

- Added configurable format weights.
- Added playability demand hints for known test cards and provider-ready demand modeling.
- Expanded each format indicator with legality, importance, demand level, competitive relevance, casual relevance, confidence, trend, status, and provider.
- Added natural-language business conclusions explaining why the market cares about each card.
- Added Key Signals describing where demand comes from.
- Replaced legality-only scoring with weighted player demand scoring.
- Added indicators for Commander Strength, Competitive Strength, Casual Strength, Format Diversity, Demand Stability, Ban Risk, Meta Dependency, and Future Demand Readiness.
- Preserved provider abstraction and left EDHREC, MTGGoldfish, Melee, MTGO, and Tournament APIs as future hooks.

## Sprint 24.2

Finalized the Intelligence Console presentation contract.

- Expanded tiles now answer exactly four questions: what the model thinks, how certain it is, why, and what evidence supports it.
- Removed redundant Summary and What This Means sections.
- Renamed confidence to model-specific labels such as Certification Confidence.
- Added plain-language confidence reasons whenever confidence is below High.
- Renamed Primary Supporting Indicators to Key Signals.
- Renamed Evidence to Supporting Evidence and kept it factual.
- Added session-scoped expanded tile memory.
- Preserved business logic and Intelligence calculations.

## Sprint 24.1

Layered Information Architecture for the Intelligence Console.

- Standardized every Intelligence model around Decision, Explanation, Evidence, and Implementation layers.
- Kept Layers 1 and 2 visible by default in Vendor Workspace.
- Moved implementation details into Atlas Inspector developer mode.
- Replaced numeric production confidence with Very Low, Low, Moderate, High, and Very High labels.
- Kept numeric confidence, versions, status, health, provider status, internal sources, future dependencies, and provider matrix visible in Atlas.
- Preserved business engines and intelligence calculations.

## Sprint 24

Certification Intelligence became a first-class Asset Intelligence model.

- Added provider-ready Certification architecture under `lib/intelligence/certification/`.
- Added a placeholder provider for PSA, BGS, and CGC with no scraping and no unofficial APIs.
- Generated Certification Profiles with overall grade, provider grade, confidence, population, gem population, gem rate, estimated premium, trend, status, source, and last updated fields.
- Added Certification indicators for grade, population scarcity, gem rate, premium, population trend, collector competition, and submission saturation.
- Updated Collector Intelligence to consume Certification Intelligence while preserving configurable strategy weights.
- Updated Intelligence Console expanded details for Certification provider status and future providers.
- Added regression coverage for Chrome Mox, Black Lotus, Textless Urza's Saga, serialized examples, Masterpieces, and Judge Promos.

## Sprint 0

Project setup, GitHub, Next.js, TypeScript, Tailwind CSS.

## Sprint 1

Application shell and first dashboard.

## Sprint 2

Watchlists became buying strategies instead of simple card lists.

## Sprint 3

Hot Opportunities and the first Opportunity domain model.

## Sprint 4

Opportunity scoring and ranking foundation.

## Sprint 5

Profit Engine for calculated net profit, fees, shipping, and total costs.

## Sprint 6

Marketplace Provider abstraction for provider-independent opportunity generation.

## Sprint 7

Weighted Opportunity Ranking Engine.

## Sprint 8

Strategy Engine and strategy-specific opportunity ranking.

## Sprint 9

Vendor Workspace for fast in-person purchase evaluation.

## Sprint 10

Universal Search Engine foundation.

## Sprint 11

Scryfall Identity Provider Platform and developer diagnostics.

## Sprint 12

Universal Query Engine and TCG Knowledge Platform.

## Sprint 12.5

Intent Resolution Engine.

## Sprint 12.6

Entity Resolution and identity relationships.

## Sprint 12.7

Canonical Resolution Engine for professional shorthand.

## Sprint 12.8

Constraint Satisfaction Engine for printing selection.

## Sprint 12.9

Prefix Matching and Progressive Query Resolution.

## Sprint 12.10

Special Guests / bonus-sheet vocabulary and zero-match default prevention.

## Sprint 12.11

Identity-token vs constraint-token separation for queries like `collected company tarkir`.

## Sprint 13

Visual Printing Confirmation and Documentation Recovery.

Added domain image URL support, Scryfall image adaptation, image fallbacks, Vendor Workspace card images, and recovered documentation.

### Targeted Vendor Workspace Fix

Improved punctuation normalization, Textless knowledge recognition, and low-confidence identity handling so queries such as `urza's saga textless`, `urzas saga textless`, and `urza saga textless` resolve to Urza's Saga and show printing candidates.

### Targeted Printing Variant Fix

Introduced explicit printing finish variants. Multi-finish printings now keep finish selection unresolved until the query or user selects a finish, while explicit queries such as `urza's saga secret lair foil` and `urza's saga secret lair nonfoil` select the correct variant.

## Sprint 14

First Live Market Provider.

Added Scryfall Market Provider v1, normalized market price snapshots, and Vendor Workspace support for daily Scryfall market estimates. Lowest listing and recent sale remain unavailable until Market Provider v2 adds true marketplace inventory or sales data.

## Sprint 15

Variant Resolution Policy and Purchase Evaluation Engine.

Added a reusable Variant Resolution Policy that respects explicit finish requests, auto-selects single-finish printings, defaults multi-finish printings to Nonfoil, and falls back to the least-special finish. Vendor Workspace now completes the buying workflow with market estimate, asking price, estimated profit, ROI, recommended offer, confidence, and BUY / NEGOTIATE / PASS recommendations.

## Sprint 16

Decision-First Vendor Workspace.

Optimized Vendor Workspace for faster buying sessions by placing printing candidates beside a sticky decision panel, reorganizing metrics, removing repeated explanation text, and introducing Decision Drivers for concise business reasoning. Atlas now records backlog, technical debt, dependency graph, and reusable interaction patterns.

## Sprint 17

Vendor Workspace VX Optimization.

Compressed the in-person buying workflow for professional trading sessions. Printing rows are denser, thumbnails are smaller, common printing refinements are chip-based, purchase evaluation updates automatically with a short debounce, and the decision panel now surfaces BUY / NEGOTIATE / PASS plus offer, profit, and ROI as the first thing to read.

Keyboard behavior now supports ESC reset, natural tab order, Enter selection outside text inputs, and arrow-key printing navigation without interrupting typing.

## Sprint 18

Card Intelligence Platform.

Introduced Card Profile, Signal Registry, signal versioning, condition-adjusted market snapshots, Market Context, Negotiation Ladder, and a deterministic Decision Resolver. Purchase Evaluation now flows through card intelligence signals and a negotiation ladder before BUY / NEGOTIATE / PASS is selected.

Vendor Workspace gained a Condition selector and collapsible Card Profile panel. Automated tests now verify condition-sensitive market estimates, negotiation ladders, decisions, strategy signal weighting, finish-sensitive ladders, independent signals, and exact BUY / NEGOTIATE / PASS ladder invariants.

## Sprint 20

Asset Intelligence Framework.

Introduced a common intelligence framework so future intelligence work becomes registered models instead of isolated scoring engines. The framework defines `IntelligenceModel` and `Indicator` contracts, model health, indicator status, version metadata, provider dependencies, dependency graphs, and future model registration.

Existing Card Intelligence signals now feed framework indicators and `CardProfile` exposes `intelligenceModels` for Vendor Workspace compatibility. Current and future models are registered for Market, Collector, Investment, Liquidity, Reprint Risk, Market Confidence, Playability, Grading, Regional, Behavior, Historical, Volatility, Demand, and Scarcity intelligence.

## Sprint 20.1

Vendor Workflow Stabilization.

Introduced a deterministic Vendor Workflow State Machine for the existing Vendor Workspace without changing business logic or the Intelligence Framework. The workflow now tracks `Idle`, `Searching`, `CandidatesFound`, `IdentityHighlighted`, `IdentitySelected`, `PrintingsLoaded`, `PrintingSelected`, `VariantResolved`, `ConditionResolved`, `ReadyForEvaluation`, `Evaluating`, `EvaluationComplete`, and `Error`.

Vendor Workspace now separates identity candidates, highlighted identity, and selected identity. The Single Printing Rule automatically advances exact one-printing identities toward market loading and purchase evaluation, while multi-printing identities immediately show printing choices. Developer diagnostics expose state transitions, trigger, counts, auto-selection reason, Single Printing Rule activation, and timing.

## Sprint 20.2

Evaluation Integrity.

Hardened the purchase evaluation pipeline so recommendations are mathematically consistent and traceable. The pipeline is now documented as Card → Printing → Variant → Condition → Market Context → Asset Intelligence → Strategy → Offer Ladder → Offer Ladder Validation → Decision Resolver → Vendor Workspace.

Added `OfferLadderValidator` to enforce Opening Offer <= Target Offer <= Maximum Buy Price and Recommended Offer <= Maximum Buy Price before the Decision Resolver can execute. Purchase Evaluation now returns explicit `READY`, `UNAVAILABLE`, `INVALID`, or `WAITING_FOR_DATA` results and carries Evaluation Trace data for market, profit, strategy, offer ladder, validation, and decision reasoning.

## Sprint 20.3

Workflow Ownership Stabilization.

Moved Vendor Workspace selection authority into the Vendor Workflow Machine. The workflow snapshot now owns highlighted identity, selected identity, selected printing, selected variant, selected condition, selected strategy, and asking price context. UI components dispatch workflow events and render from workflow context.

Added `ContextInvalidationEngine` so upstream changes automatically clear downstream dependencies. Changing identity clears printing, variant, condition, market estimate, card intelligence, offer ladder, decision, and evaluation. Rejected workflow transitions leave context unchanged, preventing half-selected UI states.

## Sprint 20.4

Workflow Command Architecture.

Replaced workflow events with intent-based workflow commands. Vendor Workspace now dispatches commands such as `SelectCard`, `SelectPrinting`, `SelectVariant`, `SelectCondition`, `ChangeStrategy`, `EnterAskingPrice`, and `ResetWorkspace`; the Workflow Command Processor decides state, invalidation, loaded objects, rejection, and command diagnostics.

Moved command invalidation into `lib/workflow/commands/ContextInvalidationEngine.ts` and added command contracts under `lib/workflow/commands/`. The Single Printing Rule now executes inside command processing, so one-printing identities such as Curse of Shallow Graves can load the printing, resolve the variant, and reach `ReadyForEvaluation` without UI-authored transition steps.

## Sprint 20.5

Asset Context Integrity and Atlas Developer Tools.

Introduced `AssetContext` as the generated identity → printing → variant → condition → market → card profile → offer ladder → decision reference chain. Workflow Command Processor owns the context, increments generation on upstream changes, and rejects market snapshots that do not match the current printing and variant.

Added `AssetContextValidator` to classify visible context as `Valid`, `Invalid`, or `Incomplete`. Vendor Workspace no longer exposes workflow diagnostics in production UI. Development diagnostics moved into Atlas Inspector, enabled with Cmd/Ctrl+Shift+D in development mode.

## Sprint 20.6

Condition-Aware Market Pricing Regression Recovery.

Restored the pre-refactor condition pricing lifecycle by reconnecting market provider loading to Asset Context generation. Changing NM, LP, MP, HP, or DMG now dispatches `ChangeCondition`, creates a new Asset Context generation, invalidates downstream objects, requests a fresh market snapshot, and lets the existing condition-aware pricing pipeline feed Card Intelligence, Offer Ladder, and Decision Resolver again.

Added generation to `LoadMarketSnapshot` commands so stale provider responses from older contexts are rejected. Atlas Inspector now shows requested condition, snapshot source, snapshot generation, provider real-data status, and fallback status.

## Sprint 21

Intelligence History Platform.

Introduced append-only evaluation history for completed purchase evaluations. Every `READY` evaluation can produce an immutable `EvaluationSnapshot` containing Asset Context generation, identity, printing, variant, condition, Market Context, Buying Strategy, Market Estimate, Offer Ladder, Decision, confidence, and Card Intelligence indicators.

Added `EvaluationHistoryEngine`, `HistoryRepository`, `SnapshotFactory`, and `SnapshotValidator`. Current persistence is local and append-only, with future paths for database storage, analytics, backtesting, strategy replay, market replay, signal validation, simulation, personal buying history, and portfolio tracking.

## Sprint 22

Playability Intelligence Platform and Intelligence Console v2.

Introduced `lib/intelligence/playability/` as the first reusable intelligence model that explains why a card has play demand. Playability now has an engine, provider abstraction, provider registry, profile contract, indicator contract, trend contract, and source contract.

The first provider is `ScryfallPlayabilityProvider`, which consumes normalized Scryfall legalities from domain `Card` objects. It produces format indicators for Commander, Modern, Legacy, Vintage, Pioneer, Standard, Pauper, Explorer, and Canadian Highlander, while deck penetration, metagame stability, and trend remain provider-ready placeholders.

`CardProfile` now exposes `playabilityProfile`, Asset Intelligence registers Playability as a live model, the Playability signal consumes profile output, strategies consume the signal through configurable weights, and Vendor Workspace displays playability through the reusable Intelligence Console.

Added `components/intelligence/` as the permanent presentation layer for every Asset Intelligence model. The console renders compact collapsed tiles by default, converts scores into A+ through F grades for presentation, keeps confidence separate, and expands one tile at a time into model details without requiring custom UI per intelligence model.

## Sprint 23

Business Profiles Platform.

Introduced business-aware recommendations so two vendors evaluating the same card can receive different recommendations based on their actual costs, marketplace assumptions, target profit, ROI, margin, negotiation style, and risk tolerance.

Added `lib/business/` with Business Profile Engine, Registry, Marketplace Profiles, Cost Profiles, Shipping Profiles, Tax Profiles, Payment Profiles, and built-in defaults. Initial marketplace templates include TCGplayer, eBay, CardTrader, Facebook Marketplace, Discord, Local Cash, Convention Sales, and Direct Store.

Purchase Evaluation and Offer Ladder now consume Business Profiles instead of generic fixed fees. Vendor Workspace has a Business Profile selector, `/settings` supports profile management actions, and regression tests verify that the same card and market estimate can produce different profit, ROI, offer ladder, and decision outcomes.

## Sprint 23.1

System Readiness Platform.

Introduced centralized readiness validation under `lib/validation/` so purchase evaluation validates prerequisites before Strategy, Offer Ladder, or Decision Resolver execution. Readiness distinguishes configuration problems, missing data, business rule failures, calculation failures, and internal errors.

Readiness reports now include status, blocking issues, warnings, ready components, and missing components. Purchase Evaluation carries the report, production unavailable states show user-facing blockers, and Atlas Inspector exposes System Readiness, Configuration Readiness, Offer Ladder Readiness, and Decision Readiness in developer mode only.

Negative negotiation margin is no longer treated as an internal validation error; it remains decision context. Regression coverage verifies missing Business Profile, missing ROI, missing market data, optional Playability, complete readiness, and the previous negotiation-margin message failure mode.

## Sprint 23.2

Pipeline Integrity.

Introduced `lib/pipeline/` with Pipeline Inspector, Pipeline Stage, Pipeline Report, and Pipeline Validation contracts. The inspector executes Asset, Market, Business, Cost Profile, Offer Policy, Strategy, Offer Ladder, and Decision stages, recording received inputs, calculated outputs, validation status, fallbacks, missing fields, execution time, and first invalid stage.

Business Profiles now own Offer Policy, which contains minimum ROI, minimum profit, desired margin, negotiation aggressiveness, and maximum capital exposure. Offer Ladder consumes that policy directly.

The sprint fixed a zero-valued Offer Ladder failure where an impossible maximum buy price was rounded into `0`. Pipeline Integrity now blocks Decision Resolver execution when a ladder output becomes zero unexpectedly and Atlas Inspector shows the first invalid stage in developer mode only.
# PHR-UI-001 Asset Visual Identity

- Added canonical provider-neutral card thumbnails, resolution caching, optimized lazy imagery, fallback handling, and developer provenance.
- Connected Market Watch and Universal Asset Picker results.
- Validated repository artwork identities for Mox Opal, Lightning Bolt, Collected Company, and Elsa – Spirit of Winter.

## PHR-ARCH-006

Identity Fidelity and Treatment Model.

Audited the complete documented Lorcast card payload and classified every provider field as mapped, derived, ignored, or reserved. Added provider-neutral Treatment with provenance, resolution state, explanation, and confidence; identity completeness metrics; canonical mapping diagnostics; and treatment-aware Command Palette, vendor, and Watchlist presentation. Lorcast derives only evidence-backed treatments from rarity and never uses market price fields to infer identity. Magic continues to resolve treatment from its existing explicit finish metadata.

## PHR-ARCH-007

Cross-Game Identity Ontology migration.

Replaced the flattened canonical model with linked Gameplay, Printing, Physical Variant, and Market Identity contracts, plus independent Market Observation, Inventory Instance, and OwnershipRelationship. Added typed aliases, mapping repository, completeness, migration utilities, Scryfall/Lorcast mappings, explicit TCGplayer Product/SKU semantics, and compatibility projections that preserve Market Watch, Vendor Workspace, Universal Command Palette, repository observations, and replay fixtures. Lorcast Enchanted is now a Printing Design Facet while Physical Finish reports Provider Does Not Supply.

## PHR-ARCH-009

Identity Presentation Layer.

Introduced pure presentation model, adapter, formatter, and diagnostics modules that translate immutable canonical identity into collector vocabulary. Updated Command Palette, Vendor results, Watchlist, and capability labels to present Printing, Treatment, Finish, Market, and Condition. Developer mode retains Gameplay Identity, Printing Identity, Printing Design Facets, Physical Finish, provider mapping, and canonical-to-presentation diagnostics. Lorcast audit confirmed Cold Foil was not misclassified and required no provider mapping correction.

## PHR-UX-005

Collector Presentation Rules.

Refined presentation terminology so Printing Design Facet appears as Treatment and Physical Finish appears as Printing. Added visibility metadata and centralized rules that hide Standard Treatment plus Regular, Normal, Nonfoil, and provider-unavailable Printing. Introduced shared collector-fact rendering across Command Palette, Vendor results, and Watchlist while developer diagnostics retain canonical values and suppression reasons. Canonical ontology and provider mappings were unchanged.
# 2026-07-30 — Identity-Backed Price Monitoring

Implemented server-owned exact-variant watches, one-action Vendor Workspace tracking with undo, deterministic legacy import, verified catalogue checkpoint refresh, and user-owned market evidence. Official listing adapters are credential-gated and completed-sale evidence remains first-party. Verification passes 220/220 tests, TypeScript, lint, production build, schema migration, diff hygiene, and desktop/mobile responsive checks.
