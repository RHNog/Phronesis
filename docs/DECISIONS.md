# Decisions

## PHR-ARCH-010: Phronesis Is The Canonical Identity

Decision: use Phronesis as the sole product and repository identity. Preserve Git history and application architecture; coordinate any external repository or checkout-directory rename separately.

Rationale: dual naming created ambiguity across product copy, package metadata, providers, browser storage, documentation, and AI memory.

## PHR-WORKFLOW-002: Product Development Uses Three Accountable Roles

Decision: CTO owns product intent and acceptance, Chief Architect owns design and conformance, and Engineer owns scoped implementation and evidence.

Rule: one session may execute sequential roles for explicit low-risk work, but all gates remain visible and self-review must not be described as independent approval.

## PHR-TECH-002: Repository Artifacts Are Durable Product Memory

Decision: the primary chat is the active CTO interface, while `docs/product-development/CONVERSATION_HISTORY.md` and linked canonical documents are durable memory.

Rule: record material CTO sessions, distinguish intent from decisions and inference, and never reconstruct unavailable transcripts.

## PHR-TECH-001: Documentation Is Part Of Implementation

Decision: establish a repository-wide Documentation-First Development System.

Rationale:

- Project Phronesis is a long-term AI-assisted engineering effort.
- Future work must remain understandable, traceable, and reusable by humans and AI coding agents.
- Implementation-grade documentation reduces duplicated decisions, stale assumptions, and architecture drift.
- Permanent Feature IDs create traceability from idea to specification, implementation prompt, tests, release notes, and future enhancements.

Constraint: this decision is documentation-only. It does not modify application runtime behavior.

Rule: every meaningful change must be classified, documented with a permanent Feature ID, and kept current in dependent documentation. Implementation follows documentation, not the other way around.

## Sprint 33: Development Replays Certified Provider Observations

Decision: introduce Provider Replay as a provider implementation detail under `lib/providers/replay/`.

Rationale:

- Development should not depend on live provider availability, network health, or API quota.
- Certified provider observations should be reusable as fixtures.
- The repository and business engines should behave the same whether observations came from a live provider or a replay fixture.
- Recording and replay should live at the provider boundary, not in Market Ontology, Repository, Assessment, Strategy, Negotiation, Decision, or Intelligence Console code.

Constraint: production forces live provider behavior. Replay modes are development capabilities only.

Rule: production acquires observations; development may replay observations. Provider replay must never become a business-domain concern.

Identity rule: replay fixtures are keyed by full market identity: asset identity, printing, collector number, finish, condition, language, provider product identifier, and provider variant identifier. The replay registry must perform exact lookup only. If an exact observation is absent, `REPLAY` mode reports the missing identity component instead of selecting a nearby card or falling back to live provider execution.

## Sprint 32: Market Ontology Owns Market Semantics

Decision: introduce `lib/market/ontology/` as the canonical vocabulary for market evidence domains and provider capabilities.

Rationale:

- A provider can know variant valuation without knowing live listings.
- Market fields such as Lowest Listing, Recent Sales, and Volatility should resolve to evidence domains before provider selection.
- Providers must not be forced to answer outside their capability.
- The repository should store observations only after the ontology confirms the provider can supply that evidence domain.

Constraint: no Vendor Workspace redesign, Assessment change, Business Profile change, Strategy change, Negotiation change, Decision change, Intelligence Console change, or new live provider.

Rule: JustTCG is a variant-level valuation, history, trend, volatility, confidence, and metadata provider. It is not a listing, transaction, or inventory provider.

## Sprint 31D: Evidence Is Layered

Decision: introduce `MarketEvidenceLayer` as the owner of market evidence aggregation and selection.

Rationale:

- A provider can have strong evidence for one field and no evidence for another.
- Adding provider data should increase platform knowledge, not replace populated fields with unavailable values.
- Field selection needs configurable priorities and fallback chains rather than one global provider winner.
- Business logic should consume selected market evidence, not provider-specific responses.

