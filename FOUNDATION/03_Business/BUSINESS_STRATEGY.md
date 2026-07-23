# Business Strategy

This document owns business strategy for Phronesis. It should evolve independently from engineering plans and product roadmap sequencing.

## Vision

Build the professional decision operating system for trading-card buying, inventory decisions, and market intelligence.

Phronesis should help serious buyers, stores, and operators make faster and better purchase decisions by converting fragmented card, market, condition, and business evidence into explainable action.

## Mission

Help trading-card professionals answer:

- What is this asset?
- Is this asset worth evaluating for this workflow?
- What does the market know right now?
- What does this asset mean for my business?
- What should I offer?
- Should I buy, negotiate, or pass?

The platform should reduce uncertainty, prevent stale or unsupported assumptions, and make every decision traceable.

## Target Customer

Primary early customers:

- Local game stores buying cards across the counter.
- Professional buyers at events, conventions, and trade nights.
- Online sellers managing buying strategies and resale targets.
- Small teams that need consistent buying decisions across employees.

Secondary future customers:

- Multi-store operators.
- High-volume marketplace sellers.
- Portfolio-oriented collectors and investors.
- Data consumers who want market intelligence through API access.
- White-label partners who need decision support embedded in their own workflows.

## Core Value Proposition

Phronesis turns a card lookup into a business-aware decision.

The platform combines identity resolution, eligibility filtering, provider-backed market evidence, cached intelligence, asset assessment, business profiles, strategy, negotiation, and decision output into one repeatable workflow.

The customer value is not raw price lookup. The value is decision confidence, operational consistency, and better buying discipline.

## Competitive Advantages

- Decision-first workflow rather than passive price tracking.
- Provider evidence is validated, classified, layered, and attributed before business use.
- Business Profiles let different operators evaluate the same card differently.
- Asset Assessment separates asset understanding from BUY/PASS decisions.
- Market Ontology prevents providers from being used for evidence domains they cannot answer.
- Replay and fixture infrastructure makes provider development recoverable and low-risk.
- Atlas diagnostics make the system explainable to builders and operators.
- Eligibility separates identity from workflow suitability, preserving broad search while preventing unsupported workflow use.

## Moats

Potential long-term moats:

- Proprietary decision history from evaluated assets, offers, outcomes, and strategies.
- Cached intelligence graph that improves over time and lowers marginal cost per evaluation.
- Configurable business profiles and strategy policies that become operational memory for stores.
- Provider normalization and evidence classification across fragmented market sources.
- Market Intelligence and Asset Assessment signals calibrated against real outcomes.
- Workflow-specific eligibility rules that let the platform expand into digital, oversized, art-card, portfolio, and inventory workflows without corrupting the buying workflow.
- Trust from explainable recommendations rather than opaque scoring.

## Growth Strategy

Near-term growth:

- Focus on Vendor Workspace as the core daily-use workflow.
- Make buying decisions faster, explainable, and repeatable for physical card buyers.
- Expand provider evidence carefully, preserving ontology and evidence validation.
- Use replay fixtures to improve development speed without increasing provider costs.

Mid-term growth:

- Add inventory and collection workflows.
- Add alerts and watchlists that reuse existing intelligence.
- Add marketplace integrations for listing and transaction evidence.
- Add portfolio tracking for users who manage larger collections or investments.
- Add CRM-style seller/customer memory for repeat in-person buying relationships.

Long-term growth:

- Multi-store operations.
- Team workflows and permissions.
- API access to normalized intelligence.
- Marketplace partner integrations.
- White-label decision intelligence.
- AI assistant surfaces that explain decisions, suggest actions, and summarize portfolio or inventory risk.

## Monetization Philosophy

Monetization should align with intelligence value and cost discipline.

Customers should pay for new intelligence generation, not repeated viewing of intelligence the platform already generated inside a freshness window. This mirrors the internal provider economy: the platform caches provider observations to reduce provider API cost, and should cache customer intelligence to reduce unnecessary customer credit consumption.

The pricing model should reward efficient use of cached intelligence on both sides:

- Internal: provider observations are cached to reduce API costs.
- External: generated intelligence is cached to reduce customer credit consumption.

## Long-Term Opportunities

- Professional buying terminal for stores and event buyers.
- Inventory management and repricing intelligence.
- Portfolio tracking and risk analysis.
- Marketplace listing optimization.
- Store-level employee buying policy controls.
- Multi-store intelligence sharing.
- API access for normalized TCG market intelligence.
- White-label decision workflows.
- AI assistant for buying, inventory, and portfolio operations.
- Outcome-driven strategy calibration.
- Cross-market arbitrage and regional opportunity detection.

## Open Questions

- Which customer segment should be first commercial focus: local game stores, solo professional buyers, online sellers, or multi-store operators?
- Should pricing start with credits, subscription tiers, professional plans, store plans, or a hybrid?
- What freshness windows are fair for customer credits and sustainable for provider costs?
- Which intelligence generation events should consume credits?
- Should manual refresh always consume credits?
- How should failed provider calls, partial evidence, or unavailable domains affect customer credits?
- Which providers must be connected before paid launch?
- Which workflow should follow Vendor Workspace: inventory, portfolio, alerts, or CRM?
- How much Atlas-level explainability should be exposed to paying operators?
- What outcome data can be collected ethically and usefully for future calibration?
