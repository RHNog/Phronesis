<!-- handoff: {"document":"CHANGELOG","owner":"human-and-agent","schema_version":"1"} -->
# Documentation Changelog

## [Unreleased]

### Added

- Purchase-fed Event Flip, Vendor direct-to-Case checkout with required Case price, receipt-linked Display Case reservation/Sale/count control, combined prepared/event-flip verification, and General Inventory reservation safety (`PHR-WORKFLOW-013`, `PHR-WORKFLOW-014`), with Binder Inventory reserved for later design (`PHR-WORKFLOW-015`).

- Repository-native Handoff continuity with populated canonical project state, backlog, active task, generated operational context, and Git-bound validation evidence.

- Marketplace-neutral listing readiness captured as deferred backlog feature `PHR-WORKFLOW-011`.

- Automatic official Banco Central do Brasil PTAX closing buy/sell rates with direction-correct arbitrage costing, last-good retention, and read-only Settings provenance (`PHR-API-007`).

- Exact LigaMagic/TCGplayer reconciliation, regional Compra/Venda evidence, explicit FX/cost profiles, Brazilian vending guidance, and verified two-way arbitrage (`PHR-ARCH-013`, `PHR-API-006`, `PHR-UX-013`, `PHR-WORKFLOW-007`).

- User-scoped server-backed Market Watch, one-action Vendor tracking, verified-checkpoint refresh, and separate estimate/listing/observed-sale evidence (`PHR-WORKFLOW-005`, `PHR-API-003`).