Constraint: no Vendor Workspace redesign, Asset Assessment change, Business Profile change, Strategy change, Negotiation change, Decision change, Intelligence Console change, or new provider integration.

Rule: repository snapshots store layered evidence. The evidence layer selects best available values. No provider may reduce existing platform knowledge by omitting a field.

## Sprint 31C: Provider Evidence Is Not Market Truth

Decision: introduce `MarketTruthEngine` as a validation gate between normalized provider responses and Market Intelligence Repository writes.

Rationale:

- Provider fields can describe different products, variants, conditions, languages, or price concepts.
- The repository should retain attributed provider evidence rather than silently converting provider output into unquestioned truth.
- Business engines need validated market knowledge, not raw SDK objects or ambiguous provider labels.
- A separate Market Truth boundary prepares the platform for future multi-provider consensus without changing Assessment, Strategy, Negotiation, or Decision architecture.

Constraint: no consensus engine, extra provider integrations, cache redesign, Asset Assessment changes, recommendation changes, Strategy changes, Negotiation changes, or Decision changes.

Validation rule: conflicting canonical identity, printing, collector number, finish, condition, language, game, product identifier, or provider timestamp rejects the provider response before repository write.

## Sprint 31B: Repository Owns Market Knowledge

Decision: introduce `MarketIntelligenceRepository` as the single source of truth for market snapshots.

Rationale:

- Provider responses should become durable platform knowledge instead of transient request data.
- Business logic should consume repository snapshots, not providers.
- Per-field TTLs reduce unnecessary provider calls and preserve fresh fields when only one signal expires.
- A repository boundary allows local persistence now and database-backed storage later without redesigning business engines.

Constraint: no Asset Assessment, Business Profile, Strategy, Negotiation, Decision, Intelligence Model, Intelligence Console, or UI redesign changes.

Refresh rule: fresh data returns from repository, slightly stale data returns immediately with background refresh, and missing or expired fields are refreshed through market infrastructure before returning.

## Sprint 31A: Use Official JustTCG SDK

Decision: integrate JustTCG through the official `justtcg-js` SDK and wrap it with the existing Provider SDK.

Rationale:

- The SDK is published as the official JavaScript/TypeScript SDK for the JustTCG API.
- It supports environment-variable authentication through `JUSTTCG_API_KEY`.
- It provides typed card, variant, usage, pagination, price history, and statistic models.
- It keeps API versioning behind `client.v1`, reducing custom request code inside the application.

Constraint: application code may not call the SDK directly. The allowed path is Application -> Provider SDK -> JustTCG Adapter -> official SDK -> JustTCG API.

Scope: Sprint 31A validates connectivity only. It does not add caching, retries, Assessment consumption, Strategy consumption, Negotiation changes, Decision changes, or production UI changes.

## Major Product And Architecture Decisions

0.9. TCGplayer is the primary Market Intelligence provider. Its data must enter through the Provider SDK and normalized MarketSnapshot evidence; raw provider responses must never reach UI, Assessment, Strategy, Business Profile, Negotiation, or Decision layers.

0.95. Market provider values are evidence until validated. Market Truth validation must classify price concepts and attach provider attribution before the repository stores those values.

0.96. Market evidence is layered. Provider priority, fallback chains, freshness, confidence, and provenance determine selected field values.

0.97. Market evidence semantics belong to the Market Ontology. A provider must declare whether it supports, partially supports, does not support, or has unknown support for every market evidence domain before its evidence can be stored for that domain.

0.8. Future providers must follow the Provider SDK lifecycle. Providers supply data; SDK infrastructure owns normalization, health, cache hooks, diagnostics, evidence mapping, confidence contribution, metadata, retry hooks, and validation hooks.

0.7. Asset Assessment is the canonical interpretation layer for asset evidence. Intelligence models provide evidence; Assessment interprets it; Business Profiles and Strategies consume Assessment.

0.6. Asset Knowledge Graph is the reusable semantic layer for Intelligence models. Relationship Registry owns configured semantic relationships; models consume the graph but do not mutate strategy, negotiation, or UI behavior.

