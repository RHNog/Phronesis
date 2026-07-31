<!-- handoff: {"document":"ARCHITECTURE","owner":"human-and-agent","schema_version":"1"} -->
# Architecture

## 2026-07-30 Card-Show Operations Boundaries

- Verified pricing catalogues remain the broad refresh source; external market adapters supply explicitly classified supplemental evidence only.
- Watch refresh, purchase ledger, activation, and curated artwork mutations are server Route Handlers with module authorization.
- Purchase receipts and authorization audits are append-only evidence. Browser state is never their source of truth.
- Buying presentation consumes existing evaluation and offer engines; it does not own business formulas.
- Exact product artwork is presentation data and cannot mutate catalogue or market identity.

## Cross-Game Snapshot Search Boundary

Vendor Workspace issues one local search request. The pricing repository queries each active catalogue, globally ranks a bounded result set, and returns per-category freshness. The presentation layer groups single-card products by deterministic artwork identity, then maps Finish selection back to one exact SKU before condition evidence and `evaluatePurchase`. Sealed products remain SKU-discrete.

Artwork enrichment is a parallel, non-blocking server boundary: Scryfall for Magic, TCGdex for Pokémon, Lorcast for Lorcana, and the official Bandai English card list for One Piece. Strict set/card-number/name/variant resolution may attach an image but cannot alter local prices or decision inputs. Riftbound remains a fail-closed authorization state until its Riot prerequisites exist.

`PHR-TECH-007` routes approved provider rasters through one same-origin cache. Exact HTTPS host/path allowlisting, redirect rejection, MIME and magic-byte checks, size/time limits, URL/content hashes, atomic writes, and ignored `.data/artwork/` metadata prevent the route from becoming an open proxy. A cached image remains usable when its provider is unavailable.

## Snapshot-Powered Vendor Workspace (PHR-WORKFLOW-004)

The Pricing Update Tool owns catalogue acquisition and its 00:00, 06:00, 12:00, and 18:00 schedules. Phronesis owns only a read-only completion observer, strict TCGplayer catalogue normalization, local SQLite persistence, search, evidence presentation, and downstream buying decisions.

```text
Verified upstream completion
  -> read-only observer
  -> strict streaming adapter
  -> transactional staging import
  -> products + latest prices + change-only history + receipt/status
  -> shared pricing search
  -> /vendor and /price-lookup
  -> existing evaluation / offer ladder / decision engines
```

Completion receipts are keyed by category, source hash, contract version, and checkpoint. This lets an unchanged later download advance freshness while preventing the same checkpoint from being reprocessed. The client status boundary omits local paths and hashes. Upstream files, credentials, databases, and schedules are never mutation targets.

`PHR-TECH-006` archives each verified transient catalogue under ignored Phronesis data before transactional import. The July 29 missed receipt was recovered through read-only local Postgres exports. Known sibling product lines in the observed composite Magic export are filtered by configuration; any unknown product line fails closed. `PHR-UI-002` enriches already-rendered Magic results through the existing identity-provider boundary and strict set/collector matching. Artwork is never price evidence, never blocks the local search path, and is not guessed when identity is ambiguous.

## Application Information Architecture (PHR-UX-006)

The production shell is organized around Discover, Decide, Monitor, and Administer. Opportunities, Vendor Workspace, Market Watch, and Settings are the primary operational destinations. Purchase Evaluation and opportunity detail are contextual routes owned by Decide and Discover. Developer routes remain outside production navigation, and future Manage capabilities are not exposed until implemented.

`lib/navigation/ProductNavigation.ts` is the source of truth for primary navigation metadata and route ownership. `Sidebar` derives active state from the current pathname; pages no longer duplicate selected-label strings. Route files remain composition boundaries, and domain engines retain their existing ownership.

## Watch History Boundary (PHR-UX-004)

Watch history belongs to watchlist membership, not canonical identity or the Market Intelligence Repository. `WatchHistoryMetadata` captures membership creation and successful observations acquired while the watch exists. Provider history from before `addedAt` is not copied.

Observation storage is bounded to 32 points and drives lightweight direction presentation only. Target-price math and market-since-added math remain independent.

## Platform Capability Architecture (PHR-UX-003)

Workflow availability is resolved by game through `PlatformCapabilityRegistry` and `PlatformCapabilityResolver`. Capability state is separate from evidence value: Operational, Pending, Unavailable, Not Applicable, and Disabled describe whether a workflow can run, while Repository, Replay, and Provider describe evidence/source presentation.

Market Watch consults the same market capability before formatting or acquisition. A non-operational market capability returns locally with an explanation and cannot call `/api/market/snapshot`.

Watchlist entries are user-owned membership records scoped by `watchlistId`. Editing or removing membership updates `WatchlistStorage` only. Canonical Identity, Market Intelligence Repository, replay fixtures, and market history remain outside the deletion dependency path.

## Identity Platform (PHR-ARCH-004)

Identity application flows use `IdentityOrchestrator`, never concrete providers. The orchestrator parses game/search context, selects from `IdentityProviderRegistry`, checks lifecycle capability, executes an operational provider, delegates existing canonical/intent resolution, and adapts results into the canonical identity model.

Current capability matrix has Magic/Scryfall, Lorcana/Lorcast, Pokémon/TCGdex, and One Piece/Bandai official operational, with Flesh and Blood registered as a pending connection. Identity artwork is provider identity data; market providers do not own it. Lorcast prices are explicitly excluded.

## Cross-Game Identity Ontology (PHR-ARCH-007)

The authoritative canonical representation is:

```text
GameplayIdentity
  -> PrintingIdentity
       -> PhysicalVariantIdentity
            -> MarketIdentity
                 -> MarketObservation
            -> InventoryInstance
                 <- OwnershipRelationship -> Owner
```

Gameplay Identity owns rules-equivalent meaning. Printing Identity owns publication, set, collector number, language, artwork, rarity, and printing-design facets. Physical Variant Identity owns only explicit manufacturing finish. Market Identity owns marketplace Product/SKU addressability, while Market Observation owns time-varying evidence. Inventory Instance owns copy state; OwnershipRelationship connects a copy to an owner.

`CanonicalIdentityModel` now carries this ontology graph. Existing `CardIdentity`, `Card`, printing, finish, workflow URL, watchlist, market repository, and replay fields remain compatibility projections during migration. Typed provider aliases declare which canonical entity they identify. `IdentityMappingRepository` resolves only validated aliases.

Scryfall mapping: `oracle_id` -> Gameplay, card `id` -> Printing, `finishes` -> Physical Variant, marketplace cross-references -> Market Identity candidates. Lorcast mapping: deterministic rules fingerprint -> Gameplay, card `id` -> Printing, rarity -> Printing Design Facet, physical finish -> Provider Does Not Supply, `tcgplayer_id` -> Market Identity candidate. TCGplayer `printingId`/`variantId` is provider finish segmentation and never canonical Printing Identity.

## Identity Presentation Layer (PHR-ARCH-009)

The PHR-ARCH-007 ontology is immutable and never imports presentation concerns. Collector-facing workflows translate canonical records through a one-way presentation boundary:

```text
Canonical Ontology
  -> IdentityPresentationAdapter
  -> IdentityPresentationModel
  -> Collector UI

Canonical Ontology + Presentation Model
  -> IdentityPresentationDiagnostics
  -> Developer UI
```

Collector vocabulary maps Printing Identity location to Set, Printing Design Facet to Treatment, Physical Finish to Printing, Market Observation to Market, and Inventory Instance condition to Condition. React components do not own these translations. Meaningful unavailable or pending states precede Unknown.

