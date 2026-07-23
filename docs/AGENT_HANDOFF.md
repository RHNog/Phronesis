# Agent Handoff

## Documentation-First Development Handoff

Documentation is part of implementation.

Source of truth: `docs/DOCUMENTATION_FIRST_DEVELOPMENT.md`.

Initial feature record: `PHR-TECH-001` in `docs/technical/PHR-TECH-001-documentation-first-development-system.md`.

Before or alongside meaningful implementation work, classify the change and create or update a feature specification using `docs/templates/FeatureSpecificationTemplate.md`. If implementation work is required, create or update an AI-ready prompt using `docs/templates/ImplementationPromptTemplate.md`.

Preserve permanent Feature IDs. If an existing feature changes, update the existing specification, record the modification date and reason, and update dependent documentation.

Use category folders under `docs/` for implementation-grade specifications: backlog, prd, architecture, technical, database, api, ui, ux, workflows, business-rules, testing, roadmap, release-notes, future, and prompts.

Do not treat improvement suggestions as approved scope. Present them separately for approval.

## Sprint 33 Handoff

Provider Replay lives in `lib/providers/replay/`.

- Provider: `ReplayProvider.ts`
- Recorder: `ReplayRecorder.ts`
- Loader and validation: `ReplayLoader.ts`
- Fixture paths: `ReplayRegistry.ts`
- Metadata: `ReplayMetadata.ts`
- Diagnostics: `ReplayDiagnostics.ts`
- Mode: `ReplayMode.ts`
- Session: `ReplaySession.ts`

Local mode is controlled by `PROVIDER_MODE` in `.env.local`:

- `LIVE`: call the live provider.
- `REPLAY`: require a fixture and skip live provider calls.
- `AUTO`: use a fixture if present, otherwise call the live provider.

Optional recording uses `PROVIDER_RECORD_FIXTURES=true`. Recording writes each provider variant as its own identity fixture with raw provider response, normalized response, timestamp, provider version, SDK version, and metadata under `fixtures/providers/{provider}/{game}/{asset}/{printing}/{finish}/{condition}/{language}.json`.

Replay fixture identity is explicit. A fixture is valid only for one asset identity, printing, collector number, finish, condition, language, provider product identifier, and provider variant identifier. `ReplayRegistry` builds exact paths from those components and does not scan for close matches. In `REPLAY`, a missing fixture must return replay observation missing with the failed component, such as Printing, Finish, Condition, or Language.

Replay is a provider implementation detail. Do not teach the repository, Asset Assessment, Business Profiles, Strategy, Negotiation, Decision, or Intelligence Console whether data came from a fixture or a live provider.

Production must continue using live providers. `resolveReplayMode()` forces `LIVE` when `NODE_ENV` is `production`.

## Sprint 32 Handoff

Market semantics now live in `lib/market/ontology/`.

- Ontology facade: `MarketOntology.ts`
- Domains: `EvidenceDomain.ts`
- Capability contracts: `EvidenceCapability.ts` and `ProviderCapability.ts`
- Registry: `CapabilityRegistry.ts`
- Questions: `EvidenceQuestion.ts`
- Resolver: `EvidenceResolver.ts`
- Coverage: `DomainCoverage.ts`

Do not treat market fields as provider capabilities by default. Resolve a requested field to its evidence domain first, then ask the provider capability matrix whether a connected provider supports that domain.

JustTCG is connected for Variant Valuation, Historical Pricing, Price Trend, Volatility, Market Confidence, and Provider Metadata. It is not connected for Listing Intelligence, Transaction Intelligence, or Inventory Intelligence. Do not map JustTCG variant price to Lowest Listing, listing count, recent sales, spread, seller competition, shipping, quantity, or inventory depth.

`MarketRefreshScheduler` now skips providers that cannot answer any requested evidence domain. `ProviderEvidenceValidator` now drops unsupported provider fields before repository storage. Future providers should register domain capabilities before their observations enter the repository.

Sprint 32.1 adds a temporary compatibility bridge in `lib/market/TransitionalEvidenceProjection.ts`. Current Market Estimate may project JustTCG Variant Valuation while the Market Intelligence Engine is not implemented. This must not be copied to Lowest Listing, listing count, recent sales, spread, seller competition, shipping, quantity, or inventory depth. Atlas diagnostics expose Requested UI Field, Resolved Evidence Domain, Evidence Source, and Projection Used.