0.5. Playability card roles are provider-independent. Provider adapters normalize external evidence into roles and demand dimensions; they do not perform strategy or negotiation.

0.4. Evidence precedes conclusion. Unknown is not a failing grade; it means required evidence is insufficient.

0.3. Playability Intelligence measures player demand, not legality alone. Legality is evidence; demand is the conclusion.

0.2. Final Intelligence Console panels answer exactly four questions: grade/confidence, business conclusion, key signals, and supporting evidence.

0.1. Intelligence Console presentation is layered. Vendor Workspace shows Decision, Explanation, and Evidence; Atlas Inspector owns Implementation details.

0. Certification Intelligence measures collectible characteristics only. It does not decide BUY, NEGOTIATE, PASS, or offer values. Collector Intelligence consumes Certification Intelligence; Strategies consume Collector Intelligence; Negotiation consumes Strategies.

1. Phronesis is not a price tracker. It is a decision platform.

2. Identity and pricing are separate domains. Identity Providers and Market Providers are different provider families.

3. Provider data must be adapted and normalized before entering the domain model.

## Sprint 24 - Certification Provider Abstraction

Decision:

Certification providers are a separate provider family from Identity Providers and Market Providers.

Rationale:

Certification ecosystem data describes graded population, gem rates, provider status, and premiums. Those are collectible characteristics, not identity or market-price facts.

Consequences:

- Future PSA, BGS, CGC, TAG, SGC, and ARS integrations register through `CertificationRegistry`.
- Current implementation uses placeholder provider output only.
- Scraping and unofficial APIs are prohibited.
- Collector Intelligence may consume normalized Certification Profile output.
- Strategies keep using configurable signal weights.

## Sprint 24.1 - Vendor vs Atlas Information Ownership

Decision:

Production Intelligence Console hides implementation details by default.

Rationale:

Vendor Workspace is for business conclusions during buying. Atlas is the developer surface for framework health, provider readiness, versions, internal signals, and diagnostics.

Consequences:

- Numeric confidence remains internal but production displays confidence labels.
- Tiles display only name, grade, confidence label, and expand affordance.
- Expanded model panels prioritize summary, business conclusion, confidence, supporting indicators, and evidence.
- Version, health, status, provider matrix, internal sources, and future dependencies are Atlas-only.

## Sprint 24.2 - Final Intelligence Console Contract

Decision:

Expanded Intelligence tiles use only four sections: Grade/Confidence, Business Conclusion, Key Signals, and Supporting Evidence.

Rationale:

Summary and What This Means repeated the same conclusion in different words. The console should communicate business conclusions quickly during buying.

Consequences:

- Confidence labels are model-specific.
- Confidence below High must include a plain-language reason.
- Key Signals are limited to four items.
- Supporting Evidence contains factual support only.
- Expanded tile state persists for the current browser session.

## Sprint 25 - Playability Demand Intelligence

Decision:

Playability Intelligence advances to Level 2 by evaluating weighted player demand.

Rationale:

Legality alone does not explain why the market cares. Player demand comes from format importance, Commander adoption, competitive relevance, casual relevance, format diversity, and metagame dependency.

Consequences:

- Format weights live in configuration.
- Scryfall remains the current provider.
- Future demand providers remain hooks only.
- Playability Profile owns business conclusions and key signals.
- Strategies continue to interpret Playability through existing signal weights.

## Sprint 25.1 - Evidence Sufficiency Before Grades

Decision:

Every Intelligence model must evaluate evidence sufficiency before producing a definitive grade.

Rationale:

Missing provider evidence should not be interpreted as negative evidence. A model without required inputs should say Unknown with low confidence instead of producing an F-like conclusion.

Consequences:

- Models declare required, optional, and future evidence.
- Confidence reflects evidence quality.
- Insufficient required evidence blocks letter grades.
- Atlas Inspector displays missing evidence and future provider dependencies.

## Sprint 26 - Playability Provider Adapter And Card Roles

Decision:

Playability Level 3 introduces a provider adapter and card role model.

Rationale:

Future providers will report different evidence shapes. The platform needs one normalized Playability Profile contract that explains why players use a card.

