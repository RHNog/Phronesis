# Project Summary

Sprint 24 adds Certification Intelligence as a first-class Asset Intelligence model.

Certification Intelligence measures collectible certification characteristics through a provider abstraction. Current coverage is placeholder-only for PSA, BGS, and CGC, with TAG, SGC, and ARS registered as future providers. It does not scrape, does not use unofficial APIs, and never decides BUY/PASS.

Dependency rule:

Certification Intelligence -> Collector Intelligence -> Strategy -> Negotiation Ladder -> Decision Resolver.

Sprint 24.1 adds layered Intelligence Console presentation.

Vendor Workspace shows Decision, Explanation, and Evidence. Atlas Inspector shows Implementation details such as provider status, versions, health, internal signals, future dependencies, and debug information.

Sprint 24.2 finalizes the Intelligence Console UI contract.

Expanded tiles show Grade/Confidence, Business Conclusion, Key Signals, and Supporting Evidence only. Confidence below High includes a business-facing reason, and expanded tile state persists for the current session.

Sprint 25 matures Playability Intelligence to Level 2.

Playability now measures weighted player demand using configurable format weights, demand hints, business conclusions, key signals, and richer per-format demand fields. Scryfall remains the current source, while EDHREC, MTGGoldfish, Melee, MTGO, and Tournament APIs remain future provider hooks.

Sprint 25.1 adds Evidence Sufficiency.

Intelligence models now declare required, optional, and future evidence. Insufficient required evidence produces Unknown rather than a failing grade, and Atlas Inspector displays missing evidence diagnostics.

Sprint 26 matures Playability Intelligence to Level 3.

Playability now includes a provider-ready adapter, normalized demand dimensions, format analysis, and provider-independent card role signals. Business conclusions explain why players use a card and how that use contributes to market demand.

The Asset Knowledge Graph sprint introduces reusable semantic relationships.

`lib/knowledge/` now models graph nodes, graph edges, queries, relationship registry, relationship resolver, and graph registry. Playability consumes graph roles and semantic relationships for richer reasoning. Certification consumes premium-printing, Reserved List, and collector-role relationships when estimating certification relevance. The graph does not redesign UI, strategy, or negotiation behavior.

Sprint 28 introduces the Asset Assessment Engine.

`lib/assessment/` now synthesizes Knowledge Graph, Playability, Certification, Collector, Investment, Market, Liquidity, Business Context, and Evidence Sufficiency into one deterministic Asset Assessment. Assessment produces overall assessment, confidence, evidence coverage, primary drivers, supporting drivers, risk factors, opportunity factors, and business summary. Business Profiles and Strategies consume this assessment instead of inspecting individual Intelligence models directly.

Sprint 29 introduces the Intelligence Provider SDK.

`lib/providers/sdk/` now defines the provider lifecycle for future integrations. Providers supply data only; SDK contracts own normalization, health, caching hooks, diagnostics, evidence mapping, confidence contribution, provider metadata, retry hooks, and validation hooks. EDHREC, PSA, BGS, CGC, Cardmarket, TCGplayer, Melee, MTGO, LigaMagic, and eBay are registered as planned metadata-only providers.

Sprint 30 integrates TCGplayer Market Intelligence.

`TCGplayerIntelligenceProvider` is now the first SDK-backed Market Intelligence provider. It normalizes TCGplayer-shaped market data into `MarketSnapshot.marketIntelligence`, including market price, direct low, lowest listing, listing count, recent sales, trend, price history, liquidity, inventory health, sales velocity, spread, confidence, volatility, stability, and demand momentum. Raw provider responses remain private to the provider layer.

Sprint 31A establishes the first live official SDK provider connection.

JustTCG is integrated through the official `justtcg-js@0.2.1` SDK and wrapped by the Provider SDK. Authentication uses `JUSTTCG_API_KEY` from `.env.local`. The first live validation uses a known-card Mox Opal request and normalizes card, variant, current price, price history, statistics, usage, and pagination fields. `/dev/justtcg` is a temporary development-only inspection page for raw SDK response, normalized response, latency, authentication status, and diagnostics.

Sprint 31B introduces the Market Intelligence Repository.

`lib/market/` now owns repository snapshots, per-field freshness metadata, refresh policy, background refresh scheduling, validation, statistics, and diagnostics. Market providers update the repository through `MarketRefreshScheduler`; application code consumes repository snapshots. Local JSON persistence is used for now, with a boundary ready for SQLite, PostgreSQL, Redis, or cloud storage.

Sprint 31C introduces the Market Truth Model.

Provider responses are now evidence until validated. `MarketTruthEngine` checks provider evidence against the selected asset context, classifies provider price concepts, scores confidence and coverage, and records Market Truth reports before repository writes. The repository stores provider attribution, retrieval time, classification, freshness, and coverage for provider-derived values. Multi-provider consensus remains future architecture.

Sprint 31D introduces the Market Evidence Layer.

Market provider evidence is now stacked by field and selected through `MarketEvidenceLayer`. The repository preserves existing evidence when a new provider lacks a field, tracks provider coverage, and selects best available values by freshness, configured provider priority, confidence, and recency. Developer diagnostics expose provenance and coverage; production surfaces continue to show selected values only.

## Current Architecture

Phronesis is a Next.js, TypeScript, and Tailwind CSS application for professional trading-card buying decisions.

The runtime architecture separates:

- Query and identity interpretation.
- Printing, finish, and condition resolution.
- Market provider normalization.
- Provider SDK lifecycle normalization.
- Market Truth validation and evidence attribution.
- Market Evidence Layer aggregation and selection.
- Market Intelligence Repository snapshots.
- Business Profile and Offer Policy assumptions.
- System Readiness and Pipeline Integrity.
- Card and Asset Intelligence.
- Asset Assessment.
- Strategy scoring.
- Negotiation Ladder generation.
- Offer Ladder validation.
- Deterministic decision resolution.
- Vendor Workspace presentation.

Atlas is not part of this runtime architecture. It is an internal companion system.

## Current Sprint

Sprint 31D: Market Evidence Layer

## Current Milestone

Layered provider evidence with best-available market field selection.

## Open Issues

- Atlas report generation is not automated yet.
- Known issues are tracked manually.
- Repository scanning is available as a standalone TypeScript utility but not connected to a script.
- Existing test execution needs a formal alias-aware test runner.
- Knowledge Graph relationship coverage is configured for known examples and should be provider-enriched later.
- Assessment driver weights are deterministic and should be calibrated with future outcome history.
- Provider SDK adapters are metadata-only until approved integration paths exist.
- TCGplayer evidence is currently normalized through provider-backed fixture records for verified Sprint 30 assets until credentialed API access is configured.
- Multi-provider market consensus is not implemented yet; validated provider evidence is stored independently.

## Technical Debt

- Business Profile persistence remains future work.
- Readiness Reports and Pipeline Reports are not persisted.
- Market Truth metadata currently warns on missing legacy provider identity fields instead of requiring every provider to expose full collector/language metadata.
- Live marketplace listings and recent sales are not integrated.
- Browser visual regression coverage is not active.
- Atlas has no drift detection yet.
- Relationship confidence calibration remains future work.
- Assessment source weighting remains configuration-ready future work.
- Existing Scryfall providers still use their current local provider contracts and should migrate gradually.
- TCGplayer API credentials and live endpoint configuration remain future operational work.

## Next Recommended Sprint

Configure credentialed TCGplayer API access and expand provider-backed market coverage.
