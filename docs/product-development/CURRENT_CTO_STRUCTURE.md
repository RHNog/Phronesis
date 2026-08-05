# Current Phronesis CTO Structure

## Active Revision — Local Card Acquisition And Recognition

- Assignment: `PHR-LOCAL-CARD-RECOGNITION-20260804`
- Document ID: `PHR-STRUCT-20260804-003`
- Features: `PHR-ARCH-015`, `PHR-TECH-013`, `PHR-TECH-014`, `PHR-TECH-015`, `PHR-WORKFLOW-016`, `PHR-API-015`, `PHR-UX-026`
- Status: `S2-S6 AND CALIBRATION TOOLING IMPLEMENTED — PRODUCT REVIEW READY; REAL CORPUS, RELEASE, AND CONSUMER ADOPTION GATED`
- Objective: turn physical card observations into evidence-backed canonical Phronesis assets, beginning with a safe macOS fi-8170 capability probe and progressing through local recognition, Vendor offers, and marketplace-neutral exports.
- Delivery lane: Controlled, seven ordered slices including contingency S1W, plan fingerprint `6e3ad12423e6abd178d7a722958e416b204885b859b7cf1ce5f5f9a217861f2d`.
- First-release rule: English Magic, one card per frame; condition is operator-confirmed and price-material finish uncertainty forces review.
- Architecture rule: Phronesis owns workflow and canonical identity; a signed native agent owns scanner control; an isolated local worker owns recognition; immutable evidence remains content-addressed.
- Safety rule: no physical scan without a connected fi-8170, explicit scan flag, owner-supplied low-value cards, and operator supervision.
- Publication rule: recognition never publishes. TCGPLAYER Tools and Liga adapters consume `PHR-API-015` only through separate draft/import gates.
- Current work orders: `docs/prompts/PHR-TECH-014-local-recognition-corpus-engine-prompt.md`, `docs/prompts/PHR-WORKFLOW-016-scanner-to-offer-vendor-buying-prompt.md`, `docs/prompts/PHR-API-015-recognized-asset-interchange-prompt.md`, and `docs/prompts/PHR-UX-026-multi-card-binder-capture-prompt.md`.
- Current accountable role: Product Owner reviews the visible workflow and calibration contract. A separately licensed, explicitly approved, and labeled English Magic corpus/holdout is still required before auto-accept; consumer projects adopt the v1 envelope through their own workflows.
- Current checkpoint: the batch watcher re-imported the exact 18-frame Windows bundle idempotently, local Vision analyzed all 18 frames, and the English-Magic-only policy safely abstained on all 18 Pokémon observations after a game-classification false-positive was found and corrected. Deterministic corpus construction, recognition-use approval evidence, immutable split enforcement, and sealed multi-metric benchmark tooling now pass synthetic validation. Durable objects, job recovery, region revisions, operator resolution, exact-condition price binding, offer drafts, immutable interchange, TCGplayer/Liga draft adapters, desktop/phone UI, 409 repository tests, 2 Swift tests, TypeScript, zero-warning lint, and production build pass. No live runtime, purchase, inventory, marketplace, deployment, external repository, real corpus, auto-accept policy, or publication state changed.

## Active Revision — Arbitrage And Regional Acquisition Recovery

- Assignment: `PHR-ARBITRAGE-ACQUISITION-RECOVERY-20260803`
- Document ID: `PHR-STRUCT-20260803-007`
- Features: `PHR-TECH-012`, `PHR-API-013`
- Status: `IMPLEMENTED AND LIVE — PRODUCT REVIEW READY; LOTE 4 SOURCE COUNT GATED`
- Objective: restore the verified regional candidate queue, make TCG catalogue-to-crosswalk continuity automatic, schedule daily LigaMagic acquisition, and add LigaPokemon through a separate owner-authenticated fail-closed connector.
- Root cause: the recovered private runtime started raw Next.js without the LaunchAgent database override and opened `.data/pricing-lookup.sqlite`; the verified 131,869-match crosswalk and 129,809 candidate rows remain in `.data/mobile-review.sqlite`.
- Catalogue state: all five TCG catalogue checkpoints are healthy but last completed on 2026-08-01. The sibling Pricing Update Tool scheduler is not currently running and its last recorded automated run failed at an upstream disabled `Continue` control. Phronesis owns observation/import continuity, not mutation of that sibling acquisition tool.
- Delivery lane: Standard — Slice 1 restores the single operational database and reconciliation hook; Slice 2 adds recurring LigaMagic plus pilot-gated LigaPokemon acquisition.
- Security boundary: no credentials, cookies, request bodies, query values, CAPTCHA/rate-limit bypass, anonymous marketplace scraping, transactions, public deployment, or invented provider schema.
- Acceptance result: the live API returns 50 ranked identity-verified rows, the observer and app share the canonical database, and the 03:00 LaunchAgent is loaded. LigaPokemon authentication and its exact 20-column pilot passed at 9,772/9,772. Product Owner authority now admits only Lote 10's exact 9,700 export with its 9,704 source claim retained. A subsequent full run passed Lote 10 and failed closed on Lote 4's repeatable 9,870-advertised versus 9,868-exported discrepancy.
- Work orders: `docs/prompts/PHR-TECH-012-arbitrage-data-plane-continuity-prompt.md` and `docs/prompts/PHR-API-013-recurring-liga-network-acquisition-prompt.md`.
- Next accountable role: Product Owner reauthenticates LigaMagic and explicitly adjudicates the separate two-card LigaPokemon Lote 4 source discrepancy; the external TCG acquisition owner restores its stale scheduler.

## Active Revision — Timed Worker Issued-Code Continuity

- Assignment: `PHR-TIMED-CODE-CONTINUITY-20260803`
- Document ID: `PHR-STRUCT-20260803-006`
- Feature: `PHR-ARCH-014`
- Status: `IMPLEMENTED AND LIVE — PRODUCT REVIEW READY`
- Objective: preserve access to the latest unused worker code across owner page navigation without making plaintext credentials recoverable from the server.
- Continuity rule: retain only the latest unused code in the authenticated owner tab's ephemeral session storage and restore it only after owner-authorized server reconciliation.
- Recovery rule: active rows without a retained code may rotate it through a two-step confirmation; the previous code becomes invalid immediately and scope, expiry, event, and entitlements remain unchanged.
- History rule: active and redeemed rows always expose the stable public login link.
- Security rule: no durable browser storage, server plaintext, secret logging, post-redemption rotation, or unauthenticated restore.
- Work order: `docs/prompts/PHR-ARCH-014-timed-event-worker-access-prompt.md`.
- Result: same-tab navigation restores the latest unused code after server reconciliation; every active/redeemed row keeps the public link; active rows without a retained code offer confirmed rotation that invalidates the prior code.
- Verification: focused 16/16, full 386/386, TypeScript, warning-free lint, production build, diff hygiene, 390×844 no-overflow review, final loopback supervision, private/public 200 probes, and public Settings denial pass.
- Next accountable role: Product Owner phone review. Commit/push remain separately gated.

## Active Revision — Resilient Copy Controls

- Assignment: `PHR-RESILIENT-COPY-CONTROLS-20260803`
- Document ID: `PHR-STRUCT-20260803-005`
- Feature: `PHR-UX-025`
- Status: `IMPLEMENTED AND LIVE — PRODUCT REVIEW READY`
- Objective: make access-code and link copying reliable and recoverable on iPhone Safari and every supported Phronesis browser surface.
- UX rule: always confirm success; if modern and compatibility copy both fail, reveal the exact selectable value with a press-and-hold instruction.
- Architecture rule: feature panels provide values; one browser utility owns method selection and one client component owns feedback/manual recovery.
- Security rule: copied values are never logged, persisted, or transmitted by the control.
- Work order: `docs/prompts/PHR-UX-025-resilient-copy-controls-prompt.md`.
- Result: worker code, public worker link, and private activation link all use the reusable control with explicit copied feedback and press-and-hold manual recovery.
- Verification: focused 4/4, full 382/382, TypeScript, warning-free lint, production build, adoption assertion, live private/public route probes, loopback supervision, and phone-width no-overflow review pass.
- Next accountable role: Product Owner phone review. Commit/push remain separately gated.

## Active Revision — Event-Independent Timed Artwork Task Access

- Assignment: `PHR-TIMED-ARTWORK-TASK-ACCESS-20260803`
- Document ID: `PHR-STRUCT-20260803-004`
- Feature: `PHR-ARCH-014`
- Status: `IMPLEMENTED AND LIVE — PRODUCT REVIEW READY`
- Objective: generate account-free, time-limited Artwork Review-only access without opening an unrelated Event Ledger event.
- Scope rule: Artwork Review alone creates immutable `TASK` scope with no event dependency. Vendor Workspace, Event Ledger, Event Flip, or Inventory forces immutable `EVENT` scope and requires the current active event.
- Lifecycle rule: task access ends by expiry or revocation; event access additionally ends when its event closes. Existing grants remain event-bound after additive migration.
- UX rule: keep the form available without an event, default to Artwork Review-only, disable and explain transactional choices until an event exists, and label issued task/event access truthfully.
- Security rule: no task grant may receive another module or `ADMIN`; public gateway, hashing, single-use redemption, throttling, owner-only generation, and module authorization remain unchanged.
- Acceptance: no-event task issuance/redemption, immutable mixed-scope enforcement, legacy migration safety, mobile UI clarity, public/private runtime continuity, and full gates.
- Work order: `docs/prompts/PHR-ARCH-014-timed-event-worker-access-prompt.md`.
- Result: Settings now renders temporary access without an event and defaults to Artwork Review only. A no-event submission creates `TASK` scope; event-module controls remain disabled until an active event exists, and mixed entitlements are independently rejected by the repository without one.
- Migration result: the live authorization database received an additive `scope_type`; its one existing grant remains `EVENT`. No existing entitlement, expiry, status, session, or event binding changed. A pre-migration SQLite backup is retained under `/private/tmp` for recovery during this session.
- Runtime result: the rebuilt application is live on loopback 3100 and the unchanged public gateway remains on loopback 3101. Private 9443 and public worker login return 200; public Settings returns 404; uncredentialed Artwork Review redirects to worker login.
- Verification: focused 11/11, full 378/378, TypeScript, warning-free lint, production build, diff hygiene, live schema audit, new UI-copy probe, loopback bindings, detached-service supervision, and public/private route probes pass.
- Next accountable role: Product Owner phone review and generation of the first real Artwork Review-only timed task code. Commit/push remain separately gated.