Consequences:

- Provider adapters normalize external evidence.
- Card roles are provider-independent signals.
- Business conclusions reflect roles and demand sources.
- Evidence Sufficiency still gates definitive grades.

4. Search became the Query Engine. The system interprets intent instead of only matching text.

5. The Query Engine must be dictionary-driven. Game knowledge lives in `knowledge/` packages.

6. Canonical Resolution exists because vendors use community shorthand such as `bolt`, `fow`, `bob`, and `monkey`.

7. Intent Resolution exists because user queries communicate meaning, not just keywords.

8. Entity Resolution exists because related card entities are not equivalent to the intended card identity.

9. Constraint Satisfaction exists because selecting a printing is different from selecting a card identity.

10. Condition and grading should not select printings. They should be preserved for purchase evaluation.

11. Images belong to domain objects, not UI-specific provider calls.

12. A printing is not always the final purchasable object. Multi-finish printings require finish variant resolution before evaluation.

13. Vendor Workspace must not implement finish defaults. The Variant Resolution Policy owns automatic finish selection.

14. Scryfall pricing is a daily market estimate source. It must not be represented as live listings, recent sales, or buylist data.

15. Purchase evaluation should consume normalized market prices, not provider-specific response shapes or listing-shaped placeholders.

16. Nonfoil is the default purchasable variant when a multi-finish printing includes Nonfoil and the user did not request another finish.

17. Purchase evaluation should explain BUY / NEGOTIATE / PASS decisions with profit, ROI, margin, confidence, and recommended offer.

18. Vendor Workspace should be decision-first: printing exploration and purchase decision must remain visible together on desktop.

19. Decision Drivers are business-engine output, not presentation copy assembled in UI.

20. Vendor Workspace should evaluate automatically after short input debounce instead of requiring a manual Evaluate button.

21. Printing refinement should prefer buyer vocabulary chips before free-text filtering.

22. Keyboard shortcuts must accelerate the buying workflow without overriding normal input, select, or textarea behavior.

23. Card Intelligence must never decide BUY, NEGOTIATE, or PASS. It only produces reusable signals.

24. Future intelligence must always become a registered Asset Intelligence model.

25. Every Intelligence Model must expose the shared model contract.

26. Every Indicator must expose the shared indicator contract.

27. Strategies interpret intelligence outputs through explicit weights and must not read provider data directly.

28. Negotiation Ladder is the single source of truth for negotiation guidance.

29. Decision Resolver compares asking price against the Negotiation Ladder and must not contradict it.

30. If asking price is less than or equal to Target Offer, the decision must be BUY.

31. If asking price is greater than Target Offer and less than or equal to Maximum Buy Price, the decision must be NEGOTIATE.

32. If asking price is greater than Maximum Buy Price, the decision must be PASS.

33. Condition influences market estimate, Negotiation Ladder, Card Intelligence, and purchase evaluation, but never identity resolution.

34. Signal and indicator versions protect future intelligence changes from breaking the architecture.

35. Future adaptive systems should learn vocabulary and behavior without changing core parser logic.

36. Vendor Workspace progression must be controlled by a deterministic workflow state machine, not scattered component booleans.

37. Identity candidates, highlighted identity, and selected identity are separate states. Highlighting is navigation intent; selection is workflow commitment.

38. An identity with exactly one printing should activate the Single Printing Rule and continue toward evaluation automatically.

39. Every successful Vendor Workspace identity selection must reach either `ReadyForEvaluation` or `Error`.

40. Vendor Workflow events describe user or system actions. UI components must not dispatch events that directly mirror internal states.

41. Decision Resolver must consume a validated Offer Ladder. It must not execute when Maximum Buy Price is unavailable.

42. Zero is not unknown. Missing evaluation data must become `UNAVAILABLE`, `INVALID`, or `WAITING_FOR_DATA`, not `0`.

43. Evaluation Trace is the source of debugging truth for profit, strategy, offer ladder, validation, and decision reasoning.

44. Workflow Command Processor owns workflow context. UI components dispatch commands and render workflow context.