PHR-UX-005 refines this vocabulary for experienced collectors: Printing Identity location is labeled Set; Physical Finish is labeled Printing. Treatment is visible only when non-standard. Printing is visible only when it distinguishes the physical collectible, so Regular, Normal, Nonfoil, and Provider Does Not Supply are suppressed. `IdentityPresentationField.visible` and `visibilityReason` own this policy; canonical values remain available to developer diagnostics.

Project Phronesis (Engineering Initiative) is the internal engineering identity for this architecture. The commercial product name remains undecided. The architecture reflects practical judgment: observations are separated from reasoning, evidence precedes conclusions, and business decisions remain explainable.

## Sprint 34: Market Intelligence Engine

The Market Intelligence Engine interprets market observations that already exist in repository or replay-normalized provider data.

```text
Provider / Replay Observation
  -> Normalized observations
  -> Market Repository evidence
  -> Market Intelligence Engine
  -> Market Intelligence Profile
```

The engine does not call providers, does not negotiate, and does not decide BUY, PASS, or NEGOTIATE. It consumes observations and produces intelligence.

Core files:

- `lib/market/intelligence/MarketIntelligenceEngine.ts`
- `lib/market/intelligence/MarketReasoning.ts`
- `lib/market/intelligence/MarketSignal.ts`
- `lib/market/intelligence/MarketSignalRegistry.ts`
- `lib/market/intelligence/MarketHealth.ts`
- `lib/market/intelligence/MarketOpportunity.ts`
- `lib/market/intelligence/MarketConfidence.ts`
- `lib/market/intelligence/MarketTrendInterpreter.ts`
- `lib/market/intelligence/MarketVolatilityInterpreter.ts`

### Reasoning Model

Market reasoning combines multiple observations:

- Current variant valuation
- Historical price range
- Price history
- Provider movement statistics
- Trend slopes
- Volatility statistics
- Evidence freshness
- Evidence confidence
- Observation density

Market Health is a multi-factor interpretation with ratings:

- Excellent
- Healthy
- Neutral
- Weak
- Distressed

Buying Opportunity is also market-only:

- Very Strong
- Strong
- Moderate
- Weak
- Very Weak
- Unknown

It considers trend, volatility, historical range, current valuation, and evidence confidence. It does not use business profile, target margin, negotiation ladder, or purchase decision logic.

Confidence uses Evidence Sufficiency. It reflects coverage, freshness, provider quality, and observation density, not whether the market is attractive.

### Signal Registry

The signal registry contains explainable market signals:

- Stable Price History
- Healthy Uptrend
- Recovering Market
- Cooling Demand
- High Price Volatility
- Low Volatility
- Strong Momentum
- Weak Momentum
- Price Compression
- Price Expansion
- Near Historical Low
- Near Historical High
- Historical Recovery
- Market Consolidation
- Provider Confidence High
- Evidence Coverage Moderate

Signals are inputs to reasoning. They are not business decisions.

## Sprint 33: Provider Replay & Fixture Infrastructure

Provider Replay separates provider acquisition from development playback.

```text
Production
  -> Provider
  -> Official SDK / API
  -> Raw observation
  -> Normalizer
  -> Repository

Development replay
  -> Provider
  -> Replay fixture
  -> Raw observation
  -> Normalizer
  -> Repository
```

The repository and business engines do not know whether observations came from a live provider or replay fixture.

Core files:

- `lib/providers/replay/ReplayProvider.ts`
- `lib/providers/replay/ReplayRecorder.ts`
- `lib/providers/replay/ReplayLoader.ts`
- `lib/providers/replay/ReplayRegistry.ts`
- `lib/providers/replay/ReplayMetadata.ts`
- `lib/providers/replay/ReplayDiagnostics.ts`
- `lib/providers/replay/ReplayMode.ts`
- `lib/providers/replay/ReplaySession.ts`

### Replay Modes

`PROVIDER_MODE` controls local provider behavior:

- `LIVE`: call the provider SDK/API.
- `REPLAY`: load a fixture and skip network/API quota. Missing fixtures fail fast.
- `AUTO`: load a fixture if present; otherwise call the live provider.

`NODE_ENV=production` forces `LIVE`.

### Fixture Format

Fixtures live under:

```text
fixtures/providers/{provider}/{game}/{asset}/{printing}/{finish}/{condition}/{language}.json
```

Example:

```text
fixtures/providers/justtcg/magic/mox-opal/6be9b1d5-9ab8-4adb-ba54-2c0117e842fa/normal/nm/english.json
```

Each fixture stores one replay observation for one market identity:

- `metadata.provider`
- `metadata.schemaVersion`
- `metadata.recordedAt`
- `metadata.providerVersion`
- `metadata.sdkVersion`
- `metadata.identity.assetIdentity`
- `metadata.identity.printing`
- `metadata.identity.collectorNumber`
- `metadata.identity.finish`
- `metadata.identity.condition`
- `metadata.identity.language`
- `metadata.identity.providerProductIdentifier`
- `metadata.identity.providerVariantIdentifier`
- optional `metadata.checksum`
- `raw` provider response
- `normalized` provider observation snapshot

The loader validates provider, game, asset, full identity, schema version, SDK version, timestamp, payload presence, and optional checksum before replay.

### Fixture Identity Model

Replay is keyed by the same market identity requested by the provider boundary: asset identity, printing, collector number, finish, condition, language, provider product identifier, and provider variant identifier. The replay layer does not infer the nearest card, printing, finish, condition, or language.

The registry builds the fixture path from normalized identity keys and performs an exact file lookup. If no exact replay observation exists, `REPLAY` mode returns a replay observation missing failure with the first missing identity component, such as Printing, Finish, Condition, or Language.

### Replay Lifecycle

1. Provider receives a normal request.
2. `ReplayProvider.prepare()` resolves `LIVE`, `REPLAY`, or `AUTO`.
3. The provider passes the requested market identity into the replay registry.
4. In `REPLAY`, an exact fixture raw response is returned before SDK instantiation.
5. In `AUTO`, an exact fixture is used if present; otherwise live provider execution proceeds.
6. The existing provider normalizer converts raw observations into the same normalized response used by live mode.
7. Diagnostics record requested identity, replay identity, exact match, missing components, fixture loaded, fixture age, recorded source, SDK version, skipped live request, and quota saved.

### Recording Workflow

When `PROVIDER_RECORD_FIXTURES=true`, live provider responses can be recorded after normalization. The recorder writes each provider variant as its own identity fixture with raw response, normalized response, metadata, and checksum-ready fixture data to the provider fixture tree.

### Provider Certification Workflow

Certified providers should:

1. Run live acquisition for a known asset.
2. Normalize the response through the provider adapter.
3. Record the fixture.
4. Validate the fixture with `ReplayLoader`.
5. Re-run the provider in `REPLAY`.
6. Confirm no SDK/network call occurs and normalized observations match the certified provider path.

## Sprint 32: Market Ontology

The Market Ontology is the canonical vocabulary for market evidence. It defines what each evidence domain means before providers are asked for data.

```text
Provider Observations
  -> Evidence Domains
  -> Market Intelligence Repository
  -> Asset Assessment
```

Core files:

- `lib/market/ontology/MarketOntology.ts`
- `lib/market/ontology/EvidenceDomain.ts`
- `lib/market/ontology/EvidenceCapability.ts`
- `lib/market/ontology/ProviderCapability.ts`
- `lib/market/ontology/CapabilityRegistry.ts`
- `lib/market/ontology/EvidenceQuestion.ts`
- `lib/market/ontology/EvidenceResolver.ts`
- `lib/market/ontology/DomainCoverage.ts`

Evidence domains:

- Variant Valuation
- Listing Intelligence
- Transaction Intelligence
- Historical Pricing
- Inventory Intelligence
- Price Trend
- Volatility
- Market Liquidity
- Market Confidence
- Provider Metadata

