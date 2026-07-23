# Project Knowledge

## Architecture Philosophy

Phronesis is a Professional TCG Decision Operating System, not a generic price tracker.

The architecture separates interpretation, market data, business assumptions, intelligence, strategy, negotiation, validation, and decision. Each layer should own one kind of responsibility and pass normalized domain objects to the next layer.

## Business Philosophy

Market Intelligence answers what an asset appears to be worth in the market. Business Profiles answer what that asset is worth to a specific business after costs, margin, ROI, capital exposure, and negotiation policy.

Decision Resolver should remain deterministic after receiving a validated Offer Ladder.

## Design Principles

- Vendor Workspace is decision-first and optimized for fast in-person buying.
- Production users should see clear outcomes and user-safe blockers, not internal diagnostics.
- Developer diagnostics belong in development-only surfaces.
- UI components render state and dispatch intent; engines calculate business values.
- Intelligence models measure, but do not decide.
- Zero is not unknown. Missing values must be unavailable or invalid.

## Important Decisions

- Identity Providers and Market Providers are separate provider families.
- Provider responses must be normalized before entering engines or UI.
- Market provider responses must be stored as Market Intelligence Repository snapshots before Asset Session or business logic consumes them.
- Market provider responses are evidence until Market Truth validation classifies, scores, and attributes them.
- Market evidence is layered; providers add evidence and may not reduce existing platform knowledge.
- Future providers must follow the Provider SDK lifecycle.
- Providers supply data only; SDK infrastructure owns normalization, health, caching hooks, diagnostics, evidence mapping, confidence contribution, metadata, retry hooks, and validation hooks.
- JustTCG is the first live official SDK provider connection and must be accessed through Provider SDK wrappers, never directly from application code.
- `JUSTTCG_API_KEY` is required locally and must not be hardcoded.
- TCGplayer is the primary Market Intelligence provider and must expose only normalized Market Intelligence evidence.
- Variant Resolution Policy owns automatic finish defaults.
- Workflow Command Processor owns Vendor Workspace context progression.
- Asset Context protects downstream state from stale upstream selections.
- System Readiness owns prerequisite validation.
- Pipeline Inspector owns first-invalid-stage diagnostics.
- Business Profiles own Offer Policy.
- Certification Intelligence measures collectible certification characteristics only.
- Certification Provider data must enter through `CertificationRegistry`.
- Collector Intelligence consumes Certification Intelligence before strategies interpret collector value.
- Playability Intelligence measures player demand, not legality alone.
- Playability format weights live in configuration.
- Playability Provider Adapter normalizes current and future provider evidence.
- Card roles are provider-independent Playability signals.
- Asset Knowledge Graph owns reusable semantic relationships between assets.
- Relationship Registry owns configured roles, mechanics, themes, archetypes, strategies, color identity, tribes, keywords, families, Universes Beyond, Reserved List, premium printings, and format relationships.
- Asset Assessment interprets Intelligence evidence into one canonical asset understanding.
- Business Profiles and Strategies consume Asset Assessment instead of inspecting individual Intelligence models directly.
- Evidence Sufficiency determines whether Intelligence models may issue grades.
- Unknown means missing evidence, not poor quality.
- Vendor Workspace owns Intelligence layers 1-3: Decision, Explanation, and Evidence.
- Atlas Inspector owns Intelligence layer 4: Implementation.
- Final Intelligence Console panels use Grade/Confidence, Business Conclusion, Key Signals, and Supporting Evidence only.
- Offer Ladder Validator blocks invalid negotiation math before Decision Resolver executes.

## JustTCG Provider Knowledge

JustTCG lives under `lib/providers/justtcg/`.

Core contracts:

- `JustTCGProvider`
- `JustTCGAdapter`
- `JustTCGNormalizer`
- `JustTCGDiagnostics`

Integration rules:

- The official `justtcg-js` SDK is the only JustTCG API access path.
- The SDK reads `JUSTTCG_API_KEY` from the environment.
- Application code consumes Provider SDK results, not SDK objects.
- Raw SDK responses are limited to the temporary development-only `/dev/justtcg` inspection page.
- Sprint 31A is connectivity only; it does not change Assessment, Strategy, Negotiation, or Decision behavior.

Provider data model:

- Canonical mapping document: `docs/providers/JUSTTCG_DATA_MODEL.md`.
- Card-level fields are raw observations.
- Variant-level `condition`, `printing`, `language`, `price`, `lastUpdated`, `tcgplayerSkuId`, and `priceHistory` are raw observations.
- Variant-level movement, range, volatility, trend, and activity statistics are provider-supplied derived metrics.
- Market Intelligence must derive platform metrics internally from raw observations instead of assuming provider fields map directly to UI fields.
- Condition-specific prices are represented as separate variant objects and must stay distinct in repository evidence.