## Active Revision — GitHub Handoff Continuity Repair

- Assignment: `PHR-HANDOFF-CONTINUITY-REPAIR-20260803`
- Document ID: `PHR-STRUCT-20260803-003`
- Feature: `PHR-TECH-011`
- Status: `COMPLETED — HOSTED VERIFICATION PASSED`
- Objective: replace the failing mutation-oriented GitHub workflow with dependency-backed project validation and exact committed-state continuity verification, then reconcile and seal the existing event-worker implementation.
- Failure evidence: the hosted job invoked `./handoff prepare-handoff` before installing Node dependencies, so required validators were unavailable; committed continuity also still pointed at the implementation preceding the current dirty worktree.
- Workflow rule: install with `npm ci`, run test/lint/build/diff validation separately, and run `./handoff validate-continuity --json` against the exact PR head with full Git history. GitHub must never prepare or commit Handoff state.
- Publication rule: validate and commit the current implementation first, create the generated seal with local bare `./handoff`, then push and verify both pull-request jobs.
- Exposure boundary: the CI repair did not activate infrastructure. A separate concurrent operation subsequently activated Funnel port 10000; live probes confirm its timed-session boundary and the unchanged private 9443 mapping.
- Work order: `docs/prompts/PHR-TECH-011-github-handoff-continuity-prompt.md`.
- Local result: 376/376 tests, standalone TypeScript, warning-free lint, Next.js 16.2.12 production build, launch-definition validation, secret-pattern review, and diff hygiene pass.
- First hosted result: run `30844457778` created one pull-request execution and passed `project-validation`. `continuity` reported only that exact-SHA checkout was `DETACHED`; the workflow now restores the event branch locally at that unchanged SHA and upgrades checkout to the Node 24 runtime.
- Final hosted result: replacement run `30844716647` passed `continuity` in 5 seconds and `project-validation` in 1 minute 19 seconds. Local and remote seal SHA equality passed, and no duplicate feature-branch push run was created.
- Concurrent deployment result: a separately authorized operation activated the public event-worker Funnel after the hosted repair passed. Public login/denial probes, loopback bindings, and private 9443 continuity were independently reverified before the activation documentation was sealed.
- Next accountable role: Event operator monitoring and explicit Funnel shutdown when the approved public window ends.

## Active Revision — Isolated Public Event Worker Gateway

- Assignment: `PHR-PUBLIC-EVENT-WORKER-GATEWAY-20260803`
- Document ID: `PHR-STRUCT-20260803-002`
- Feature: `PHR-ARCH-014`
- Status: `IMPLEMENTED AND LIVE — PUBLIC WORKER LOGIN READY`
- Objective: provide browser-only worker access without a Tailscale installation while preserving the Product Owner's current remote phone connection and the existing tailnet-only 9443 service.
- Architecture: dedicated loopback gateway on 3101 -> existing Phronesis on 3100; Tailscale Funnel public HTTPS on unused port 10000 -> gateway; 9443 Serve remains untouched.
- Authorization rule: the gateway overwrites a public-ingress header. Phronesis detects that header before OPTIONAL-mode compatibility and accepts only a valid timed event session. Permanent identity and anonymous compatibility never authorize the public ingress.
- Transport rule: block Settings, employee/grant administration, permanent activation/sign-in, developer routes, and non-event Better Auth endpoints at the gateway; app page/API entitlements remain the authoritative second boundary.
- Remote-safety rule: build, validate, install, and health-check the gateway before Funnel activation. Any failure leaves 9443 operational. Do not switch the global auth mode while the owner is remote.
- Acceptance: module-correct worker landing, Secure cookie behind TLS termination, public no-cookie fail-closed behavior, owner-only path blocking, private-path continuity, durable launch service, Funnel verification, full gates, and explicit shutdown instructions.
- Work order: `docs/prompts/PHR-ARCH-014-timed-event-worker-access-prompt.md`.
- Live result: `https://ramons-macbook-pro.tailaa2d39.ts.net:10000/event-access` is public through Funnel and requires a valid single-use event code. Settings, permanent authentication, and unassigned modules remain denied. The owner-only `:9443` route remains tailnet-only and returns HTTP 200.
- Runtime result: Phronesis and its gateway listen only on `127.0.0.1:3100` and `127.0.0.1:3101`. Named detached `screen` sessions supervise the locked/remote Mac runtime; validated LaunchAgent definitions are installed for the next normal login.
- Verification: public login 200; public Settings and permanent auth 404; uncredentialed Artwork Review redirects to event login; private Settings 200; full 376/376 tests pass. Public shutdown is `tailscale funnel --https=10000 off`.

## Active Revision — Assignable Artwork Review Worker Access

- Assignment: `PHR-ARTWORK-REVIEW-WORKER-ACCESS-20260803`
- Document ID: `PHR-STRUCT-20260803-001`
- Feature: `PHR-ARCH-014`
- Status: `IMPLEMENTED AND LIVE — PRODUCT REVIEW READY`
- Objective: make Artwork Review independently assignable to permanent employees and account-free timed workers without exposing Settings or broad Administration.
- Access rule: `ARTWORK_REVIEW:VIEW` reads the queue and candidate images; `OPERATE` records manual candidate and packaging-gallery decisions; `ADMIN` alone runs source refresh and assisted recovery. Timed grants can receive at most `OPERATE`.
- Migration rule: preserve every existing entitlement, backfill the new module only for Owner/Admin memberships, and leave existing operators, viewers, invitations, and timed sessions unchanged.
- Delivery rule: existing tailnet Serve remains private. Browser-only public access is delivered by the separately authorized isolated gateway revision below; public traffic never reaches this module through anonymous compatibility.
- Acceptance: employee and temporary-worker Settings selectors, one-module worker navigation, page/API enforcement, admin-only bulk controls, migration tests, focused/full gates, and private runtime verification.
- Work order: `docs/prompts/PHR-ARCH-014-timed-event-worker-access-prompt.md`.
- Result: `ARTWORK_REVIEW` is now a first-class module in permanent employee assignments and timed worker codes. An artwork-only worker sees only Artwork Review, can perform manual candidate/gallery decisions at `OPERATE`, and cannot run refresh/assisted recovery or reach Administration.
- Migration result: the live authorization database added the module without removing existing entitlements and backfilled one Owner with `ARTWORK_REVIEW:ADMIN`; no operator, viewer, invitation, or timed session received implicit access.
- Runtime boundary: the existing 9443 Tailscale Serve mapping remains tailnet-only and healthy. The later isolated public-gateway revision activated browser-only Funnel access on port 10000 with timed-session-only authorization while private authentication remains `OPTIONAL`.
- Verification: full 373/373 tests, TypeScript, warning-free lint, production build, diff hygiene, live migration audit, private service restart/status, and `/artwork-review` HTTPS 200 pass.
- Next accountable role: Product Owner may issue scoped event codes and review the live public worker workflow. Whole-private-app `REQUIRED` rollout and commit/push remain separately gated.

## Active Revision — Shared-SKU Packaging Galleries

- Assignment: `PHR-SEALED-PACKAGING-GALLERY-20260802`
- Document ID: `PHR-STRUCT-20260802-006`
- Feature: `PHR-UX-024`
- Status: `IMPLEMENTED AND LIVE — PRODUCT REVIEW READY`
- Objective: preserve multiple valid wrapper/package images under one catalogue SKU and display them as a carousel without changing product identity or price evidence.
- Identity rule: artwork multiplicity is not identity multiplicity. Wrapper art for one priced booster SKU becomes an ordered gallery; region/edition/package variants with separate TCG-derived identities remain separate SKUs.
- Safety rule: an owner bulk-approves at least two active, allow-listed candidates for one current identity. Galleries cannot overwrite exact or curated artwork and are atomically reversible with append-only evidence.
- Acceptance: one-click gallery approval/undo, separate gallery coverage, ordered artwork API, accessible Vendor Snapshot carousel, Fossil booster proof, mobile containment, full gates, and live private verification.
- Work order: `docs/prompts/PHR-UX-024-sealed-artwork-review-queue-prompt.md`.
- Result: the active `Fossil Booster Pack [1st Edition]` TCG-derived SKU now owns one ordered three-image gallery containing the Aerodactyl, Lapras, and Zapdos wrappers. Its catalogue identity, price evidence, and purchase behavior remain singular. The separate Unlimited SKU remains unresolved because the available wrapper files visibly carry the 1st Edition mark.
- Coverage: 364 exact, 118 assisted representative, 14 owner representative, 1 packaging gallery, and 497 total visible products across 2,894 sealed identities; 878 products remain pending owner review.
- Verification: focused 16/16 and full 370/370 tests, TypeScript without incremental output, warning-free lint, production build, diff hygiene, transactional/idempotency/undo evidence, live artwork API gallery order and provenance, private page HTTP 200, and tailnet mapping health pass.
- Next accountable role: Product Owner visual review through `Artwork Review` and the Vendor Workspace Snapshot carousel. Commit and push remain separately gated.

## Active Revision — Temporary Artwork Review Tab