Provider capability rule:

- Providers declare supported, unsupported, partial, and unknown domains explicitly.
- Market questions resolve to a domain before provider selection.
- Unsupported providers are not queried for that domain.
- Unsupported provider fields are not written as repository evidence.

JustTCG capabilities:

- Supported: Variant Valuation, Historical Pricing, Price Trend, Volatility, Market Confidence, Provider Metadata.
- Partial: Market Liquidity, because valuation and movement help context but do not prove depth.
- Unsupported: Listing Intelligence, Transaction Intelligence, Inventory Intelligence.

If a UI or engine asks for Lowest Listing, the platform resolves that question to Listing Intelligence. JustTCG is not eligible for that domain. A listing-capable provider such as TCGplayer can answer now, while Cardmarket and eBay remain future mappings.

### Transitional Evidence Projection

Until the Market Intelligence Engine exists, Current Market Estimate uses a compatibility bridge:

```text
Current Market Estimate
  -> Consensus Market Estimate (future)
  -> Variant Valuation (JustTCG)
  -> Historical Repository Estimate
  -> No connected evidence
```

This projection is internal and does not weaken provider capability enforcement. JustTCG still cannot answer Listing Intelligence, Transaction Intelligence, or Inventory Intelligence. The bridge only allows Variant Valuation to keep the Current Market Estimate populated so Vendor Workspace does not lose valid valuation evidence.

Developer diagnostics expose Requested UI Field, Resolved Evidence Domain, Evidence Source, and Projection Used. Production users see the valuation result, not implementation details.

Removal plan: retire `TransitionalEvidenceProjection` when the Market Intelligence Engine owns Current Market Estimate natively.

### Coverage-Driven Refresh

Market refresh now evaluates both field freshness and evidence-domain coverage before returning a repository snapshot.

```text
Repository Snapshot
  -> Fresh?
  -> Coverage Complete?
  -> Return only when both are satisfied
```

The scheduler builds an Evidence Coverage Map for the selected asset, printing, finish, and condition. Each evidence domain receives a coverage status and freshness state:

- Variant Valuation
- Historical Pricing
- Listing Intelligence
- Transaction Intelligence
- Inventory Intelligence
- Price Trend
- Volatility
- Market Liquidity
- Market Confidence
- Provider Metadata

If a field is fresh but a required evidence domain is missing or only partially covered, the scheduler fetches only the preferred capable provider for that missing domain. Existing evidence remains in the repository and new valid provider evidence is merged through the Market Evidence Layer. Unsupported domains are marked unsupported and do not trigger provider calls.

Developer diagnostics expose coverage, freshness, missing evidence, providers queried, providers skipped, and merge result.

## Sprint 31D: Market Evidence Layer

Market values are now selected from layered provider evidence. A single provider response is never treated as complete market truth, and adding a provider must not reduce already available information.

```text
Market Providers
  -> Provider Validation
  -> Market Evidence Layer
  -> Market Intelligence Repository
  -> Asset Assessment
```

Core files:

- `lib/market/MarketEvidenceLayer.ts`
- `lib/market/EvidenceAggregator.ts`
- `lib/market/EvidenceResolver.ts`
- `lib/market/EvidencePriority.ts`
- `lib/market/EvidenceProvenance.ts`
- `lib/market/EvidenceCoverage.ts`
- `lib/market/EvidenceFallback.ts`
- `lib/market/EvidenceSelection.ts`

Responsibilities:

- Aggregate evidence from multiple providers.
- Preserve existing evidence when a new provider lacks a field.
- Select best available evidence by freshness, configured provider priority, confidence, and recency.
- Retain provider provenance internally.
- Report provider coverage independently by field.
- Keep production UI on the same market snapshot contract.

Fallback examples:

- Current Market Estimate: future consensus -> JustTCG -> Scryfall -> repository snapshot -> unavailable.
- Lowest Listing: JustTCG -> repository snapshot -> unavailable.
- Recent Sales: JustTCG -> repository snapshot -> unavailable.

Production surfaces receive selected market values. Developer tooling can inspect evidence stack, selected provider, fallback reason, provider priority, freshness, and coverage.

Condition-specific evidence:

- Evidence nodes retain asset, printing, variant, finish, condition, provider condition, and product identifier.
- Provider condition-specific values are stored separately from generic market estimates.
- Generic evidence can be used as fallback, but condition-specific evidence is preferred when freshness is comparable.
- Future graded variants can use the evidence node certification envelope for PSA, BGS, CGC, grade, and serial identity without redesigning repository storage.

JustTCG raw-observation rule:

- `docs/providers/JUSTTCG_DATA_MODEL.md` is the provider mapping source of record.
- JustTCG `card` and `variant` fields are preserved as raw observations.
- JustTCG movement, range, trend, volatility, and activity statistics are classified as provider-supplied derived metrics.
- Repository evidence stores raw observations; Market Intelligence derives platform metrics internally.
- Provider fields must not be assumed to correspond directly to UI fields.

## Sprint 31C: Market Truth Model

The repository stores provider evidence, not provider truth. A provider response must pass Market Truth validation before it can update Market Intelligence Repository fields.

```text
Selected Printing
  -> Market Provider
  -> Normalization
  -> Market Truth Model
  -> Market Intelligence Repository
  -> Asset Session
```

Core files:

- `lib/market/MarketTruthEngine.ts`
- `lib/market/ProviderEvidenceValidator.ts`
- `lib/market/ProviderEvidenceScore.ts`
- `lib/market/ProviderMatchValidator.ts`
- `lib/market/ProviderPricingClassifier.ts`
- `lib/market/ProviderFieldMapping.ts`
- `lib/market/ProviderConsistencyReport.ts`
- `lib/market/MarketTruthReport.ts`

Validation covers canonical card identity, printing, collector number, finish, condition, language, game, product identifier, and provider timestamp. Missing legacy metadata can warn; conflicting metadata rejects the provider response.

Price classification maps provider values into business-readable categories: Market Price, Lowest Listing, Lowest NM Listing, Direct Price, Average Sale, Recent Sale, Suggested Price, or Unknown.

Every stored provider-derived value retains provider name, retrieval timestamp, confidence, classification, freshness, and coverage. A future consensus engine may compare multiple validated providers, but Sprint 31C intentionally does not create consensus or alter Assessment, Strategy, Negotiation, Recommendation, or cache architecture.

## Sprint 31B: Market Intelligence Repository

Market provider responses are no longer treated as transient request output. They are normalized into Market Intelligence snapshots owned by the platform.

```text
Provider
  -> Normalization
  -> Market Intelligence Repository
  -> Asset Session
  -> Assessment
  -> Strategy
  -> Negotiation
  -> Decision
```

`app/api/market/snapshot` now consumes `MarketRefreshScheduler`, which reads and updates `MarketIntelligenceRepository`. Provider communication is centralized inside market infrastructure. Application code does not call market providers directly.

The snapshot model stores card identity, printing, finish, condition, current market price, lowest listing, listing count, recent sales, spread, market confidence, liquidity, sales velocity, volatility, provider, last refresh, per-field expiration, and snapshot version.

Refresh philosophy:

- Every field owns its own TTL.
- Fresh repository data returns without provider contact.
- Slightly stale data returns immediately and refreshes asynchronously.
- Expired or missing fields block for provider refresh.
- Only expired or missing fields are refreshed.

Initial local persistence uses `.market-intelligence-repository.json`. The repository boundary is intentionally narrow so storage can migrate to SQLite, PostgreSQL, Redis, or cloud storage without changing business engines.

