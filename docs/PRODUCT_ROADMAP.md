# Product Roadmap

## Product Review Candidate — Vendor Workspace Raw-Card Markets

- A selected Magic or English Pokémon single now puts TCGplayer beside the applicable Brazilian raw-card provider in one decision card (`PHR-UX-013`).
- Provider name, observation, promoted snapshot, and available source material make the local value auditable without leaving Vendor Workspace.
- Optional PriceCharting graded evidence is collapsed immediately below the raw-card card and does no initial work until the operator asks for it (`PHR-API-010`).
- Next: Product Owner validates the live hierarchy during real card buying. New LigaMagic acquisition remains a separate local reauthentication/operations task.

## Product Review Candidate — Provider Connections And Regional Health

- Settings now presents LigaMagic and LigaPokémon first with their real local acquisition outcomes, then groups PriceCharting directly beside JustTCG as a valuation feed (`PHR-UX-012`).
- The owner can refresh current status without reloading or exposing private browser profiles. LigaMagic currently needs local reauthentication; LigaPokémon has a successfully promoted snapshot.
- A later owner-authorized workflow may provide a safe local reauthentication launcher or bounded acquisition trigger; current delivery is intentionally read-only.

## Product Review Candidate — Plug-And-Play Scanner Appliances

- Pair an approved Mac or Windows scanner computer once, see its exact readiness in Scanner-to-Offer, and control Start or Cancel from Phronesis (`PHR-TECH-017`).
- Keep the booth computer closed to inbound access: its agent polls outbound, executes only a locally configured vendor adapter, and uploads checksum-verified front images to the command-bound batch.
- Provide a dependency-free portable agent and target-OS native executable build so a repository checkout and local Node installation are unnecessary for testers.
- Preserve truthful qualification: current-host macOS packaging and synthetic capture/cancellation are verified; signed installers, automatic service setup, Windows artifact execution, and each physical scanner/driver combination remain release gates.

## Current Delivery — Arbitrage Evidence Continuity

- Restore the existing Cross-market decision queue from the verified 131,869-match LigaMagic/TCGplayer crosswalk by keeping runtime and acquisition on one operational database (`PHR-TECH-012`).
- Refresh LigaMagic daily at 03:00 with complete-snapshot promotion and separately visible provider health (`PHR-API-013`).
- Add LigaPokemon through an isolated authenticated pilot; Pokémon cross-market promotion is a later evidence decision, not part of this delivery.
- Upstream TCG catalogue currency remains dependent on the separately operated acquisition tool's four-daily scheduler.

## Current Delivery — Event Inventory Lanes

- Product Review pending: Purchase-fed Event Flip with multi-card selection, quantity validation, intended Sale pricing, and one retry-safe Add-to-Case action (`PHR-WORKFLOW-013`).
- Product Review pending: one Display Case view for prepared opening stock and receipt-backed event flips, with atomic linked Sales/reversals, returns, counts, and verification (`PHR-WORKFLOW-014`).
- Operational boundary: General Inventory owns acquisition, cost, and total on-hand evidence; Display Case is a reservation over exact card lots and never duplicate ownership.
- Backlog: Binder Inventory (`PHR-WORKFLOW-015`) needs named binder/page/pocket, movement, Sale selection, and reconciliation design before implementation.

## Current Delivery — Inventory Operations

- Completed: event checkout automatically creates auditable exact-card and aggregate Bulk inventory lots (`PHR-WORKFLOW-008`).
- Completed: workspace locations, physical-count reconciliation, quantity basis, and append-only movement/count history (`PHR-WORKFLOW-009`).
- Completed: classified sale/disposition ledger, gross recorded sales, retry-safe creation, and non-destructive reversal (`PHR-WORKFLOW-010`).
- Product Review pending: General Inventory exposes Display Case reserved and generally available quantities and blocks operations that would invalidate active Case evidence (`PHR-WORKFLOW-014`).
- Operational: acquisition evidence, on-hand quantity, location, source provenance, reconciliation, disposition history, and void propagation.
- Backlog: marketplace-neutral listing readiness (`PHR-WORKFLOW-011`) with readiness gates, reserved quantities, price/margin evidence, listing drafts, review, and cancellation. Publication, payments, shipping, and automatic repricing remain outside that backlog item.
- Inventory priority is paused while regional arbitrage validation is active.
- Existing separate gates remain: required-login activation, owner arbitrage cost configuration, executable availability, and daily LigaMagic scheduling.

## Current Delivery — Regional Vending And Arbitrage Intelligence

- Exact LigaMagic/TCGplayer cross-market identity bridge: Completed and validated across 86,392 identities.
- Brazilian vending evidence inside Vendor Workspace: Product Review Ready.
- Official BCB PTAX closing buy/sell automation: Completed and operational (`PHR-API-007`).
- Two-way US↔Brazil arbitrage verification: Completed and truth-gated; operational ranking awaits owner cost configuration and executable availability.
- Daily LigaMagic scheduling remains separately gated.

## Immediate Product Direction — Cross-Game Buying And Intelligence

The cross-game Vendor Workspace removes catalogue switching, groups finish variants under one artwork, and activates current Magic, Pokémon, One Piece, and Lorcana catalogue workflows. `PHR-UX-009` now adds the visible Phronesis Intelligence explanation by reusing the already-executing Card Intelligence, Market Intelligence, Asset Assessment, Strategy, Offer Ladder, and Decision Resolver outputs.

The Product Owner's July 30 continuation completed `PHR-TECH-008` and `PHR-UX-009`. Riftbound remains deferred. The next CTO product brief should prioritize the highest-value evidence or workflow maturity increment without reopening these completed surfaces.

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

Receipt-backed intake, condition/variant identity, acquisition cost basis, locations, and physical-count reconciliation are operational through `PHR-WORKFLOW-008` and `PHR-WORKFLOW-009`. Event Flip and Display Case extend that ownership evidence under `PHR-WORKFLOW-013` and `PHR-WORKFLOW-014`; Binder Inventory is separately deferred as `PHR-WORKFLOW-015`. The remaining bullets describe later maturity increments.

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
