# Platform Release v1.0

Release date: 2026-07-09

Release status: recoverable platform freeze

Release type: documentation-only architecture snapshot

## Release Intent

Platform v1.0 freezes the current Phronesis platform as a recoverable baseline. This is not a feature sprint. It records the completed architecture, active workflow boundaries, provider infrastructure, diagnostics surfaces, known limitations, and recovery procedure for the current platform state.

No functionality, architecture, provider behavior, UI behavior, replay behavior, repository behavior, business logic, or engine logic is changed by this release document.

## Engineering Identity

Platform v1.0 is part of Project Phronesis (Engineering Initiative), the internal engineering initiative responsible for building an evidence-driven decision intelligence platform for collectible markets.

Project Phronesis expresses the platform philosophy of practical judgment: evidence before conclusions, observations separated from reasoning, explainable intelligence, and transparent business decisions.

This is not a commercial rebrand. The legal entity remains Phronesis, and the future customer-facing product name remains intentionally undecided.

## Planning Framework

Platform v1.0 separates future planning into independent lanes:

- Engineering identity: `docs/PROJECT_PHRONESIS.md`
- Brand philosophy: `docs/BRAND_PHILOSOPHY.md`
- Engineering roadmap: `docs/ROADMAP.md`
- Product roadmap: `docs/PRODUCT_ROADMAP.md`
- Business strategy: `docs/BUSINESS_STRATEGY.md`
- Idea ledger: `docs/IDEA_LEDGER.md`
- Monetization possibilities: `docs/MONETIZATION.md`

Product-facing ideas should live in the Product Roadmap or Idea Ledger until they are promoted into scoped engineering work. Monetization ideas should remain possibilities until a pricing model is selected.

## Platform Summary

Phronesis v1.0 is a professional TCG decision operating system. The platform resolves an asset, validates workflow eligibility, gathers provider-backed market evidence, stores and layers evidence, interprets market conditions, synthesizes asset assessment, applies business context and strategy, builds a negotiation ladder, and resolves a purchase decision.

### Identity

Responsible for answering: "What asset did the user search for?"

Identity search and resolution are owned by the search, canonical, intent, entity, constraint, and Scryfall identity provider layers. Identity keeps the full universe of resolved assets available to search, knowledge, repository, and Atlas diagnostics.

Primary areas:

- `lib/engines/search/`
- `lib/engines/canonical/`
- `lib/engines/intent/`
- `lib/engines/entity/`
- `lib/engines/constraints/`
- `lib/providers/identity/`

### Knowledge Graph

Responsible for shared semantic relationships.

The Asset Knowledge Graph enriches intelligence models with roles, relationships, formats, mechanics, collector traits, and configured asset relationships. It is not a workflow filter and does not remove assets from the platform.

Primary areas:

- `lib/knowledge/`
- `knowledge/`
- `config/relationships.ts`

### Eligibility Engine

Responsible for answering: "Should this workflow use this asset?"

Eligibility is separate from identity. It filters assets for workflow support without deleting them from search, repository, knowledge, or Atlas. The Default Vendor profile allows physical cards, promos, premium treatments, serialized cards, foreign-language printings, and similar supported physical trading-card products while hiding workflow-ineligible objects such as Magic Online, Arena-only, digital-only, checklist, emblem, Art Series, oversized, placeholder, and marketing insert assets.

Primary areas:

- `lib/engines/eligibility/`
- Vendor Workspace eligibility diagnostics in Atlas Inspector

### Provider SDK

Responsible for provider lifecycle boundaries.

The Provider SDK standardizes metadata, health, coverage, evidence mapping, diagnostics, normalization, cache hooks, retry hooks, validation hooks, and result contracts. Providers supply data; downstream engines consume normalized provider evidence.

Primary areas:

- `lib/providers/sdk/`
- `lib/providers/identity/`
- `lib/providers/market/`
- `lib/providers/justtcg/`

### Replay Infrastructure

Responsible for development playback of certified provider observations.

Production acquires live observations. Development can replay certified fixtures without API quota or network dependency. Replay is a provider implementation detail; repositories and business engines remain unaware of live versus replay source.

Replay fixtures are keyed by explicit market identity: asset, printing, collector number, finish, condition, language, provider product identifier, and provider variant identifier.

Primary areas:

- `lib/providers/replay/`
- `fixtures/providers/`

### Repository

Responsible for durable market knowledge.

The Market Intelligence Repository stores market snapshots, evidence metadata, freshness, per-field TTLs, statistics, local persistence, and repository diagnostics. It sits between provider acquisition and business-facing evaluation flows.

Primary areas:

