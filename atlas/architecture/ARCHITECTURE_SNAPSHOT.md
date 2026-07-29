# Architecture Snapshot

## Snapshot

Atlas Sprint A1

## Major Systems

- PHR-UX-007 mobile Pricing Lookup: strict export-contract normalization, SQLite/FTS repository, change-only snapshot history, and responsive Decide-area presentation (implementation in progress; real schema certification pending).

- Next.js application shell under `app/`.
- Shared UI components under `components/`.
- Feature-specific UI under `features/`.
- Domain contracts under `types/`.
- Provider-independent engines under `lib/engines/`.
- External and mock providers under `lib/providers/`.
- Provider SDK under `lib/providers/sdk/`.
- Market Intelligence Repository under `lib/market/`.
- Market Truth Model under `lib/market/`.
- Market Evidence Layer under `lib/market/`.
- Market Ontology under `lib/market/ontology/`.
- JustTCG official SDK provider under `lib/providers/justtcg/`.
- Business profile system under `lib/business/`.
- Workflow command and context systems under `lib/workflow/`.
- Intelligence framework, Playability model, and Certification model under `lib/intelligence/`.
- Evaluation history under `lib/history/`.
- System readiness under `lib/validation/`.
- Pipeline integrity under `lib/pipeline/`.
- Asset Knowledge Graph under `lib/knowledge/`.
- Asset Assessment under `lib/assessment/`.
- Evidence Sufficiency Framework under `lib/intelligence/framework/`.
- Game and query knowledge under `knowledge/` and `data/query/`.

## Dependencies

Runtime architecture flows through normalized domain objects:

Query and identity interpretation -> printing and variant resolution -> certification profile -> market snapshot -> readiness and pipeline validation -> card intelligence -> asset assessment -> business profile -> strategy -> negotiation ladder -> offer validation -> decision -> presentation.

Atlas is outside this runtime chain.

Live provider connectivity flow:

Application -> Provider SDK -> JustTCG Adapter -> official `justtcg-js` SDK -> JustTCG API.

Market repository flow:

Provider -> Normalization -> Market Ontology -> Market Truth Model -> Market Evidence Layer -> Market Intelligence Repository -> Asset Session -> Assessment -> Strategy -> Negotiation -> Decision.

Semantic relationship flow:

Asset data -> Relationship Resolver -> Asset Knowledge Graph -> Intelligence models -> normalized Intelligence Profile output.

Assessment flow:

Intelligence model evidence -> Evidence Sufficiency -> Asset Assessment Engine -> Business Profile context -> Strategy scoring -> Negotiation Ladder -> Decision Resolver.

## Engines

- Query, search, canonical, intent, entity, and constraint engines.
- Variant Resolution Policy.
- Card Intelligence Engine and signal registry.
- Asset Assessment Engine and Assessment Registry.
- Strategy scoring and constraints.
- Profit and evaluation engines.
- Negotiation ladder, offer calculator, offer validator, and decision resolver.
- Ranking and opportunity generation.
- Market condition adjustment.

## Providers

- Provider SDK lifecycle for metadata, health, coverage, evidence, diagnostics, caching hooks, retry hooks, validation hooks, and normalization.
- Market Intelligence Repository for local persistence, per-field TTLs, background refresh, statistics, diagnostics, and repository-owned market snapshots.
- Market Truth Model for provider match validation, price classification, evidence scoring, consistency reporting, and repository write gating.
- Market Evidence Layer for evidence stacking, configurable provider priority, fallback chains, provenance, coverage, and selected field values.
- Market Ontology for evidence domains, provider capability declarations, evidence question resolution, and domain coverage.
- JustTCG as the first live official SDK provider connection, authenticated by `JUSTTCG_API_KEY`.
- TCGplayer Market Intelligence Provider as the first active SDK-backed market provider.
- Scryfall Identity Provider.
- Scryfall Market Provider.
- Mock Marketplace Provider.
- eBay, CardTrader, LigaMagic provider placeholders or abstractions.
- Planned SDK metadata for EDHREC, PSA, BGS, CGC, Cardmarket, Melee, MTGO, LigaMagic, and eBay.