Sprint 32.2 changes scheduling behavior only. Fresh repository snapshots must still evaluate evidence coverage before returning. `lib/market/EvidenceCoverageMap.ts` derives domain coverage and domain freshness from stored evidence. `MarketRefreshScheduler` fetches only preferred capable providers for missing refreshable domains and merges valid evidence back into the repository.

## Sprint 31D Handoff

Market evidence is layered before selected values reach downstream consumers.

- Layer: `lib/market/MarketEvidenceLayer.ts`
- Aggregation: `EvidenceAggregator.ts`
- Selection: `EvidenceResolver.ts`
- Priority config: `EvidencePriority.ts`
- Provenance: `EvidenceProvenance.ts`
- Coverage: `EvidenceCoverage.ts`
- Fallback chains: `EvidenceFallback.ts`
- Selection contract: `EvidenceSelection.ts`

Do not reintroduce single-provider overwrite behavior. If a provider lacks a market field, preserve existing evidence and selected values from other providers. Provider priority is configurable per field, and production UI should keep showing selected market values without evidence-stack diagnostics.

Developer-only diagnostics can expose evidence stack, selected provider, fallback reason, provider priority, freshness, and coverage.

Condition-specific evidence nodes carry asset, printing, variant, finish, condition, provider condition, product identifier, and optional certification identity. Do not collapse LP/MP/HP/DMG provider data into NM or generic market evidence.

JustTCG mapping document: `docs/providers/JUSTTCG_DATA_MODEL.md`. Preserve raw observations from JustTCG separately from provider-supplied derived metrics. Repository evidence may store raw observations, but production UI should consume internally derived Market Intelligence fields.

## Sprint 31C Handoff

Market Truth now sits between normalized market providers and `MarketIntelligenceRepository`.

- Engine: `lib/market/MarketTruthEngine.ts`
- Evidence validation: `ProviderEvidenceValidator.ts`
- Match validation: `ProviderMatchValidator.ts`
- Price classification: `ProviderPricingClassifier.ts`
- Evidence scoring: `ProviderEvidenceScore.ts`
- Reports: `ProviderConsistencyReport.ts` and `MarketTruthReport.ts`

Provider responses must match the selected asset context before repository write. Validate canonical card identity, printing, collector number, finish, condition, language, game, product identifier, and provider timestamp. Missing legacy metadata can warn; conflicting metadata rejects.

Do not add consensus behavior yet. Do not route Assessment, Strategy, Negotiation, Decision, or recommendation logic directly to providers. The repository stores attributed evidence with provider name, retrieval timestamp, confidence, classification, freshness, and coverage.

## Sprint 31B Handoff

Market Intelligence now flows through `lib/market/`.

- Repository: `MarketIntelligenceRepository`
- Scheduler: `MarketRefreshScheduler`
- Snapshot model: `MarketSnapshot`, `MarketSnapshotMetadata`
- Policy: `MarketRefreshPolicy`, `MarketFreshness`
- Diagnostics: `MarketRepositoryStatistics`, `MarketRepositoryDiagnostics`
- Validation: `MarketSnapshotValidator`

Do not call market providers from application code. Use `MarketRefreshScheduler`, which checks repository freshness, returns fresh repository snapshots, refreshes only expired fields, and allows slightly stale snapshots to refresh in the background.

Local persistence file: `.market-intelligence-repository.json`. It is ignored by git and exists only until a database-backed store is selected.

## Sprint 31A Handoff

JustTCG is the first live provider connection.

- Dependency: `justtcg-js@0.2.1`.
- Required local env var: `JUSTTCG_API_KEY`.
- Provider files: `lib/providers/justtcg/JustTCGProvider.ts`, `JustTCGAdapter.ts`, `JustTCGNormalizer.ts`, and `JustTCGDiagnostics.ts`.
- Registry: `ProviderRegistry` registers `justtcg` as an active provider.
- Dev tool: `/dev/justtcg` is development-only and displays raw SDK response, normalized response, latency, authentication status, and diagnostics.

Do not move JustTCG into production UI yet. Sprint 31A is connectivity only: no caching, retries, Assessment changes, Strategy changes, Negotiation changes, Decision changes, or production UI redesign.

## What Is This Project?

Phronesis is a Professional TCG Decision Operating System.

It helps trading-card buyers discover opportunities, evaluate in-person purchases, and eventually manage portfolio decisions.

## Current Development Phase

Current sprint: Sprint 32, Market Ontology.

The app now evaluates a selected card through deterministic Vendor Workflow states, Card Profile, Asset Intelligence models, condition-adjusted market context, strategy-weighted signals, Negotiation Ladder, and deterministic Decision Resolver output.