Atlas diagnostics track repository health, average freshness, cache hit rate, provider usage, estimated API cost saved, oldest snapshot, and newest snapshot.

## Sprint 31A: JustTCG Live Provider Connection

The first live provider connection uses the official `justtcg-js` JavaScript/TypeScript SDK.

```text
Application
  -> Provider SDK
  -> JustTCG Provider Adapter
  -> official justtcg-js SDK
  -> JustTCG API
```

Application code must not instantiate or call `JustTCG` directly. `JustTCGProvider` owns SDK initialization, `JustTCGAdapter` owns Provider SDK compatibility, and `JustTCGNormalizer` maps SDK response fields into internal normalized provider data.

Current scope is connectivity only:

- Known-card request: `Mox Opal`.
- Authentication: `JUSTTCG_API_KEY` from the environment.
- SDK version: `justtcg-js@0.2.1`.
- No caching, retries, Assessment changes, Strategy changes, Negotiation changes, Decision changes, or production UI redesign.

Normalized field mapping is documented in `JUSTTCG_FIELD_MAPPINGS` and covers card identity, set metadata, external identifiers, variant condition, printing, language, current USD price, update timestamp, price history, movement percentages, and price statistics.

The temporary `/dev/justtcg` page is development-only. It displays the raw SDK response for inspection, the normalized response used by the Provider SDK, provider latency, authentication status, and diagnostics. Production surfaces continue to receive normalized provider data only.

## Application Structure

Phronesis is a Next.js application using TypeScript and Tailwind CSS.

Top-level structure:

- `app/`: Next.js routes and API routes.
- `components/`: shared UI and reusable product components.
- `features/`: workflow-specific UI modules.
- `types/`: domain contracts shared across engines and UI.
- `data/`: mocked domain data.
- `knowledge/`: dictionary-driven TCG knowledge.
- `config/`: configurable engine thresholds and weights.
- `lib/knowledge/`: reusable Asset Knowledge Graph, relationship registry, resolver, graph registry, nodes, edges, and queries.
- `lib/assessment/`: Asset Assessment Engine, assessment registry, evidence, reasoning, confidence, summary, and assessment contracts.
- `lib/engines/`: provider-independent business and interpretation engines.
- `lib/providers/`: external or mocked data provider implementations.
- `lib/providers/sdk/`: reusable provider lifecycle SDK and planned provider metadata.
- `lib/intelligence/certification/`: provider-ready Certification Intelligence model.

## Intelligence Provider SDK

The Provider SDK is the reusable lifecycle layer for future data providers.

Core files:

- `lib/providers/sdk/ProviderClient.ts`
- `lib/providers/sdk/ProviderAdapter.ts`
- `lib/providers/sdk/ProviderEvidence.ts`
- `lib/providers/sdk/ProviderHealth.ts`
- `lib/providers/sdk/ProviderCoverage.ts`
- `lib/providers/sdk/ProviderMetadata.ts`
- `lib/providers/sdk/ProviderRegistry.ts`
- `lib/providers/sdk/ProviderDiagnostics.ts`
- `lib/providers/sdk/ProviderCache.ts`
- `lib/providers/sdk/ProviderResult.ts`

Provider rule:

Providers supply data. The SDK owns normalization, health, caching hooks, diagnostics, evidence mapping, confidence contribution, provider metadata, retry hooks, and validation hooks.

Prepared SDK provider metadata:

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

These adapters are metadata-only and waiting for approved integration paths. They do not scrape, do not call unofficial APIs, and do not change existing provider behavior.

## TCGplayer Market Intelligence Provider

`TCGplayerIntelligenceProvider` is the first SDK-backed Market Intelligence provider.

Location:

- `lib/providers/market/TCGplayerIntelligenceProvider.ts`

Provider responsibilities:

- Accept provider-shaped market records.
- Normalize data into domain `MarketSnapshot` and `MarketIntelligenceEvidence`.
- Hide raw provider responses from UI, business logic, assessment, strategy, and negotiation.

Normalized evidence:

- Market Price
- Direct Low
- Lowest Listing
- Listing Count
- Recent Sales
- Market Trend
- Price History
- Liquidity
- Inventory Health
- Sales Velocity
- Spread
- Market Confidence
- Volatility
- Market Stability
- Demand Momentum

Flow:

TCGplayer provider data -> Provider SDK adapter -> normalized Market Intelligence evidence -> Card Intelligence signals -> Asset Assessment -> Strategy -> Negotiation Ladder.

Scryfall remains a fallback market estimate source when TCGplayer evidence is unavailable for the requested asset.

## Asset Knowledge Graph

The Asset Knowledge Graph is the semantic relationship layer shared by Intelligence models.

Core files:

- `lib/knowledge/AssetKnowledgeGraph.ts`
- `lib/knowledge/KnowledgeGraphRegistry.ts`
- `lib/knowledge/RelationshipRegistry.ts`
- `lib/knowledge/RelationshipResolver.ts`
- `lib/knowledge/KnowledgeNode.ts`
- `lib/knowledge/KnowledgeEdge.ts`
- `lib/knowledge/KnowledgeQuery.ts`

The graph models relationships between an asset and:

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

Relationship Registry owns configured semantic knowledge. Relationship Resolver combines configured knowledge with card metadata into an `AssetKnowledgeGraph`. Knowledge Graph Registry is the stable integration point consumed by Intelligence models.

Playability consumes graph roles, archetypes, themes, strategies, and format context for richer player-demand reasoning. Certification consumes premium-printing, Reserved List, and collector-role relationships for certification relevance. The graph does not decide BUY/PASS, strategy behavior, or negotiation terms.

## Asset Assessment Engine

Asset Assessment is the canonical synthesis layer between Intelligence models and downstream business logic.

Core files:

- `lib/assessment/AssetAssessmentEngine.ts`
- `lib/assessment/AssetAssessment.ts`
- `lib/assessment/AssessmentEvidence.ts`
- `lib/assessment/AssessmentReasoning.ts`
- `lib/assessment/AssessmentConfidence.ts`
- `lib/assessment/AssessmentSummary.ts`
- `lib/assessment/AssessmentRegistry.ts`

Flow:

Intelligence Models provide evidence.

Asset Assessment interprets evidence.

Business Profile applies business context.

Strategy applies business objectives.

Negotiation consumes strategy-shaped output.

Decision evaluates the validated offer.

Asset Assessment consumes Knowledge Graph, Playability, Certification, Collector, Investment, Market, Liquidity, Business Context, and Evidence Sufficiency. It outputs overall assessment, confidence, evidence coverage, primary drivers, supporting drivers, risk factors, opportunity factors, and a concise business summary.

Unknown evidence reduces confidence but does not reduce asset quality. This preserves the distinction between a weak asset and an unknown asset.

## App Shell

`components/ui/AppShell.tsx` owns the application frame:

- Sidebar navigation
- Topbar
- Main content area

Feature routes compose their UI inside `AppShell`.

## Feature Modules

Feature-specific presentation lives in `features/`.

Examples:

- `features/vendor/`: Vendor Workspace and purchase evaluation UI.
- `features/developer/identity/`: development-only Identity Explorer and diagnostics.
- `features/opportunities/`: Opportunity Details.
- `features/evaluation/`: Purchase Evaluation form and result components.

Generic UI should remain in `components/ui`.

## Intelligence Console Information Architecture

Every Intelligence model uses the same presentation contract:

Layer 1: Grade and model-specific confidence

Layer 2: Business Conclusion

Layer 3: Key Signals

Layer 4: Supporting Evidence

Implementation remains Atlas-only.

Expanded Vendor Workspace panels answer exactly four questions:

1. What do you think?
2. How certain are you?
3. Why?
4. What evidence supports it?