Provider rule: providers supply data only. SDK infrastructure owns lifecycle behavior, and provider data must be adapted into domain objects before engines or UI consume it.

Market Truth rule: provider values are evidence until validated against the selected printing and classified by price concept. Repository snapshots store provider attribution, retrieval time, confidence, classification, freshness, and coverage.

Market Evidence rule: adding provider evidence must never reduce platform knowledge. Missing fields do not erase populated values from other providers.

Market Ontology rule: providers must declare supported, unsupported, partial, or unknown capability by evidence domain. Unsupported providers are skipped for requested domains and unsupported fields are not stored as repository evidence.

Coverage refresh rule: repository freshness is not sufficient by itself. The scheduler must also verify evidence-domain coverage before skipping provider requests.

Transitional Projection rule: Current Market Estimate may project JustTCG Variant Valuation until the Market Intelligence Engine is implemented. Lowest Listing and Recent Sales must not use projected Variant Valuation.

JustTCG data model rule: JustTCG provider responses are raw observations plus provider-supplied derived statistics. Repository evidence stores raw observations, and platform Market Intelligence derives selected market metrics internally.

JustTCG capability rule: JustTCG supports Variant Valuation, Historical Pricing, Price Trend, Volatility, Market Confidence, and Provider Metadata. It does not support Listing Intelligence, Transaction Intelligence, or Inventory Intelligence.

## Intelligence Models

- Asset Intelligence Framework.
- Card Intelligence signals.
- Playability Intelligence backed by Scryfall legalities.
- Playability Intelligence Level 2 demand layer backed by configurable format weights and demand hints.
- Playability Intelligence Level 3 adapter, demand model, and card role model.
- Certification Intelligence backed by a placeholder provider and provider registry.
- Asset Knowledge Graph relationship context consumed by Playability and Certification.
- Asset Assessment registered as the canonical synthesis model for Intelligence evidence.
- Future models: Grading, Regional, Behavior, Historical, Volatility, Demand, Scarcity, Liquidity, and other registered intelligence dimensions.

Intelligence rule: intelligence measures asset characteristics. It does not decide BUY, NEGOTIATE, PASS, or offer values.

Certification dependency graph: Certification Intelligence -> Collector Intelligence -> Strategy -> Negotiation Ladder -> Decision Resolver.

Future certification providers: PSA, BGS, CGC, TAG, SGC, and ARS through `CertificationRegistry`.

Information architecture rule: Vendor Workspace displays Decision, Explanation, and Evidence. Atlas Inspector displays Implementation details.

Final Intelligence Console rule: expanded panels display Grade/Confidence, Business Conclusion, Key Signals, and Supporting Evidence only.

Playability maturity rule: legality is evidence, not the conclusion. Playability conclusions describe player demand.

Evidence sufficiency rule: required evidence gates grades. Unknown is not failure.

Provider adapter rule: future playability providers normalize evidence into the Playability Profile instead of changing downstream consumers.

Provider SDK rule: future providers must expose metadata, health, coverage, evidence contribution, diagnostics, cache hooks, retry hooks, validation hooks, and normalization through SDK contracts.

TCGplayer rule: raw provider responses stay inside the provider adapter. Downstream layers consume only normalized `MarketSnapshot` and Market Intelligence evidence.

Knowledge graph rule: semantic relationships are shared infrastructure. Relationship Registry and Relationship Resolver enrich Intelligence reasoning without changing production UI contracts.

Assessment rule: Assessment interprets evidence but never decides BUY, NEGOTIATE, PASS, or offer values.

## Workflows

- Vendor Workflow Machine.
- Workflow Command Processor.
- Context Invalidation Engine.
- Asset Context Validator.
- System Readiness.
- Pipeline Inspector.
- Evaluation History snapshot lifecycle.

Workflow rule: UI dispatches commands and renders state; engines own business output.

## Atlas Isolation

Atlas lives under `/atlas` and is intentionally absent from the runtime dependency graph.
