# Current Phronesis CTO Structure

## Active Assignment — Identity-Backed Price Monitoring

- Assignment: `PHR-PRICE-MONITORING-20260730`
- Document ID: `PHR-STRUCT-20260730-004`
- Status: `IN PROGRESS — S1 ACCEPTED; S2 IMPLEMENTED/ACTIVATION GATED; S3 ACTIVE`
- Priority: Critical baseline stabilization followed by high-priority product delivery
- Delivery lane: Standard, five ordered implementation slices
- Workflow authority: shared master file at its currently declared revision `2.1.0`; project-pointer revision mismatch is recorded as non-blocking governance debt
- Approved features: `PHR-TECH-009`, `PHR-ARCH-011`, `PHR-WORKFLOW-005`, `PHR-API-003`

### Approved Product Outcome

Restore a fully green deterministic repository baseline, introduce invite-only application identity and module assignments, and deliver persistent low-friction card-price monitoring refreshed by verified catalogue snapshots with legitimate estimate, listing, and observed-sale evidence kept distinct.

### Implementation Slice Plan

1. `S1 — PHR-TECH-009`: resolve 29 standalone TypeScript diagnostics and all 17 established behavioral failures; establish the green gate.
2. `S2 — PHR-ARCH-011`: add invite-only identity, sessions, workspace membership, roles, module entitlements, auditability, and server enforcement.
3. `S3 — PHR-WORKFLOW-005`: move watchlists to user-owned server persistence and add one-action tracking with defaults, idempotency, and undo.
4. `S4 — PHR-WORKFLOW-005`: refresh tracked variants from verified four-daily Pricing Update Tool checkpoints and add in-app freshness/alert state.
5. `S5 — PHR-API-003`: add bounded JustTCG enrichment, disabled-by-default official listing adapters, and first-party observed-sale evidence without scraping.

### Accepted Slice Evidence

- `S1 — PHR-TECH-009`: **ACCEPTED** on 2026-07-30. All 204 tests pass; standalone TypeScript, lint without warnings, production build, and diff checks pass. Validation, Engineer report, release notes, and same-session Chief Architect conformance are recorded under the feature ID.
- `S2 — PHR-ARCH-011`: **IMPLEMENTED; ACTIVATION GATED**. Better Auth 1.6.25, local identity schema, invite-only provisioning, roles, entitlements, audit, protected page/API boundaries, administration UI, migration/bootstrap scripts, and reversible rollout pass 210/210 tests, type, lint, build, diff, and responsive review. Required mode remains withheld pending Product Owner-authorized GitHub OAuth credentials/owner email, live callback verification, and supported resolution or explicit risk acceptance for three remaining Next transitive production advisories.
- `S3 — PHR-WORKFLOW-005`: **ACTIVE**. Persistence must preserve existing local watch data through a deterministic legacy-owner migration boundary while authentication remains disabled.

### Authorization And Boundaries

Repository documentation/code changes, database migrations with rollback, dependency installation required by the approved identity design, deterministic tests, builds, private desktop/mobile review, ordinary isolated checkpointing, same-session role handoffs, bounded remediation, and GitHub continuity after explicit Product Review are authorized autonomously.

External account creation, credential generation or disclosure, paid-plan activation, public deployment, marketplace transactions, destructive data migration, force push, history rewriting, scraping, TCGplayer/Cardmarket unauthorized acquisition, and Riftbound work are prohibited without a Critical Escalation decision.

### Product Review Gate

The assignment reaches Product Review only after all completed slices have focused evidence, final integration checks pass, the exact review commit is identified, and the visible package distinguishes implemented capabilities from provider features still disabled by missing credentials. Canonical adoption and GitHub continuity follow explicit Product Owner approval under the master workflow.

## Active Remediation — PHR-TECH-007-R1

- Assignment: `PHR-ARTWORK-RELIABILITY-20260730`
- Document ID: `PHR-STRUCT-20260730-003`
- Status: `CANONICAL ADOPTION COMPLETE`
- Priority: Critical event readiness
- Objective: restore resolved Magic thumbnails through the durable local cache and make Lorcana provider searches compatible with TCGplayer title punctuation without weakening strict printing matching
- Specification: `docs/technical/PHR-TECH-007-durable-local-artwork-cache.md`
- Engineer work order: `docs/prompts/PHR-TECH-007-durable-local-artwork-cache-prompt.md`

### Authorization And Boundaries

