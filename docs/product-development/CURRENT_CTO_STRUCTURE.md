# Current Phronesis CTO Structure

## Active Authorized Revision — PHR-TECH-007 + PHR-API-002

- Assignment: `PHR-LOCAL-ARTWORK-20260729`
- Document ID: `PHR-STRUCT-20260729-006`
- Status: `CANONICAL ADOPTION AUTHORIZED`
- Priority: Critical event reliability
- Objective: connect strictly matched official Bandai One Piece artwork and retain authorized provider images in an ignored durable local cache
- Authorization provenance: Product Owner attested on 2026-07-29 that Bandai authorization is given; this is recorded as user-supplied authority, not independently verified
- Specification: `docs/technical/PHR-TECH-007-durable-local-artwork-cache.md` and revised `docs/api/PHR-API-002-cross-game-catalogue-artwork-providers.md`
- Work order: `docs/prompts/PHR-TECH-007-durable-local-artwork-cache-prompt.md`
- Authorized: repository code/documentation edits, official Bandai card-list/image reads, ignored local artwork files, tests/builds, private review, and bounded remediation
- Prohibited: bulk provider catalogue download, Riftbound unofficial assets, upstream pricing mutation, credentials, account changes, commit, push, public deployment, or publication

### Operational Result

- Official Bandai English card-list search is operational for One Piece identity and catalogue artwork.
- Strict set, card-number, normalized-name, and explicit variant evidence select base, parallel/reprint, or SP assets; ambiguous qualifiers retain placeholders.
- Approved provider images are served through a same-origin, fail-closed cache under ignored `.data/artwork/` storage with source and authorization metadata.
- The 12 unique official artworks mapped by the active `luffy` catalogue search were explicitly prewarmed for event reliability.
- Desktop and 390px phone review passed without horizontal overflow; One Piece artwork rendered in results and selected snapshot evidence.

### Evidence

- Validation: `docs/testing/PHR-TECH-007-durable-local-artwork-cache-validation.md` and revised `docs/testing/PHR-API-002-cross-game-catalogue-artwork-providers-validation.md`.
- Engineer report: `docs/implementation-reports/PHR-TECH-007-durable-local-artwork-cache-report.md`.
- Conformance: `docs/reviews/PHR-TECH-007-durable-local-artwork-cache-conformance-review.md`.

### Acceptance And Deployment Gate

The Product Owner accepted the Product Review package on 2026-07-29 with the instruction to deploy and continue development. Canonical Git publication and private-service verification are authorized. Riftbound still requires Riot approval and an app-specific key.

## Active Cross-Game Buying Revision — PHR-API-002 + PHR-UX-008

- Assignment: `PHR-CROSS-GAME-BUYING-20260729`
- Document ID: `PHR-STRUCT-20260729-005`
- Status: `PRODUCT REVIEW READY`
- Priority: Critical event workflow
- Accountable flow: CTO intent complete; Chief Architect specification complete; Engineer implementation authorized autonomously
- Objective: remove manual catalogue switching, group finish duplicates by artwork identity, expose exact finish then condition, connect immediately authorized Pokémon/Lorcana artwork, and prepare Lorcana/Riftbound catalogue receipts
- Specifications: `docs/api/PHR-API-002-cross-game-catalogue-artwork-providers.md` and `docs/ux/PHR-UX-008-unified-artwork-first-catalogue-search.md`
- Work orders: `docs/prompts/PHR-API-002-cross-game-catalogue-artwork-providers-prompt.md` and `docs/prompts/PHR-UX-008-unified-artwork-first-catalogue-search-prompt.md`

### Authorization

Repository code/documentation edits, read-only upstream configuration inspection, local review data, immediately keyless provider reads, optional server-side use of already-owned credentials, tests/builds, private desktop/phone review, and bounded remediation are authorized.

External account creation, paid-plan acceptance, credential generation, Riot application submission, unofficial Riftbound assets, upstream Pricing Update Tool mutation, schedule change, extra pricing run, public deployment, commit, push, and publication are prohibited.

### Provider Boundary

- Operational now: Magic/Scryfall, Pokémon/TCGdex v2, Lorcana/Lorcast, and One Piece/Bandai official.
- Superseded by the authorized revision above: One Piece/Bandai official is operational; Scrydex is fallback-only.
- Pending Riot approval and app-specific key: Riftbound/Riot API.

### Intelligence Roadmap Finding

Phronesis Intelligence, Asset Assessment, Strategy, Offer Ladder, and Decision Resolver already execute inside `evaluatePurchase`. The current Snapshot Vendor Workspace exposes decision outputs and drivers but not the established layered Intelligence Console. A separate visible-dashboard refinement should reuse `evaluation.cardProfile.intelligenceModels` and `assetAssessment`; it must not create another intelligence engine or enter this artwork/search work order implicitly.

### Operational Result