- `lib/market/MarketIntelligenceRepository.ts`
- `lib/market/MarketRefreshScheduler.ts`
- `lib/market/MarketRefreshPolicy.ts`
- `lib/market/MarketFreshness.ts`
- `lib/market/MarketRepositoryDiagnostics.ts`
- `lib/market/MarketRepositoryStatistics.ts`

### Evidence Layer

Responsible for layering and selecting best available evidence.

The Market Evidence Layer preserves multiple provider contributions instead of replacing populated fields with sparse provider responses. It owns aggregation, priority, provenance, coverage, fallback chains, and selected field values.

Primary areas:

- `lib/market/MarketEvidenceLayer.ts`
- `lib/market/EvidenceAggregator.ts`
- `lib/market/EvidenceResolver.ts`
- `lib/market/EvidencePriority.ts`
- `lib/market/EvidenceProvenance.ts`
- `lib/market/EvidenceCoverage.ts`
- `lib/market/EvidenceFallback.ts`
- `lib/market/EvidenceSelection.ts`

### Market Ontology

Responsible for defining market evidence semantics.

The ontology maps questions to evidence domains before provider selection. Providers declare whether they support, partially support, do not support, or have unknown support for each evidence domain. Unsupported providers are skipped for requested domains.

Primary areas:

- `lib/market/ontology/`

Domains include Variant Valuation, Listing Intelligence, Transaction Intelligence, Historical Pricing, Inventory Intelligence, Price Trend, Volatility, Market Liquidity, Market Confidence, and Provider Metadata.

### Market Intelligence Engine

Responsible for interpreting market observations.

The Market Intelligence Engine consumes repository and replay-normalized observations. It produces market health, liquidity, price stability, volatility, momentum, buying opportunity, confidence, reasoning, and explainable market signals. It does not call providers, negotiate, or decide BUY, PASS, or NEGOTIATE.

Primary areas:

- `lib/market/intelligence/`

### Asset Assessment

Responsible for synthesizing asset evidence.

Asset Assessment is the canonical interpretation layer for asset understanding. It combines intelligence model evidence into overall assessment, confidence, evidence coverage, primary drivers, supporting drivers, risk factors, opportunity factors, and business summary. It does not decide BUY, NEGOTIATE, PASS, or offer values.

Primary areas:

- `lib/assessment/`
- `lib/engines/cardIntelligence/`
- `lib/intelligence/`

### Business Profiles

Responsible for business-specific economics and policy context.

Business Profiles define marketplace, cost, shipping, tax, payment, ROI, margin, and operating assumptions. They provide business context to purchase evaluation and negotiation without becoming identity, provider, or market infrastructure.

Primary areas:

- `lib/business/`
- `features/settings/`

### Strategy

Responsible for applying configured buying objectives.

Strategy applies configurable signal weights and scoring preferences to assessed assets and market context. It consumes upstream interpretation and business profile context.

Primary areas:

- `lib/engines/strategy/`
- `data/seedStrategies.ts`

### Negotiation

Responsible for offer construction.

Negotiation builds offer ladders, zones, and validated offer values from strategy, market, business, and asset context. It does not resolve identity or call providers.

Primary areas:

- `lib/engines/negotiation/`
- `lib/engines/offerLadder/`

### Decision

Responsible for final purchase recommendation.

Decision resolves BUY, NEGOTIATE, PASS, or related outcomes from validated inputs. It sits after identity, evidence, assessment, business profile, strategy, and negotiation.

Primary areas:

- `lib/engines/decision/`
- `lib/engines/evaluation/`

### Atlas

Responsible for developer diagnostics and platform memory.

Atlas records architecture, decisions, sprint history, provider diagnostics, workflow traces, readiness, pipeline state, evidence coverage, eligibility diagnostics, and implementation details. Atlas is a developer surface and is isolated from production business conclusions.

Primary areas:

- `docs/`
- `atlas/`
- `features/vendor/components/AtlasInspector.tsx`
- `app/dev/identity`
- `app/dev/justtcg`

## Architecture Snapshot

```text
Identity
  |
  v
Knowledge Graph
  |
  v
Eligibility
  |
  v
Provider SDK
  |
  v
Replay
  |
  v
Repository
  |
  v
Evidence Layer
  |
  v
Market Ontology
  |
  v
Market Intelligence
  |
  v
Asset Assessment
  |
  v
Business Profiles
  |
  v
Strategy
  |
  v
Negotiation
  |
  v
Decision
```

Runtime note: Atlas observes and documents the platform, but Atlas is not part of the production decision dependency chain.

## Completed Workflows

### Vendor Workspace

The Vendor Workspace supports search, identity resolution, eligibility filtering, printing refinement, variant selection, condition selection, market snapshot loading, market evidence diagnostics, card profile generation, purchase panel evaluation, offer ladder, and decision output.