Sprint 28 adds Asset Assessment as the canonical interpretation layer. Intelligence models provide evidence, Assessment interprets evidence, Business Profiles apply business context, Strategies apply business objectives, Negotiation consumes strategy-shaped output, and Decision evaluates the validated offer.

`CardProfile.assetAssessment` is now the shared assessment output. It includes overall assessment, overall confidence, evidence coverage, primary drivers, supporting drivers, risk factors, opportunity factors, and business summary.

Sprint 29 adds `lib/providers/sdk/` as the reusable provider lifecycle layer. Providers should supply data only; SDK contracts own normalization, health, cache hooks, diagnostics, evidence mapping, confidence contribution, metadata, retry hooks, and validation hooks.

Planned SDK providers are metadata-only for EDHREC, PSA, BGS, CGC, Cardmarket, TCGplayer, Melee, MTGO, LigaMagic, and eBay. No live integrations, scraping, or unofficial APIs were added.

Sprint 30 promotes TCGplayer to the first SDK-backed Market Intelligence provider. TCGplayer data is normalized into `MarketSnapshot.marketIntelligence`; raw provider-shaped data must not leave the provider adapter.

Provider-backed market evidence now feeds Liquidity, Market Confidence, Demand, Volatility, Asset Assessment, and Offer Ladder spread/liquidity behavior.

Sprint 31C adds Market Truth validation before repository writes. Provider data is evidence until validated and classified; consensus across providers is still deferred.

Sprint 31D adds the Market Evidence Layer. Provider evidence is stacked, repository snapshots preserve prior evidence, and selected values are resolved by freshness, configured priority, confidence, and recency.

Sprint 32 adds the Market Ontology. Evidence domains define what providers know before provider selection. Provider capabilities must be explicit, and unsupported provider fields must not become repository evidence.

Sprint 32.1 adds Transitional Evidence Projection so valid JustTCG Variant Valuation continues to populate Current Market Estimate until the Market Intelligence Engine replaces the bridge.

Sprint 32.2 adds coverage-driven refresh. Freshness alone must not skip provider requests when evidence coverage is incomplete.

Playability Intelligence now measures why a card has play demand. It is registered in the Asset Intelligence Framework, backed first by Scryfall legalities, exposed on `CardProfile.playabilityProfile`, and consumed by strategies through configurable `Playability` signal weights.

Card Profile now renders `components/intelligence/IntelligenceConsole.tsx`. Future intelligence models should appear automatically through the shared Intelligence Tile pattern rather than adding custom Card Profile UI.

Business Profiles now make purchase recommendations business-aware. Vendor Workspace has a Business Profile selector, `/settings` has an in-memory management surface, and purchase evaluation / offer ladder calculations consume selected profile costs and targets instead of generic fixed fees.

System Readiness now validates Business Profile, Market Snapshot, Card Intelligence, and Strategy prerequisites before Strategy, Offer Ladder, or Decision Resolver execution. Evaluations carry a Readiness Report, production UI shows user-facing blockers, and Atlas Inspector exposes developer-only readiness diagnostics.

Pipeline Integrity now inspects Asset, Market, Business, Cost Profile, Offer Policy, Strategy, Offer Ladder, and Decision stages. Evaluations carry a Pipeline Report, Atlas Inspector shows the first invalid stage in developer mode, and zero-valued Offer Ladder output blocks Decision Resolver execution unless a future feature explicitly defines zero as intended.

Certification Intelligence now measures collectible certification characteristics as a first-class Asset Intelligence model. It exposes a Certification Profile, placeholder PSA/BGS/CGC provider summaries, future TAG/SGC/ARS status, and indicators for grade, population scarcity, gem rate, premium, population trend, collector competition, and submission saturation. It must never decide BUY/PASS; Collector Intelligence consumes it, Strategies consume Collector Intelligence through weights, and Negotiation consumes Strategy output.

Intelligence Console now uses layered information architecture. Vendor Workspace should show business conclusions, confidence labels, supporting indicators, and evidence. Atlas Inspector owns implementation details such as version, health, status, internal sources, future dependencies, internal signals, and provider matrices.

Sprint 24.2 finalized the production contract: expanded Intelligence tiles show Grade, model-specific Confidence, Business Conclusion, Key Signals, and Supporting Evidence only. Confidence below High must explain itself. Summary and What This Means should not return.

Sprint 25 matures Playability Intelligence from legality reporting to player demand intelligence. Playability now uses configurable format weights and demand hints to generate business conclusions, key signals, demand level, competitive relevance, casual relevance, trend, and confidence reasons. Do not replace this with BUY/PASS logic.