- Assignment: `PHR-SEALED-ARTWORK-TAB-20260802`
- Document ID: `PHR-STRUCT-20260802-005`
- Feature: `PHR-UX-024`
- Status: `IMPLEMENTED AND LIVE — PRODUCT REVIEW READY`
- Objective: restore the non-empty sealed review queue after a Safari request-path failure and move the workflow from Settings into a separate temporary Administration tab.
- Product rule: the tab changes access and presentation only; it does not erase candidates, merge identities, or weaken exact/representative provenance.
- Acceptance: `/artwork-review` navigation, Settings removal, ADMINISTRATION authorization, current-origin and abort-safe queue loading, truthful non-zero active counts, desktop/mobile private verification, and full gates.
- Work order: `docs/prompts/PHR-UX-024-sealed-artwork-review-queue-prompt.md`.
- Result: `Artwork Review` is a separate temporary Administration destination; Settings no longer embeds the queue. The active database retains 884 pending products, and `Celebrations Mini Tin Display` remains the first intentional exception.
- Runtime remediation: the screenshot represented a failed API load, not an empty queue. The client now uses a current-origin absolute endpoint, abort-state suppression, and resilient response parsing; the loopback service was restarted and both `/artwork-review` and the queue API returned 200 through the configured private-review runtime.
- Verification: focused 11/11 and full 369/369 tests, TypeScript, warning-free lint, production build, diff hygiene, direct SQLite count, page/API HTTP 200, and tailnet mapping health pass.
- Next accountable role: Product Owner phone review at the existing tailnet-only 9443 URL. Commit and push remain separately gated.

## Active Revision — TCGplayer Mini Tin Variant Reconciliation

- Assignment: `PHR-POKEMON-MINI-TIN-IDENTITY-20260802`
- Document ID: `PHR-STRUCT-20260802-004`
- Feature: `PHR-API-004`
- Status: `IMPLEMENTED AND APPLIED — PRODUCT REVIEW READY`
- Objective: reconcile generation-coded Celebrations Mini Tin source artwork to the eight separately priced regional TCGplayer catalogue identities without collapsing them into a generic product or Display.
- Identity rule: Kanto through Galar remain distinct TCG-derived SKUs inside one Mini Tin family. The family is useful for navigation; SKU-level identity continues to own artwork and price evidence.
- Safety rule: accept only exact set, Mini Tin class, bracketed canonical region, and one corresponding `gen1`–`gen8` source asset. Display and assortment identities remain unresolved without their own source evidence.
- Acceptance: eight deterministic regional mappings, no Display substitution, independent market prices preserved, focused/full verification, active-database application, and idempotent rerun evidence.
- Work order: `docs/prompts/PHR-API-004-product-artwork-coverage-prompt.md`.
- Result: the active database maps Kanto–Galar to `gen1`–`gen8` respectively under eight separate TCG-derived SKUs. `Celebrations Mini Tin Display` remains unresolved. Exact sealed community mappings rose from 356 to 364; total visible sealed coverage rose from 483 / 2,894 (16.69%) to 491 / 2,894 (16.97%).
- Verification: focused 14/14 and full 369/369 tests, TypeScript without incremental output, warning-free lint, diff hygiene, successful active apply, and direct SQLite identity audit pass.
- Next accountable role: Product Owner review; the Display requires its own exact artwork source and is intentionally still in the exception queue.

## Active Revision — Assisted Sealed Artwork Recovery

- Assignment: `PHR-SEALED-ARTWORK-REVIEW-20260802`
- Document ID: `PHR-STRUCT-20260802-003`
- Feature: `PHR-UX-024`
- Status: `IMPLEMENTED AND APPLIED — PRODUCT REVIEW READY`
- Priority: High
- Objective: let Phronesis automatically adopt only the defensible exact-set/product-class representative subset, leaving genuine ambiguity for owner review without weakening the 356 exact mappings.
- Product rule: exact, Phronesis-assisted representative, and owner-approved representative coverage remain separate. Mixed-product guesses and value-sensitive variants never auto-apply; every decision is reversible and audited.
- Architecture: versioned pure selection policy, local metadata staging, idempotent assisted application, append-only review events, typed active representative provenance, Administration API, responsive Settings exception queue, and truthful Vendor Workspace labelling.
- Constraints: no paid requests, scraping, broad confidence-only approval, exact overwrite, new dependency, public deployment, commit, or push.
- Acceptance: deterministic assisted dry-run/apply; safe idempotency and exact/owner preservation; reversible provenance-aware artwork; truthful separate coverage; desktop/mobile usability; full verification gates.
- Work order: `docs/prompts/PHR-UX-024-sealed-artwork-review-queue-prompt.md`.
- Result: the active private database retains 356 / 2,894 exact sealed images (12.30%) and adds 118 assisted representatives, producing 474 / 2,894 visible (16.38%). The pending queue fell from 1,019 to 901. The earlier 47.51% figure is a theoretical queue ceiling, not a verified match rate.
- Compute evidence: metadata staging completed in 5.141 seconds on the active 1.2 GB database with no paid call or image prefetch.
- Verification: focused 17/17, full 366/366, TypeScript, warning-free lint, production build, diff hygiene, live desktop search/images, and 390×844 zero-overflow pass.
- Verification: v1 dry run selected 118 and refused 966 unsafe ambiguities; apply wrote 118; repeat apply wrote zero and recognized all 118. Focused 6/6, full 368/368, TypeScript, lint, build, diff hygiene, active SQLite audit, private Settings HTTP 200, and accepted-state API checks pass.
- Next accountable role: Product Owner may move forward; Settings remains an exception/undo surface. Commit, push, or public deployment remains separately gated.

## Active Revision — Community Pokémon Sealed Recovery Pass

- Assignment: `PHR-COMMUNITY-POKEMON-SEALED-RECOVERY-20260802`
- Document ID: `PHR-STRUCT-20260802-002`
- Feature: `PHR-API-004`
- Status: `COMPLETED — EXACT RECOVERY APPLIED AND VERIFIED`
- Objective: improve the initial 191 / 2,892 sealed result by recovering deterministic source files omitted through package-class and exact-set normalization gaps.
- Evidence: plural package paths, modern set aliases, promo-ID evidence, half-display distinction, and strict mixed/same-set filename identity recovered 165 additional exact products. Sealed coverage is now 356 / 2,892 (12.31%), an 86.4% relative increase over the initial 191 mappings.
- Boundary: recover exact products only. Representative pack art, regular-versus-Pokémon-Center ETB substitution, half-display substitution, case imagery, edition collapse, and loose promo scans remain prohibited.
- Required artifacts: revised specification/work order, classifier/alias tests, measured dry run, exact apply, cache/idempotency evidence, validation/report/review/memory updates.
- Verification: focused 13/13 and full 362/362 tests, TypeScript, lint, production build, diff hygiene, and a zero-write/zero-failure idempotent rerun pass.
- Residual: 1,019 rows have possible but non-unique or non-exact source candidates; 1,517 are unmatched or unsupported. They remain placeholders rather than receiving incorrect packaging art.
- Next accountable role: CTO may separately approve a provenance-labelled representative-image tier or another exact source; no further exact recovery is available from this source under the current identity contract.

## Active Revision — Community Pokémon Artwork Gap Fill

- Assignment: `PHR-COMMUNITY-POKEMON-ARTWORK-20260802`
- Document ID: `PHR-STRUCT-20260802-001`
- Feature: `PHR-API-004`
- Status: `COMPLETED — CTO ACCEPTED; ACTIVE DATABASE POPULATED`
- Priority: Critical Event Readiness
- Objective: fill the maximum defensible Pokémon singles and sealed artwork gaps from PokéFiles and `1niceroli/ptcg-assets` without paid Scrydex API access or weakened identity safeguards.
- Singles rule: read PokéFiles' public catalogue snapshot, retain its declared upstream image URL, and attach only by exact English set, collector number, and material artwork name. Existing valid resolutions take precedence; stamped, staff, prize, and other material variants require matching artwork evidence.
- Sealed rule: pin one immutable `ptcg-assets` commit, map only English set directories, require compatible product class plus a unique descriptor match, and quarantine booster-art, case, bundle, regional, or same-class ambiguity.
- Storage rule: store exact SKU mappings in `pricing_artwork_resolutions`, cache only approved raster hosts through `PHR-TECH-007`, and write a local ignored run report with source revisions, accepted counts, residual gaps, and ambiguity samples.
- Constraints: no paid Scrydex API call, overwrite of a valid same-identity mapping, fuzzy set adoption, guessed promo/stamp artwork, full repository clone, Git publication, or provider-wide unbounded byte crawl.
- Required artifacts: revised `PHR-API-004` specification and prompt, implementation, focused tests, local coverage run, validation, release note, implementation report, conformance review, and memory updates.
- Measured result: 31,286 / 43,732 Pokémon single rows (71.54%), 356 / 2,892 sealed rows (12.31%), and 1,500 / 1,500 priority images cached. Residual 1,019 possible-but-non-exact and 1,517 unmatched/unsupported sealed rows remain placeholders.
- Verification: targeted 13/13, full 362/362, TypeScript, lint, production build, diff hygiene, and zero-failure idempotent rerun pass.
- Next accountable role: CTO may prioritize another source or curated residual workflow later; no action is required for this completed revision.

## Active Revision — PriceCharting Multi-Game Daily Snapshots