Vendor Workspace owns:

- Grade
- Model-specific confidence label
- Confidence reason when confidence is below High
- Business conclusion
- Key Signals
- Supporting Evidence

Atlas Inspector owns Layer 4:

- Version
- Health
- Status
- Framework and engine details
- Internal sources
- Future dependencies
- Internal signals
- Provider health
- Provider status
- Provider matrix
- Debug information

Production UI must not expose implementation language such as Placeholder, Experimental, Framework Version, Engine Version, Provider Matrix, Internal Sources, or Future Dependencies.

## Current Query Pipeline

User Query

↓

Query Engine

↓

Knowledge Platform

↓

Canonical Resolution

↓

Intent Resolution

↓

Identity Resolution

↓

Constraint Satisfaction

↓

Printing Resolution

↓

Variant Resolution

↓

Condition Resolution

↓

Market Context

↓

Asset Intelligence Framework

↓

Certification Intelligence

↓

Card Intelligence Models

↓

Strategy

↓

Negotiation Ladder

↓

Decision Resolver

↓

Vendor Workspace

## Provider Architecture

Identity Providers answer:

What is this card?

Market Providers answer:

What is this card worth?

Certification Providers answer:

What are the collectible certification characteristics of this asset?

These provider families must stay separate.

Current state:

- Scryfall is the first Identity Provider.
- Scryfall is the first Market Provider.
- Scryfall market data is daily affiliate market estimate data, not live listing inventory.
- Lowest listing and recent sale data are not live yet.
- UI components must never know Scryfall response shapes.
- Provider data must be adapted into domain objects before it reaches engines or UI.

Certification provider rules:

- Certification Intelligence measures characteristics only.
- Certification Intelligence never decides BUY, NEGOTIATE, or PASS.
- Current Certification implementation uses a placeholder provider only.
- PSA, BGS, and CGC are represented as current placeholder-backed providers.
- TAG, SGC, and ARS are registered as future providers.
- No scraping or unofficial APIs are allowed.
- Future providers must register through `CertificationRegistry`.

## Certification Intelligence

Certification Intelligence is a first-class Asset Intelligence model.

Certification flow:

Printing + Variant

↓

Certification Engine

↓

Certification Provider Registry

↓

Certification Profile

↓

Asset Intelligence Framework

↓

Collector Intelligence

↓

Strategy

↓

Negotiation Ladder

↓

Decision Resolver

Certification Profile exposes overall certification grade plus provider-level grade, confidence, population, gem population, gem rate, estimated premium, trend, status, source, and last updated.

Certification indicators:

- Certification Grade
- Population Scarcity
- Gem Rate
- Certification Premium
- Population Trend
- Collector Competition
- Submission Saturation

Future indicators:

- Cross-grading
- Population Growth

## Playability Intelligence Level 2

Playability Intelligence measures player demand.

It does not decide BUY, NEGOTIATE, PASS, or offer values.

Current provider:

- Scryfall legalities

Current demand layer:

- Configurable format weights in `config/playability.ts`
- Demand hints for known play patterns
- Weighted format contribution
- Business conclusions
- Key Signals

Per-format Playability indicators track:

- Legality
- Importance
- Demand Level
- Competitive Relevance
- Casual Relevance
- Confidence
- Trend
- Status
- Provider

Playability indicators:

- Commander Strength
- Competitive Strength
- Casual Strength
- Format Diversity
- Demand Stability
- Ban Risk
- Meta Dependency
- Future Demand Readiness

Future providers:

- EDHREC
- MTGGoldfish
- Melee
- MTGO
- Tournament APIs

No unofficial API integration is allowed.

## Playability Intelligence Level 3

Playability Level 3 adds explainable demand semantics.

Demand Model dimensions:

- Commander Demand
- Competitive Demand
- Casual Demand
- Combo Relevance
- Staple Status
- Format Diversity
- Demand Stability
- Ban Risk
- Meta Dependency
- Demand Resilience
- Future Demand Readiness

Format Analysis exposes:

- Legality
- Demand
- Competitive Weight
- Casual Weight
- Trend
- Confidence
- Evidence Source
- Provider Status

Card Role Model:

- Fast Mana
- Commander Staple
- Combo Piece
- Tutor
- Removal
- Counterspell
- Finisher
- Engine
- Utility
- Value Card
- Ramp
- Protection
- Card Draw

Provider Adapter:

`PlaceholderPlayabilityProviderAdapter` normalizes current placeholder-backed evidence into the Playability Profile. Future EDHREC, MTGGoldfish, Melee, MTGO, and Tournament API adapters must normalize into the same profile contract.

## Evidence Sufficiency Framework

Evidence precedes conclusion.

Every Intelligence model declares:

- Required Evidence
- Optional Evidence
- Future Evidence

Evidence states:

- SUFFICIENT
- PARTIAL
- INSUFFICIENT
- UNKNOWN
- WAITING_FOR_PROVIDER

Grade rules:

- SUFFICIENT: generate grade.
- PARTIAL: generate grade and reduce confidence.
- INSUFFICIENT: display Unknown instead of a letter grade.

Unknown is not a failing grade. It means the platform cannot yet produce a reliable conclusion.

Missing evidence and negative evidence are separate states.

Integrated model families:

- Playability
- Certification
- Collector
- Investment
- Market
- Liquidity
- Regional
- Historical
- Behavior
- Volatility

## Market Price Architecture

Market Providers answer what a selected printing and finish variant is worth.

Scryfall Market Provider v1 maps Scryfall Card price fields into normalized `MarketSnapshot` data:

- `prices.usd` → Nonfoil USD market estimate
- `prices.usd_foil` → Foil USD market estimate
- `prices.usd_etched` → Etched USD market estimate
- `prices.eur` → Nonfoil EUR market estimate
- `prices.eur_foil` → Foil EUR market estimate
- `prices.eur_etched` → Etched EUR market estimate
- `prices.tix` → MTGO TIX market estimate

Null prices are ignored. The application must not invent prices, live listings, recent sales, or buylist values.

Vendor Workspace receives normalized `MarketSnapshot` data from the internal market API and passes `MarketPrice` into the Evaluation Engine.

## Condition Pricing Lifecycle

Condition-aware pricing must preserve provider precedence.

Current flow:

Condition selector

↓

`ChangeCondition` command

↓

New Asset Context generation

↓

Market snapshot request for the current printing and variant

↓

Generation-aware `LoadMarketSnapshot`

↓

Existing `createConditionMarketSnapshot`

↓

Card Intelligence

↓

Offer Ladder

↓

Decision Resolver

The existing condition-aware market snapshot pipeline must be reused. Do not replace it with new placeholder multipliers or inferred pricing.

Market Provider precedence:

- If provider market data exists, use provider market data.
- Future Condition Intelligence may estimate missing values only when provider data is unavailable.
- Future inferred condition pricing must be traceable and must never override provider data.

## Image Architecture

Card images are presentation data attached to normalized `Card` domain objects.

The Scryfall adapter maps provider image data into:

- `imageUrl`
- `imageUrls`
- `cardFaces`
- `imageSource`
- `imageFace`
- `hasCardFaces`

UI components render images from domain objects only. They must not fetch Scryfall image data directly.

## Printing Variant Architecture

A card identity is not a purchasable object, and a printing is not always the final purchasable object.

The selection model is:

Card Identity

↓

Printing

↓

Printing Finish Variant

Scryfall can return one printing with multiple available finishes, such as Nonfoil and Foil. The adapter preserves those finishes as `PrintingVariant` objects on the normalized `Card`.

Constraint Satisfaction may auto-commit a printing while leaving the finish variant unresolved. Vendor Workspace must block purchase evaluation until a finish variant is selected unless the query or source data makes the finish unambiguous.

