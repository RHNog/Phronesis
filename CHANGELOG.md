# Changelog

## Unreleased — PHR-TECH-007 + PHR-API-002 Bandai Revision

### One Piece artwork reliability

- Activated strictly matched official Bandai English One Piece artwork under the Product Owner's authorization attestation.
- Added an ignored, same-origin durable artwork cache with exact source allowlisting, raster validation, atomic writes, metadata, and repeat-request reuse.
- Prewarmed 12 unique official artworks mapped by the active `luffy` event search.
- Verified 23/23 focused tests, lint, production build/type check, desktop/mobile runtime behavior, and diff hygiene. Full-suite baseline remains 180 passes / 17 known failures.

## Unreleased — PHR-API-002 + PHR-UX-008

### Cross-game buying

- Replaced manual catalogue switching with one globally ranked search across Magic, Pokémon, One Piece, Lorcana, and Riftbound catalogue registrations.
- Collapsed finish-only duplicates into artwork-first results and added exact Finish selection before Condition.
- Connected Pokémon artwork through TCGdex and retained strict Scryfall/Lorcast paths for Magic/Lorcana.
- Registered Lorcana and Riftbound for automatic verified-receipt ingestion; the later authorized revision activates One Piece/Bandai while Riftbound/Riot remains authorization gated.
- Verified 18/18 focused tests, 7/7 identity tests, lint, production build/type check, desktop/mobile runtime behavior, and diff hygiene. Full-suite baseline remains 173 passes / 17 known failures.

## Unreleased — PHR-WORKFLOW-004

### Event readiness

- Activated July 29 Magic, Pokémon, and One Piece catalogues in the isolated review repository under `PHR-TECH-006`.
- Added hash-verified, atomic local archival before observer import and strict filtering of the known composite Magic export.
- Added non-blocking Magic thumbnails to Vendor Workspace search and selected evidence under `PHR-UI-002`; unsupported games retain stable placeholders.

### Review access

- Added tailnet-only phone review through `PHR-TECH-005`, with loopback binding, HTTPS, persistent recovery, mobile verification, and no public deployment.

### Added

- Desktop-first Snapshot-Powered Vendor Workspace for Magic, Pokémon, and One Piece.
- Read-only observer of verified Pricing Update Tool catalogue completions.
- Strict, transactional, idempotent full-catalogue imports with freshness, movement, history, and last-good recovery.
- Shared snapshot data across `/vendor` and `/price-lookup`, with mobile adaptation.

### Verification

- Focused tests 34/34, lint, production build, and diff checks pass.
- Representative 792,927-row Magic catalogue imports in under 15 seconds.
- Product Review acceptance, canonical adoption, deployment, and publication remain pending; isolated live snapshot activation is operational.

All notable changes to this project will be documented in this file.

The format is inspired by "Keep a Changelog".

---

## [Unreleased]