- Assignment: `PHR-PRICECHARTING-MULTIGAME-DAILY-20260801`
- Document ID: `PHR-STRUCT-20260801-008`
- Feature: `PHR-API-012`
- Status: `IMPLEMENTED — PRODUCT REVIEW READY; ACTIVATION AND SCHEDULER GATED`
- Priority: Critical
- Objective: extend receipt-backed PriceCharting evidence to Magic and English One Piece at the highest defensible deterministic compatibility, then acquire and atomically activate both subscription snapshots once per day.
- Identity rule: every game has a versioned exact resolver. PriceCharting `tcg-id`, price, popularity, and row order cannot identify or break a tie. Magic uses set/name/collector/finish/treatment proof; One Piece uses set/name/prefixed collector/language/distribution proof.
- Measured result: Magic receipt 4 accepted 109,841 / 129,485 eligible singles (84.83%); One Piece receipt 5 accepted 4,731 / 6,122 eligible English singles (77.28%). Both are dry runs and active pointers remain null.
- Daily rule: encrypted owner-provided URLs only; HTTPS PriceCharting allow-list; same-host redirects; exact schema/game validation; immutable hash; ten-minute request spacing; independent atomic promotion; persistent same-day skip/retry state.
- Constraints: no fuzzy adoption, bare `tcg-id` join, Japanese-to-English collapse, sealed auto-map, TCGplayer-lane mutation, URL disclosure, invented endpoint, host scheduler installation, public deployment, commit, or push.
- Artifacts: spec, implementation prompt, validation, release notes, implementation report, and conformance review under `docs/` for `PHR-API-012`.
- Next accountable role: CTO Product Review, encrypted URL entry, and supervised one-shot activation. Host recurrence requires separate operational approval.

## Active Revision — PriceCharting Bulk Evidence Import

- Assignment: `PHR-PRICECHARTING-BULK-IMPORT-20260801`
- Document ID: `PHR-STRUCT-20260801-007`
- Feature: `PHR-API-011`
- Status: `IMPLEMENTED — PRODUCT REVIEW READY; DRY RUN COMPLETE, ACTIVATION PENDING`
- Priority: High
- Objective: convert complete PriceCharting CSV receipts into locally available, separately attributed graded and market evidence without weakening Phronesis identity or TCG Direct Low precedence.
- Identity rule: PriceCharting product ID is the provider key; only exact, unique, one-to-one English Pokémon physical-SKU mappings may auto-promote. TCG ID, UPC, price, release date, sales volume, and name similarity are corroboration only.
- Collision rule: every source or target collision fails closed. The measured source contains 5,206 otherwise strong rows converging on 2,372 Phronesis targets; none may become active without a later explicit identity proof.
- Import rule: immutable hashed receipt -> strict versioned validation -> provider staging -> versioned game resolver -> atomic active-receipt promotion -> deterministic coverage report. Dry-run is the default; apply is explicit; last-good evidence survives failure.
- Evidence rule: PriceCharting observations remain outside TCGplayer-owned price lanes and cannot change artwork or the recommended offer. TCG Direct Low remains first-priority buying evidence.
- Measured implementation result: owner source hash `a06dcdde...faac1` staged 91,572 rows; resolver v9 proves 33,379 collision-free candidates and 32,099 graded candidates, while retaining 1,704 collision rows across 745 targets, 387 ambiguous rows, 5,851 unmatched rows, 1,425 sealed review rows, 189 quarantined rows, and 48,637 unsupported/non-English rows. The 80.78% eligible-row result comes from fixture-gated exact identity, qualifier, pattern, set, annotation, and sibling-finish evidence—not fuzzy matching.
- Delivery lane: Standard Lane with receipt/staging, resolution/promotion, and consumption/operations slices when implementation is authorized.
- Constraints: no scheduler, authenticated CSV acquisition, One Piece, Magic, image ingestion, sealed fuzzy matching, dependency, public deployment, commit, or push. `--apply` remains an explicit owner operation and has not run.
- Artifacts: `docs/api/PHR-API-011-pricecharting-bulk-evidence-import.md`, `docs/prompts/PHR-API-011-pricecharting-bulk-evidence-import-prompt.md`, and `docs/testing/PHR-API-011-pricecharting-bulk-evidence-import-validation.md`.
- Verified result: focused 21/21 and full 338/338 tests, TypeScript, warning-free lint, production build, and diff hygiene pass. The owner CSV recomputed dry-run receipt `3`; active receipt remains `NULL`.
- Next accountable role: CTO Product Review and explicit activation decision. Recurring acquisition remains a later objective.

## Active Revision — Editable Purchase Cart

- Assignment: `PHR-EDITABLE-PURCHASE-CART-20260801`
- Document ID: `PHR-STRUCT-20260801-006`
- Feature: `PHR-UX-020`
- Status: `IMPLEMENTED — PRODUCT REVIEW READY`
- Priority: Critical
- Objective: let Vendor Workspace employees edit unit/total purchase value and quantity directly on an unsubmitted cart line and remove unwanted lines before receipt finalization.
- Integrity rule: update only the employee-owned active-event cart payload; identity, condition, recommendation, market evidence, event ownership, receipts, ledger, Inventory, and Display Case evidence remain immutable.
- Interaction rule: exact lines edit unit price and quantity; Bulk edits total paid and optional approximate count. Each line exposes explicit Save changes and Remove item controls; checkout cannot proceed with unsaved edits.
- Constraints: preserve the single canonical cart and purchase API, receipt/Inventory/Case transaction, authorization, and responsive adjacent workspace. No post-checkout editing, dependency, public deployment, commit, or push.
- Acceptance: persisted exact/Bulk corrections, correct totals, owner isolation, active-event validation, visible removal, Case-quantity clamp, invalid-input feedback, 390px containment, and full gates.
- Delivery lane: Fast Lane with an additive API action and no schema migration.
- Work order: `docs/prompts/PHR-UX-020-editable-purchase-cart-prompt.md`.
- Verified result: exact and Bulk edits persist through the canonical owner-scoped cart update, unsaved changes block checkout, reduced quantity clamps pending Case quantity, and Remove item returns the cart to its prior state. Focused 16/16 and full 315/315 tests, TypeScript, warning-free lint, diff hygiene, production build, live desktop interaction, and 390×844 no-overflow/44px-control checks pass.
- Next accountable role: CTO Product Review. Same-session Chief Architect conformance passed but is not independent Product Owner review.

## Active Revision — Sealed Readiness And Embedded Verification

- Assignment: `PHR-SEALED-CHECKOUT-CERTS-20260801`
- Document ID: `PHR-STRUCT-20260801-005`
- Features: `PHR-API-008`, `PHR-UX-019`, `PHR-API-009`
- Status: `IMPLEMENTED — PRODUCT REVIEW READY; PROVIDER ACTIVATION GATED`
- Priority: Critical
- Objective: spend the configured 100-credit PkmnPrices UTC-day budget only on newest-first sealed products, place a compact expandable recommended offer directly above the Event cart, and add in-Phronesis certificate verification through authorized grader interfaces.
- Provider rule: PkmnPrices `/v1/sealed` is the only paid endpoint; open Pokémon set metadata supplies release order; PSA is the only immediately functional grader API; Beckett/BCCG, TAG, CGC, and SGC remain explicit API-authorization gates and are not scraped.
- Identity rule: sealed artwork attaches only through exact TCGplayer product ID or exact normalized name plus set; ambiguous records remain staged.
- Security rule: `PKMNPRICES_API_KEY` and `PSA_API_TOKEN` remain server-only and are never returned, logged, committed, or accepted by an unauthenticated client.
- Constraints: preserve existing checkout calculations, purchase APIs, cart, Event Ledger, Inventory and Case behavior; no fuzzy adoption, scraping, dependency, public deployment, commit, or push.
- Acceptance: 100-credit UTC ceiling and restart safety, newest-first cursor, truthful plan/configuration state, exact image resolution, compact offer tile above cart, functional configured PSA lookup, zero-network unsupported graders, responsive UI, and full gates.
- Work orders: `docs/prompts/PHR-API-008-pkmnprices-sealed-ingestion-prompt.md`, `docs/prompts/PHR-UX-019-compact-checkout-offer-prompt.md`, and `docs/prompts/PHR-API-009-grading-certificate-lookup-prompt.md`.
- Verified result: combined focused 12/12 and full 314/314 tests, TypeScript, warning-free lint, diff hygiene, production build, live side-by-side desktop composition, offer disclosure behavior, and 390×844 responsive rendering pass. PkmnPrices and PSA credentials are not configured, so no provider credit or certificate request was transmitted.
- Next accountable role: CTO Product Review, followed by server-side credential registration and private-service restart when sealed-enabled PkmnPrices and PSA credentials are available. Same-session Chief Architect conformance passed but is not independent Product Owner review.

## Active Revision — Adjacent Search And Checkout Workspace

- Assignment: `PHR-ADJACENT-VENDOR-CHECKOUT-20260801`
- Document ID: `PHR-STRUCT-20260801-004`
- Feature: `PHR-UX-018`
- Status: `IMPLEMENTED — PRODUCT REVIEW READY`
- Priority: Critical
- Objective: place Event checkout/cart beside catalogue results on desktop so rapid exact-card price entry and cart composition remain in one visual work area.
- Product rule: the existing single VendorCheckout, purchase API, cart, receipt, ledger, Inventory, Display Case routing, and Quick Sale behavior remain authoritative and unchanged.
- Layout rule: primary desktop band is results + checkout; secondary band is evidence + buying decision. Phone order is results → checkout → evidence → decision.
- Constraints: presentation-only recomposition; no duplicate checkout, business-rule/API/database/auth change, hidden analytical panel, dependency, public deployment, commit, or push.
- Acceptance: adjacent desktop geometry, immediate selected-card composer update, one checkout instance, safe nested breakpoints, 390px semantic order/no overflow, existing workflow regressions, and full gates pass.
- Delivery lane: Fast Lane, reversible UI composition.
- Work order: `docs/prompts/PHR-UX-018-adjacent-search-checkout-workspace-prompt.md`.
- Verified result: at the standard 1280px private-review viewport, results measure 351px beside the 586px Event station with zero overflow. At 390px, results → checkout → evidence → decision render in semantic order at 343px width with zero overflow. Focused 21/21 and full 305/305 tests, TypeScript, warning-free lint, production build, private service, and responsive geometry pass.
- Next accountable role: CTO Product Review. Same-session Chief Architect conformance passed but is not independent Product Owner review.

## Active Revision — Catalogue Verification Controls