Special foil treatments such as Halo, Surge, Galaxy, and Confetti are modeled as distinct finish variants instead of plain Foil.

## Variant Resolution Policy

`lib/engines/variantResolution/VariantResolutionPolicy.ts` chooses a default purchasable finish after printing resolution.

Policy order:

1. Explicit user finish requests always win.
2. Single-finish printings auto-select that finish.
3. Multi-finish printings with Nonfoil auto-select Nonfoil.
4. If Nonfoil is unavailable, the least-special available finish is selected.

The policy is isolated so future games can define different finish priorities without moving rules into Vendor Workspace.

## Purchase Evaluation Engine

The Evaluation Engine consumes:

- selected printing
- selected finish variant
- selected condition
- normalized market estimate
- market context
- buying strategy
- user asking price

It now creates a `CardProfile`, applies condition-adjusted market context, calculates strategy-weighted Card Intelligence, builds a Negotiation Ladder, and asks the Decision Resolver to compare the seller's asking price against the ladder.

## Card Intelligence Platform

Card Intelligence never decides BUY, NEGOTIATE, or PASS. It produces reusable signals.

Current signal registry:

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

Signals include score, confidence, version, contributing factors, supporting data sources, generated timestamp, source, explanation, and status. Status can be `live`, `estimated`, `placeholder`, or `future`.

Every `CardProfile` contains identity, printing, variant, condition, market context, condition market snapshot, signals, framework intelligence models, overall confidence, and generation timestamp.

## Asset Intelligence Framework

The Asset Intelligence Framework is the common contract for all future intelligence work.

Location:

- `lib/intelligence/framework/`

Intelligence Models do not make decisions. They measure one dimension of an asset. Strategies consume Intelligence Models, the Negotiation Ladder consumes strategies, and the Decision Resolver consumes the Negotiation Ladder.

Every Intelligence Model exposes:

- id
- name
- version
- status
- confidence
- lastUpdated
- inputs
- outputs
- indicator list
- supporting sources
- health
- explanation
- dependency graph

Model health values:

- Healthy
- Partial
- Missing Data
- Unavailable
- Deprecated
- Experimental

Every Indicator exposes:

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

Registered current models:

- Market Intelligence
- Collector Intelligence
- Investment Intelligence
- Liquidity Intelligence
- Reprint Risk
- Market Confidence

Registered future models:

- Playability Intelligence
- Grading Intelligence
- Regional Intelligence
- Behavior Intelligence
- Historical Intelligence
- Volatility Intelligence
- Demand Intelligence
- Scarcity Intelligence

Future intelligence must become a model registered in this framework instead of an isolated scoring engine.

## Condition Resolution

Condition belongs after variant resolution and before market context.

Supported conditions:

- NM: Near Mint
- LP: Lightly Played
- MP: Moderately Played
- HP: Heavily Played
- DMG: Damaged

Condition influences market estimate, Negotiation Ladder, purchase evaluation, and Card Intelligence. It must not influence identity resolution.

## Market Context

`MarketContext` records country, region, currency, marketplace, language, tax model, and shipping model.

Current default:

- United States
- North America
- USD
- English
- Scryfall Market Provider

Future Market Context Engine responsibilities include regional valuation, currency normalization, marketplace selection, shipping assumptions, tax models, import costs, regional liquidity, regional demand, format popularity, and marketplace-specific multipliers.

## Negotiation Ladder

The Negotiation Ladder is the single negotiation source of truth.

It produces:

- Opening Offer
- Target Offer
- Maximum Buy Price
- Walk Away Price

Purchase Evaluation consumes the Negotiation Ladder. The Decision Resolver performs no independent business calculations.

Decision invariants:

- If current asking price is less than or equal to Target Offer, the decision must be BUY.
- If current asking price is greater than Target Offer and less than or equal to Maximum Buy Price, the decision must be NEGOTIATE.
- If current asking price is greater than Maximum Buy Price, the decision must be PASS.

This prevents contradictions because the Decision Resolver only compares the seller's asking price against the Negotiation Ladder.

## Evaluation Integrity

Sprint 20.2 formalizes the purchase evaluation pipeline:

Card → Printing → Variant → Condition → Market Context → Asset Intelligence → Strategy → Offer Ladder → Offer Ladder Validation → Decision Resolver → Vendor Workspace.

The Offer Ladder Validator lives at `lib/engines/negotiation/OfferLadderValidator.ts`.

It validates:

- Opening Offer
- Target Offer
- Maximum Buy Price
- Recommended Offer
- Negotiation Margin

Business invariants:

- Opening Offer <= Target Offer
- Target Offer <= Maximum Buy Price
- Recommended Offer <= Maximum Buy Price
- Decision Resolver may execute only after validation succeeds
- Missing calculations are unavailable, invalid, or waiting for data, never fallback zero

Evaluation Trace is produced by `evaluatePurchase` and includes Profit Trace, Offer Ladder Trace, Strategy Trace, Decision Trace, and validation status. Production UI should show a concise unavailable reason. Development UI may render trace diagnostics.

## Stable Systems

The following systems are stable extension points. Future work should enrich them instead of redesigning their boundaries:

- Knowledge Platform
- Query Engine
- Canonical Resolution
- Intent Resolution
- Constraint Satisfaction
- Variant Resolution
- Card Intelligence Platform
- Asset Intelligence Framework
- Negotiation Ladder
- Decision Resolver

## Decision-First Vendor Workspace

Vendor Workspace is optimized around one question: should the buyer purchase this card right now?

Desktop layout:

- Search and interpretation remain at the top.
- Printing candidates stay in the left column.
- The decision panel stays sticky in the right column.
- The printing list is not sticky.

Decision Drivers are generated by the business engine layer, not by UI components. They explain why BUY, NEGOTIATE, or PASS was returned without repeating metrics already visible in the panel.

## Vendor Workspace VX Pattern

Sprint 17 keeps the same architecture while making the buying workflow faster and denser.

Interaction model:

- Search remains the first focus target.
- Printing refinement starts with buyer vocabulary chips before optional text refinement.
- Printing rows show thumbnail, set, collector number, language, finish, printing style, release year, and match score in a compact row.
- Finish selection is a small segmented control that shows only available purchasable variants.
- Purchase evaluation updates automatically after a short debounce when asking price, printing, or finish changes.
- ESC resets the workflow and returns focus to search.
- Arrow keys navigate printing candidates when the user is not typing into an input.
- Enter selects the highlighted printing when focus is outside text inputs.

The VX layer must not calculate pricing, recommendation, margin, ROI, confidence, or decision drivers. It only orchestrates user input and renders engine output.

## Vendor Workflow Command Architecture

Sprint 20.4 uses command-driven workflow orchestration without changing the business engines.

Source files:

- `types/VendorWorkflowState.ts`
- `lib/workflow/commands/WorkflowCommand.ts`
- `lib/workflow/commands/WorkflowCommandProcessor.ts`
- `lib/workflow/commands/WorkflowCommandResult.ts`
- `lib/workflow/commands/CommandRegistry.ts`
- `lib/workflow/commands/ContextInvalidationEngine.ts`

The workflow tracks:

- current state
- previous state
- last command
- command log
- rejected command log
- identity count
- printing count
- auto-selection reason
- Single Printing Rule activation
- error message
- execution timing

Valid workflow progression keeps identity discovery separate from identity commitment:

1. Search produces identity candidates.
2. Keyboard or mouse navigation highlights an identity.
3. Selection commits an identity.
4. Printings load or the Single Printing Rule selects the only printing.
5. Variant and condition resolution prepare the purchase evaluation.
6. The workflow reaches `ReadyForEvaluation`, `EvaluationComplete`, or `Error`.