- One search now spans all five registered catalogue categories and visibly identifies each result's game.
- Finish-only duplicates collapse to one artwork result; exact Finish is selected before Condition and preserves exact-SKU price evidence.
- Pokémon/TCGdex, Magic/Scryfall, Lorcana/Lorcast, and One Piece/Bandai official artwork paths are operational. Riftbound remains an explicit authorization gate.
- Lorcana and Riftbound sources are registered for the persistent observer and will import only after the Pricing Update Tool produces verified completed receipts.
- Desktop 1440px and mobile 390px browser checks passed with no horizontal overflow, ten loaded Pokémon images, zero failed image elements, and a two-option finish selector.

### Evidence

- Validation: `docs/testing/PHR-API-002-cross-game-catalogue-artwork-providers-validation.md` and `docs/testing/PHR-UX-008-unified-artwork-first-catalogue-search-validation.md`.
- Engineer report: `docs/implementation-reports/PHR-CROSS-GAME-BUYING-20260729-report.md`.
- Conformance: `docs/reviews/PHR-CROSS-GAME-BUYING-20260729-conformance-review.md`.

### Next Gate

Same-session Engineer, Designer, and Chief Architect gates are complete. Product Owner visible acceptance remains required before canonical adoption, commit, push, deployment, or publication. The authorized revision above activates One Piece through the official Bandai source; Riftbound separately requires Riot approval and an app-specific key.

## Active Event Readiness Revision — PHR-TECH-006 + PHR-UI-002

- Assignment: `PHR-EVENT-READINESS-20260729`
- Document ID: `PHR-STRUCT-20260729-004`
- Status: `PRODUCT REVIEW READY`
- Delivery lane: Controlled urgent revision
- Objective: activate current July 29 catalogue data, preserve future verified receipts through the August 1 event, and add non-blocking catalogue thumbnails
- Technical specification: `docs/technical/PHR-TECH-006-event-snapshot-activation.md`
- UI specification: `docs/ui/PHR-UI-002-snapshot-catalogue-thumbnails.md`
- Work orders: `docs/prompts/PHR-TECH-006-event-snapshot-activation-prompt.md` and `docs/prompts/PHR-UI-002-snapshot-catalogue-thumbnails-prompt.md`
- Authorization: read-only recovery from local Pricing Update Tool data, ignored local archive/review-data writes, repository code/documentation edits, provider-backed artwork reads, tests/builds, visual verification, and bounded remediation
- Prohibited: Pricing Update Tool modification, schedule change, credentials, extra marketplace pricing run, inventory mutation, price publication, destructive cleanup, public deployment, commit, push, or publication

### Current Operational Result

- July 29 18:20 data is active for Magic, Pokémon, and One Piece in `.data/mobile-review.sqlite`.
- Raw and normalized recovery archives are preserved under `.data/pricing-catalogues/20260729_182153/`.
- The persistent read-only observer remains active for the next scheduled receipt.
- At the `PHR-UI-002` gate, Magic artwork was the only operational catalogue enrichment. Later `PHR-API-002` revisions activate Pokémon/TCGdex, Lorcana/Lorcast, and official One Piece/Bandai artwork; `PHR-TECH-007` retains approved images locally.

### Next Gate

Engineer implementation, Designer review, and same-session Chief Architect conformance are complete. The Product Owner can now inspect the July 29 data and thumbnails through the existing desktop or private phone review surface. Canonical adoption, commit, push, deployment, and public release remain pending Product Review acceptance. PHR-WORKFLOW-004 and PHR-TECH-005 remain uncommitted Product Review candidates and are not superseded.

## Active Hot Fix — PHR-TECH-005

- Assignment: `PHR-TECH-005-20260729`
- Document ID: `PHR-STRUCT-20260729-003`
- Status: `PRODUCT REVIEW READY`
- Delivery lane: Controlled, three reversible slices
- Objective: private phone access to the current Product Review build through existing Tailscale
- Specification: `docs/technical/PHR-TECH-005-private-mobile-review-access.md`
- Work order: `docs/prompts/PHR-TECH-005-private-mobile-review-access-prompt.md`
- Authorization: repository edits, isolated review data, per-user LaunchAgent, and one dedicated private Tailscale Serve handler on port 9443
- Prohibited: Funnel, public deployment, anonymous access, modification of existing Serve handlers, live-data activation, commit, push, or publication

### Operational Result

- Private URL: `https://ramons-macbook-pro.tailaa2d39.ts.net:9443/vendor`
- Validation: `docs/testing/PHR-TECH-005-private-mobile-review-access-validation.md`
- Conformance/report: `docs/implementation-reports/PHR-TECH-005-private-mobile-review-access-report.md`
- Service is operational; canonical adoption remains coupled to the outstanding PHR-WORKFLOW-004 Product Review acceptance.

PHR-WORKFLOW-004 remains Product Review Ready and is not superseded by this operational hot fix.

## Active Assignment — PHR-WORKFLOW-004