### Added
- Canonical Phronesis identity, three-role product-development workflow, CTO conversation ledger, and documentation-practices review.
- Sprint 33 Provider Replay & Fixture Infrastructure under `lib/providers/replay/`.
- Replay modes `LIVE`, `REPLAY`, and `AUTO` controlled by `PROVIDER_MODE` in local development.
- Provider fixture loading, validation, optional checksum verification, recording, replay sessions, and replay diagnostics.
- Market-identity replay fixtures keyed by asset, printing, collector number, finish, condition, language, provider product identifier, and provider variant identifier.
- JustTCG replay integration so development can replay certified fixtures without network calls or API quota usage while production remains live.
- Seed JustTCG fixtures under `fixtures/providers/justtcg/magic/` for Mox Opal, Chrome Mox, Lightning Bolt, Black Lotus, Collected Company, Urza's Saga, and Sol Ring.
- Developer-only replay diagnostics on `/dev/justtcg` for replay mode, fixture loaded, fixture age, recorded source, provider, SDK version, live request skipped, and quota saved.
- Replay diagnostics for requested identity, replay identity, exact match, and missing identity component.
- Evidence Coverage Map for market refresh scheduling by asset, printing, finish, condition, domain coverage, and domain freshness.
- Scheduler diagnostics for coverage, freshness, missing evidence, providers queried, providers skipped, and merge result.
- Transitional Evidence Projection Layer for projecting JustTCG Variant Valuation into Current Market Estimate while the Market Intelligence Engine is not yet implemented.
- Developer diagnostics for requested UI field, resolved evidence domain, evidence source, and projection usage.
- Sprint 32 Market Ontology under `lib/market/ontology/`.
- Canonical evidence domains for Variant Valuation, Listing Intelligence, Transaction Intelligence, Historical Pricing, Inventory Intelligence, Price Trend, Volatility, Market Liquidity, Market Confidence, and Provider Metadata.
- Provider capability matrix for JustTCG, TCGplayer, Scryfall, Cardmarket, and eBay market evidence domains.
- Evidence question resolution so market fields map to evidence domains before provider selection.
- Domain coverage reporting for connected, planned, partial, and unsupported provider capability states.
- Regression coverage for Market Ontology resolution across Mox Opal, Chrome Mox, Black Lotus, Lightning Bolt, Collected Company, and Urza's Saga.
- JustTCG provider data model mapping document covering card fields, variant fields, response metadata, condition-specific variant representation, and raw-observation versus provider-derived metric classification.
- Raw provider observation storage on market evidence so repository evidence can retain JustTCG card, variant, price, timestamp, SKU, and price-history observations.
- Sprint 31D Market Evidence Layer for stacked provider evidence.
- Evidence aggregation, resolution, priority, provenance, coverage, fallback, and selection contracts under `lib/market/`.
- Layered market evidence storage so multiple providers can contribute to each field without reducing previously available information.
- Developer-only Market Evidence Layer diagnostics on the JustTCG inspection page.
- Market Evidence Layer regression coverage for Mox Opal, Chrome Mox, Black Lotus, Urza's Saga, Collected Company, and Lightning Bolt.
- Sprint 31C Market Truth Model for provider evidence validation.
- `lib/market/` validation pipeline for provider match checks, evidence scoring, price classification, field mapping, consistency reports, and Market Truth reports.
- Repository-stored provider evidence metadata for provider name, retrieval time, confidence, price classification, freshness, and coverage.
- Developer-only JustTCG inspection page now includes a Market Truth Report for normalized provider validation.
- Market Truth regression coverage for Mox Opal, Chrome Mox, Black Lotus, Lightning Bolt, Collected Company, and Urza's Saga.
- Sprint 31B Market Intelligence Repository infrastructure.
- `lib/market/` repository, snapshot, metadata, refresh policy, freshness, scheduler, validator, statistics, and diagnostics contracts.
- Per-field Market Intelligence TTL policy with repository-backed market snapshot reads.
- Local JSON persistence for Market Intelligence snapshots with future database migration boundary.
- Sprint 31A JustTCG live provider connection.
- Official `justtcg-js` SDK dependency and SDK-backed JustTCG Provider Adapter.
- `lib/providers/justtcg/` provider, adapter, normalizer, and diagnostics modules for known-card connectivity.
- Temporary developer-only JustTCG inspection page showing raw SDK response, normalized response, latency, and authentication status.
- Sprint 30 TCGplayer Market Intelligence provider integration.
- `TCGplayerIntelligenceProvider` using the Provider SDK as the primary market intelligence source with Scryfall fallback when provider-backed evidence is unavailable.
- Normalized Market Intelligence evidence for market price, direct low, lowest listing, listing count, recent sales, market trend, price history, liquidity, inventory health, sales velocity, spread, market confidence, volatility, market stability, and demand momentum.
- TCGplayer-backed Liquidity, Market Confidence, Demand, and Volatility signal support.
- Offer Ladder spread and liquidity improvements from normalized market evidence.
- Sprint 29 reusable Intelligence Provider SDK.
- `lib/providers/sdk/` with generic provider client, adapter, evidence, health, coverage, metadata, registry, diagnostics, cache, and result contracts.
- Planned SDK adapter metadata for EDHREC, PSA, BGS, CGC, Cardmarket, TCGplayer, Melee, MTGO, LigaMagic, and eBay without live integrations.
- Provider SDK diagnostics in Atlas Inspector for metadata, health, coverage, evidence contribution, lifecycle, and integration gaps.
- Sprint 28 Asset Assessment Engine.
- `lib/assessment/` with Asset Assessment engine, registry, evidence, reasoning, confidence, summary, and assessment contracts.
- Asset Assessment registered as a first-class Asset Intelligence model and Intelligence Console tile.
- Assessment drivers, risk factors, opportunity factors, evidence coverage, and business summary generation.
- Strategy scoring can consume Asset Assessment evidence instead of inspecting individual Intelligence models directly.
- Business Profile explanations now consume the Asset Assessment summary before negotiation.
- Asset Knowledge Graph semantic layer under `lib/knowledge/`.
- Relationship Registry and Relationship Resolver for asset roles, mechanics, themes, archetypes, strategies, color identity, tribes, keywords, families, Universes Beyond, Reserved List, premium printings, and format relationships.
- Playability Intelligence now consumes Asset Knowledge Graph relationships for role-aware reasoning without UI changes.
- Certification Intelligence now consumes Asset Knowledge Graph collector relationships for certification relevance without replacing official population providers.
- Asset Knowledge Graph regression coverage for Mox Opal, Sol Ring, Collected Company, Counterspell, and Black Lotus.
- Sprint 26 Playability Intelligence Level 3.
- Playability Provider Adapter for provider-ready normalization of future EDHREC, MTGGoldfish, Melee, MTGO, and Tournament API responses.
- Card Role Model with roles such as Fast Mana, Commander Staple, Combo Piece, Removal, Counterspell, Engine, Utility, Ramp, Protection, and Card Draw.
- Playability Demand Model dimensions for Commander Demand, Competitive Demand, Casual Demand, Combo Relevance, Staple Status, Format Diversity, Demand Stability, Ban Risk, Meta Dependency, Demand Resilience, and Future Demand Readiness.
- Mox Opal playability demand modeling and role-aware regression coverage.
- Sprint 25.1 Evidence Sufficiency Framework.
- `EvidenceSufficiencyEngine`, `EvidenceRequirement`, `EvidenceScore`, `EvidenceStatus`, and `EvidenceReport` framework contracts.
- Evidence requirements for every registered Intelligence model.
- Unknown grade display when required evidence is insufficient.
- Atlas Inspector evidence diagnostics for evidence status, missing evidence, and evidence explanation.
- Regression coverage for Playability without EDHREC, Certification without PSA/BGS/CGC, Collector with sufficient evidence, and mocked sufficient Playability evidence.
- Sprint 25 Playability Intelligence Level 2.
- Configurable Playability format weights and demand hints in `config/playability.ts`.
- Playability Profile demand fields for legality, importance, demand level, competitive relevance, casual relevance, confidence, trend, status, and provider.
- Playability business conclusions explaining why the market cares about a card.
- Playability Key Signals such as Commander Staple, Broad Format Diversity, Stable Demand, and Meta Dependent.
- New Playability indicators for Demand Stability, Meta Dependency, and Future Demand Readiness.
- Sprint 24.2 final Intelligence Console presentation contract.
- Session-scoped expanded Intelligence tile memory.
- Model-specific confidence labels such as Certification Confidence and Playability Confidence.
- Plain-language confidence reasons whenever confidence is below High.
- Sprint 24.1 layered Intelligence Console information architecture.
- Production confidence labels: Very Low, Low, Moderate, High, and Very High.
- Atlas Inspector implementation layer for Intelligence model versions, health, status, internal sources, future dependencies, internal signals, and Certification provider matrix.
- Sprint 24 Certification Intelligence Platform.
- `lib/intelligence/certification/` with Certification Engine, Provider abstraction, Registry, Profile, Indicator, Trend, and Source contracts.
- Placeholder Certification Provider for PSA, BGS, and CGC without scraping or unofficial APIs.
- Certification Profile with overall grade, provider grades, confidence, population placeholders, gem rate readiness, estimated premium, trend, source, and last-updated fields.
- Certification indicators for certification grade, population scarcity, gem rate, certification premium, population trend, collector competition, and submission saturation.
- Certification Intelligence registered as a first-class Asset Intelligence model.
- Intelligence Console expanded Certification detail with provider rows and future provider status.
- Certification regression coverage for Chrome Mox, Black Lotus, Textless Urza's Saga, serialized examples, Masterpieces, and Judge Promos.
- Sprint 23.2 Pipeline Integrity.
- `lib/pipeline/` with Pipeline Inspector, Pipeline Stage, Pipeline Report, and Pipeline Validation contracts.
- Developer-only Atlas Pipeline Trace for Asset, Market, Business, Offer Policy, Strategy, Offer Ladder, and Decision stages.
- Business-owned Offer Policy extraction with minimum ROI, minimum profit, desired margin, negotiation aggressiveness, and maximum capital exposure.
- Regression coverage for a $34.01 market estimate, $5 seller ask, and Online Marketplace Business Profile producing a positive Offer Ladder and BUY / NEGOTIATE result.
- Sprint 23.1 System Readiness Platform.
- `lib/validation/` with System Readiness Engine, Readiness Validator, Readiness Report, Readiness Status, Configuration Validator, and Evaluation Prerequisites.
- Centralized readiness checks for Business Profile, Market Snapshot, Card Intelligence, Strategy, Offer Ladder, and Decision prerequisites.
- Developer-only Atlas Inspector System Readiness diagnostics.
- System readiness regression coverage for missing Business Profile, missing ROI, missing market data, optional Playability, complete configuration, and negative negotiation margin messaging.
- Sprint 23 Business Profiles Platform.
- `lib/business/` with Business Profile Engine, Registry, Marketplace Profile, Cost Profile, Shipping Profile, Tax Profile, Payment Profile, and built-in defaults.
- Built-in Business Profile examples for Prime Time Retail, Convention Buying, Cash Only, and Online Marketplace.
- Marketplace templates for TCGplayer, eBay, CardTrader, Facebook Marketplace, Discord, Local Cash, Convention Sales, and Direct Store.
- Vendor Workspace Business Profile selector.
- Settings page for creating, duplicating, renaming, deleting, and setting default Business Profiles.
- Business-aware evaluation regression coverage.
- Intelligence Console v2 as the reusable presentation layer for Asset Intelligence models.
- `components/intelligence/IntelligenceConsole.tsx`, `IntelligenceTile.tsx`, `IntelligenceDetail.tsx`, and `IntelligenceGrade.tsx`.
- Intelligence grade mapping from internal numeric scores to A+ through F presentation grades.
- Compact collapsed intelligence tiles with name, grade, confidence, and expand affordance.
- Expanded intelligence detail panels with score, grade, confidence, version, status, summary, factors, sources, trend, future dependencies, and explanation.
- Intelligence Console grade mapping regression coverage.
- Sprint 22 Playability Intelligence Platform.
- `lib/intelligence/playability/` with Playability Engine, Provider abstraction, Registry, Profile, Indicator, Trend, and Source contracts.
- `ScryfallPlayabilityProvider` using Scryfall legalities as the first provider-backed playability source.
- Playability Profile with Overall, Commander, Modern, Legacy, Vintage, Pioneer, Standard, Pauper, Explorer, and Canadian Highlander format indicators.
- Playability indicators for overall playability, Commander strength, competitive strength, casual strength, ban risk, format diversity, meta stability, trend, and future deck penetration.
- Playability regression coverage for Chrome Mox, Sol Ring, Lightning Bolt, Black Lotus, Counterspell, and Collected Company.
- Sprint 21 Intelligence History Platform.
- Evaluation Snapshot, Asset Snapshot, Market Snapshot History, Strategy Snapshot, and Offer Ladder Snapshot types.
- Evaluation History Engine, History Repository, Snapshot Factory, and Snapshot Validator.
- Append-only local Evaluation History recording for completed `READY` purchase evaluations.
- Sprint 20.6 condition-aware market pricing regression recovery.
- Generation-aware market snapshot requests so condition changes reload provider market data for the current Asset Context.
- Atlas Inspector provider trace fields for requested condition, snapshot source, snapshot generation, provider real-data status, and fallback status.
- Sprint 20.5 Asset Context Integrity and Atlas Developer Tools.
- `AssetContext` domain type with context id, generation, identity, printing, variant, condition, market, card profile, offer ladder, and decision references.
- `AssetContextValidator` for detecting invalid, incomplete, or synchronized asset context.
- Atlas Inspector developer tool behind Cmd/Ctrl+Shift+D in development mode.
- Sprint 20.4 Workflow Command Architecture.
- `WorkflowCommand`, `WorkflowCommandProcessor`, `WorkflowCommandResult`, and `CommandRegistry` for intent-based Vendor Workspace orchestration.
- Command diagnostics for last command, accepted commands, rejected commands, invalidated objects, reloaded objects, rejection reason, and execution time.
- Sprint 20.3 Workflow Ownership stabilization.
- `ContextInvalidationEngine` for automatic downstream invalidation when identity, printing, variant, condition, strategy, market context, or asking price changes.
- Workflow diagnostics for invalidated objects, loaded objects, accepted commands, and rejected commands.
- Sprint 20.2 Evaluation Integrity foundation.
- Offer Ladder Validator for impossible values, missing values, negative values, and ladder-ordering invariants.
- Evaluation Trace, Profit Trace, Offer Ladder Trace, Strategy Trace, and Decision Trace outputs.
- Evaluation integrity tests for positive-profit decisions, PASS decisions, unavailable market data, and invalid offer ladders.
- Sprint 20.1 Vendor Workflow State Machine for deterministic Vendor Workspace progression.
- Vendor Workflow diagnostics showing current state, previous state, last command, identity count, printing count, auto-selection reason, Single Printing Rule activation, and execution timing.
- Vendor Workflow Machine tests for single printing, multiple printing, ambiguous identity, auto-selection, ESC reset, and no-printing error paths.
- Sprint 20 Asset Intelligence Framework foundation.
- Shared Intelligence Model contract with id, name, version, status, confidence, inputs, outputs, indicators, supporting sources, health, explanation, and dependency graph.
- Shared Indicator contract with score, confidence, version, status, data sources, contributing factors, last updated timestamp, explanation, and future dependencies.
- Intelligence Model registry for Market, Collector, Investment, Liquidity, Reprint Risk, Market Confidence, Playability, Grading, Regional, Behavior, Historical, Volatility, Demand, and Scarcity intelligence.
- Asset Intelligence Framework tests for model registration, indicator registration, metadata, placeholder models, dependency graph generation, and Vendor Workspace compatibility.
- Sprint 18 Card Intelligence Platform foundation.
- Deterministic Card Profile and signal architecture for investment, flip, grading, collector, liquidity, volatility, scarcity, demand, playability, reprint risk, market confidence, and historical stability signals.
- Condition Resolution with NM, LP, MP, HP, and DMG condition profiles.
- Condition-adjusted market snapshots for purchase evaluation.
- Market Context domain object for country, region, currency, marketplace, language, tax, and shipping assumptions.
- Negotiation Ladder Engine with opening offer, target offer, maximum buy price, and walk-away price.
- Deterministic Decision Resolver that compares asking price against the Negotiation Ladder.
- Vendor Workspace Condition selector and collapsible Card Profile panel.
- Automated tests for condition-sensitive market estimates, negotiation ladders, decisions, signal independence, strategy signal weighting, finish-sensitive ladders, and BUY / NEGOTIATE / PASS invariants.
- Sprint 17 Vendor Workspace VX optimization for denser, keyboard-first buying sessions.
- Printing filter chips for common buyer refinements such as Foil, Judge, Retro, Textless, Secret Lair, Special Guests, and Masterpiece.
- Automatic debounced purchase evaluation when asking price, finish, or printing changes.
- Compact quick summary showing decision, target offer, expected profit, and ROI after evaluation.
- Decision-first Vendor Workspace layout with a desktop sticky decision panel.
- Decision Drivers Engine for concise recommendation reasoning.
- Project Atlas documentation for backlog, patterns, dependency graph, and technical debt.
- Variant Resolution Policy for automatic purchasable finish selection.
- Complete purchase evaluation output with BUY / NEGOTIATE / PASS, recommended offer, margin, ROI, and confidence.
- Scryfall Market Provider v1 for daily market estimate snapshots.
- Normalized `MarketPrice`, `MarketSnapshot`, and `PriceSource` domain types.
- Internal market snapshot API for Vendor Workspace market estimates.
- Printing finish variants for multi-finish Scryfall printings.
- Visual card images in Vendor Workspace identity results.
- Printing candidate thumbnails with image fallbacks.
- Selected printing image display in the purchase panel.
- Structured card image URLs and card-face image metadata.
- Documentation recovery system under `docs/`.
- Agent handoff documentation.
- Sprint history documentation.
- Architecture, roadmap, decision, product spec, prompt history, and documentation changelog files.