Sprint 25.1 adds Evidence Sufficiency. Intelligence models must declare required, optional, and future evidence before producing grades. If required evidence is insufficient, production shows Unknown with low confidence and a reason. Missing evidence is not negative evidence.

Sprint 26 adds Playability Level 3 semantics: provider adapter, demand dimensions, format analysis, and card role model. Playability remains demand-only and must not evaluate collectability, negotiation, or BUY/PASS decisions.

Asset Assessment must not decide BUY/PASS. It synthesizes evidence into asset understanding only.

## What Has Been Built?

- Next.js App Shell
- Hot Opportunities
- Watchlists as buying strategies
- Vendor Workspace
- Purchase Evaluation
- Opportunity, Profit, Ranking, Strategy, Query, Canonical, Intent, Entity, and Constraint engines
- Scryfall Identity Provider
- Developer Identity Explorer
- Visual card confirmation in Vendor Workspace
- Printing finish variants with unresolved finish blocking in Vendor Workspace
- Scryfall Market Provider v1 for daily market estimates
- Internal market snapshot API
- Variant Resolution Policy
- Complete Vendor Workspace purchase evaluation output
- Decision-first Vendor Workspace layout
- Decision Drivers Engine
- Card Intelligence Engine
- Asset Intelligence Framework
- Intelligence Console v2
- Intelligence Tile pattern
- Intelligence grade mapping
- Business Profiles Platform
- System Readiness Platform
- Pipeline Integrity
- Pipeline Inspector
- Certification Intelligence Platform
- Layered Intelligence Console
- Final Intelligence Console UI contract
- Playability Intelligence Level 2
- Evidence Sufficiency Framework
- Playability Intelligence Level 3
- Asset Knowledge Graph
- Asset Assessment Engine
- Intelligence Provider SDK
- TCGplayer Market Intelligence Provider
- Certification Provider Registry
- Placeholder Certification Provider
- Offer Policy
- Readiness Report
- Configuration Validator
- Marketplace Profile templates
- Business-aware Offer Ladder integration
- Playability Intelligence Platform
- Playability Provider Registry
- Scryfall Playability Provider using legalities
- Intelligence Model registry
- Indicator registry
- Signal Registry
- Condition Resolution
- Market Context foundation
- Condition-adjusted market snapshots
- Negotiation Ladder Engine
- Deterministic Decision Resolver invariants
- Dense Vendor Workspace printing rows
- Printing filter chips
- Automatic debounced purchase evaluation
- Vendor Workflow State Machine
- Single Printing Rule
- Vendor Workflow diagnostics
- ESC reset and keyboard printing navigation
- Project Atlas

## What Should Not Be Changed Casually?

- Provider-independent engine contracts
- Identity Provider vs Market Provider separation
- Query Engine dictionary-driven behavior
- Canonical, intent, entity, and constraint pipeline order
- Condition and grading preservation rules
- Domain-model image adaptation rules
- Printing-vs-finish-variant separation
- Market estimate vs live listing separation
- Variant policy vs UI selection separation
- Decision driver engine vs presentation copy separation
- Card Intelligence vs recommendation separation
- Playability vs recommendation separation
- Intelligence Console vs business engine separation
- Grade presentation vs numeric score storage separation
- Business Profile vs provider separation
- Business Profile vs Decision Resolver separation
- System Readiness vs business engine separation
- Business Profile vs Offer Policy ownership
- Pipeline Inspector vs business engine separation
- Playability Provider abstraction and registry
- Asset Intelligence model contract
- Indicator contract and status metadata
- Negotiation Ladder vs Decision Resolver separation
- Offer Ladder Validator vs Decision Resolver separation
- Condition must not affect identity resolution
- Automatic evaluation should remain engine-driven; UI components may debounce input but must not calculate business values.
- Printing filters should use buyer-facing vocabulary and avoid exposing internal engine terminology.
- Vendor Workflow command processing should stay centralized in `lib/workflow/commands/WorkflowCommandProcessor.ts`.
- Vendor Workspace should dispatch workflow commands, not workflow events or manual state transitions.
- Workflow Command Processor owns Asset Context and context generation.
- Asset Context validation lives in `lib/workflow/AssetContextValidator.ts`.
- Workflow context owns selected and highlighted Vendor Workspace state.
- Context invalidation must stay centralized in `lib/workflow/commands/ContextInvalidationEngine.ts`.
- Successful identity selection must reach `ReadyForEvaluation` or `Error`.
- Candidate, highlighted, and selected identity states must remain separate.