Workflow ownership is command-driven through:

- `lib/workflow/VendorWorkflowMachine.ts`
- `lib/workflow/commands/WorkflowCommandProcessor.ts`
- `lib/workflow/AssetContextValidator.ts`
- `lib/workflow/commands/ContextInvalidationEngine.ts`

### Developer Identity Explorer

The identity explorer validates identity provider output, canonical resolution, normalized card data, raw provider responses, and identity diagnostics.

### JustTCG Developer Inspection

The JustTCG development page validates SDK connectivity, request tracing, provider diagnostics, replay diagnostics, normalization, and raw SDK response handling in development only.

### Settings

The settings workflow exposes in-memory Business Profile management.

### Evaluation History And Pipeline Diagnostics

Evaluation history, system readiness, and pipeline integrity provide validation and traceability for purchase evaluation stages.

## Provider Infrastructure Snapshot

Connected or present provider infrastructure:

- Scryfall Identity Provider.
- Scryfall Market Provider.
- Official JustTCG SDK provider through `justtcg-js@0.2.1`.
- JustTCG Adapter, Normalizer, Diagnostics, Replay, and development inspection.
- TCGplayer Market Intelligence Provider as normalized SDK-style evidence.
- Mock Marketplace Provider.
- Provider SDK registry and diagnostics.
- Placeholder or planned provider surfaces for eBay, CardTrader, LigaMagic, EDHREC, PSA, BGS, CGC, Cardmarket, Melee, MTGO, and others.

Provider boundary rule: raw provider responses stay inside provider infrastructure and development diagnostics. Engines consume normalized provider output and repository evidence.

## Platform Maturity

| Subsystem | Maturity | Notes |
| --- | --- | --- |
| Identity | Production Ready | Scryfall-backed identity search, canonical resolution, intent resolution, printing constraints, and developer diagnostics exist. |
| Knowledge Graph | Production Ready | Shared semantic relationship graph is available to intelligence models. |
| Eligibility | Version 1 | Default Vendor profile filters workflow-ineligible assets while preserving identity/search/knowledge data. |
| Provider SDK | Production Ready | Provider lifecycle contracts, registry, diagnostics, normalization, evidence, health, and coverage are established. |
| Replay | Production Ready | LIVE, REPLAY, AUTO modes, fixture validation, exact market identity fixtures, and diagnostics exist. |
| Repository | Version 1 | Local repository persistence, refresh policy, scheduler, statistics, diagnostics, and evidence-aware refresh are present. |
| Evidence Layer | Version 1 | Evidence stacking, priority, provenance, fallback, coverage, and selected values are implemented. |
| Market Ontology | Production Ready | Evidence domains, provider capabilities, question resolution, and domain coverage are established. |
| Market Truth | Version 1 | Provider match validation, price classification, evidence scoring, and consistency reporting are present. |
| Market Intelligence | Version 1 | Reasoning, health, opportunity, confidence, trend, volatility, and signal registry are implemented. |
| Asset Assessment | Version 1 | Assessment synthesis, drivers, confidence, risks, opportunities, and business summary are implemented. |
| Business Profiles | Version 1 | Cost, marketplace, shipping, tax, payment, and operating assumptions are represented. |
| Strategy | Version 1 | Signal-weighted buying strategies exist and feed downstream negotiation. |
| Negotiation | Version 1 | Offer ladder, zones, calculator, and validation are present. |
| Decision | Version 1 | Decision resolver and purchase evaluation output are present. |
| Vendor Workflow | Production Ready | Command-driven workflow, context invalidation, readiness, and pipeline validation are present. |
| Atlas | Version 1 | Documentation, diagnostics, provider traces, pipeline traces, readiness, and architecture memory are available. |

## Known Limitations

These are roadmap items, not defects in Platform v1.0.

- Only JustTCG is connected as the live official SDK market provider path.
- Scryfall identity is connected; additional identity providers are not connected.
- TCGplayer market intelligence exists as normalized provider infrastructure, but broader live marketplace provider coverage remains future work.
- Consensus Engine is not implemented.
- Listing Intelligence provider coverage is not broadly connected.
- Transaction Intelligence provider coverage is not connected.
- Inventory Intelligence provider coverage is not connected.
- Market calibration is pending.
- Currency normalization is pending.
- Regional valuation is pending.
- Provider administration UI is pending.
- Production provenance UI is intentionally not exposed.
- Database-backed repository persistence is pending; local JSON persistence is the current recovery boundary.
- Retry policy and provider cache hooks exist conceptually in Provider SDK contracts but are not fully operationalized for every provider.
- Official certification population providers are pending; certification providers are placeholders.
- EDHREC, MTGGoldfish, Melee, MTGO, and tournament playability providers are future integrations.
- Multi-provider market consensus, priority administration, and calibration against real outcomes are future work.
- Visual regression automation is not fully established.
- Atlas is developer-facing and intentionally not a production user surface.