### Changed
- Market refresh now requires both freshness and evidence-domain coverage before returning a cached repository snapshot.
- Fresh but incomplete snapshots now fetch only missing refreshable evidence domains.
- Current Market Estimate now preserves JustTCG Variant Valuation through a temporary projection bridge.
- Lowest Listing remains restricted to Listing Intelligence and Recent Sales remains restricted to Transaction Intelligence.
- Market refresh now skips providers that cannot answer any requested evidence domain.
- Provider evidence validation now drops unsupported provider fields before repository storage.
- JustTCG is now treated as a variant-level valuation/history/trend/volatility provider, not a listing, transaction, or inventory provider.
- Fallback language no longer names JustTCG as the source for listing, sales, spread, inventory, or sales velocity evidence.
- JustTCG normalization now preserves raw card and variant observations separately from provider-supplied derived metrics.
- Market Truth evidence mapping now carries raw observations into repository evidence objects.
- Market evidence nodes now retain asset, printing, variant, finish, condition, provider condition, product identifier, and future certification identity.
- Vendor Workspace market loading now explicitly reloads and validates snapshots for the selected condition.
- Condition-specific provider prices are no longer condition-adjusted a second time.
- Current sprint updated to Sprint 31D.
- Market Intelligence Repository now derives displayed market fields from layered evidence selections instead of single-provider replacement values.
- Current sprint updated to Sprint 31C.
- Market provider data is now validated and attributed as evidence before it can update Market Intelligence Repository snapshots.
- Current sprint updated to Sprint 31B.
- Market snapshot API now consumes the Market Intelligence Repository scheduler instead of calling providers directly.
- Current sprint updated to Sprint 31A.
- Atlas now treats JustTCG as the first live official SDK connection using `JUSTTCG_API_KEY`.
- Playability business conclusions now reflect card roles and demand sources instead of generic format summaries.
- Playability Key Signals now include role-derived signals such as Fast Mana, Combo Enabler, Commander Staple, and Engine.
- Intelligence confidence now reflects evidence quality before producing a conclusion.
- Playability and Certification now return Unknown instead of a failing grade when required providers are missing.
- Missing evidence is no longer treated as negative evidence.
- Playability Intelligence now measures weighted player demand instead of reporting legality as the primary signal.
- Playability tile conclusions, key signals, and supporting evidence now use Playability Profile demand intelligence.
- Playability provider roadmap now records EDHREC, MTGGoldfish, Melee, MTGO, and Tournament APIs.
- Expanded Intelligence tiles now answer only Grade/Confidence, Business Conclusion, Key Signals, and Supporting Evidence.
- Removed redundant Summary and What This Means sections from production Intelligence panels.
- Primary Supporting Indicators was renamed to Key Signals.
- Evidence was renamed to Supporting Evidence and limited to factual support.
- Intelligence Console now prioritizes business conclusions, summary, confidence, supporting indicators, and evidence before implementation details.
- Vendor Workspace Intelligence tiles now show model name, grade, confidence label, and expand affordance without numeric confidence.
- Implementation details such as Version, Health, Status, Provider Status, Internal Sources, and Future Dependencies moved from Vendor Workspace into Atlas Developer Mode.
- Collector Intelligence now consumes Certification Intelligence as a measured input while strategies continue to use configurable signal weights.
- Current sprint updated to Sprint 24.
- Offer Ladder now consumes Offer Policy extracted from the selected Business Profile instead of relying on scattered business thresholds.
- Evaluation now attaches a Pipeline Report so developer diagnostics can identify the first invalid stage instead of only the final symptom.
- Online Marketplace default minimum profit now reflects low-dollar marketplace buys so valid low-value opportunities do not collapse the Offer Ladder to zero.
- Purchase evaluation now generates a Readiness Report before strategy, offer ladder, and decision execution.
- Evaluation no longer treats negative negotiation margin as an implementation error.
- Production unavailable states now show user-facing readiness blockers instead of internal engine terminology.
- Purchase evaluation now uses Business Profile costs instead of generic fixed marketplace fees and shipping assumptions.
- Offer Ladder now consumes Business Profile assumptions and explains which profile was used.
- Profit, ROI, maximum buy price, negotiation, and decision can change when the Business Profile changes without changing the selected card.
- Evaluation summary now shows the Business Profile used for the recommendation.
- Card Profile now renders the Intelligence Console instead of bespoke large indicator cards.
- Intelligence model presentation now uses grades while preserving numeric scores internally.
- Intelligence confidence remains visually separate from grade.
- Intelligence Console expands one tile at a time by default.
- Playability Intelligence is now a live registered Asset Intelligence model with provider dependency graph metadata.
- Scryfall card adaptation now preserves legalities for normalized domain cards.
- Card Profile now exposes `playabilityProfile` alongside signals and framework intelligence models.
- The Playability signal now consumes Playability Profile output instead of a fixed placeholder score.
- Vendor Workspace Card Profile panel now displays playability tier, format legalities, trend, ban status, and deck penetration readiness.
- Seed strategies now consume Playability through configurable signal weights.
- Completed Vendor Workspace evaluations now create immutable historical intelligence snapshots without changing current UX.
- Condition changes now dispatch `ChangeCondition`, create a new Asset Context generation, and request a fresh Market Snapshot.
- `LoadMarketSnapshot` commands now carry Asset Context generation to reject slow responses from older generations.
- Vendor Workspace no longer displays workflow diagnostics in production UI.
- Market snapshots are accepted only when they match the current Asset Context printing and variant.
- Vendor Workspace passes market data to purchase evaluation only when the visible asset context is validated.
- Vendor Workspace now dispatches workflow commands such as `SelectCard`, `SelectPrinting`, `SelectVariant`, `SelectCondition`, `ChangeStrategy`, `EnterAskingPrice`, and `ResetWorkspace` instead of workflow events.
- Workflow invalidation now lives under the command processor path so components express intent while the workflow engine decides state and downstream invalidation.
- Vendor Workflow Machine now owns selected identity, highlighted identity, selected printing, selected variant, selected condition, selected strategy, and asking price context.
- Vendor Workspace now renders selected and highlighted state from workflow context instead of local component selection state.
- Purchase Evaluation now returns explicit `READY`, `UNAVAILABLE`, `INVALID`, or `WAITING_FOR_DATA` results instead of falling back to zero-like recommendations.
- Decision Resolver now consumes validated offer ladders only.
- Vendor Workspace now hides internal evaluation traces from production users while exposing them in development diagnostics.
- Vendor Workspace now separates identity candidates, highlighted identity, and selected identity.
- Vendor Workspace now applies the Single Printing Rule so exact one-printing identities progress toward evaluation without extra clicks.
- Vendor Workspace identity rows now distinguish Suggested, Highlighted, and Selected visual states.
- Card Profile now exposes framework-generated Intelligence Models in addition to existing signals.
- Vendor Workspace Card Profile panel now renders indicators from Asset Intelligence Framework outputs.
- Purchase Evaluation now consumes Card Profile, condition-adjusted market price, strategy signal weights, and Negotiation Ladder output.
- Decision Resolver no longer independently calculates BUY / PASS; it follows Negotiation Ladder invariants.
- Seeded strategies now include explicit Card Intelligence signal weights.
- Vendor Workspace market estimate, negotiation ladder, and decision now update when condition changes.
- Vendor Workspace now removes the manual Evaluate action in favor of live evaluation.
- Printing rows are denser, image thumbnails are smaller, and match score remains visible for faster scanning.
- ESC now resets Vendor Workspace and returns focus to search while arrows and Enter support printing navigation outside text inputs.
- Finish selection now renders as a compact segmented control using only available finish variants.
- Decision panel ordering now emphasizes selected card, recommendation, confidence, market estimate, asking price, maximum price, offer, profitability, and drivers.
- Vendor Workspace now puts printing candidates beside the decision panel on desktop.
- Production Vendor Workspace copy now avoids provider and engine implementation details.
- Multi-finish printings now default to Nonfoil through the Variant Resolution Policy while preserving one-click finish switching.
- Vendor Workspace now recalculates market estimate and purchase evaluation when the selected finish changes.
- Vendor Workspace now uses Scryfall market estimates when a selected printing and finish variant have price data.
- Purchase evaluation now consumes normalized market prices instead of marketplace listing objects.
- Vendor Workspace now treats a printing and its purchasable finish variant as separate selections.
- Scryfall adapter now preserves all available finishes instead of collapsing multi-finish printings to foil.
- Scryfall adapter now maps image data into normalized domain card objects.
- README now describes Phronesis instead of the default Next.js template.