- Assignment: `PHR-CATALOGUE-VERIFY-20260801`
- Document ID: `PHR-STRUCT-20260801-003`
- Feature: `PHR-UX-017`
- Status: `IMPLEMENTED — PRODUCT REVIEW READY`
- Priority: High
- Objective: let Vendor Workspace operators enlarge the current catalogue artwork and open an exact-context TCGplayer search for manual double-checking, especially when a thumbnail is missing or questionable.
- Product rule: external TCGplayer content is operator corroboration only; it never mutates, selects, or automatically verifies a Phronesis identity.
- Interaction rule: result thumbnails preview on precise-pointer hover; the selected evidence thumbnail also supports keyboard focus/touch. The fixed preview cannot interfere with result selection or overflow the viewport.
- Constraints: reuse canonical image candidates/cache; fixed encoded HTTPS TCGplayer search origin; no API call, scraping, external write, automatic reconciliation, dependency, database, public deployment, commit, or push.
- Acceptance: exact identity-sensitive link, safe new-tab behavior, enlarged cached preview, truthful placeholder fallback, keyboard/Escape behavior, 390px containment, existing search/purchase regressions, and full gates pass.
- Delivery lane: Fast Lane, one reversible presentation-only slice.
- Work order: `docs/prompts/PHR-UX-017-catalogue-verification-controls-prompt.md`.
- Verified result: exact One Piece `OP16-022` selection exposes an encoded `tcgplayer.com/search/all/product` link with `noopener noreferrer`; the canonical preview opens at 252×348, remains viewport-contained at phone width, dismisses with Escape, and the link measures 44px high. Full 305/305 tests, focused 10/10 remediation checks, TypeScript, warning-free lint, production build, diff hygiene, private health, zero horizontal overflow, and no new browser warning/error pass.
- Next accountable role: CTO Product Review. Same-session Chief Architect conformance passed but is not independent Product Owner review.

## Active Revision — One Piece Set-Code Search Resolution

- Assignment: `PHR-ONEPIECE-SET-SEARCH-20260801`
- Document ID: `PHR-STRUCT-20260801-002`
- Feature: `PHR-UX-016`
- Status: `IMPLEMENTED — PRODUCT REVIEW READY`
- Objective: make queries such as `OP13 booster` connect One Piece printed set codes to sealed products stored under canonical human set names.
- Product rule: aliases are derived from exact imported single-card collector codes, not manually maintained release-title guesses; every remaining query term stays mandatory and the operator still selects the result.
- Evidence rule: only sufficiently supported, dominant, semantically compatible OP/EB/ST/PRB mappings are persisted. Special-event/reprint labels and ambiguous or weak evidence fail closed.
- Constraints: local additive SQLite only; no provider call, fuzzy identity adoption, source-catalogue rewrite, dependency, auto-selection, public deployment, commit, or push.
- Acceptance: `OP13 booster` returns Carrying On His Will sealed products with visible interpretation; OP13 singles remain available; OP/EB/ST/PRB parsing and fail-closed rules are deterministic; existing Pokémon/global search and full gates pass.
- Delivery lane: Fast Lane, one reversible additive slice.
- Verified result: the active catalogue derived 55 aliases (17 OP, 3 EB, 33 ST, 2 PRB). OP13 resolves to Carrying On His Will from 165 base-set products versus a 3-product compatible runner-up; `OP13 booster` returns Booster Box, Box Case, Booster Pack, and Sleeved Booster Pack, while OP13 singles remain available and unrelated required terms return no match. One Piece collector input `22` now canonicalizes to `022`: both `Monkey.D.Luffy OP16 22` and `Monkey.D.Luffy OP16 022` return the same two `OP16-022` printings, while `Zoro OP16 22` returns zero. Focused and full 302/302 tests, TypeScript, warning-free lint, production build, diff hygiene, private health, API, and 390×844 no-overflow/clean-console checks pass.
- Next accountable role: CTO Product Review. Same-session Chief Architect conformance passed but is not independent Product Owner acceptance.

## Active Revision — Pokémon And One Piece Artwork Readiness

- Assignment: `PHR-ARTWORK-READINESS-20260801`
- Document ID: `PHR-STRUCT-20260801-001`
- Feature: `PHR-API-004` with `PHR-TECH-007` cache dependency
- Status: `IMPLEMENTED — PRODUCT REVIEW READY`
- Objective: repair missing phone thumbnails in one end-to-end pass and prepare the largest safe Pokémon/One Piece artwork baseline possible before the 2026-08-02 event.
- Identity rule: provider discovery may remove commerce-only collector suffixes and documented set-era labels; attachment still requires exact printing evidence. Special/stamped/serial/event variants fail closed.
- Operational result: 32,566 Pokémon and 3,224 One Piece product mappings persisted; 1,000 priority images cached with zero failures. Sealed or ambiguous products remain placeholders.
- Verification: focused 35/35, full 300/300, TypeScript, lint, diff, production build, private health, exact same-origin image bytes, and 390×844 visual/console/overflow gates pass.
- Artifacts: `docs/api/PHR-API-004-product-artwork-coverage.md`, `docs/prompts/PHR-API-004-product-artwork-coverage-prompt.md`, `docs/testing/PHR-API-004-product-artwork-coverage-validation.md`, `docs/implementation-reports/PHR-API-004-product-artwork-coverage-report.md`, and `docs/reviews/PHR-API-004-product-artwork-coverage-conformance-review.md`.

## Active Product Work — 2026-07-31

- Structure: `PHR-STRUCT-20260731-001`
- Feature: `PHR-ARCH-014`
- Objective: account-free, timed, event-bound worker access with operational module scoping.
- Status: `IMPLEMENTED — PRODUCT REVIEW PENDING`
- Next gate: regression/build evidence, responsive review, conformance, and CTO acceptance.

## Active Assignment — Event Flip And Display Case Inventory

- Assignment: `PHR-EVENT-FLIP-DISPLAY-CASE-20260731`
- Document ID: `PHR-STRUCT-20260731-006`
- Status: `IMPLEMENTED — PRODUCT REVIEW PENDING`
- Features: `PHR-WORKFLOW-013`, `PHR-WORKFLOW-014`; future `PHR-WORKFLOW-015`
- Priority: Critical
- Objective: make every event Purchase visible to a sorting handler; let exact single-card lots be multi-selected, quantity-checked, Sale-priced, and added to a receipt-linked Display Case; make linked Sales reduce both Case and underlying owned quantity; and provide combined end-of-event verification.
- Inventory rule: General Inventory remains acquisition/cost/on-hand authority. Display Case is a reserved event allocation, not duplicate ownership. Prepared Sheet stock remains a distinct no-lot source. Binder Inventory is documented but not implemented.
- Intake rule: exact `SINGLE` receipt lots are actionable. Exact sealed, aggregate Bulk, and description-only manual Purchases remain visible but cannot become a specific Case card until a later itemization workflow establishes identity and quantity.
- Financial rule: handler-entered Case price is intended/list evidence. Whole-Sale actual amount remains on the Event Ledger and cannot be arbitrarily allocated across items.
- Quantity rule: Case allocation reserves but does not decrement total owned quantity. Case-linked Sale decrements Case and underlying General Inventory atomically. Reversal restores both only when no later physical count makes restoration ambiguous.
- Authorization: Event Flip and Display Case use `INVENTORY:VIEW/OPERATE`; Sale search/write retains `VENDOR_WORKSPACE` authorization. Repository ownership checks remain authoritative.
- Constraints: additive local SQLite only; preserve receipts, cost basis, General Inventory, Event Stock, cash math, manual fallback, and existing authorization. No Bulk identity fabrication, Binder implementation, provider call, payment, settlement, accounting, external transaction, public deployment, dependency, commit, or push.
- Acceptance: immediate purchase visibility, multi-card Case allocation, editable prices, reservation math, merged Sale search, atomic Sale/reversal, receipt/disposition/count guards, prepared-source visibility, physical variance/reporting, full deterministic gates, and desktop/390px private review.
- Approved amendment: Vendor Workspace purchase lines must expose an inline `Send to Display Case` choice and require the handler to enter the intended Case price before checkout. Case quantity defaults to one, is editable up to purchased quantity, and leaves remaining copies outside Case. Receipt, Inventory intake, and Case placement remain one atomic operation; unselected eligible cards continue to Event Flip.
- Verified result: every finalized event Purchase now appears in Event Flip; exact single-card lots support multi-select quantity and intended-price allocation into a receipt-linked Case, while sealed, Bulk, and manual evidence remains truthfully non-actionable. Vendor Workspace additionally offers direct-to-Case routing with a required intended price inside the atomic receipt/Inventory transaction. Display Case combines prepared opening stock with event-flip allocations, both Sale surfaces share one source-labelled picker, and linked Sale/reversal updates Case, General Inventory, and Event Ledger atomically. General Inventory exposes owned, Case-reserved, and generally available quantities and blocks operations that would consume a reservation. Append-only Case prices, returns, counts, and a combined CSV verification report are available. Focused 6/6 and full 290/290 tests, TypeScript, lint, production build, diff hygiene, private health, desktop, and 390px no-overflow/clean-console checks pass.
- Next accountable role: CTO Product Review. Same-session Chief Architect conformance passed but is not independent Product Owner acceptance.

## Active Assignment — Event Stock Control And Intent-Aware Search