- Pokémon explicit set-alias reconciliation and current Lorcana catalogue/artwork activation (`PHR-TECH-008`).
- Lifecycle-based application structure and typed primary navigation (`PHR-UX-006`).
- Phronesis product identity migration (`PHR-ARCH-010`).
- Three-role Canonical Product Development Workflow for CTO, Chief Architect, and Engineer (`PHR-WORKFLOW-002`).
- Conversation-derived Product Development Memory and CTO session ledger (`PHR-TECH-002`).
- 2026-07-22 documentation-practices and rebuild-readiness review.
- PHR-TECH-001 Documentation-First Development System.
- Repository-wide documentation-first workflow in `docs/DOCUMENTATION_FIRST_DEVELOPMENT.md`.
- Feature specification template and implementation prompt template.
- Permanent documentation taxonomy under `docs/backlog`, `docs/prd`, `docs/architecture`, `docs/technical`, `docs/database`, `docs/api`, `docs/ui`, `docs/ux`, `docs/workflows`, `docs/business-rules`, `docs/testing`, `docs/roadmap`, `docs/release-notes`, `docs/future`, and `docs/prompts`.
- Repository-level AI instructions requiring documentation-first behavior for meaningful changes.
- PHR-ARCH-001 Project Phronesis Founding Charter.
- Founding charter guidance for philosophy, culture, engineering discipline, visual identity, communication standards, AI-assisted development, long-term vision, and founder-absent decision making.
- PHR-ARCH-002 Project Phronesis Foundation Governance System.
- Root `FOUNDATION/` layer governing engineering, product, business, partnership, brand, communication, and future work order checks.
- PHR-ARCH-003 Corporate Foundation Organization.
- Brand Production Brief in Markdown, DOCX, and PDF.
- Brand Board PNG.
- Partnership Submission Package for reusable partner proposal generation with external AI systems.
- PHR-UX-001 Executive Partnership Deck for the TCGplayer ecosystem partnership proposal.
- Editable PPTX, Google Slides compatible PPTX, DOCX, PDF, and Markdown deck source for the TCGplayer executive partnership deck.
- Sprint 33 Provider Replay & Fixture Infrastructure documentation.
- Sprint 33.1 fixture identity model documentation for exact replay lookup by asset, printing, collector number, finish, condition, language, provider product identifier, and provider variant identifier.
- Replay lifecycle, fixture format, development workflow, and provider certification workflow documentation.
- Documentation that production acquires observations while development may replay observations through provider implementations.
- Sprint 32.2 coverage-driven market refresh documentation.
- Evidence Coverage Map documentation for asset, printing, finish, condition, coverage status, and domain freshness.
- Developer diagnostics documentation for coverage, freshness, missing evidence, providers queried, providers skipped, and merge result.
- Sprint 32.1 Transitional Evidence Projection documentation.
- Developer diagnostics for requested UI field, resolved evidence domain, evidence source, and projection usage.
- Sprint 32 Market Ontology documentation.
- Market evidence domains for Variant Valuation, Listing Intelligence, Transaction Intelligence, Historical Pricing, Inventory Intelligence, Price Trend, Volatility, Market Liquidity, Market Confidence, and Provider Metadata.
- Provider capability matrix documentation for JustTCG, TCGplayer, Scryfall, Cardmarket, and eBay market evidence domains.
- Evidence question resolution documentation for mapping market fields to evidence domains before provider selection.
- Domain coverage documentation for connected, planned, partial, and unsupported provider capability states.
- JustTCG provider data model mapping documentation.
- Raw-observation storage documentation for JustTCG card, variant, price, timestamp, SKU, price history, and provider metadata fields.
- Sprint 31D Market Evidence Layer documentation.
- Evidence stacking, aggregation, resolver, configurable provider priority, provenance, coverage, fallback chains, and selection documentation.
- Documentation that adding provider evidence must never reduce already available market information.
- Sprint 31C Market Truth Model documentation.
- Provider evidence validation, provider match validation, provider price classification, evidence scoring, field mapping, consistency reporting, and Market Truth Report documentation.
- Documentation that repository market values store provider evidence attribution rather than claiming provider responses are truth.
- Future consensus engine documentation as deferred architecture.
- Sprint 31B Market Intelligence Repository documentation.
- Repository-owned Market Snapshot model, per-field refresh policies, background refresh, repository statistics, local persistence, and Atlas diagnostics documentation.
- Sprint 31A JustTCG live provider connection documentation.
- Official `justtcg-js` SDK integration, `JUSTTCG_API_KEY` authentication, known-card live request, normalization mapping, provider diagnostics, and developer-only inspection page documentation.
- Sprint 30 TCGplayer Market Intelligence Provider documentation.
- Provider-backed market evidence, normalized MarketSnapshot intelligence, Atlas provider trace, and negotiation benefit documentation.
- Sprint 29 Intelligence Provider SDK documentation.
- Provider lifecycle, metadata, health, coverage, diagnostics, evidence mapping, confidence contribution, retry hooks, validation hooks, cache hooks, and planned provider documentation.
- Sprint 28 Asset Assessment Engine documentation.
- Assessment philosophy, reasoning, evidence interpretation, primary drivers, risk factors, business summary, architecture graph, dependency graph, and Atlas synchronization documentation.
- Sprint 26 Playability Intelligence Level 3 documentation.
- Demand Model, Card Role Model, Playability Provider Adapter, and updated Intelligence Registry documentation.
- Sprint 25.1 Evidence Sufficiency Framework documentation.
- Unknown state, evidence requirements, missing-vs-negative evidence, and future provider dependency documentation.
- Sprint 25 Playability Intelligence Level 2 documentation.
- Format weighting, demand signals, Playability business conclusions, future provider integrations, and updated Intelligence Registry documentation.
- Sprint 24.2 finalized Intelligence Console UI contract documentation.
- Expansion memory, model-specific confidence labels, confidence reason rules, and final section order documentation.
- Sprint 24.1 layered Intelligence Console documentation.
- Vendor vs Atlas responsibility split for Decision, Explanation, Evidence, and Implementation layers.
- Sprint 24 Certification Intelligence Platform documentation.
- Certification Intelligence philosophy, Provider abstraction, Certification Profile, Collector integration, future provider roadmap, dependency graph, architecture graph, backlog, and technical debt documentation.
- Sprint 23.2 Pipeline Integrity documentation.
- Pipeline Inspector, Offer Policy, first-invalid-stage termination, zero-valued ladder prevention, Business Invariants, architecture graph, technical debt, and Atlas Pipeline Trace documentation.
- Sprint 23.1 System Readiness Platform documentation.
- Readiness Pipeline, validation layers, configuration validation, user-facing error handling, dependency graph, backlog, and technical debt documentation.
- Sprint 23 Business Profiles Platform documentation.
- Business Profiles, Marketplace Profiles, Cost Profiles, Offer Ladder integration, business-aware recommendations, dependency graph, backlog, and technical debt documentation.
- Sprint 22 Intelligence Console v2 documentation.
- Intelligence Tile, Intelligence Detail, grade mapping, confidence separation, progressive disclosure, and shared presentation contract documentation.
- Sprint 22 Playability Intelligence Platform documentation.
- Playability provider abstraction, profile, format indicators, provider roadmap, dependency graph, backlog, and technical debt documentation.
- Sprint 21 Intelligence History Platform documentation.
- Evaluation Snapshot, immutable history, append-only repository, snapshot lifecycle, and future Simulation Platform documentation.
- Sprint 20.6 condition-aware market pricing regression recovery documentation.
- Market Provider precedence, condition pricing lifecycle, Asset Context market snapshot generation, and future Condition Intelligence TODO documentation.
- Sprint 20.5 Asset Context Integrity and Atlas Developer Tools documentation.
- Asset Context, Context Generation, Context Integrity Validator, Atlas Inspector, Developer Mode, stale-reference invariants, and diagnostics relocation documentation.
- Sprint 20.4 Workflow Command Architecture documentation.
- Command Processor, Command Registry, Context Invalidation, workflow ownership, command diagnostics, and business invariant documentation.
- Sprint 20.3 Workflow Ownership documentation.
- Context Invalidation, workflow authority, command-driven ownership, rejected command, and dependency invalidation documentation.
- Sprint 20.2 Evaluation Integrity documentation.
- Offer Ladder Validation, business invariant, Evaluation Trace, calculation trace, and replay-readiness documentation.
- Sprint 20.1 Vendor Workflow State Machine documentation.
- Single Printing Rule, identity state separation, workflow invariant, diagnostics, and stabilization backlog documentation.
- Sprint 20 Asset Intelligence Framework documentation.
- Intelligence Model and Indicator contract documentation.
- Model health, status metadata, dependency graph, and future model registration documentation.
- Sprint 18 Card Intelligence Platform notes.
- Signal Registry, signal versioning, Market Context, Condition Resolution, Negotiation Ladder, and Decision Resolver invariant documentation.
- Sprint 17 Vendor Workspace VX optimization notes.
- Dense printing row, chip-first refinement, automatic evaluation, and keyboard-safe shortcut patterns.
- Project Atlas documentation.
- Decision-first workspace pattern documentation.
- Decision Drivers documentation.
- Variant Resolution Policy documentation.
- Purchase Evaluation Engine documentation.
- Scryfall Market Provider v1 documentation.
- Market estimate architecture notes.
- Printing variant architecture notes for multi-finish printings.
- Product specification for the current decision-operating-system positioning.
- Architecture overview covering routes, features, engines, providers, and data flow.
- Roadmap with completed work, current sprint, near-term sprints, and future milestones.
- Architecture decision record.
- Logical sprint history.
- Agent handoff instructions.
- Prompt history summary.