## Important Architectural Rules

- UI components must not know external provider response shapes.
- UI components must not fetch Scryfall images directly.
- Business engines must not call providers directly.
- Provider data must be normalized before entering domain objects.
- Query and constraint logic must stay deterministic and explainable.
- Multi-finish printings may default only through the Variant Resolution Policy.
- Scryfall prices are daily estimates and must not be treated as live inventory.
- Do not invent lowest listing, recent sale, or buylist values.
- Card Intelligence must not negotiate.
- Playability must not negotiate or decide BUY / PASS.
- Intelligence Console must not calculate recommendations or mutate model output.
- Every Intelligence Model must use the shared Intelligence Tile presentation contract.
- Business Profiles must not query providers.
- Business Profiles own Offer Policy.
- System Readiness owns prerequisite validation.
- Business engines assume READY inputs and must not expose internal validation errors.
- Offer Ladder consumes Business Profile assumptions; Decision Resolver remains deterministic.
- Pipeline Inspector must identify the first invalid or unavailable stage before downstream engines substitute values.
- Opening Offer, Target Offer, Maximum Buy Price, and Recommended Offer must not silently collapse to zero.
- Future intelligence must be registered as an Asset Intelligence model, not built as an isolated scoring engine.
- Strategies must not read provider data directly.
- Strategies may consume Playability only through normalized signal/model outputs and configured weights.
- Negotiation Ladder owns opening offer, target offer, maximum buy price, and walk-away price.
- Offer Ladder Validator must approve the ladder before Decision Resolver executes.
- Decision Resolver must return BUY at or below target, NEGOTIATE between target and maximum buy price, and PASS above maximum buy price.
- Missing evaluation data must return unavailable or invalid results, never fallback zero.
- Evaluation Trace should be preserved for future replay, backtesting, and simulation work.
- Rejected workflow commands must leave selected identity, printing, variant, and decision context unchanged.
- Production Vendor Workspace must not display workflow or Asset Context diagnostics.
- Atlas Inspector is development-only and toggled with Cmd/Ctrl+Shift+D.
- Condition changes must dispatch `ChangeCondition` and trigger a generation-aware market snapshot request.
- Market Provider data always has precedence over future condition inference.
- Evaluation history is append-only and lives under `lib/history/`.
- Only completed `READY` evaluations should create `EvaluationSnapshot` records.
- Snapshot validation must reject incomplete Asset Context, Offer Ladder, or Decision data.
- Production UI should not expose provider internals or placeholder engine language.
- Tailwind CSS only.
- No external libraries unless explicitly requested.

## Before Making Changes

Future agents must read:

1. `docs/AGENT_HANDOFF.md`
2. `docs/ARCHITECTURE.md`
3. `docs/DECISIONS.md`
4. `docs/ROADMAP.md`
5. `docs/SPRINT_HISTORY.md`
6. `docs/ATLAS.md`

Then inspect the relevant source files before editing.

## Commands

Before changes:

```bash
git status --short
```

After changes:

```bash
npm run lint
npx tsc --noEmit
```

## Documentation Rule

Future agents must update documentation after every sprint.

Every sprint must update:

1. `CHANGELOG.md`
2. `docs/SPRINT_HISTORY.md`
3. `docs/AGENT_HANDOFF.md` if current state or next steps changed
4. `docs/ARCHITECTURE.md` if architecture changed
5. `docs/ROADMAP.md` if priorities changed
6. `docs/DECISIONS.md` if a major product or architecture decision was made
7. `docs/ATLAS.md`

No sprint is complete until documentation is updated.

## Suggested Next Step

Next Pipeline Integrity work should persist Pipeline Reports with failed evaluations and add policy validation before Business Profiles are saved. Next System Readiness work should persist Readiness Reports with Evaluation Snapshots and add historical diagnostics for failed evaluations. Next Business Profile work should persist profiles, add import / export, and include profile ids plus Offer Policy in immutable evaluation snapshots. Next Playability work should add official provider integrations for EDHREC-style deck penetration, MTGGoldfish-style format popularity, and Melee / MTGO / Top8 competitive results without scraping. Market Provider v2 should add true live listings or recent sales from a marketplace-specific provider while preserving normalized `MarketSnapshot` output. Future intelligence work should register models in the Asset Intelligence Framework without changing the Asset Intelligence → Strategy → Negotiation Ladder → Offer Ladder Validation → Decision Resolver contract. Evaluation History is now the input for future backtesting, simulation, strategy replay, evaluation replay, Market Context replay, signal validation, personal buying history, and portfolio tracking.