### Fixed
- Fixed zero-valued Offer Ladder output caused by impossible business policy math being rounded into `0`.
- Pipeline Integrity now blocks Decision Resolver execution when Opening Offer, Target Offer, Maximum Buy Price, or Recommended Offer resolve to zero unexpectedly.
- The first invalid evaluation stage is now reported before downstream engines can silently substitute fallback values.
- Incomplete or invalid evaluation snapshots are rejected before entering history.
- Restored condition-aware market estimate and evaluation refresh after the Asset Context refactor.
- Changing NM, LP, MP, HP, or DMG no longer leaves Market Estimate unavailable when provider market data exists.
- Stale market snapshots from previous context generations are rejected before they can drive purchase evaluation.
- Rapid card switching now leaves one coherent Asset Context instead of mixed identity, printing, variant, or market references.
- The Curse of Shallow Graves / Shallow Grave class of single-printing issues is handled by command processing: loading search results can activate the Single Printing Rule, select the only printing, resolve the variant, and reach `ReadyForEvaluation` without UI-authored transitions.
- Switching identity now clears stale printing, variant, asking price, offer ladder, decision, and evaluation context automatically.
- Rejected workflow transitions now leave workflow-owned UI context unchanged.
- Missing or invalid market data now produces "Unable to evaluate purchase" instead of a misleading recommendation.
- Invalid Offer Ladder output now blocks Decision Resolver execution.
- Vendor Workflow orchestration is now driven by workflow commands instead of UI-dispatched state steps.
- Successful Vendor Workspace identity selection now deterministically reaches `ReadyForEvaluation` or `Error`.
- Multi-printing Vendor Workspace searches now load printing choices immediately instead of stalling at an identity candidate.
- Multi-finish printings no longer auto-select foil when the query does not specify a finish.
- `foil` constraints no longer match `Nonfoil` variants.
- Special foil treatments such as Halo, Surge, Galaxy, and Confetti are normalized as distinct finish variants.
- Missing card images now render a clean fallback instead of disappearing from the workflow.
- Apostrophe and punctuation-heavy card names now receive a normalization boost during identity scoring.
- `urza's saga textless`, `urzas saga textless`, and `urza saga textless` now resolve to Urza's Saga and load printing candidates.
- Textless variants such as `text less` and `no text` are recognized as treatment constraints.
- Clear low-confidence identity candidates can now load printing candidates instead of leaving Vendor Workspace stuck at an identity row.