## Recovery Instructions

### Git Checkout

After the Platform v1.0 release commit is merged, recover the platform with either the release tag or the exact release commit.

Recommended tag:

```bash
git checkout platform-v1.0
```

Fallback using a commit SHA:

```bash
git checkout <platform-v1.0-commit-sha>
```

### Git Tag

Create the recoverable release tag after committing this release document:

```bash
git tag -a platform-v1.0 -m "Platform v1.0 recoverable release"
git push origin platform-v1.0
```

To verify the tag:

```bash
git show platform-v1.0
```

### Install And Build

Install dependencies from the locked project state, then verify:

```bash
npm install
npm run lint
npm run build
```

The Next.js build fetches Google Fonts during production build. In a restricted environment, build verification requires network access or a local font strategy.

### Environment Variables

Create `.env.local` from `.env.example` and set:

```text
JUSTTCG_API_KEY=your_justtcg_api_key_here
JUSTTCG_BASE_URL=https://api.justtcg.com
PROVIDER_MODE=LIVE
PROVIDER_RECORD_FIXTURES=false
```

Development replay options:

```text
PROVIDER_MODE=REPLAY
PROVIDER_RECORD_FIXTURES=false
```

Fixture recording option:

```text
PROVIDER_MODE=AUTO
PROVIDER_RECORD_FIXTURES=true
```

Production note: `NODE_ENV=production` forces live provider behavior through replay mode resolution.

### Repository Restore

The local Market Intelligence Repository persistence boundary is the repository-owned local JSON file, if present in the deployment or developer workspace. Restore the repository state by copying the saved repository persistence file back to the project root before starting the app.

Expected recovery pattern:

```bash
cp <backup>/.market-intelligence-repository.json ./.market-intelligence-repository.json
```

If no repository backup exists, the platform can rebuild repository snapshots by refreshing market data through connected providers or replay fixtures, subject to environment configuration and provider availability.

### Replay Fixture Restore

Replay fixtures are part of the recoverable platform state under:

```text
fixtures/providers/
```

Restore fixtures by checking out the release tag or copying the fixture tree from a known-good release backup:

```bash
cp -R <backup>/fixtures/providers ./fixtures/
```

Then run in replay mode for development recovery:

```text
PROVIDER_MODE=REPLAY
```

Current JustTCG replay fixtures include certified observations under `fixtures/providers/justtcg/magic/`, including market-identity Mox Opal fixtures.

### Atlas Restore

Atlas recovery is file-based. The release snapshot is recoverable from:

- `docs/`
- `docs/releases/Platform-v1.0.md`
- `atlas/`

No runtime migration is required for Atlas documents.

## Atlas Release Registration

Platform v1.0 is registered as the frozen architecture snapshot for the current platform.

Release entry:

- Name: Platform v1.0
- Type: recoverable platform release
- Status: frozen documentation snapshot
- Date: 2026-07-09
- Engineering identity: Project Phronesis
- Scope: architecture, engines, workflows, provider infrastructure, replay, ontology, evidence, assessment, market intelligence, eligibility, Atlas, limitations, and recovery
- Non-scope: functionality changes, architecture changes, refactoring, feature implementation, provider behavior changes, replay behavior changes, repository changes, UI changes, business logic changes

Completed milestones recorded:

- Application shell and decision-first Vendor Workspace.
- Search, identity, canonical, intent, entity, constraint, printing, and variant resolution.
- Asset Knowledge Graph.
- Workflow command processor, context invalidation, readiness, and pipeline integrity.
- Business Profiles and Strategy.
- Negotiation Ladder, Offer Ladder validation, and Decision Resolver.
- Intelligence Console and Atlas Inspector.
- Playability Intelligence, Certification Intelligence, Evidence Sufficiency, and Asset Assessment.
- Provider SDK.
- Scryfall identity and market provider surfaces.
- TCGplayer normalized Market Intelligence provider infrastructure.
- JustTCG official SDK connection.
- Market Truth Model.
- Market Intelligence Repository.
- Market Evidence Layer.
- Market Ontology.
- Provider Replay and fixture infrastructure.
- Market Intelligence Engine.
- Asset Eligibility Engine.

## Release Verification

Recommended verification commands for this release:

```bash
npm run lint
npm run build
```

Optional TypeScript verification:

```bash
npx tsc --noEmit
```

## Generated Files

- `docs/releases/Platform-v1.0.md`