This is a bounded remediation of the already-approved thumbnail objective. Repository code/documentation edits, focused and proportional verification, local/private browser review, provider read-only diagnostics, cache prewarm for specifically verified results, ordinary checkpointing, and private-service restart are authorized autonomously. Pricing data, buying logic, inventory, credentials, external accounts, provider-wide bulk downloads, Riftbound, public deployment, force push, history rewriting, and destructive cache cleanup are prohibited.

### Acceptance

- Scryfall image requests identify Phronesis and a resolved Mox Opal image returns through `/api/pricing/image` with HTTP 200 and local metadata.
- Lorcana partial title input resolves the exact first catalogue name into a Lorcast-compatible query while strict set/collector matching remains authoritative.
- Unmatched foreign-language, sealed, ambiguous, or unsupported catalogue records remain honest placeholders.
- Focused tests, lint, build/type check, diff checks, and representative desktop/mobile runtime verification pass without a pricing or decision regression.

### Verified And Accepted Result

- The exact Mox Opal cache request changed from HTTP 502 to HTTP 200 with a valid locally retained JPEG after Phronesis began sending a provider-compatible User-Agent.
- `Mulan - res` now resolves three catalogue SKUs across two Winterspell artworks through a Lorcast-compatible query; attachment remains strict by set and collector number.
- Twelve representative small/normal Mox Opal and Mulan assets were prewarmed and returned HTTP 200.
- Focused 11/11, lint, application build/type check, diff, desktop, and 390px mobile checks pass. The supported full suite is 187 passes / 17 unchanged baseline failures; standalone TypeScript retains only 29 known `TS5097` test-import errors.
- Same-session Chief Architect conformance is recorded in `docs/reviews/PHR-TECH-007-durable-local-artwork-cache-conformance-review.md`. CTO accepts the bounded patch for canonical adoption.

### Canonical Adoption

- GitHub PR `#4` merged normally into `main` at `cd7363f7c0f7fc14c10558cc9569e976f2cc8663`.
- The canonical checkout and `origin/main` match the merge commit before this adoption-record update.

## Active Assignment — PHR-UX-009

- Assignment: `PHR-INTELLIGENCE-PANEL-20260730`
- Document ID: `PHR-STRUCT-20260730-002`
- Status: `CANONICAL ADOPTION COMPLETE`
- Priority: High, approved roadmap continuation
- Delivery lane: Standard, two ordered implementation slices
- Plan fingerprint: `PHR-UX-009-standard-v1`
- Objective: expose the established Phronesis Intelligence explanation inside the Snapshot Vendor Workspace without creating a parallel engine
- Specification: `docs/ux/PHR-UX-009-visible-buying-intelligence-panel.md`
- Designer direction: `docs/design/PHR-UX-009-visible-buying-intelligence-panel.md`
- Engineer work order: `docs/prompts/PHR-UX-009-visible-buying-intelligence-panel-prompt.md`

### Authorized Slices

1. `PHR-UX-009-S1`: visible assessment summary derived from the canonical ready evaluation, with focused unit and integration coverage.
2. `PHR-UX-009-S2`: progressive reuse of the existing Intelligence Console plus desktop/mobile Designer and integration conformance.

### Authorization And Boundaries

Repository code/documentation edits, focused and proportional verification, local/private browser review, bounded remediation, ordinary isolated-branch checkpointing, GitHub continuity after Product Review, and restart of the existing private Phronesis review service after canonical adoption are authorized autonomously.

Riftbound, provider/account work, new credentials, new dependencies, pricing or inventory mutation, new intelligence formulas, Business Profile/Strategy/Offer Ladder/Decision Resolver changes, public deployment, destructive Git operations, force push, and history rewriting are prohibited.

### Acceptance And Continuation

The assignment reaches Product Review when a ready Snapshot evaluation visibly explains the current action using the existing Asset Assessment and Intelligence Models, progressive disclosure is accessible, unchanged inputs preserve unchanged decisions, and desktop/mobile evidence passes without new regressions. After canonical adoption, continue through the next already-approved roadmap item that has sufficient product intent; otherwise return a concise priority recommendation.

### Verified And Accepted Result