### Documented
- Sprint 26 Playability Level 3 demand model, card role model, provider adapter, and Intelligence Registry updates.
- Sprint 25.1 Evidence Sufficiency philosophy, Unknown state, model evidence requirements, and future provider dependencies.
- Sprint 25 Playability maturity increase from Level 1 Framework to Level 2 Meaningful Intelligence.
- Sprint 24.2 final Intelligence Console UI contract, confidence explanation rules, expansion memory, and redundancy removal.
- Sprint 24.1 layered information architecture, Vendor Information Model, Atlas Information Model, and responsibility split.
- Sprint 24 Certification Intelligence philosophy, provider abstraction, profile, dependency graph, architecture graph, backlog, and technical debt.
- Sprint 23.2 Pipeline Inspector, Offer Policy, Pipeline Integrity, Business Invariants, technical debt, and architecture graph.
- Sprint 23.1 System Readiness Platform, validation layers, readiness pipeline, configuration validation, user-facing error improvements, dependency graph, backlog, and technical debt.
- Sprint 23 Business Profiles Platform, marketplace templates, cost profiles, offer ladder integration, business-aware recommendations, dependency graph, backlog, and technical debt.
- Sprint 22 Intelligence Console v2, Intelligence Tile, grade mapping, confidence separation, and progressive disclosure.
- Sprint 22 Playability Intelligence Platform, provider abstraction, format indicators, strategy integration, provider roadmap, dependency graph, backlog, and technical debt.
- Sprint 21 Intelligence History Platform, immutable history, evaluation snapshot lifecycle, repository abstraction, and future Simulation Platform.
- Sprint 20.6 regression recovery, Market Provider precedence, condition pricing lifecycle, Asset Context integration, and future Condition Intelligence hooks.
- Sprint 20.5 Asset Context, context generation, context integrity, Atlas Inspector, Developer Mode, stale-reference invariants, and context-validation backlog.
- Sprint 20.4 Workflow Command Architecture, command processor ownership, context invalidation dependency graph, workflow ownership invariants, and command-oriented backlog.
- Sprint 20.3 Workflow Ownership, workflow authority, context invalidation, workflow invariants, and state ownership backlog.
- Sprint 20.2 Evaluation Integrity, Offer Ladder Validation, business invariants, Evaluation Trace, calculation trace, and replay-ready backlog.
- Sprint 20.1 Vendor Workflow State Machine, Single Printing Rule, diagnostics, workflow invariant, and stabilization backlog.
- Sprint 20 Asset Intelligence Framework, Intelligence Model contract, Indicator contract, model health, versioning, dependency graph, and future intelligence models.
- Sprint 18 Card Intelligence philosophy, Signal Registry, Market Context, Negotiation Ladder, canonical pipeline, and decision invariants.
- Sprint 17 VX optimization, keyboard workflow, chip filters, automatic evaluation, and dense printing patterns.
- Sprint 16 Atlas synchronization, decision-first pattern, backlog, and technical debt.
- Variant Resolution Policy and complete Vendor Workspace buying workflow.
- Scryfall prices as daily market estimates rather than live listing or recent sale data.
- Product vision as a Professional TCG Decision Operating System.
- Current architecture and provider boundaries.
- Permanent documentation update rule for future sprints.

---

## [0.1.0] - 2026-07-07

### Added
- Initial project structure
- Development environment
- React + Next.js application
- First working dashboard UI
- AI-assisted development workflow with Codex