- Project: Phronesis
- Canonical repository root: `/Volumes/JarvisSSD/Projects/Phronesis`
- Assignment ID: `PHR-WORKFLOW-004-20260729`
- Feature ID: `PHR-WORKFLOW-004`
- Governing workflow: shared master workflow via `.agents/WORKFLOW.md`
- Document ID: `PHR-STRUCT-20260729-002`
- Status: `PRODUCT REVIEW READY`
- Delivery lane: Standard
- Plan fingerprint: `PHR-WORKFLOW-004-standard-v1`
- Accountable role: Product Owner for visible acceptance; Engineer, Designer, and Chief Architect gates are complete

### Approved Outcome

Build a desktop-first Snapshot-Powered Vendor Workspace that follows verified Pricing Update Tool catalogue completions, preserves last-good local data, and combines exact catalogue evidence with the existing Business Profile, offer ladder, and BUY / NEGOTIATE / PASS engines. Mobile is a responsive backup using the same system.

### Authoritative Artifacts

- Specification: `docs/workflows/PHR-WORKFLOW-004-snapshot-powered-vendor-workspace.md`
- Designer Direction: `docs/design/PHR-WORKFLOW-004-snapshot-powered-vendor-workspace.md`
- Engineer work order: `docs/prompts/PHR-WORKFLOW-004-implementation-prompt.md`

### Authorization

The four ordered implementation slices, local code/documentation edits, proportional tests/builds, bounded remediation, Designer review, and Chief Architect conformance are authorized autonomously. Read-only use of the adjacent Pricing Update Tool as integration evidence is authorized. Modification of that project, credentials, external mutation, deployment, public release, destructive operations, force push, and history rewriting are not authorized.

### Completed Evidence

- Engineer report: `docs/implementation-reports/PHR-WORKFLOW-004-engineer-report.md`
- Validation: `docs/testing/PHR-WORKFLOW-004-snapshot-powered-vendor-workspace-validation.md`
- Conformance: `docs/reviews/PHR-WORKFLOW-004-conformance-review.md`
- Runbook: `docs/technical/PHR-WORKFLOW-004-pricing-observer-runbook.md`
- Release note: `docs/release-notes/PHR-WORKFLOW-004.md`

### Next Gate

The Product Owner inspects the visible Product Review package and explicitly accepts, rejects, or requests bounded revision. Canonical adoption, commit, push, deployment, and live-data activation remain pending.

---

## Identity

- Project: Phronesis
- Canonical repository root: `/Volumes/JarvisSSD/Projects/Phronesis`
- Rollback checkout: `/Users/ramonnogueira/Developer/Phronesis`
- Assignment ID: `019fa79e-34a1-75e9-9516-99399a01cbcf`
- Feature ID: `PHR-UX-007`
- Governing workflow: shared `MASTER-CANONICAL-WORKFLOW` revision 2.8.0 via `.agents/WORKFLOW.md`
- Document ID: `PHR-STRUCT-20260729-001`
- Status: `CANONICAL ADOPTION COMPLETE`

This repository-owned file is the only canonical Structure authority for Phronesis role commands.

## Accepted Outcome — Mobile Pricing Lookup

The approved Mobile Pricing Lookup gives Ramon a phone-first, one-lookup delivered-price reference for English Pokémon singles and sealed products, including condition-aware results, movement history, freshness, shipping treatment, and explicit uncertainty.

The exact Product Review-approved implementation from assignment `019fa79e-34a1-75e9-9516-99399a01cbcf` has been reconciled onto the maintained JarvisSSD repository without replaying product planning, architecture, engineering, visual verification, or Product Review. The product implementation is unchanged from the reviewed patch; only the three concurrently advanced documentation ledgers were merged with the later repository-reconciliation record.

Canonical implementation commit: `8de8670e67c5df2a8dd1c8da93d218610ac40210`.

## Canonical Artifacts

- Specification: `docs/ux/PHR-UX-007-mobile-pricing-lookup.md`
- Designer direction: `docs/design/PHR-UX-007-mobile-pricing-lookup.md`
- Implementation prompt: `docs/prompts/PHR-UX-007-implementation-prompt.md`
- Engineer report: `docs/implementation-reports/PHR-UX-007-engineer-report.md`
- Debugger recovery record: `docs/implementation-reports/PHR-UX-007-debugger-recovery.md`
- Validation record: `docs/testing/PHR-UX-007-mobile-pricing-lookup-validation.md`
- Release note: `docs/release-notes/PHR-UX-007.md`

## Preserved Boundaries

- Production import certification still requires a representative sanitized Pricing Tool export and its authoritative schema/version; columns are not guessed.
- Deployment, credentials, purchases, external mutation, destructive operations, rollback deletion, force push, and history rewriting remain outside this adoption.
- Known repository baseline debt remains visible and is not represented as a PHR-UX-007 regression.

## Next Gate

The adopted result may proceed to a separately authorized testable release or deployment. New product scope requires a new approved objective; it must not be folded into this completed assignment.

## Revision History

- 2026-07-29: `PHR-STRUCT-20260729-001` reconciled and adopted the Product Review-approved `PHR-UX-007` implementation into the canonical JarvisSSD repository while preserving later repository-governance history.
- 2026-07-28: `PHR-STRUCT-20260728-001` reconciled the canonical repository and GitHub checkpoint under `PHR-TECH-004`.