45. Context invalidation belongs in `ContextInvalidationEngine`, not in React components.

46. Rejected workflow commands must leave workflow-owned context unchanged.

47. Commands describe user or system intent. The workflow engine, not the UI, decides state transitions and invalidation.

48. Single Printing Rule execution belongs in command processing so selected one-printing identities cannot leave stale or half-selected UI context.

49. Asset Context is the source of truth for evaluation ownership. Every visible identity, printing, variant, market snapshot, card profile, offer ladder, and decision must belong to the same context generation.

50. Production Vendor Workspace must not expose workflow states, command logs, context ids, timing, or developer diagnostics.

51. Atlas Inspector owns developer diagnostics and must be gated behind development mode.

52. Stale downstream objects must be rejected or hidden instead of rendered with the current selection.

53. Market Providers have precedence for pricing. If provider data exists, future Condition Intelligence must not override it.

54. Condition changes are upstream Asset Context changes. They must create a new generation and request a fresh market snapshot before evaluation is treated as current.

55. Future condition inference may fill provider gaps only. It must be traceable and clearly marked as fallback data.

56. Evaluation history is immutable. Snapshots are append-only and must never be edited or overwritten.

57. Only completed evaluations create Evaluation Snapshots. Context changes are history events, not snapshots.

58. Business engines do not write history. History records engine output after evaluation completes.

59. Future simulation, replay, and analytics systems consume Evaluation Snapshots instead of recalculating old recommendations in place.

60. Playability Intelligence measures play demand only. It must never decide BUY, NEGOTIATE, PASS, opening offers, target offers, or maximum buy prices.

61. Playability providers plug into `PlayabilityProvider` and `PlayabilityRegistry`; strategies consume normalized Playability outputs through configurable weights.

62. Scryfall legalities are the first Playability provider source. EDHREC, MTGGoldfish, Melee, MTGO, and Top8 are future providers, not scraped data sources.

63. Intelligence Console is the permanent UI layer for Asset Intelligence models. Individual models must not create bespoke presentation layouts.

64. Intelligence grades are presentation-only mappings from internal numeric scores. Numeric scores remain available to engines and history.

65. Confidence must remain separate from grade because score quality and data reliability are different concepts.

66. Business Profiles answer what a card is worth to a specific business. Market Intelligence answers what the card is worth in the market.

67. Business Profiles must not query providers. They supply costs, targets, and assumptions to evaluation engines.

68. Offer Ladder consumes Business Profile assumptions before Decision Resolver executes. Decision Resolver remains deterministic.

69. Generic fixed marketplace fee and shipping assumptions should not drive purchase recommendations when a Business Profile is available.

70. System Readiness owns prerequisite validation. Business engines assume READY input and should not each validate configuration independently.

71. Readiness failures must be classified as configuration problems, missing data, business rule failures, calculation failures, or internal errors.

72. Production users should see meaningful readiness blockers, while Atlas Developer Mode owns readiness dependency diagnostics.

73. Negative negotiation margin is valid decision context, not an implementation failure.

74. Business Profiles own Offer Policy. Offer Ladder consumes extracted policy rather than reading scattered business thresholds.

75. Pipeline Inspector owns first-invalid-stage diagnostics for evaluation. Downstream engines must not continue with silent substitutions after an invalid upstream stage.

76. Zero-valued Opening Offer, Target Offer, Maximum Buy Price, or Recommended Offer is invalid unless a future feature explicitly declares zero as intended.

77. Atlas Developer Mode may display Pipeline Trace. Production users must not see pipeline, trace, undefined, fallback, or zero-default terminology.

## Documentation Rule

Every sprint must update:

1. `CHANGELOG.md`
2. `docs/SPRINT_HISTORY.md`
3. `docs/AGENT_HANDOFF.md` if current state or next steps changed
4. `docs/ARCHITECTURE.md` if architecture changed
5. `docs/ROADMAP.md` if priorities changed
6. `docs/DECISIONS.md` if a major product or architecture decision was made

No sprint is complete until documentation is updated.