Invariant:

Every successful identity selection must reach `ReadyForEvaluation` or `Error`.

The Single Printing Rule applies when a selected identity has exactly one printing. In that case the Workflow Command Processor auto-selects the printing, resolves the purchasable finish variant, resolves condition, marks market and card intelligence as loaded, and prepares evaluation. If any required step cannot be resolved, the command processor records `Error` instead of leaving the UI half-selected.

Workflow transitions are driven only by workflow commands. UI components dispatch intent such as `SelectCard`, `SelectPrinting`, `SelectVariant`, `SelectCondition`, `ChangeStrategy`, `EnterAskingPrice`, or `ResetWorkspace`. The command processor decides the current state, required invalidations, loaded objects, and next state.

Sprint 20.3 makes the workflow snapshot the authority for selected workflow context. Vendor Workspace renders highlighted identity, selected identity, selected printing, selected variant, selected condition, selected strategy, and asking price from workflow context.

Context invalidation lives in `lib/workflow/commands/ContextInvalidationEngine.ts`. React components must not remember which downstream state to clear. They dispatch commands; the workflow command processor applies invalidation atomically.

Rejected commands preserve the previous context and append the command to workflow diagnostics. This prevents the UI from showing a selected printing or decision that does not belong to the current identity.

Dependency graph:

User Intent

↓

Workflow Command

↓

Workflow Command Processor

↓

Context Invalidation Engine

↓

Workflow Snapshot

↓

Vendor Workspace Presentation

## Asset Context Integrity

Asset Context makes one evaluation explicit. It is defined in `types/AssetContext.ts` and owned by `WorkflowCommandProcessor`.

An Asset Context includes:

- context id
- identity id
- printing id
- variant id
- condition
- market context id
- strategy id
- market snapshot id
- card profile id
- offer ladder id
- decision id
- generation
- updated timestamp

Generation increments when upstream context changes, such as card, printing, variant, condition, or strategy. Downstream objects from older generations become stale and must not be rendered as current data.

`lib/workflow/AssetContextValidator.ts` validates the visible asset chain:

Identity

↓

Printing

↓

Variant

↓

Market Snapshot

The validator returns:

- `Valid`
- `Invalid`
- `Incomplete`

Vendor Workspace uses the validator and generation-aware market snapshot ids to avoid rendering stale market data or stale evaluations.

Asset Context architecture graph:

Workflow Command

↓

Workflow Command Processor

↓

Asset Context Generation

↓

Context Invalidation

↓

Provider / Engine Output

↓

Asset Context Validator

↓

Vendor Workspace Presentation

## Atlas Inspector

Atlas Inspector is a development-only diagnostics surface in `features/vendor/components/AtlasInspector.tsx`.

Activation:

- Cmd+Shift+D
- Ctrl+Shift+D

Production Vendor Workspace must not display:

- workflow states
- command logs
- context ids
- execution timing
- provider traces
- developer messages

Atlas Inspector panels include Workflow, Asset Context, Query Parser, Canonical Resolution, Intent Resolution, Printing Resolution, Card Intelligence, Offer Ladder, Decision Trace, Performance, and Provider Trace.

Atlas Inspector Provider Trace should show requested condition, market snapshot source, generation, whether provider returned real data, and whether fallback data was used.

## Intelligence History Platform

The Intelligence History Platform records completed evaluations without changing business calculations.

Source files:

- `types/EvaluationSnapshot.ts`
- `types/AssetSnapshot.ts`
- `types/MarketSnapshotHistory.ts`
- `types/StrategySnapshot.ts`
- `types/OfferLadderSnapshot.ts`
- `lib/history/EvaluationHistoryEngine.ts`
- `lib/history/HistoryRepository.ts`
- `lib/history/SnapshotFactory.ts`
- `lib/history/SnapshotValidator.ts`

Lifecycle:

Ready Purchase Evaluation

↓

Snapshot Factory

↓

Snapshot Validator

↓

History Repository

↓

Immutable Evaluation Snapshot

Current persistence is local and append-only. The repository abstraction is intentionally small so future storage can move to database, cloud, analytics, or warehouse systems without changing evaluation engines.

Snapshot invariants:

- Asset Context must be complete.
- Market Snapshot must be present.
- Offer Ladder must be valid.
- Decision must be valid.
- Snapshots are never edited.
- New evaluations append new snapshots.

Future Simulation Platform:

The Simulation Platform should consume immutable snapshots for backtesting, strategy replay, market replay, signal validation, buying history analysis, and portfolio tracking. It should not mutate old snapshots or recalculate historical recommendations in place.

## Playability Intelligence Platform

Playability Intelligence measures play demand. It does not choose BUY, NEGOTIATE, PASS, opening offers, target offers, or maximum buy prices.

Source files:

- `lib/intelligence/playability/PlayabilityEngine.ts`
- `lib/intelligence/playability/PlayabilityProvider.ts`
- `lib/intelligence/playability/PlayabilityRegistry.ts`
- `lib/intelligence/playability/PlayabilityProfile.ts`
- `lib/intelligence/playability/PlayabilityIndicator.ts`
- `lib/intelligence/playability/PlayabilityTrend.ts`
- `lib/intelligence/playability/PlayabilitySource.ts`

Profile formats:

- Overall
- Commander
- Modern
- Legacy
- Vintage
- Pioneer
- Standard
- Pauper
- Explorer
- Canadian Highlander

Each format indicator exposes score, confidence, trend, availability, data source, legal / restricted / banned / unknown status, last updated timestamp, meta stability, deck penetration readiness, and explanation.

Provider graph:

Playability Intelligence

↓

Playability Engine

↓

Playability Provider Registry

↓

Scryfall Playability Provider

↓

Future providers: EDHREC, MTGGoldfish, Melee, MTGO, Top8

Runtime graph:

Scryfall Legalities

↓

Normalized Card

↓

Playability Profile

↓

Card Profile

↓

Asset Intelligence Framework Indicators

↓

Strategy Signal Weights

↓

Negotiation Ladder

↓

Decision Resolver

Architecture rule: provider data can improve Playability confidence and indicators, but Playability must remain an input to strategies only.

## Intelligence Console v2

The Intelligence Console is the permanent presentation layer for Asset Intelligence models.

Source files:

- `components/intelligence/IntelligenceConsole.tsx`
- `components/intelligence/IntelligenceTile.tsx`
- `components/intelligence/IntelligenceDetail.tsx`
- `components/intelligence/IntelligenceGrade.tsx`

Presentation contract:

- Every Intelligence Model renders through the same tile standard.
- Collapsed tiles show model name, grade, confidence, and expand affordance only.
- Expanded details show score, grade, confidence, version, status, summary, contributing factors, supporting data sources, trend, future dependencies, and explanation.
- Only one tile expands at a time by default.
- Business engines and providers remain presentation-independent.
- No Intelligence Model should implement its own custom UI.

Grade mapping:

- 95+ = A+
- 90-94 = A
- 85-89 = A-
- 80-84 = B+
- 75-79 = B
- 70-74 = B-
- 65-69 = C+
- 60-64 = C
- 55-59 = C-
- 50-54 = D
- Below 50 = F

Confidence is displayed separately because grade measures score quality and confidence measures data reliability.

Architecture graph:

Card Profile

↓

Asset Intelligence Models

↓

Intelligence Console

↓

Intelligence Tile

↓

Intelligence Detail

↓

Grade Mapping

## Business Profiles Platform

Business Profiles make recommendations business-aware. Market Intelligence answers what the card is worth in the market; Business Profile answers what the card is worth to a specific business.

Source files:

- `lib/business/BusinessProfileEngine.ts`
- `lib/business/BusinessProfileRegistry.ts`
- `lib/business/MarketplaceProfile.ts`
- `lib/business/CostProfile.ts`
- `lib/business/ShippingProfile.ts`
- `lib/business/TaxProfile.ts`
- `lib/business/PaymentProfile.ts`
- `lib/business/BusinessDefaults.ts`

Business Profile fields include id, name, currency, country, default marketplace, cost profile, shipping profile, payment profile, tax profile, minimum ROI, minimum profit, target margin, target ROI, negotiation aggressiveness, maximum capital exposure, risk tolerance, created timestamp, and updated timestamp.

Business Profiles own Offer Policy. `createOfferPolicy` extracts the evaluation-facing policy from a profile:

- minimum ROI
- minimum profit
- desired margin
- negotiation aggressiveness
- maximum capital exposure

Offer Ladder consumes Offer Policy. Decision Resolver stays deterministic and receives only a validated ladder.

Built-in marketplace templates:

- TCGplayer
- eBay
- CardTrader
- Facebook Marketplace
- Discord
- Local Cash
- Convention Sales
- Direct Store

Built-in starting profiles:

- Prime Time Retail
- Convention Buying
- Cash Only
- Online Marketplace

Business-aware evaluation graph:

Market Estimate

↓

Business Profile

↓

Strategy

↓

Offer Ladder

↓

Offer Ladder Validation

↓

Decision Resolver

Vendor Workspace owns the selected Business Profile in UI state and passes it to purchase evaluation. Switching Business Profiles regenerates profit, ROI, Offer Ladder, negotiation, and decision without changing the selected card, printing, variant, or condition.

Settings currently provides an in-memory profile management surface for create, duplicate, rename, delete, and set default. Persisted Business Profiles are future work.

## Pipeline Integrity

Sprint 23.2 adds a pipeline inspector for mathematically consistent evaluation.

Source files:

- `lib/pipeline/PipelineInspector.ts`
- `lib/pipeline/PipelineStage.ts`
- `lib/pipeline/PipelineReport.ts`
- `lib/pipeline/PipelineValidation.ts`

Evaluation pipeline:

Asset Context

↓

Market Snapshot

↓

Business Profile

↓

Cost Profile

↓

Offer Policy

↓

Strategy

↓

Offer Ladder

↓

Decision

Each stage records received inputs, calculated outputs, validation status, fallbacks used, missing fields, execution time, and an optional reason. The first stage that is not READY terminates the pipeline. Downstream engines must not silently substitute defaults after an invalid or unavailable upstream stage.

Offer Ladder Integrity requires Opening Offer, Target Offer, Maximum Buy Price, and Recommended Offer to be positive when the market estimate, costs, profit policy, and strategy are valid. Zero is not an implicit fallback. Missing values return unavailable or invalid pipeline status with an explicit reason.

The Sprint 23.2 failure appeared when `calculateMaximumBuyPrice` produced a negative feasible maximum after costs and an overly high Online Marketplace minimum profit, then rounded that impossible value into `0`. The Pipeline Inspector now identifies the Offer Ladder as the first invalid stage, and the Online Marketplace default policy now supports valid low-dollar buys.

Developer diagnostics live in Atlas Inspector only. Production users must not see pipeline, trace, undefined, fallback, or zero-default terminology.

## System Readiness Platform

System Readiness validates prerequisites before business engines execute.

Source files:

- `lib/validation/SystemReadinessEngine.ts`
- `lib/validation/ReadinessValidator.ts`
- `lib/validation/ReadinessReport.ts`
- `lib/validation/ReadinessStatus.ts`
- `lib/validation/ConfigurationValidator.ts`
- `lib/validation/EvaluationPrerequisites.ts`

Readiness states:

- READY
- PARTIAL
- WAITING_FOR_CONFIGURATION
- WAITING_FOR_PROVIDER
- WAITING_FOR_MARKET_DATA
- INVALID
- ERROR

Issue classes:

- Configuration Problem
- Missing Data
- Business Rule Failure
- Calculation Failure
- Internal Error

Readiness pipeline:

Asset Context

↓

Business Profile

↓

Market Snapshot

↓

Card Intelligence

↓

Strategy

↓

Offer Ladder

↓

Decision

Readiness Report fields:

- status
- blocking issues
- warnings
- ready components
- missing components

Validation layers:

- Configuration Validator checks Business Profile, Market Snapshot, and Strategy configuration.
- Readiness Validator checks Card Intelligence and optional Playability readiness.
- System Readiness Engine composes component readiness before Strategy, Offer Ladder, and Decision Resolver execution.
- Offer Ladder Validator still validates ladder math after prerequisites are ready.

Production UI shows user-facing readiness blockers. Atlas Inspector shows System Readiness, Configuration Readiness, Offer Ladder Readiness, Decision Readiness, and dependency state in developer mode.

## Engine Rules

- Business engines must remain provider-independent.
- Query, canonical, intent, entity, and constraint engines must remain independent from React.
- UI components render data and user controls; they do not calculate business values.
- Intelligence Console renders intelligence output only and must not create business decisions.
- UI components dispatch workflow commands; they do not own selected workflow context.
- UI components do not mutate Asset Context.
- Asset Context validation must happen before downstream market data is treated as current.
- Market Provider data has precedence over any future condition inference.
- Condition changes must request a generation-aware Market Snapshot before evaluation is current.
- History is append-only and immutable.
- Business Profiles supply assumptions and must not query providers.
- Business Profiles own Offer Policy.
- System Readiness owns prerequisite validation before Strategy, Offer Ladder, or Decision execution.
- Business engines assume READY inputs and should not expose configuration failures directly.
- Offer Ladder must consume Business Profile assumptions when available.
- Pipeline Inspector must terminate at the first invalid or unavailable stage.
- Zero-valued Offer Ladder outputs are invalid unless a future feature explicitly declares zero as an intended outcome.
- Business engines must not write or mutate history.
- Dictionaries and config files should evolve before parser logic is rewritten.
- Finish selection must be resolved by domain data, constraints, and the Variant Resolution Policy, not by UI defaults.
- Canonical Treatment describes physical collectible identity and remains independent from market value.
- Derived Treatment carries its provider field source, explanation, state, and confidence; absent evidence remains explicitly unresolved.
- Provider mapping audits and identity completeness belong to the canonical identity boundary, not UI components.
- Condition must never affect identity resolution.
- Card Intelligence must not negotiate or choose BUY / PASS.
- Intelligence models must not make decisions.
- Every Intelligence Model must use the Intelligence Tile presentation contract.
- Future intelligence must use the Asset Intelligence Framework contract.
- Playability must measure play demand only and must not negotiate or decide BUY / PASS.
- Negotiation Ladder owns negotiation guidance.
- Offer Ladder Validator validates negotiation output before Decision Resolver execution.
- Decision Resolver compares asking price against the Negotiation Ladder.
- Decision Resolver must remain deterministic and business-profile agnostic after receiving a validated ladder.
- Scryfall prices must be labeled as market estimates, never live inventory.
- Recommendation explanations must add decision context instead of repeating visible metrics.
- Vendor Workspace shortcuts must preserve normal typing behavior inside inputs and selects.
- Context invalidation must stay centralized in `ContextInvalidationEngine`.
# Current Architecture Addendum — Price Monitoring

Market Watch persistence is application-owned SQLite state scoped by Phronesis user and workspace. Local storage is compatibility/rollback state, not authority. Verified catalogue receipts update watched valuations through `WatchlistRepository`; optional external evidence flows through `MarketEvidenceRepository` with immutable evidence-kind semantics. Provider credentials and calls remain server-side, explicit, bounded, and absent from initial page loads.
