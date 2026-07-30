# Project Atlas

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
- `groupSearchMatchesByArtwork` creates deterministic category/name/set/collector/language artwork groups while preserving alternate-art descriptors and sealed products.
- Vendor Workspace selects a group, then an exact Finish SKU, then Condition; only that exact snapshot record reaches `evaluatePurchase`.
- `/api/pricing/artwork` dispatches Magic to Scryfall, Pokémon to TCGdex, Lorcana to Lorcast, and One Piece to the official Bandai English card list. Riftbound returns an explicit authorization state.
- `/api/pricing/image` is the fail-closed same-origin boundary for approved provider rasters. It validates exact hosts/paths and content, then reuses ignored `.data/artwork/` image/metadata pairs.
- Identity-provider artwork is presentation evidence only. Catalogue snapshots remain price evidence and provider results never mutate local catalogue records.
- `PHR-UX-009` now reads `evaluation.cardProfile.intelligenceModels` and `assetAssessment` through the visible buying-intelligence panel.

## Application Structure

`PHR-UX-006` defines the lifecycle map used by the production shell:

```text
Discover   -> Opportunities       -> / and /opportunities/[id]
Decide     -> Vendor Workspace    -> /vendor and /evaluate
Monitor    -> Market Watch        -> /watchlists
Administer -> Settings            -> /settings
Manage     -> Future capability   -> no production destination
```

Primary navigation ownership lives in `lib/navigation/ProductNavigation.ts`. Developer routes are intentionally outside this map.

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
- Extension boundary: hover previews, contextual overlays, and quick actions attach to existing image slots.

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

## Backlog

1. Add live marketplace listings and recent sales.
2. Add EDHREC provider for Commander deck penetration.
3. Add MTGGoldfish provider for format popularity and trend.
4. Add Melee, MTGO, and Top8 providers for competitive metagame results.
5. Add Deck Penetration implementation with percentage, sample size, confidence, and status.
6. Add Meta Stability and Trend provider implementations.
7. Add Intelligence Console keyboard and visual regression coverage.
8. Persist Business Profiles.
9. Add Business Profile import and export.
10. Validate Offer Policy before Business Profiles are saved.
11. Persist Readiness Reports with Evaluation Snapshots.
12. Persist Pipeline Reports for failed evaluations.
13. Add readiness browser diagnostics for historical failed evaluations.
14. Add Pipeline Trace replay UI.
15. Add a Printing Descriptor Engine for provider-neutral printing labels.
16. Add development-only Vendor Workflow transition inspector.
17. Add Evaluation Trace replay UI.
18. Add workflow context inspector.
19. Add historical backtesting.
20. Add simulation engine.
21. Add strategy replay and Market Context replay.
22. Add Asset Intelligence model diagnostics UI.
23. Add Liquidity Engine as an Asset Intelligence model.
24. Add Historical Analytics Engine as an Asset Intelligence model.
25. Add Market Context Engine.
26. Add camera, OCR, and barcode entry.
27. Add ARIA active-descendant support for richer keyboard highlighting.
28. Add persisted buyer preferences for finish defaults.
29. Add saved Vendor Workspace chip presets.
30. Add visual regression coverage for 13-inch and 14-inch laptop viewports.

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