- Assignment: `PHR-EVENT-STOCK-SEARCH-20260731`
- Document ID: `PHR-STRUCT-20260731-005`
- Status: `IMPLEMENTED — PRODUCT REVIEW PENDING`
- Features: `PHR-WORKFLOW-012`, `PHR-UX-016`
- Priority: Critical
- Objective: ingest a human-maintained five-column Google Sheet snapshot into local event stock; let both Event Ledger Sale surfaces search and decrement the exact option; produce sold, expected-leftover, physical-count, and variance evidence; and make catalogue search understand bounded shorthand such as `SH03 → SWSH03`.
- Product rule: Google Sheets is the authoring surface, but the live event runs only from a hash-recorded local CSV snapshot. A consumed manifest is immutable. Sale/reversal and stock movements are atomic and append-only.
- Reporting rule: whole-Sale actual amount remains transaction evidence and is never arbitrarily allocated across item rows. Imported unit price remains list-price evidence. Count variance never becomes an inferred Sale, Loss, or correction.
- Search rule: bounded identifier aliases improve retrieval/ranking and are disclosed to the operator; they never mutate catalogue identity or auto-select a product.
- Constraints: additive SQLite only; preserve legacy/manual Sales, Quick Sale, cash math, global Inventory, authorization, and existing dirty worktree. No live Google credential, public Sheet, payment processing, external transaction, dependency, public deployment, commit, or push.
- Acceptance: strict CSV validation/hash provenance, local stock search, atomic multi-item Sale/reversal, retry/oversell safety, untracked flags, physical counts, truthful reports, SH03 first-result proof, full deterministic gates, and isolated desktop/390px runtime verification.
- Verified result: an owner-scoped native Google Sheet and downloadable CSV template feed strict hash-recorded local event stock; both Sale surfaces share exact option selection, atomic movements, reversal, untracked fallback, physical counts, and sold/leftover reports. `Charizard v sh03` returns `SWSH03: Darkness Ablaze` Charizard V `019/189` first with visible interpretation. The disposable end-to-end workflow, 29.93 ms median search across 10,000 options, 284/284 tests, TypeScript, lint, production build, diff hygiene, private health, and 390px overflow/console checks pass.
- Next accountable role: CTO Product Review. Same-session Chief Architect conformance passed but is not independent Product Owner acceptance.

## Active Assignment — Vendor Workspace Quick Sale

- Assignment: `PHR-VENDOR-QUICK-SALE-20260731`
- Document ID: `PHR-STRUCT-20260731-004`
- Status: `IMPLEMENTED — PRODUCT REVIEW PENDING`
- Feature: `PHR-UX-015`
- Priority: High
- Objective: let a buyer record an incidental event Sale inside Vendor Workspace without leaving the buying workflow.
- Product boundary: Vendor Workspace provides only Purchase intake and Lite Quick Sale. `/event-ledger` remains the seller’s full panel for event start, expected-cash audit, activity, adjustment, reversal, close, and reconciliation.
- Data rule: both surfaces post to the same authorized `/api/event-ledger`, active event ID, validation, `PurchaseLedgerRepository`, summary, and audit trail. No second ledger or cash calculation is permitted.
- Acceptance: one-to-25-item Sale, payment-aware expected cash, immediate returned summary, retry safety, draft preservation, view-only/no-event states, unchanged purchase intake, full deterministic gates, and responsive live cross-surface proof.
- Verified result: a disposable two-item $25.50 Cash Sale entered at 390px in Vendor Workspace updated its Lite summary to $25.50 gross sales and $125.50 expected cash, then appeared with both sold-item descriptions and the same totals in `/event-ledger`. Purchase intake remained present, desktop and phone layouts had no horizontal overflow, required controls met the 44px target, and the console was clean. Full 279/279 tests, TypeScript, lint, production build, diff hygiene, and private-service health pass.
- Next accountable role: CTO Product Review. Same-session Chief Architect conformance passed but is not independent Product Owner acceptance.

## Active Assignment — Responsive Application Navigation

- Assignment: `PHR-RESPONSIVE-APPLICATION-NAVIGATION-20260731`
- Document ID: `PHR-STRUCT-20260731-003`
- Status: `IMPLEMENTED — PRODUCT REVIEW PENDING`
- Feature: `PHR-UX-014`
- Priority: High
- Objective: restore the complete Phronesis application path at phone widths after Product Review exposed that the desktop-only sidebar disappeared without a mobile replacement.
- Product rule: the server entitlement-filtered typed destination list is the only input to both desktop and phone navigation. Mobile presentation cannot own a second route list or permission decision.
- Accessibility rule: named trigger/dialog/navigation, current-page state, 44px controls, focus entry and containment, Escape/backdrop/explicit dismissal, trigger-focus restoration, body-scroll restoration, and breakpoint-aware closure are mandatory.
- Verified result: all six authorized destinations render and navigate at 390px, Event Ledger is current, every route closes the drawer, phone controls measure 44–52px, horizontal overflow is zero, widening restores the desktop sidebar and body scrolling, and the console is clean. Focused 5/5, full 278/278, TypeScript, lint, production build, diff hygiene, and private health checks pass.
- Next accountable role: CTO Product Review. Same-session Chief Architect conformance passed but is not independent Product Owner acceptance.

## Active Assignment — Event Cash Ledger Revision

- Assignment: `PHR-EVENT-CASH-LEDGER-20260731`
- Document ID: `PHR-STRUCT-20260731-002`
- Status: `IMPLEMENTED — PRODUCT REVIEW PENDING`
- Feature: `PHR-WORKFLOW-006`
- Priority: Critical
- Objective: evolve the purchase-only event checkout into a single-currency Event Cash Ledger with declared opening cash, frictionless manual Sales and Purchases, multi-item sold descriptions, payment-aware cash effects, audited reversal, and closing variance.
- Product rules: a Sale has one positive total and one to 25 required human-entered sold-item lines; it never requires or mutates Inventory. Vendor Workspace purchases retain immutable receipts and Inventory intake while adding one ledger Purchase atomically. Expected cash includes only Cash movements and adjustments. Net event cash movement is never labelled profit.
- Constraints: additive migration only; preserve receipt, Inventory, authorization, and audit evidence. No payment processing, tax, settlement, accounting export, customer CRM, public deployment, or automatic manual-sale Inventory reconciliation.
- Acceptance: exact cash calculations, retry safety, receipt linkage, reversal, close locking, workspace authorization, full automated gates, desktop review, and 390px no-overflow review pass.
- Verified result: the dedicated Event Ledger starts with explicit currency/opening cash, records payment-aware manual Sales and Purchases, persists one to 25 sold-item rows per Sale, supports reasoned Cash Adjustments and reversals, atomically links evaluated purchase receipts, and freezes expected/actual/variance evidence at close. Product Review then exposed the missing shared phone-navigation path; `PHR-UX-014` now restores all six entitlement-filtered destinations. The 278-test suite, TypeScript, lint, production build, private service health, complete six-route phone navigation, desktop breakpoint recovery, no-overflow/touch-target, and zero-console-error checks pass.
- Next accountable role: CTO Product Review. Same-session Chief Architect conformance passed but is not independent Product Owner acceptance.

## Active Assignment — Catalogue Completion And Arbitrage Targets

- Assignment: `PHR-CATALOGUE-ARBITRAGE-PRECISION-20260731`
- Document ID: `PHR-STRUCT-20260731-001`
- Status: `IMPLEMENTED — PRODUCT REVIEW PENDING`
- Features: `PHR-ARCH-013`, `PHR-UX-013`, `PHR-WORKFLOW-007`
- Objective: move LigaMagic/TCGplayer reconciliation as close as defensibly possible to complete supported coverage, add precise owner-defined arbitrage targets, and make the two routes visibly and economically distinct.
- Matching boundary: exact full identity remains primary; every LigaMagic-specific recovery is named and bounded by exact name/collector/finish, compatible material qualifiers, or explicit catalogue semantics. Textless, fuzzy adoption, populated collector conflicts, language collapse, treatment collapse, forced edition mappings, Art/Stat collapse, and duplicate target adoption remain prohibited.
- Target boundary: acquisition range, gross resale value, gross spread, net profit, profit margin, ROI, and evidence age are nullable and route/currency specific. No policy values may be invented and no target may replace identity, freshness, cost, or executable-availability evidence.
- Acceptance: named match-method counts and residual reasons are reproducible across two builds; ambiguity and Textless adoption remain zero; direction changes reverse acquisition/exit semantics; Settings persists validated nullable targets; tests, type, lint, build, diff, desktop, and 390px review pass.
- Verified result: 131,869 unique mappings, 64.66% supported emitted-row coverage, 83.04% supported consumer-priced coverage, 98.44% accepted-match price comparability, zero duplicate TCGplayer targets, zero ambiguous adoption, and zero quarantined-shell adoption. Two full rebuilds produced byte-identical reports and fingerprint `8b96e2472cd3504d06a75bc475b158ef8bec5a722f2570b2bb33d133f8c22304`. Direction-correct target profiles and economics pass the 271-test suite, TypeScript, lint, production build, diff hygiene, and 390px review.
- Product boundary: secure connector credential entry is not part of this feature. Provider cards remain configuration/status documentation until an authenticated credential-vault slice is approved; no secret is collected in the current Settings UI.

## Active Assignment — Arbitrage Visual Presentation

- Assignment: `PHR-ARBITRAGE-PRESENTATION-20260730`
- Document ID: `PHR-STRUCT-20260730-014`
- Status: `PRODUCT REVIEW READY`
- Features: `PHR-UX-013`, `PHR-WORKFLOW-007`
- Objective: keep the four owner-controlled direction-cost settings available for later population and make Arbitrage the primary, responsive Opportunities decision surface.
- Verified result: Settings labels the nullable cost policy as awaiting owner inputs; Opportunities leads with 50 exact candidates, route summaries and filters, evidence age, net-first economics, explicit blockers, and focused availability verification. No cost was invented and no candidate advanced beyond its evidence gate. The 261-test suite, standalone TypeScript, warning-free lint, production build, diff hygiene, desktop review, and 390px no-overflow review pass.
- Next gate: Product Owner visual approval. Commit, remote continuity, and private deployment follow only after approval of the visible result.

## Active Assignment — LigaMagic/TCGplayer Crosswalk Validation

