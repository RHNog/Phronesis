# Product Roadmap

## Immediate Product Direction — Cross-Game Buying And Intelligence

The current Product Review candidate removes catalogue switching, groups finish variants under one artwork, and activates Pokémon thumbnails. The next recommended buying-dashboard increment is a visible Phronesis Intelligence panel that reuses the already-executing Card Intelligence, Market Intelligence, Asset Assessment, Strategy, Offer Ladder, and Decision Resolver outputs. It should explain the decision at card-show speed, not introduce a parallel scoring system.

The Product Owner's July 30 event-readiness continuation makes `PHR-TECH-008` the immediate prerequisite: improve strict Pokémon thumbnail coverage and activate Lorcana catalogue prices/artwork. Riftbound is deferred. After `PHR-TECH-008` passes, the visible Phronesis Intelligence panel is the next approved product increment.

This document owns product-facing ideas and future customer capabilities. Engineering sequencing remains in `docs/ROADMAP.md`. Business strategy remains in `docs/BUSINESS_STRATEGY.md`.

## Product Roadmap Philosophy

Product roadmap items describe customer-facing capabilities, not implementation commitments. Each idea may require future engineering planning, provider integrations, design work, pricing validation, and customer discovery before implementation.

The current product center is the Vendor Workspace: a professional buying workflow that turns asset identity, market evidence, assessment, strategy, and negotiation into a decision.

`PHR-WORKFLOW-004` is the current Product Review candidate: it merges the former Vendor Workspace with four-daily catalogue snapshots into a desktop-first card-show station. The July 29 event-readiness revision activated fresh Magic, Pokémon, and One Piece data; later revisions add Pokémon/TCGdex, Lorcana/Lorcast, official One Piece/Bandai thumbnails, durable local artwork retention, unified catalogue search, and artwork-first finish selection. Mobile is the responsive backup rather than the primary device. Canonical adoption remains pending Product Owner acceptance.

## Product Pillars

### Buying Decisions

Goal: make in-person and online buying decisions faster, clearer, and more consistent.

Potential capabilities:

- Vendor Workspace refinement.
- Barcode, OCR, and camera-assisted search.
- Faster printing and variant confirmation.
- Configurable buying policies.
- Team review and override workflows.
- Offer history and negotiation notes.

### Inventory Management

Goal: help stores and professional sellers manage owned assets after purchase.

Potential capabilities:

- Inventory intake.
- Condition and variant tracking.
- Cost basis tracking.
- Listing readiness.
- Inventory aging.
- Repricing suggestions.
- Dead-stock detection.
- Restock and buylist recommendations.

### Portfolio Tracking

Goal: help collectors, investors, and operators understand holdings over time.

Potential capabilities:

- Portfolio value tracking.
- Asset allocation by game, set, rarity, format, and strategy.
- Unrealized gain/loss.
- Risk exposure.
- Premium printing tracking.
- Historical performance.
- Certification-aware portfolio views.

### Watchlists And Alerts

Goal: turn intelligence into proactive monitoring.

Potential capabilities:

- Watchlists by card, printing, set, strategy, or market signal.
- Price movement alerts.
- Market health alerts.
- Buying opportunity alerts.
- Inventory repricing alerts.
- Provider evidence freshness alerts.
- Alert routing by email, SMS, push, or workspace notification.

### CRM And Seller Memory

Goal: support repeat buying relationships.

Potential capabilities:

- Seller profiles.
- Deal history.
- Trust notes.
- Preferred negotiation style.
- Follow-up reminders.
- Source attribution for collections.
- Store employee notes.

### Marketplace Integrations

Goal: connect platform intelligence with listing, sales, and transaction workflows.

Potential integrations:

- TCGplayer.
- eBay.
- Cardmarket.
- CardTrader.
- LigaMagic.
- Facebook Marketplace.
- Discord communities.
- Local cash/convention sales workflows.

Product capabilities:

- Listing import.
- Listing creation.
- Sales import.
- Recent transaction intelligence.
- Marketplace-specific fee modeling.
- Cross-market opportunity comparison.

### Mobile

Goal: provide a responsive backup to the desktop-first card-show workflow.

Potential capabilities:

- Mobile adaptation of Vendor Workspace.
- Camera search.
- Offline or low-connectivity mode.
- Quick offer calculator.
- Event mode.
- Team buying mode.

### Analytics

Goal: help operators learn from decisions and outcomes.

Potential capabilities:

- Buying performance dashboard.
- Strategy performance.
- Employee buying consistency.
- Offer acceptance rate.
- Profit by source.
- Inventory turnover.
- Market signal accuracy.
- Provider cost and intelligence credit analytics.

### Collection Management

Goal: serve collectors and hybrid collector-sellers.

Potential capabilities:

- Collection import.
- Binder/deck/list organization.
- Condition and language tracking.
- Premium and serialized asset tracking.
- Collection value history.
- Missing-card planning.
- Trade matching.

### Future AI Assistant

Goal: provide explainable assistance across buying, inventory, portfolio, and analytics.

Potential capabilities:

- Explain a decision.
- Summarize why a card is risky or attractive.
- Suggest an offer.
- Compare two opportunities.
- Summarize inventory exposure.
- Find stale listings.
- Explain changes in portfolio value.
- Draft seller follow-up notes.

### Future Multi-Store Support

Goal: support operators with multiple locations, teams, and policies.

Potential capabilities:

- Store-level business profiles.
- Employee permissions.
- Shared inventory.
- Transfer suggestions.
- Store-specific pricing policy.
- Multi-location analytics.
- Centralized strategy governance.

## Product Backlog Index

| Area | Product Ideas | Status |
| --- | --- | --- |
| Buying Decisions | Vendor Workspace, offer history, team review, search acceleration | Active platform foundation |
| Inventory Management | Intake, repricing, aging, restock recommendations | Future |
| Portfolio Tracking | Holdings, value history, risk, performance | Future |
| Watchlists And Alerts | Price, market, opportunity, freshness alerts | Future |
| CRM | Seller profiles, deal history, reminders | Future |
| Marketplace Integrations | Listings, sales, transactions, cross-market comparison | Future |
| Mobile | Camera search, event mode, quick offers | Future |
| Analytics | Strategy, employee, profit, provider, credit analytics | Future |
| Collection Management | Collection import, organization, trade planning | Future |
| AI Assistant | Explanations, comparisons, summaries, recommendations | Future |
| Multi-Store | Permissions, store policies, shared inventory, governance | Future |

## Relationship To Engineering Roadmap

Product roadmap items become engineering roadmap items only after they are scoped into platform work. Until then, they stay here as product direction, customer discovery prompts, and prioritization candidates.

Engineering roadmap: `docs/ROADMAP.md`

Business strategy: `docs/BUSINESS_STRATEGY.md`

Idea ledger: `docs/IDEA_LEDGER.md`
# Active Delivery — PHR-UX-007 Mobile Pricing Lookup

Build the phone-first English Pokémon buying reference from the existing Pricing Tool export contract. Engineering is active; authoritative export schema binding, durable hosted persistence, Mac Worker runtime evidence, and production deployment are later gates.