## Market Intelligence Repository Knowledge

The Market Intelligence Repository lives under `lib/market/`.

Core contracts:

- `MarketIntelligenceRepository`
- `MarketSnapshot`
- `MarketSnapshotMetadata`
- `MarketRefreshPolicy`
- `MarketRefreshScheduler`
- `MarketFreshness`
- `MarketSnapshotValidator`
- `MarketRepositoryStatistics`
- `MarketRepositoryDiagnostics`

Integration rules:

- Providers update repository snapshots.
- Application market routes use `MarketRefreshScheduler`.
- Business engines consume repository-derived snapshots.
- Every market field owns its own TTL.
- Fresh repository data prevents provider calls.
- Slightly stale data can return immediately while background refresh runs.
- Missing or expired fields refresh through market infrastructure before returning.

## Market Truth Model Knowledge

The Market Truth Model lives under `lib/market/`.

Core contracts:

- `MarketTruthEngine`
- `ProviderEvidenceValidator`
- `ProviderEvidenceScore`
- `ProviderMatchValidator`
- `ProviderPricingClassifier`
- `ProviderFieldMapping`
- `ProviderConsistencyReport`
- `MarketTruthReport`

Integration rules:

- Provider responses must match the selected printing before repository write.
- Validate canonical card identity, printing, collector number, finish, condition, language, game, product identifier, and provider timestamp.
- Classify provider price concepts as Market Price, Lowest Listing, Lowest NM Listing, Direct Price, Average Sale, Recent Sale, Suggested Price, or Unknown.
- Store provider name, retrieval time, confidence, classification, freshness, and coverage with provider-derived values.
- Multi-provider consensus remains future work.

## Market Evidence Layer Knowledge

The Market Evidence Layer lives under `lib/market/`.

Core contracts:

- `MarketEvidenceLayer`
- `EvidenceAggregator`
- `EvidenceResolver`
- `EvidencePriority`
- `EvidenceProvenance`
- `EvidenceCoverage`
- `EvidenceFallback`
- `EvidenceSelection`

Integration rules:

- Repository snapshots store evidence stacks.
- New provider evidence is merged without deleting other provider evidence.
- Selected values are resolved by freshness, configured provider priority, confidence, and recency.
- Provider coverage is tracked independently by field.
- Fallback chains are field-specific.
- Production UI consumes selected values only.
- Developer tooling may expose provenance, selected provider, fallback reason, priority, freshness, and coverage.

## Asset Knowledge Graph Knowledge

The Asset Knowledge Graph lives under `lib/knowledge/`.

Core contracts:

- `AssetKnowledgeGraph`
- `KnowledgeNode`
- `KnowledgeEdge`
- `KnowledgeQuery`
- `RelationshipRegistry`
- `RelationshipResolver`
- `KnowledgeGraphRegistry`

Integration rules:

- Playability consumes graph roles, archetypes, themes, strategies, and format context.
- Certification consumes graph premium-printing, Reserved List, and collector-role relationships.
- Collector Intelligence may consume graph-enriched Certification and future graph facts through normalized Intelligence outputs.
- The graph does not decide BUY, PASS, strategy, negotiation, or offer values.

## Asset Assessment Knowledge

The Asset Assessment Engine lives under `lib/assessment/`.

Core contracts:

- `AssetAssessmentEngine`
- `AssetAssessment`
- `AssessmentEvidence`
- `AssessmentReasoning`
- `AssessmentConfidence`
- `AssessmentSummary`
- `AssessmentRegistry`

Layer rule:

Intelligence Models provide evidence.

Asset Assessment interprets evidence.

Business Profile applies business context.

Strategy applies business objectives.

Negotiation consumes strategy-shaped output.

Decision evaluates the validated offer.

Assessment outputs:

- Overall Assessment
- Overall Confidence
- Evidence Coverage
- Primary Drivers
- Supporting Drivers
- Risk Factors
- Opportunity Factors
- Business Summary

Unknown evidence reduces confidence only. Unknown evidence does not reduce the quality score, because unknown asset and weak asset must remain separate states.

## Provider SDK Knowledge

The Provider SDK lives under `lib/providers/sdk/`.

Core contracts:

- `ProviderClient`
- `ProviderAdapter`
- `ProviderEvidence`
- `ProviderHealth`
- `ProviderCoverage`
- `ProviderMetadata`
- `ProviderRegistry`
- `ProviderDiagnostics`
- `ProviderCache`
- `ProviderResult`

Prepared providers:

- EDHREC
- PSA
- BGS
- CGC
- Cardmarket
- TCGplayer active for Market Intelligence
- Melee
- MTGO
- LigaMagic
- eBay

Lifecycle rule:

Providers supply data only. The SDK owns normalization, health, caching hooks, diagnostics, evidence mapping, confidence contribution, provider metadata, retry hooks, and validation hooks.

Current state:

- TCGplayer is active through `TCGplayerIntelligenceProvider`.
- Remaining SDK providers are metadata-only.
- No scraping or unofficial APIs were added.
- Atlas Inspector consumes Provider SDK metadata for developer diagnostics.

## TCGplayer Market Intelligence Knowledge

TCGplayer provider files:

- `lib/providers/market/TCGplayerIntelligenceProvider.ts`
- `lib/providers/TCGplayerProvider.ts`

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

Integration rules:

- `MarketSnapshot.marketIntelligence` carries provider-backed evidence.
- Raw provider-shaped data remains inside the provider adapter.
- Signals consume normalized market evidence.
- Asset Assessment consumes normalized signals and market evidence.
- Business Profiles do not call TCGplayer.
- Negotiation benefits from normalized liquidity and spread only.

## Permanent Rules

- Do not modify Vendor Workspace behavior during Atlas-only work.
- Do not modify business engines during Atlas-only work.
- Do not modify production UI during Atlas-only work.
- Keep Atlas internal and isolated.
- Do not add production imports to Atlas.
- Do not expose Atlas artifacts to customers.
- Keep canonical sprint, roadmap, architecture, decision, and prompt history in sync through source references and future generation rather than copy-paste drift.

## Sprint 24 Knowledge

Certification Intelligence dependency graph:

Certification Intelligence -> Collector Intelligence -> Strategy -> Negotiation Ladder -> Decision Resolver.

Current provider state:

- Placeholder provider for PSA, BGS, and CGC.
- Future providers: TAG, SGC, ARS.
- No scraping.
- No unofficial APIs.

Technical debt:

- Population, gem population, gem rate, population trend, and submission saturation remain placeholders.
- Estimated premium is metadata-based until official graded-market providers exist.

## Sprint 24.1 Knowledge

Layered Information Architecture:

- Layer 1: Decision
- Layer 2: Explanation
- Layer 3: Evidence
- Layer 4: Implementation

Vendor Information Model:

- Model name
- Grade
- Confidence label
- Summary
- Business conclusion
- Primary supporting indicators
- Evidence

Atlas Information Model:

- Numeric confidence
- Version
- Health
- Status
- Internal sources
- Future dependencies
- Internal signals
- Provider status
- Provider matrix
- Debug information

## Sprint 24.2 Knowledge

Final Intelligence Console UI Contract:

- Grade
- Model-specific Confidence
- Business Conclusion
- Key Signals
- Supporting Evidence

Production rules:

- Remove duplicate Summary and What This Means sections.
- Confidence below High always explains itself.
- Key Signals are limited to four items.
- Supporting Evidence is factual.
- Expanded tile memory is session-scoped.
- Atlas owns implementation details.

## Sprint 25 Knowledge

Playability Intelligence is now Level 2 Meaningful Intelligence.

It answers:

- Why is this card played?
- Where does demand come from?
- Is demand Commander, competitive, casual, broad, stable, or meta-dependent?

Current source:

- Scryfall legalities.

Demand layer:

- Configurable format weights.
- Demand hints.
- Weighted format contribution.
- Business conclusions.
- Key Signals.

Future providers:

- EDHREC.
- MTGGoldfish.
- Melee.
- MTGO.
- Tournament APIs.

## Sprint 25.1 Knowledge

Evidence Sufficiency Framework:

- EvidenceRequirement
- EvidenceStatus
- EvidenceScore
- EvidenceReport
- EvidenceSufficiencyEngine

Rules:

- Evidence precedes conclusion.
- Confidence reflects evidence quality.
- Missing evidence is not negative evidence.
- Unknown blocks definitive conclusions.
- Future providers improve evidence sufficiency automatically.

Initial insufficient examples:

- Playability without EDHREC or equivalent demand providers.
- Certification without PSA, BGS, or CGC provider-backed population data.

## Sprint 26 Knowledge

Playability Intelligence is now Level 3 Explainable Demand Intelligence.

Registered concepts:

- Demand Model.
- Card Role Model.
- Playability Provider Adapter.

Demand dimensions:

- Commander Demand.
- Competitive Demand.
- Casual Demand.
- Combo Relevance.
- Staple Status.
- Format Diversity.
- Demand Stability.
- Ban Risk.
- Meta Dependency.
- Demand Resilience.
- Future Demand Readiness.

Card roles:

- Fast Mana.
- Commander Staple.
- Combo Piece.
- Tutor.
- Removal.
- Counterspell.
- Finisher.
- Engine.
- Utility.
- Value Card.
- Ramp.
- Protection.
- Card Draw.