- Assignment: `PHR-ARBITRAGE-DATA-VALIDATION-20260730`
- Document ID: `PHR-STRUCT-20260730-013`
- Status: `CTO ACCEPTED — ACQUIRED DATA VALIDATED; OPERATIONAL COST GATE REMAINS`
- Features: `PHR-ARCH-013`, `PHR-API-006`, `PHR-WORKFLOW-007`
- Objective: validate the acquired LigaMagic snapshot against the active TCGplayer-centred Magic catalogue and safely remediate systematic identity-label drift.

### Baseline

- Source identities: 329,301.
- Exact matched: 71,954.
- Unmatched supported Normal/Foil: 147,584.
- Quarantined Textless: 109,763.
- Ambiguous adopted: zero.

### Authorization And Boundaries

Documentation, offline ignored-database crosswalk mutation, deterministic alias derivation, sanitized local reports, repository code/tests, bounded remediation, full validation/build, ordinary feature-branch checkpointing, and private-service restart are authorized autonomously.

Fuzzy matching, Textless adoption, provider requests, scraping, LigaMagic scheduling, owner cost assumptions, executable-availability fabrication, external transactions, public deployment, destructive migration, new dependencies, force push, and history rewriting are prohibited.

### Acceptance

The same source pair rebuilds to the same fingerprint; every alias is backed by at least two conflict-free unique anchors; exact/alias/comparable coverage and remaining gaps are reported; ambiguous and unsupported identities remain non-actionable.

### Verified Result

The source pair deterministically resolves 71,954 exact identities and 14,438 qualifier-preserving alias identities: 86,392 total matches, 39.35% supported coverage, 86,032 two-sided price pairs, zero ambiguities, and 109,763 quarantined Textless rows. Two rebuilds produced fingerprint `ada5cb0288f45d16636bc3e34aab144709d0ff0b12c9eda629aa5ce6fcff20d2`. US acquisition and resale now consume direction-correct TCGplayer fields. All 261 tests, standalone TypeScript, warning-free lint, production build, private restart, and live API checks pass. Candidates remain `IDENTITY_VERIFIED` until owner costs and executable availability are supplied. Listing readiness is deferred as `PHR-WORKFLOW-011`.

## Active Assignment — Inventory Disposition Ledger

- Assignment: `PHR-INVENTORY-DISPOSITION-20260730`
- Document ID: `PHR-STRUCT-20260730-012`
- Status: `CTO ACCEPTED — PRIVATE DEPLOYMENT VERIFIED`
- Feature: `PHR-WORKFLOW-010`
- Objective: explain and atomically apply inventory leaving a lot through explicit sale, loss, damage, transfer-out, or correction evidence.

### Product Rules

- Receipt, acquisition cost, prior counts, and provenance remain immutable.
- Dispositions are lot-specific, append-only, reasoned, and reversible without deletion.
- Known on-hand quantity may reach zero but never become negative.
- Sales record gross proceeds only; no profit, settlement, or accounting claim is inferred.

### Authorization And Boundaries

Documentation, additive local schema, repository/API/UI changes, deterministic tests/build, private responsive review, bounded remediation, ordinary feature-branch checkpointing, and private-service restart are authorized autonomously.

External transactions, payment capture, marketplace mutation, public deployment, authentication activation, accounting recognition, destructive migration, new dependencies, force push, and history rewriting are prohibited.

### Acceptance

Disposition creation and reversal are atomic, authorized, workspace-scoped, idempotent where applicable, audited, responsive, and preserve intake/count evidence; all repository and runtime gates pass.

### Verified Result

Sale, loss, damage, transfer-out, and correction records now atomically decrement known operational quantity. Retry-safe creation, reasoned non-destructive reversal, count-revision protection, gross-sale evidence, workspace ownership, and operator authorization pass. Receipt/acquisition/count evidence remains unchanged. The 259-test suite, TypeScript, warning-free lint, production build, diff hygiene, private desktop/390px runtime, console, overflow, and HTTP gates pass. External transactions and financial settlement remain deferred.

## Active Assignment — Inventory Location And Count Reconciliation

- Assignment: `PHR-INVENTORY-RECONCILIATION-20260730`
- Document ID: `PHR-STRUCT-20260730-011`
- Status: `CTO ACCEPTED — PRIVATE DEPLOYMENT VERIFIED`
- Feature: `PHR-WORKFLOW-009`
- Objective: organize receipt-backed lots into workspace locations and record physical counts through audited events without changing source receipt evidence.

### Product Rules

- Unassigned is the default visible location.
- Move and COUNT events are append-only and require a reason.
- A physical count is an observation, not a sale, loss, or cost-basis rewrite.
- Mutations require `INVENTORY:OPERATE` and resource ownership is verified server-side.

### Authorization And Boundaries

Documentation, additive local schema, repository/API/UI changes, deterministic tests/build, private responsive review, bounded remediation, ordinary feature-branch checkpointing, and private-service restart are authorized autonomously.

Authentication activation, disposition/sales semantics, external transactions, public deployment, LigaMagic scheduling, destructive migration, new dependencies, force push, and history rewriting are prohibited.

### Acceptance

Location creation and lot reconciliation are atomic, authorized, workspace-scoped, audited, responsive, and preserve receipt/cost evidence; all repository and runtime gates pass.

### Verified Result

Workspace locations, explicit Unassigned state, on-hand quantity basis, and append-only MOVE/COUNT events are operational. Combined reconciliation is atomic, every mutation requires `INVENTORY:OPERATE`, and lot/location ownership is verified in the DAL. Receipt quantity and acquisition cost remain unchanged. The supported suite, standalone TypeScript, warning-free lint, production build, diff hygiene, desktop, 390px no-overflow, private runtime, and browser-console gates pass. Sales/disposition semantics remain deferred.

## Active Assignment — Receipt-Backed Inventory Intake

- Assignment: `PHR-INVENTORY-INTAKE-20260730`
- Document ID: `PHR-STRUCT-20260730-010`
- Status: `CTO ACCEPTED — PRIVATE DEPLOYMENT VERIFIED`
- Feature: `PHR-WORKFLOW-008`
- Objective: make finalized event-purchase receipts create auditable workspace inventory cost-basis lots without duplicate entry.

### Product Rules

- Exact lines retain exact catalogue identity, condition, quantity, unit cost, total cost, and receipt provenance.
- Bulk lines remain aggregate Bulk lots with selected product lines and approximate evidence; no individual identities are fabricated.
- Checkout and receipt reversal update inventory atomically and idempotently.
- Inventory reads require module authorization and remain workspace-scoped.

### Authorization And Boundaries

Documentation, additive local database schema, repository/API/UI changes, deterministic tests/build, private responsive review, bounded remediation, ordinary feature-branch checkpointing, and private-service restart after verification are authorized autonomously.

Authentication activation, LigaMagic schedule activation, external transactions, public deployment, destructive migration, new dependencies, force push, and history rewriting are prohibited.

### Acceptance

Receipt finalization creates one correct lot per line with no second operator action; historical receipts reconcile without duplicates; receipt void preserves and deactivates linked lots; permissions, tests, TypeScript, lint, build, diff, and responsive review pass.

### Verified Result

Exact and aggregate Bulk lots now derive transactionally from receipt lines, historical receipts reconcile idempotently, and receipt voids preserve but deactivate linked lots. The Inventory module is workspace-scoped at page and API boundaries and renders desktop-first with a 390px no-overflow adaptation. The full behavioral suite, standalone TypeScript, warning-free lint, production build, diff hygiene, private loopback runtime, and browser-console gates pass. No external or gated capability was activated.

## Active Assignment — Official BCB PTAX Exchange Rate

- Assignment: `PHR-OFFICIAL-FX-20260730`
- Document ID: `PHR-STRUCT-20260730-009`
- Status: `CTO ACCEPTED — PRIVATE DEPLOYMENT VERIFIED`
- Feature: `PHR-API-007`
- Objective: replace manual BRL/USD input with automatically refreshed official BCB PTAX closing buy/sell evidence and direction-correct regional calculations.

### Authorization And Boundaries

Repository documentation/code/database migration, read-only official BCB requests, deterministic tests/builds, private runtime review, bounded remediation, ordinary feature-branch checkpointing, and private-service restart after verification are authorized autonomously.

New dependencies, unofficial FX fallback, user-controlled provider URLs, credentials, transactions, public deployment, LigaMagic schedule activation, destructive migration, force push, and history rewriting are prohibited.

### Acceptance

Official buy/sell quotes and provenance refresh automatically at most hourly; weekends and holidays resolve to the latest close; last-good values survive failure; calculations use the conservative direction-specific quote; Settings makes FX read-only; all repository and responsive runtime gates pass.

### Verified Result

The private service automatically persisted the official 2026-07-30 PTAX close at buy `5.0733` and sell `5.0739` BRL/USD with BCB provenance. Repeated reads retained the same retrieval timestamp, proving hourly throttling; forced refresh passed. All 245 tests, standalone TypeScript, warning-free lint, production build, diff hygiene, desktop review, 390px regional-panel review, and browser-console checks passed. Direction-specific costs remained unset and therefore gated actionable arbitrage. At this historical acceptance point, the LigaMagic schedule was still disabled; current recurrence is tracked under `PHR-API-013`.

## Active Assignment — Regional Vending And Arbitrage Intelligence

- Assignment: `PHR-REGIONAL-INTELLIGENCE-20260730`
- Document ID: `PHR-STRUCT-20260730-008`
- Status: `PRODUCT REVIEW READY`
- Delivery lane: Standard, four ordered slices
- Features: `PHR-ARCH-013`, `PHR-API-006`, `PHR-UX-013`, `PHR-WORKFLOW-007`
- Objective: convert the verified LigaMagic snapshot into exact regional vending evidence and truthfully gated two-way arbitrage opportunities.

### Authorized Slices

1. Exact LigaMagic-to-TCGplayer crosswalk with ambiguity and Textless quarantine.
2. Regional evidence, timestamped FX, direction-specific cost profiles, and explicit incomplete/stale states.
3. Offer-first Brazilian vending intelligence inside the existing Vendor Workspace.
4. Ranked US↔Brazil arbitrage candidates with append-only executable-availability verification.