- The existing Asset Assessment and Decision Resolver action are visible in a compact explanation panel; detailed models reuse `IntelligenceConsole` through progressive disclosure.
- Focused 6/6, lint, application build/type check, diff, desktop, and 390px mobile checks pass.
- The full suite is 186 passes / 17 unchanged baseline failures; standalone TypeScript retains only 29 known `TS5097` test-import errors.
- Same-session Designer and Chief Architect verdicts conform. CTO accepts the exact patch for guarded canonical adoption.
- GitHub PR `#4` merged the accepted implementation normally into `main` at `cd7363f7c0f7fc14c10558cc9569e976f2cc8663`.

## Active Assignment — PHR-TECH-008

- Assignment: `PHR-POKEMON-LORCANA-20260730`
- Document ID: `PHR-STRUCT-20260730-001`
- Status: `CANONICAL ADOPTION COMPLETE`
- Priority: Critical event readiness
- Delivery lane: Standard, two ordered implementation slices
- Objective: improve strict Pokémon artwork coverage and activate a current Lorcana catalogue with locally retained artwork
- Specification: `docs/technical/PHR-TECH-008-pokemon-lorcana-event-readiness.md`
- Engineer work order: `docs/prompts/PHR-TECH-008-pokemon-lorcana-event-readiness-prompt.md`

### Authorized Slices

1. `PHR-TECH-008-S1`: explicit Pokémon set-alias reconciliation, tests, and before/after runtime evidence.
2. `PHR-TECH-008-S2`: catalogue-only Lorcana acquisition through the existing authorized local session, archive/hash verification, transactional local import, Lorcast resolution, cache prewarm, and desktop/mobile verification.

### Authorization And Boundaries

Repository code/documentation edits, focused and full verification, build, private review, a read-only Lorcana catalogue export, ignored local archive/database/cache writes, ordinary Git checkpointing, GitHub continuity, and restart of the existing private Phronesis review service are authorized autonomously.

Riftbound, Pricing Update Tool code/repository edits, store visibility changes, inventory or price mutation, pricing/review/publication phases, schedule changes, new credentials, account changes, destructive cleanup, public deployment, force push, and history rewriting are prohibited.

### Acceptance And Continuation

The assignment is accepted when Pokémon artwork improves without false-positive matching and Lorcana has searchable snapshot prices plus at least one strict locally retained thumbnail. After conformance and canonical continuity, continue to the approved visible Phronesis Intelligence dashboard roadmap item under a new documentation-first Structure.

### Verified Result

- Pokémon `pikachu` strict artwork coverage improved from 12/40 to 25/40; 24 unique mapped images were prewarmed locally.
- Lorcana catalogue-only receipt `35cc2651ad5b88d6db9d32732652f6fe9dd03b1cf4220af728e4a1aec9cc2814` imported 30,531 rows and 6,243 products at checkpoint `2026-07-30T04:34:16.000Z`.
- Lorcast AVIF images now pass strict durable-cache validation; 17 unique Mickey Mouse result artworks were retained locally.
- Focused 18/18, lint, build, diff, desktop, and mobile checks pass. The supported full suite remains at the exact 183-pass/17-failure baseline and standalone TypeScript retains only 29 known `TS5097` test-import errors.
- Same-session Chief Architect conformance: `docs/reviews/PHR-TECH-008-pokemon-lorcana-event-readiness-conformance-review.md`.

### Canonical Adoption And Private Activation

- Candidate commit: `ee29bab79eaef3588ede08546ede4f6016e23195`.
- Private GitHub PR: `#3`, merged normally into `main`.
- Canonical merge commit: `a7891cf574aaf05fb4da8ddf7559448c9c1619de`.
- The canonical checkout and `origin/main` match the merge commit.
- The existing private review service was restarted and returned HTTP 200 through its loopback health check with the tailnet-only mapping intact.
- Deployed runtime verification: Pokémon `pikachu` resolves 25 strict mappings; Lorcana `mickey mouse` resolves 30; Lorcana sync status is `CURRENT` at `2026-07-30T04:34:16.000Z`.

## Active Authorized Revision — PHR-TECH-007 + PHR-API-002

- Assignment: `PHR-LOCAL-ARTWORK-20260729`
- Document ID: `PHR-STRUCT-20260729-006`
- Status: `CANONICAL ADOPTION COMPLETE`
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

The Product Owner accepted the Product Review package on 2026-07-29 with the instruction to deploy and continue development. GitHub PR `#1` merged the accepted implementation into `main` at commit `8ed1b98da2879f44976b008e6991588d78f4f49e`. The canonical checkout equals `origin/main`, and the existing private desktop/phone service passed an HTTP 200 health check after merge. Riftbound still requires Riot approval and an app-specific key.

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