### Changed

- LigaMagic/TCGplayer validation now deterministically reconciles 86,392 cross-market identities through exact and qualifier-preserving edition-alias matches and exposes 86,032 two-sided price pairs; arbitrage uses direction-correct TCGplayer acquisition/resale fields (`PHR-ARCH-013`, `PHR-API-006`, `PHR-WORKFLOW-007`).
- Market refresh now requires both freshness and evidence-domain coverage before skipping provider requests.
- Provider Replay fixtures now document market-identity paths instead of card-level fixture paths.
- Fresh but incomplete snapshots now fetch only missing refreshable evidence domains.
- Current Market Estimate now preserves JustTCG Variant Valuation through a temporary projection bridge until the Market Intelligence Engine exists.
- Lowest Listing and Recent Sales remain restricted to Listing Intelligence and Transaction Intelligence respectively.
- Current sprint updated to Sprint 32.
- Documentation now treats Market Ontology as the owner of market evidence semantics before provider selection.
- Documentation now records JustTCG as unsupported for Listing Intelligence, Transaction Intelligence, and Inventory Intelligence.
- Documentation now distinguishes provider raw observations from provider-supplied derived metrics and platform-derived Market Intelligence.
- Current sprint updated to Sprint 31D.
- Documentation now treats the Market Evidence Layer as the owner of best-available field selection.
- Current sprint updated to Sprint 31C.
- Documentation now treats provider evidence validation as the required gate before Market Intelligence Repository writes.
- Current sprint updated to Sprint 31B.
- Documentation now treats Market Intelligence Repository as the single source of truth between providers and Asset Session.
- Current sprint updated to Sprint 31A.
- Documentation now records JustTCG as the first live official SDK provider connection and explains why the official SDK was selected over a custom HTTP client.
- Current sprint updated to Sprint 30.
- Documentation now treats TCGplayer as the first active SDK-backed Market Intelligence provider.
- Current sprint updated to Sprint 29.
- Documentation now treats future providers as SDK lifecycle participants that supply data only.
- Current sprint updated to Sprint 28.
- Documentation now treats Asset Assessment as the canonical evidence interpretation layer consumed by Business Profiles and Strategies.
- Current sprint updated to Sprint 26.
- Playability documentation now describes explainable player demand intelligence and role-driven demand sources.
- Current sprint updated to Sprint 25.1.
- Documentation now states that evidence precedes conclusions and missing evidence is not a failing grade.
- Current sprint updated to Sprint 25.
- Playability documentation now treats the model as demand intelligence rather than legality reporting.
- Current sprint updated to Sprint 24.2.
- Intelligence Console documentation now removes redundant Summary and What This Means layers.
- Intelligence Console documentation now treats implementation details as Atlas-only developer information.
- Current sprint updated to Sprint 24.1.
- Current sprint updated to Sprint 24.
- Documentation now treats Certification Intelligence as a first-class measurement model consumed by Collector Intelligence.
- Current sprint updated to Sprint 23.2.
- Documentation now treats Offer Policy as owned by Business Profiles and consumed by Offer Ladder.
- Documentation now treats Pipeline Inspector as the first-invalid-stage diagnostic owner for purchase evaluation.
- Current sprint updated to Sprint 23.1.
- Documentation now treats System Readiness as the centralized validation owner before business engines execute.
- Current sprint updated to Sprint 23.
- Documentation now treats Business Profile as the source of business-specific costs and target assumptions.
- Documentation now records Intelligence Console as the standard presentation layer for every Asset Intelligence model.
- Current sprint updated to Sprint 22.
- Documentation now treats Playability as measurement consumed by strategies, not a decision engine.
- Current sprint updated to Sprint 21.
- Documentation now treats completed evaluations as append-only historical intelligence.
- Current sprint updated to Sprint 20.6.
- Vendor Workspace condition changes now document market provider reload through Asset Context generation.
- Current sprint updated to Sprint 20.5.
- Production Vendor Workspace documentation now excludes workflow diagnostics from normal UI.
- Current sprint updated to Sprint 20.4.
- Workflow documentation now describes command-driven orchestration instead of event-driven orchestration.
- Current sprint updated to Sprint 20.3.
- Roadmap now points near-term work toward live opportunities, marketplace listings, and printing descriptors after Card Intelligence.
- Roadmap now includes Vendor Workspace VX follow-ups such as persisted preferences and visual regression checks.
- Documentation is now part of sprint completion.
- Roadmap now points Market Provider v2 toward live listings and recent sales.

### Fixed

- Prevented Phronesis roles from resolving Structure commands through Muamba Arte or other cross-project artifacts (`PHR-WORKFLOW-002`).
- Documented zero-valued Offer Ladder prevention and the Online Marketplace policy correction for low-dollar opportunities.
- Documented rejection of incomplete evaluation snapshots before persistence.
- Documented restoration of condition-aware market estimates after Asset Context integration.
- Documented stale market snapshot rejection and generation-based Asset Context protection.
- Documented the single-printing command flow that resolves Curse of Shallow Graves / Shallow Grave style selection issues without UI-authored transitions.
- Documented invalid evaluation prevention and fallback-zero removal.
- Documented stale workflow UI prevention through workflow-owned context.
- Documented Vendor Workspace deterministic progression fix for candidate, highlighted, and selected identity states.
- Documented targeted Vendor Workspace fix for unresolved finish variants.
- Documented targeted Vendor Workspace fix for apostrophe normalization, Textless constraints, and low-confidence printing candidate loading.

### Documented

- Required documentation update rule for future sprints.
- Sprint 13 visual printing confirmation work.