### Product Rules

- LigaMagic Compra is consumer retail evidence.
- LigaMagic Venda is a dealer-buy benchmark, not a guaranteed executable offer.
- No candidate is actionable until identity, freshness, costs, and real availability are verified.
- Unknown costs are not silently treated as zero.
- Existing Phronesis evaluation, checkout, authentication, and module authorization remain canonical.

### Authorization And Boundaries

Repository documentation/code/database migrations, ignored local crosswalk/evidence data, deterministic tests/builds, private desktop/mobile review, bounded remediation, ordinary feature-branch checkpoints, and private-service restart after verification are authorized autonomously.

The 03:00 LigaMagic schedule, public deployment, paid commitments, scraping, transactions, credential capture/disclosure, destructive migration, force push, and history rewriting are prohibited. The Product Owner is interrupted only for a critical financial/security decision or genuine block.

### Acceptance

Every accepted cross-market mapping is unique and auditable; Vendor Workspace shows correctly labelled Brazilian evidence for exact matches; arbitrary financial assumptions cannot produce actionable recommendations; availability verification is persisted and authorized; full tests, TypeScript, lint, build, diff, responsive review, Designer conformance, and Chief Architect conformance pass.

## Active Assignment — LigaMagic Authenticated Export Dry Run

- Assignment: `PHR-LIGAMAGIC-DRYRUN-20260730`
- Document ID: `PHR-STRUCT-20260730-007`
- Status: `COMPLETE — DRY RUN VERIFIED; 03:00 SCHEDULE NOT AUTHORIZED`
- Feature: `PHR-API-005`
- Priority: Critical pricing-intelligence foundation
- Objective: create a dedicated authenticated LigaMagic export profile, perform one user-supervised collection export, capture safe request behavior, and produce a complete non-scheduled dry-run snapshot across every discovered collection.
- Evidence semantics: `Compra` is the price a consumer pays a store; `Venda` is the price a store offers a consumer.
- Authorized: repository documentation/code/tests, `playwright-core` dependency installation without browser download, ignored local profile/download/database evidence, one supervised export, sequential export of all owned collections, and bounded authenticated reads through LigaMagic's own export UI.
- User boundary: the Product Owner must personally enter credentials and complete CAPTCHA/verification in the dedicated browser profile. The workflow resumes automatically after authentication.
- Prohibited: password/token/cookie capture, CAPTCHA or rate-limit bypass, anonymous or marketplace-page scraping, daily schedule installation, LigaPokémon, arbitrage recommendation/UI, canonical pricing activation, transaction, public deployment, force push, and history rewriting.
- Acceptance: exact schema/advertised-quantity/row-count/hash evidence for one pilot and every discovered collection; complete manifest and SQLite dry-run snapshot; duplicate/conflict report; full deterministic repository verification; no secret in repository or evidence.
- Verified result: the pilot captured the supported authenticated `POST /?view=colecao/export&id=…` attachment response without headers, cookies, request bodies, or query values. The complete run reconciled 329,976 advertised cards across 329,903 rows and 37 collections, yielding 329,301 unique identities, 602 identical duplicates, and zero conflicting duplicates. The schedule remains absent.

## Active Remediation — Artwork And Provider Settings

- Assignment: `PHR-ARTWORK-PROVIDER-SETTINGS-20260730`
- Document ID: `PHR-STRUCT-20260730-006`
- Status: `CTO ACCEPTED — PR #5 OPEN; PRIVATE DEPLOYMENT VERIFIED; SECURE REGISTRATION GATE PRESERVED`
- Features: `PHR-API-004-R1`, `PHR-UX-012`
- Objective: resolve the exact Urza's Saga Store Championship thumbnail and establish Settings as the canonical provider connection/control surface.
- Authorized: bounded artwork matching remediation, Settings UI, authentication readiness guidance, documentation, tests/build, private restart, local checkpoint.
- Security boundary: provider secret entry remains prohibited until required owner authentication and an encrypted owner-only credential store have a reviewed work order. No compatibility-mode secret mutation is permitted.
- Verified result: exact Urza's Saga Store Championship Foil artwork returns `OPERATIONAL` and renders through the durable local image route; Settings shows provider health and the employee-login readiness checklist. Full suite 234/234, standalone TypeScript, lint, production build, diff, private runtime, and browser-console gates pass.
- Publication state: the accepted checkpoint is pushed on `codex/phr-price-monitoring-20260730` and included in draft GitHub PR `#5` targeting `main`. The launch-managed private deployment runs from the JarvisSSD checkout and passed loopback, tailnet HTTPS, catalogue-status, and OAuth-start verification.

## Active Assignment — Card-Show Operations

- Assignment: `PHR-CARD-SHOW-OPERATIONS-20260730`
- Document ID: `PHR-STRUCT-20260730-005`
- Status: `CTO ACCEPTED — PR #5 OPEN; PRIVATE DEPLOYMENT VERIFIED; AUTH OWNER CALLBACK GATED`
- Priority: Critical event readiness
- Delivery lane: Standard, six integrated slices
- Approved features: `PHR-TECH-010`, `PHR-UX-010`, `PHR-ARCH-012`, `PHR-UX-011`, `PHR-WORKFLOW-006`, `PHR-API-004`

### Approved Product Outcome

Make Phronesis operational for card-show buying: truthful catalogue-aware refresh, intentional manual tracking, immediate recommended offers, module-scoped employee activation, persistent vendor checkout including mixed Bulk purchases, and honest sealed/special-product artwork recovery.

### Authorized Slices

1. `S1 — PHR-TECH-010`: refresh integrity, catalogue reconciliation, structured errors, and provider health.
2. `S2 — PHR-UX-010 + PHR-UX-011`: manual watch composer and offer-first decision presentation.
3. `S3 — PHR-ARCH-012`: module-at-invite employee activation codes with GitHub identity proof retained and mandatory activation gated.
4. `S4 — PHR-WORKFLOW-006`: persistent event cart, exact-product and Bulk lines, immutable receipts, and authorization.
5. `S5 — PHR-API-004`: per-visible-result artwork resolution plus exact-SKU curated sealed/special-product images.
6. `S6 — Integration`: full verification, responsive private review, conformance, and memory reconciliation.

### Product Decisions Resolved Autonomously

- Vendor Workspace remains one-action tracking; the pre-add composer applies to manual/global additions.
- Employees with `VENDOR_WORKSPACE:OPERATE` may finalize their own event purchases for show speed; administrator correction and void remain audited.
- Activation codes are single-use onboarding artifacts, never permanent passwords. GitHub remains the installed identity proof in this slice; passkey installation is deferred behind a separate security-tested credential-lifecycle gate.
- Riftbound remains deferred.

### Authorization And Boundaries

Repository documentation/code/database migrations, deterministic local tests/builds, ignored local review data, private desktop/mobile review, service restart after verification, bounded remediation, and ordinary checkpoint commits are authorized autonomously.

Authentication remains `DISABLED` or `OPTIONAL` until owner bootstrap, credentials, live callback, activation-code verification, and security gates pass. External account creation, credential disclosure, public deployment, paid-provider commitment, scraping, marketplace transactions, destructive data migration, force push, history rewriting, and Riftbound are prohibited.

### Acceptance

Every slice must pass its specification, focused tests, the supported full suite, standalone TypeScript, warning-free lint, production build, diff checks, and same-session Chief Architect conformance. No failed refresh may overwrite last-good evidence or claim recent success; no authorization may rely on navigation hiding alone; no purchase receipt may be silently mutable; and no artwork may attach without exact evidence.

### Verified Result

- All six slices are implemented. The supported suite passes 232/232, standalone TypeScript has zero diagnostics, lint has zero warnings, and the Next.js 16.2.12 production build passes.
- The private service is running on loopback 3100 and tailnet-only HTTPS 9443. Its five loaded catalogue checkpoints report `CURRENT`.
- The previously failing Urza's Saga watch reconciled uniquely across provider set-label drift and refreshed from the verified catalogue to `$469.04` with HTTP 200 while preserving its watch membership.
- The four-daily observer no longer exits through the `server-only` import boundary.
- GitHub/passkey authentication remains activation-gated. JustTCG is configured but enrichment remains deliberately disabled; eBay and CardTrader remain unconfigured. No secret is recorded in repository evidence.
- CTO acceptance was recorded automatically under `PHR-WORKFLOW-002`. The integrated branch through `f1a49c5` is pushed in draft GitHub PR `#5`; the private tailnet deployment is verified. Authentication is configured in `OPTIONAL` mode and an initial owner invitation exists locally, but required mode remains gated on successful live owner callback verification.

## Active Assignment — Identity-Backed Price Monitoring

- Assignment: `PHR-PRICE-MONITORING-20260730`
- Document ID: `PHR-STRUCT-20260730-004`
- Status: `CTO ACCEPTED — PR #5 OPEN; AUTH OPTIONAL PENDING LIVE OWNER CALLBACK`
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
- `S3 — PHR-WORKFLOW-005`: **IMPLEMENTED**. User/workspace-scoped server persistence, default lists, idempotent tracking, soft removal/undo, local rollback cache, and explicit legacy ownership pass verification.
- `S4 — PHR-WORKFLOW-005`: **IMPLEMENTED**. Newly verified catalogue receipts refresh matching watched variants from local snapshot state without a competing provider schedule.
- `S5 — PHR-API-003`: **IMPLEMENTED; EXTERNAL PROVIDERS GATED**. Evidence types remain distinct; first-party sales work locally; JustTCG is opt-in/budgeted; eBay Browse and CardTrader are disabled without authorized credentials.
- Integrated result: **220/220 tests**, standalone TypeScript, warning-free lint, production build, local schema migration, diff hygiene, and desktop/390px responsive smoke checks pass. The running review service had no verified catalogue loaded, so one-action live catalogue interaction remains represented by deterministic integration tests.

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
