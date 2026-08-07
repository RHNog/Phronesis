# CTO Product Development Conversation History

## 2026-08-06 — Trusted Account Sign Up Invitation

### User Intent

- Add an invite link that makes it easy to send trustworthy people to account Sign Up.

### Decision And Implementation

- Extended `PHR-ARCH-016` rather than creating a second invitation authority. People & access now shows one generic permanent-account link with resilient Copy, native Share when supported, and Preview.
- Kept the link non-secret and zero-authority: it includes no identity or module decision, and every registrant remains pending until owner verification and exact module approval.
- Live review discovered that the configured future `access.phronesis.com` origin does not currently resolve. Added `PHRONESIS_RESTRICTED_PUBLIC_MODE` so a trusted-origin configuration cannot be mistaken for live infrastructure; disabled mode uses the current private origin.
- Rebuilt and restarted the private scanner-review service. The live invitation is `https://ramons-mac-studio.tailaa2d39.ts.net:9444/sign-up` until the restricted-public route passes activation.

### Acceptance State

Implementation and same-session conformance are Product Review ready and privately live. Focused 35/35 and full 443/443 tests, TypeScript, warning-free lint, Next.js 16.2.12 production build, desktop/phone no-overflow review, 44-pixel actions, Copy confirmation, exact Preview target, private HTTP 200, and zero browser warnings/errors pass. No account, request, membership, entitlement, invitation code, message, DNS, tunnel, or public route was created.

## 2026-08-06 — Event Consignment Ownership And Settings Control Center

### User Intent

- Identify the owner of each product sold in Event Ledger for consigned booth inventory.
- Require product owners to be registered before that event opens.
- Replace the poorly organized endless Settings page with an efficient and visually coherent administrative workspace.

### Decision And Implementation

- Extended `PHR-WORKFLOW-006` with an immutable event-scoped owner roster created atomically at opening, plus nullable house-or-owner attribution on every sold-item row.
- Added owner selection to full Event Ledger and Vendor Workspace Quick Sale, preserved it through Event Stock and Display Case canonicalization, and exposed it in active activity and closed historical reports.
- Explicitly deferred commission, per-line sale allocation, owner payout statements, settlement, and profit because the existing Sale has one unallocated customer total.
- Assigned `PHR-UX-029` and replaced Settings' vertical stack with Overview plus five direct-linkable work panels, desktop rail, phone selector, native history, safe query normalization, focus management, and same-session state preservation.
- Preserved all prior Settings components, APIs, provider-secret boundaries, and Administration authorization.

### Acceptance State

Implementation and same-session conformance are Product Review ready and privately live. Full 441/441 tests, TypeScript, warning-free lint, Next.js 16.2.12 production build, isolated owner→Sale→close→archive validation, live database backup/integrity/additive migration, desktop/phone Settings navigation, Back/Forward, unsaved-state preservation, no-overflow geometry, 44-pixel controls, private HTTP 200, and zero browser-console errors pass. The current live event remains house-only because its roster was locked before this revision; owners can be added when the next event is created.

## 2026-08-06 — Trusted Account Registration And Restricted Custom Domain

### User Intent

- Let trustworthy people create their own Phronesis accounts, then let the owner assign whichever modules each person should use.
- Replace the conspicuous Tailscale hostname with a normal restricted-public address under the owner-controlled `phronesis.com` domain.

### Decision

- Separate authenticated identity from Phronesis authority. Registration creates a Better Auth account plus one pending request and zero memberships/entitlements.
- Require the owner or Administration Admin to verify the person out of band, choose a non-Owner role, select at least one exact module/access pair, and explicitly approve or reject.
- Use `access.phronesis.com` through a dedicated loopback restricted gateway and custom-domain tunnel. Tailscale Funnel cannot supply a custom-domain certificate/name; private Serve and the separate worker gateway stay unchanged.
- Restricted-public ingress always requires a permanent Better Auth session and active membership, regardless of private optional compatibility, and blocks Settings, administration, developer, activation, and event-worker paths at transport.

### Acceptance State

Implemented and privately live under `PHR-ARCH-016`; `PHR-TECH-016` is implemented with external activation gated. Full 437/437 tests, TypeScript, warning-free lint, production build, isolated end-to-end registration/pending/owner-exact-module approval, phone/desktop no-overflow checks, gateway probes, live database backup/integrity/additive migration, tailnet sign-up, API denial, and live browser evidence pass. A macOS 27 launchd external-volume stall appeared on the final rebuild; database integrity stayed `ok`, and the private runtime was recovered in named detached screen session `phronesis-scanner-review` with loopback/tailnet `200`. Reboot persistence now requires a separate privacy-permission or internal-runtime decision. The first real trusted-person review is next. Cloudflare/DNS/tunnel/Access activation, verified email, password reset, passkeys, and MFA remain outside this acceptance.

## 2026-08-06 — Back-First Duplex Correction And Review Controls

### User Intent

- Correct the Scanner-to-Offer evidence labels because the Pokémon design is always the card back and the actual card face was being shown as the reverse.
- Make Refresh perform an observable, useful action.

### Diagnosis And Decision

- The physical `Phronesis Card Duplex` profile releases its rear sensor first. The bridge had sealed the batch as front-first, so recognition ran on nine Pokémon backs and left the nine actual faces as evidence-only.
- Preserve the sealed manifest and every immutable object/history record. Add one audited, idempotent pre-resolution orientation correction that supersedes active regions append-only, flips effective sides, and schedules only the actual faces. Make the correction govern later idempotent replays of the original manifest.
- Order batches by immutable creation time, expose an explicit batch selector, preserve the selected batch/card across reload, announce refresh completion/time/count, and provide Previous/Next plus `Card N of M` independently from Refresh.

### Acceptance State

Implemented, repaired in the live private store, and privately deployed under `PHR-TECH-015` and `PHR-WORKFLOW-016`. Current physical-session truth is nine even FRONT observations, nine odd paired BACK observations, eight review recommendations, one abstention, and zero pending/failed work. Installed-WebApp evidence shows Drowzee as FRONT and the Pokémon design as PAIRED REVERSE; Next advances Card 1 to Card 2, and Refresh changes the visible timestamp while retaining Card 2. Full 429/429 tests, importer 13/13, Windows bridge 16/16, warning-free lint, TypeScript/production build, backup integrity, service health, and same-session conformance pass. Auto-accept, grading/finish inference, purchasing, inventory, publication, and public exposure remain closed.

## 2026-08-06 — Installed WebApp Shell Optimization

### User Intent

- Restore a visible way to expand the collapsed sidebar.
- Remove the white strip at the far-right edge of the installed application.
- Optimize Phronesis as a standalone WebApp and add the shell controls and keyboard shortcuts needed for efficient operation.

### Decision

- Extend `PHR-UX-027` rather than introduce a parallel shell feature.
- Pin the desktop sidebar to the dynamic viewport, keep Expand directly below the brand header, and make only the tool list independently scrollable.
- Own the root canvas, scrollbar, safe-area, horizontal containment, and standalone overscroll colors in the application shell so Safari never reveals a white browser canvas.
- Enable app-navigation shortcuts only in standalone display mode and outside editable controls. Use `Cmd/Ctrl+B` for the sidebar, `G` then `D` for Dashboard, and `G` then `1–9` for the visible authorized tools; expose the full map through an accessible `?` dialog and make the avatar a real Settings link.

### Acceptance State

Implemented and privately live under `PHR-UX-027`. Focused 8/8 and full 425/425 tests, TypeScript, warning-free lint, Next.js 16.2.12 production build, service health, and installed Safari WebApp validation pass. Live evidence proves Collapse/Expand reciprocity, persistent visible Expand, `Cmd+B`, `G` then `D` navigation, shortcut-help/Escape behavior, a functional Settings link, and a dark far-right scrollbar with no white strip. Same-session conformance is Product Review ready; no commit, push, merge, public deployment, or authorization behavior changed in this revision.

## 2026-08-06 — Scanner Session Cancellation And Restart

### User Intent

- Restart a scan batch that was created before PaperStream was ready.
- Add a Cancel button inside Phronesis so the operator can abort a scan session without database intervention.

### Decision

- Cancel is an authenticated, confirmed, idempotent Phronesis session transition, not remote control of PaperStream.
- Preserve frames, decisions, material history, and offer evidence; cancel pending or leased recognition work and reject late frame imports.
- Keep the cancelled record visible and require an explicit new batch rather than silently replacing it.

### Acceptance State

Implemented and privately live under `PHR-WORKFLOW-016`. Empty `Poke Test #2` was cancelled with zero frames retained, both private services restarted, and replacement `Poke Test #3` was created as Lightly Played / Holofoil with the live Cancel control visible. Full 425/425 tests, warning-free lint, Next.js 16.2.12 production build with TypeScript, diff hygiene, loopback HTTP 200, and installed-app UI verification pass. No physical scanner start, evidence deletion, purchase, inventory, auto-accept, grading, or publication occurred.

## 2026-08-05 — Authenticated Remote Scanner Recovery

### User Intent

- Restore the remote Scanner-to-Offer page after iPhone Safari displayed server error `1507235227`.

### Diagnosis And Decision

- The isolated scanner service correctly bound pricing and recognition stores but omitted the canonical authorization database. Its worktree-relative auth store lacked the purchase-event table used by the worker-session authorization path, so anonymous probes passed while the authenticated phone request crashed.
- Persistently bind the scanner LaunchAgent to the canonical authorization database and re-register the job.
- Harden independent task authorization against an absent optional event module, while keeping every transactional/event scope fail-closed.

### Acceptance State

Recovered and privately live. Focused 10/10 and full 420/420 tests, TypeScript, warning-free lint, production build, loaded-environment inspection, authenticated browser verification, loopback/tailnet HTTP 200, and unchanged error-log length pass. The scanner session data and authorization grants were not rewritten.

## 2026-08-05 — Exact Offer Consolidation And Lot Totals

### User Intent

- Continue the approved vision implementation without delay after establishing batch-scoped condition and finish.

### Decision

- Close the next unblocked Scanner-to-Offer brief gap by consolidating exact duplicate resolutions into quantities while preserving per-scan evidence.
- Treat an offer amount as per-unit and require canonical identity, material, price snapshot, buying preset, unit offer, and currency to match before grouping.
- Calculate subtotals and lot totals on the server, keep currencies separate, and fail closed on unsafe integer arithmetic.
- Preserve the current manual buying-preset and offer boundary because no scanner-specific authoritative preset policy has been approved; do not repurpose unrelated Business Profile defaults.

### Acceptance State

Implemented and privately activated through same-session architecture, engineering, and conformance gates under `PHR-WORKFLOW-016`. Full 419/419 tests, TypeScript, warning-free lint, Next.js production build, diff hygiene, private-service restart, live API continuity, and 390×844 browser evidence pass. The offer projection remains draft-only and creates no purchase, inventory, consumer, or publication mutation.

## 2026-08-05 — Homogeneous Batch Condition And Finish

### User Intent

- Set condition once for a complete scan batch instead of repeating it per card, and determine whether current recognition can reliably grade condition or distinguish Pokémon Normal, Holofoil, and Reverse Holofoil.

### Decision

- Automatic condition grading is not viable as a trusted operational result from the current fixed-light duplex scans. Keep condition operator-declared at batch scope.
- Finish classification is more tractable than grading but is not qualified on the present capture and evidence set. Treat finish as an exact operator-declared batch constraint and require separate homogeneous batches.
- Persist batch material revisions append-only, lock both values after the first resolved card, derive resolution material and price verification server-side, and fail closed when the candidate's catalogue variant differs.
- A future finish suggestion may be evaluated only against a labeled, set/era/finish-stratified holdout. Condition automation remains a distinct, higher-evidence objective requiring controlled surface-defect capture and validation.

### Acceptance State

Implemented and privately activated through same-session architecture, engineering, and conformance gates under `PHR-WORKFLOW-016`. Focused 26/26, full 419/419, TypeScript, warning-free lint, production build, additive live migration, loopback/tailnet HTTP 200, and 390×844 no-overflow browser evidence pass. The existing legacy batch remains unchanged and explicitly requires configuration; no current scan was assigned a condition or finish, and no automatic grading, finish classification, auto-accept, purchase, inventory, consumer, or publication gate opened.

## 2026-08-05 — Acquisition-Proven Duplex Review Evidence

### User Intent

- Resume the local vision implementation from its prior Product Review boundary and continue making it operational with progress updates.

### Decision

- Treat the missing reverse image in Resolve as an acquisition-contract problem, not a UI inference opportunity.
- Preserve the accepted 18-frame `v1` bundle and its `pairingSemantics: unknown` truth. Do not relabel adjacent legacy frames.
- Add an opt-in `v2` adjacent-duplex-front-first manifest that seals explicit sides and reciprocal pairs, rejects incomplete/contradictory pairs before READY, schedules only fronts for recognition, and keeps backs as linked immutable evidence.
- Show front and acquisition-proven reverse evidence during manual material review. If no proven reverse exists, render a labelled unavailable state. Condition remains operator-confirmed and no automatic grading claim is introduced.
- Remove the implicit Near Mint default and any cross-card condition carryover; exact-condition pricing stays disabled until the operator makes a fresh per-card selection.

### Acceptance State

Implemented and privately activated for software review. Node bridge 12/12, Windows PowerShell 15/15, focused recognition 25/25, full repository 418/418, TypeScript, warning-free lint, production build, loopback/tailnet HTTP 200, live API, and browser semantic gates pass. The current legacy session remains unchanged at 18 frames, eight reviews, ten abstentions, zero pending/accepted/failed, displays `Paired reverse unavailable`, begins with `Select condition`, and keeps exact-condition pricing disabled. One supervised physical `v2` duplex pair still requires the interactive Windows scanner session; no auto-accept, grading, purchase, inventory, consumer, or publication gate opened.

## 2026-08-05 — Pokémon-First Recognition Revision

### User Intent

- Make Pokémon, rather than Magic, the first implemented recognition product line and apply the necessary operational adjustments.

### Decision

- Change the active first-release lane to English Pokémon (`pokemon-en`) while preserving one-card-per-frame acquisition, operator confirmation, review-only recognition, and every purchase/publication gate.
- Treat English as the retained conservative first-language boundary. Card backs, Spanish Pokémon, Magic, and insufficient language evidence abstain.
- Require name-plus-collector retrieval and explicit labelled catalogue-variant selection because Pokémon normal, holofoil, and reverse-holofoil SKUs can share the same name and collector number.
- Reprocess the existing immutable 18-frame session append-only so its eight English faces can exercise the new lane while nine backs and one Spanish face remain safe abstentions.

### Acceptance State

Implemented, privately activated, and accepted by the authorized evidence gates under `PHR-ARCH-015`, `PHR-TECH-014`, and `PHR-WORKFLOW-016`. The live append-only replay retains both revisions and presents eight English Pokémon reviews plus ten abstentions; the repeated replay is idempotent. Full 416/416 tests, TypeScript, lint, production build, live API/service evidence, route continuity, and 390×844 mobile validation pass. Auto-accept, active binder segmentation, purchase/inventory mutation, downstream adoption, new public exposure, and publication remain closed. Product Owner experience review of one exact candidate is next.

## 2026-08-05 — Urgent Private Scanner-To-Offer Activation

### User Intent

- Move forward and make the local recognition feature operational as soon as possible.

### Decision

- Treat the instruction as authority for private tailnet activation of the already-reviewed scanner-to-offer workflow and recurring local worker.
- Preserve the existing `:9443` service and unrelated dirty canonical checkout by using a parallel loopback service and separate tailnet-only port.
- Keep automatic recognition acceptance, binder-region adoption, purchases, inventory mutation, external consumers, publication, and public Funnel exposure closed.
- Remove repetitive idle/already-imported watcher logging before persistent activation.

### Acceptance State

Private activation accepted by evidence. The isolated app and recurring worker run under user LaunchAgents, tailnet-only `:9444` returns the scanner page and immutable evidence, existing `:9443` remains HTTP 200, and the public `:10000` mapping is unchanged. The exact batch is terminal at `REVIEW` with 18 safe abstentions and zero pending jobs. A stale aggregate `PROCESSING` state discovered during live review was corrected with durable lifecycle reconciliation and regression coverage. Full 415/415 tests, zero-warning lint, production build, quiet idle polling, and 390×844 browser validation pass. Auto-accept, binder activation, purchase/inventory mutation, external consumers, publication, and public exposure remain gated.

## 2026-08-05 — Binder Segmentation Benchmark Continuation

### User Intent

- Move forward with development after completion of the local recognition calibration toolchain.

### Decision

- Real English Magic calibration remains blocked because no specific source/provenance approval was supplied.
- Continue with the next unblocked brief slice: benchmark-only local multi-card/binder region suggestions under `PHR-UX-026`.
- Keep detector output outside active repository regions and preserve deployment, production activation, recognition auto-accept, and publication gates.

### Acceptance State

Benchmark tooling is implemented and same-session conformance complete. The real smoke test returned an internal-rectangle false localization, so production segmentation is explicitly not accepted. Full 414/414 repository tests, 4/4 Swift tests, TypeScript, zero-warning lint, production build, and diff hygiene pass. A labeled real binder holdout and separate Designer/Product Review remain mandatory for activation.

## 2026-08-05 — Local Recognition Calibration Tooling Continuation

### User Intent

- Continue development after receiving the private mobile URL and learning that the new scanner route is not deployed.

### Decision And Result

- Continued locally with the next safe `PHR-TECH-014` increment: corpus construction and executable benchmark evidence.
- Added deterministic content-addressed bundles, immutable identity/object split enforcement, explicit recognition-use approval evidence, duplicate holdout-asset prevention, and sealed multi-metric reports.
- Did not treat the instruction as deployment, publication, external-consumer mutation, corpus-license approval, or auto-accept activation authority.
- Corrected the stale generated active-task source that still described the completed physical scanner gate.

### Acceptance State

Implemented and same-session conformance complete. Full 409/409 repository tests, 2/2 Swift tests, TypeScript, zero-warning lint, production build, and diff hygiene pass. Real English Magic calibration remains gated on separately approved provenance and a powered holdout.

## 2026-08-05 — Local Recognition Platform Implementation

After the Windows duplex bridge passed physical acceptance, the Product Owner explicitly authorized implementation through the end of the approved local card-recognition brief under the Canonical Autonomous Workflow. The Chief Architect advanced `PHR-TECH-014`, `PHR-WORKFLOW-016`, `PHR-API-015`, and the safe `PHR-UX-026` foundation while preserving the prior English-Magic-first, operator-confirmed material, and no-publication rules.

The implemented package now provides content-addressed scan evidence, durable sessions and recoverable jobs, append-only multi-region corrections, a local Apple Vision evidence worker, read-only catalogue retrieval, game gating, deterministic review/abstention, corpus activation/rollback, benchmark qualification, authenticated Scanner to Offer APIs/UI, server-verified exact-condition price bindings, local offer drafts, immutable Recognized Asset Envelope v1, and pure TCGplayer/Liga draft adapters. TCGPLAYER Tools remained read-only because it is an independent dirty repository and consumer adoption is a separate workflow.

The exact 18-frame Windows bundle replay found three irrelevant Magic review candidates from Pokémon `BASIC` headers. Engineering added explicit observed-game evidence before catalogue retrieval and replayed the immutable batch. Final evidence is 18 completed jobs, 18 safe abstentions, zero review/accepted/failed, which is correct because the physical batch is Pokémon while first-release recognition is English Magic. Product Review remains pending. Auto-accept, licensed artwork indexing, automatic binder segmentation, consumer adoption, deployment, push, and publication remain gated.

## 2026-08-04 — Windows Bridge Duplex Acquisition

The Product Owner authorized the Windows bridge while the fi-8170 macOS session remains blocked by the unsupported macOS 27 ICA boundary, prepared the PaperStream job, supplied low-value cards, corrected the job to duplex after rejecting a back-only first scan, and completed the supervised batch.

`PHR-TECH-015` now contains a fail-closed PowerShell capture/seal boundary and dependency-free Mac verifier/importer. The working path requires PaperStream to run in the logged-in Windows console session because Parallels remote execution runs as `SYSTEM` in session 0. The registered job must use 300 dpi, 24-bit color, duplex, single-page JPEG, no blank-page removal, batch-folder output, and the documented `/Exit` lifecycle.

The accepted evidence session acquired 18 JPEG frames from nine operator-loaded low-value cards. Windows sealing preserved originals and produced a manifest with SHA-256 `723ee7e9be1b91aae5d5e97f3fe55aa8cfe966532ba89b274d27a8647614ad2b`; macOS independently matched all 18 sizes and hashes, imported atomically, and returned `already_imported` on repeat. The manifest retains observed sequence with `pairingSemantics: unknown`. The operator reported no damage or feed issues. Raw images remain outside Git, no Phronesis product state changed, and S1W conformance is complete.

## 2026-08-04 — Local Card Acquisition And Recognition Program

The Product Owner supplied a local card-recognition brief, accepted the CTO implementation structure, and authorized implementation through the Canonical Autonomous Workflow. The approved outcome is an offline-first platform that converts physical card observations into evidence-backed canonical Phronesis assets for Vendor Buying, inventory, TCGPLAYER Tools, LigaMagic, LigaPokémon, and future multi-card capture.

The CTO selected English Magic and one card per frame for the first release, retained operator confirmation for condition and price-material finish uncertainty, and prohibited automatic marketplace publication. The Chief Architect selected Controlled Lane and decomposed the work into fi-8170 acquisition, durable agent, local corpus/recognition, scanner-to-offer, recognized-asset interchange, and later platform/capture expansion.

The first Engineer work order is `PHR-TECH-013 / Slice A`: a standalone Swift/ImageCaptureCore capability probe with explicit physical-scan consent, deterministic JSONL events, atomic frame promotion, SHA-256 evidence, redaction, cancellation, and disconnected tests. Discovery found the driver and SDK but no connected fi-8170, so software implementation proceeds while the physical gate remains explicit.

The software checkpoint now passes Swift build, formatter lint, 18/18 tests, disconnected zero-device enumeration, typed not-found, explicit scan denial, no-device no-write behavior, SIGINT cancellation, diff hygiene, and private-identifier review. Same-session Chief Architect conformance passes for the software scope. No physical card was scanned; final Slice A acceptance still requires the connected fi-8170 and an owner-approved low-value batch.

## 2026-08-03 — GitHub Handoff Continuity Repair

The Product Owner reported repeated GitHub errors after implementing the Handoff workflow and authorized a repair. Hosted logs and a clean-checkout reproduction established two separate causes: the workflow tried to prepare Handoff state before installing the locked Node dependencies required by the repository validators, and the committed Handoff seal still represented an earlier implementation while the public event-worker gateway remained dirty locally.

`PHR-TECH-011` changes GitHub from a Handoff author into a verifier. One project-validation job installs with `npm ci` and runs tests, lint, build, and diff hygiene. A separate continuity job checks the exact committed pull-request head with full history and never mutates the checkout. Feature branches run through the pull-request event only; direct push validation is limited to `main` to prevent duplicate runs and duplicate failure emails.

The repair deliberately preserves the current `PHR-ARCH-014` public-gateway and Artwork Review authorization implementation. It must pass the full local gate, be committed as implementation truth, receive a fresh local Handoff seal, and pass both hosted jobs. Public Tailscale Funnel activation remains a separate Product Owner gate and is not part of this repair.

The first repaired hosted run passed the complete dependency-backed project job and produced only one pull-request run. Continuity then identified a CI-specific identity edge: checking out the exact head SHA leaves Git detached, while the seal records the branch name. The remediation keeps the exact SHA and creates a runner-local event branch before validation; it does not regenerate Handoff or weaken branch matching. Checkout v5 also removes the runner's Node 20 action warning.

Replacement hosted run `30844716647` passed continuity in 5 seconds and dependency-backed project validation in 1 minute 19 seconds. The remote branch matched the local seal, and no duplicate feature-branch push run appeared. The GitHub/Handoff repair is complete.

While the final hosted bookkeeping seal was running, a separate process recorded and performed a Product Owner-authorized Funnel activation. Read-only reconciliation confirmed public port 10000 forwards to loopback gateway 3101, public login returns 200, public Settings returns 404, both Node services bind only to loopback, and private tailnet-only 9443 remains healthy. Those independently created records were preserved and incorporated into the next seal; the CI repair itself did not activate infrastructure.

## 2026-08-02 — Assisted Sealed Artwork Recovery And Exception Queue

The Product Owner challenged the remaining sealed coverage, asked for the compute cost of approaching the reviewable 47.5% tier, and first directed Phronesis to build a simple manual verification tool. After seeing where it lived, the Product Owner explicitly redirected Phronesis to perform the defensible review work automatically and let operations move forward. `PHR-UX-024` now combines a versioned assisted policy with an Administration Settings exception queue. Exact, `ASSISTED_REPRESENTATIVE`, and `OWNER_APPROVED_REPRESENTATIVE` coverage remain separate; all representative decisions are audited, reversible, and labelled as packaging-variable in Vendor Workspace.

The 47.51% value was corrected from an implied achievable match rate to a theoretical queue ceiling: 598 products had exact-set/class candidates, while 421 had only broad mixed-product guesses. Conservative v1 refuses mixed guesses, value-sensitive/composite variants, explicit wrapper/edition claims, and non-generic package ambiguity. It applied 118 representatives to the active 2,894-product catalogue, raising visible coverage from 356 (12.30%) to 474 (16.38%) and reducing the manual exception queue from 1,019 to 901. A second apply wrote zero rows and recognized all 118 as current.

Focused 6/6 and full 368/368 tests, TypeScript, warning-free lint, production build, diff hygiene, exact SQLite provenance/event reconciliation, private Settings HTTP 200, and accepted-state API checks pass. No paid request, scraping, broad confidence-only acceptance, public deployment, commit, or push occurred. The Product Owner may move forward; Settings remains available for exceptions and reversal.

## 2026-08-02 — Free Community Pokémon Artwork Gap Fill

The Product Owner declined paid Scrydex access and directed Phronesis to use PokéFiles and `1niceroli/ptcg-assets` immediately at the highest safe matching percentage. The accepted `PHR-API-004` revision treats PokéFiles as public catalogue metadata rather than image ownership, validates its public Supabase project without retaining the anonymous client credential, and resolves English singles only through exact set, collector number, and material artwork evidence.

For sealed products, Phronesis reads the public repository's recursive tree at immutable commit `3744b0ab766cb6fcea9ac6f353913b64b40bf9a0` instead of cloning its approximately 2 GB history. Exact set, compatible package class, and unique descriptor evidence are mandatory; cases, edition variants, multi-art booster wrappers, and same-class uncertainty remain quarantined.

The active pricing database moved from zero community mappings to 31,286 / 43,732 Pokémon single rows (71.54%) and, after a sealed recovery pass, 356 / 2,892 sealed rows (12.31%). The recovery added 165 exact sealed mappings by recognizing plural package folders, modern set aliases, promo IDs, half displays, and strict mixed/same-set filenames—an 86.4% relative increase over the initial 191 mappings. The 1,500 highest-priority unique images are cached with zero final failures. One dead PokémonTCG image was replaced through exact TCGdex identity; a trusted 13.86 MB repository PNG was signature-validated under an import-only 16 MiB ceiling. A final repeat stored zero mappings. The audit retains 1,019 possible-but-non-exact and 1,517 unmatched/unsupported sealed rows as explicit residual work.

Targeted 13/13 and full 362/362 tests, TypeScript, warning-free lint, production build, and diff hygiene pass. No paid Scrydex request, price/offer/inventory mutation, public deployment, commit, or push occurred.

## 2026-08-01 — PriceCharting Magic And One Piece Daily Snapshots

The Product Owner supplied a 130,186-row Magic PriceCharting export and an 11,854-row One Piece export, directed Phronesis to reuse everything learned from the Pokémon importer, maximize compatibility in one safe pass, and structure a once-daily download routine. `PHR-API-012` owns the implementation.

Repository analysis proved that PriceCharting `tcg-id` values do not share the current Phronesis source-SKU identity namespace for these games, so the implementation never uses them as a join. Magic v2 resolves through explicit set aliases, exact name, collector when present, finish/treatment, and unique target evidence. One Piece v3 adds prefixed collectors, punctuation/spacing normalization, PRB01/PRB02 routing, base/parallel/manga/SP/distribution distinctions, exact English-language boundaries, and unique target evidence. The owner dry runs accepted 109,841 of 129,485 eligible Magic singles (84.83%) and 4,731 of 6,122 eligible English One Piece singles (77.28%); all residual ambiguity, collisions, sealed products, absent sets, and Japanese rows remain inactive. Active pointers remain null.

Settings now accepts the API token plus encrypted Magic and One Piece subscription CSV URLs. The daily routine accepts only HTTPS PriceCharting hosts, validates redirects, content, exact schema, and expected game, spaces CSV calls by ten minutes, stores immutable downloads, promotes each game atomically, and persists same-UTC-day success/failure state. One-shot and 06:15 UTC watch modes are ready. No URL was invented, no external download occurred, and no host scheduler was installed. Owner URL entry, supervised activation, Product Review, commit, push, and scheduler approval remain pending.

## 2026-08-01 — PriceCharting Bulk Evidence Import Architecture

The Product Owner directed Phronesis to devise the PriceCharting importing system before implementing a recurring routine, with One Piece and Magic intended as the next datasets after Pokémon. `PHR-STRUCT-20260801-007` assigns the architecture to `PHR-API-011`; implementation, recurrence, and additional games are not yet started.

The governed design preserves each CSV as an immutable SHA-256 receipt, validates an explicit schema contract, normalizes the full provider file into isolated staging, resolves identity through a versioned game profile, promotes only a complete collision-free one-to-one mapping set, and records independent append-only PriceCharting observations plus a deterministic coverage report. Dry-run is the default, apply is explicit, and an active-receipt pointer preserves last-good rollback. PriceCharting cannot write TCGplayer price lanes, artwork, or recommended-offer values; TCG Direct Low precedence remains unchanged.

A stricter second analysis identified a material collision boundary omitted by the initial row-level estimate. Although 19,163 PriceCharting rows were strong candidates across 16,329 Phronesis Pokémon SKUs, only 13,957 candidates are presently one-to-one and collision-free; 13,596 of those carry graded evidence. These are reconciliation benchmarks rather than automatic-match quotas, and the implementation resolver may accept fewer after stricter identity validation. Another 5,206 strong source rows converge on 2,372 targets and must remain quarantined until a physical-variant distinction or explicit provider-alias decision is proven. Coverage is therefore evidence-gated rather than percentage-driven.

The first implementation work order is ready for an owner-operated local Pokémon dry-run/apply importer in three Standard Lane slices. English sealed records stage but remain strict-gated. Authenticated daily acquisition, scheduling, review-console mutations, and separately audited One Piece and Magic profiles are deferred. Architecture is ready for Product Review; no product code, database migration, source import, provider transmission, commit, push, or deployment occurred in this phase.

## 2026-08-01 — Editable Purchase Cart

The Product Owner directed Phronesis to make the Vendor Workspace purchase cart editable by value and quantity and to add line removal. `PHR-STRUCT-20260801-006` assigns the bounded implementation to `PHR-UX-020`.

The existing server-backed operator cart remains authoritative. Exact lines now expose Unit purchase price and Purchase quantity; Bulk exposes Bulk total paid and optional Approximate count. Each line has explicit Save changes and Remove item controls. The update route validates positive integer-cent value, exact quantity from 1 through 1000, optional positive Bulk count, active event, workspace, and operator ownership. It preserves card/Bulk identity, condition, notes, recommendation, and market evidence. Unsaved UI changes block checkout, and reducing an exact quantity clamps a pending direct-to-Case quantity.

Live private review used one disposable, clearly labelled Black Lotus cart line. `$10.00 × 2` became `$12.34 × 3`, the saved subtotal persisted as `$37.02`, unsaved finalization was blocked, and reducing purchase quantity to one clamped Case quantity from three to one. Remove item returned the cart to its original empty state. No receipt, Event Ledger entry, Inventory lot, or Case allocation was created. At 390×844, document scroll width equalled client width, inputs/actions measured 44px high, and browser logs were clean.

Focused 16/16 and full 315/315 tests, TypeScript, warning-free ESLint, diff hygiene, and the Next.js 16.2.12 production build pass. Same-session conformance passes but is not independent Product Owner approval. Product Review, commit, push, and public deployment remain pending.

## 2026-08-01 — Sealed Readiness And Embedded Verification

The Product Owner directed Phronesis to dedicate the entire 100-credit daily PkmnPrices allowance to sealed Pokémon products from newest releases backward, move the recommended buying offer immediately above the cart in a compact expandable tile, research embedded certificate verification for PSA, Beckett, TAG, CCG/CGC, and other graders, and begin implementation. `PHR-STRUCT-20260801-005` assigns the release to `PHR-API-008`, `PHR-UX-019`, and `PHR-API-009`.

Phronesis now has a supervised PkmnPrices `/v1/sealed` worker. Open Pokémon set metadata determines release order; a durable UTC-day usage ledger, release/page cursor, provider-reported charge accounting, and exact 100-credit local ceiling survive retries and restarts. Provider records are staged locally and artwork resolves only through exact source-ID plus name/set corroboration or exact normalized name+set fallback. Missing credentials, 403 plan denial, rate limits, or malformed upstream data fail closed without diverting a credit to singles. The active private runtime has no `PKMNPRICES_API_KEY`, and official documentation restricts sealed access to Pro/Business, so no provider credit was consumed during verification.

The existing purchase-evaluation result now feeds a native disclosure directly above `Current purchase`. Its collapsed state shows the recommendation with small TCG Low and TCG Market evidence; expansion reveals Opening, Target, and Walk away. The previous large lower offer card was removed without changing calculations, actual-price defaulting, cart state, or receipt behavior. Live desktop review confirmed the tile in the adjacent checkout; a 390×844 viewport confirmed the compact responsive state.

Official-source research found a documented bearer-authenticated PSA public API and public web lookup forms for Beckett/BGS/BVG/BCCG, TAG, CGC, and SGC. No documented machine API was found for the latter providers. Phronesis therefore implements PSA behind a server-only `PSA_API_TOKEN` and registers every other grader as `OFFICIAL_API_REQUIRED`; unsupported selections issue no automated request and do not open a browser. `CCG` was interpreted as CGC, while BCCG remains under Beckett. No live PSA call occurred because the token is absent.

Combined focused 12/12 and full 314/314 tests, TypeScript, warning-free ESLint, diff hygiene, production build, and live responsive UI verification pass. Same-session conformance passes but is not independent Product Owner approval. Credential activation, Product Review, commit, push, and public deployment remain pending.

## 2026-08-01 — Adjacent Search And Checkout Workspace

The Product Owner directed Phronesis to place checkout/cart beside Vendor Workspace catalogue results so an event buyer can select cards, enter actual prices, and compose a cart without moving between distant page bands. `PHR-STRUCT-20260801-004` assigns the reversible layout increment to `PHR-UX-018`.

Vendor Workspace now has one primary responsive band containing Catalogue results and the single canonical `VendorCheckout`, with checkout receiving the wider desktop column. Snapshot evidence and Buying decision remain fully available in a secondary band. The Event station retains Purchase intake, Quick Sale, cart state, payment, Display Case routing, finalization, APIs, authorization, and transaction ownership. Its internal purchase split is delayed to the extra-wide breakpoint so nested minimum-width columns cannot overflow the new composition.

Live private review measured a 351px results column beside a 586px Event station at 1280px, with zero horizontal overflow. At 390px, results, checkout, evidence, and decision stack in that semantic order at 343px width with zero overflow. Focused 21/21 and full 305/305 tests, TypeScript, warning-free lint, production build, and private runtime pass. No business rule, API, database, dependency, event record, public deployment, commit, or push changed. Same-session conformance passes; Product Review remains pending.

## 2026-08-01 — Catalogue Verification Controls

The Product Owner requested a direct TCGplayer double-check for catalogue cards whose thumbnail is absent or questionable, plus a larger image on thumbnail hover. `PHR-STRUCT-20260801-003` assigns the bounded presentation-only increment to `PHR-UX-017`.

Vendor Workspace now builds a safely encoded public TCGplayer all-products search from the selected visible name, collector number, and set. The 44px external link opens in a new tab with `noopener noreferrer` and explicitly states that Phronesis selection remains unchanged. `CardThumbnailPreview` reuses canonical image candidates and the same-origin cache, renders above scroll containers through a fixed portal, clamps to the viewport, supports result hover plus selected-image focus/touch, and dismisses on Escape, blur, scroll, resize, or hover exit. Missing artwork remains a truthful placeholder and never blocks the TCGplayer link.

Live One Piece verification used the exact `OP16-022` Monkey.D.Luffy result. The preview measured 252×348 and remained contained at phone width with document scroll width equal to client width; the external link measured 44px and contained the expected encoded query. An initial development LCP warning from the on-demand large image was remediated by eagerly loading only the mounted preview; the final interaction produced no new warning/error. Full 305/305 tests, focused 10/10 remediation checks, TypeScript, warning-free lint, production build, private service, and diff hygiene pass. No external link was opened, provider API called, identity mutated, public deployment performed, or commit/push created.

## 2026-08-01 — One Piece Set-Code Search Resolution

The Product Owner reported that `OP13 booster` returned no result even though TCGplayer exposed Carrying On His Will sealed products, then approved implementation. Diagnosis proved that One Piece singles carry `OP13-*` collector numbers while sealed products carry the human set name and a blank collector number; the all-token FTS plan therefore had no row containing both literal `OP13` and `booster`.

`PHR-STRUCT-20260801-002` extends `PHR-UX-016` through one Fast Lane slice. Phronesis now derives OP/EB/ST/PRB code-to-title aliases from exact imported single-card collector numbers, requires at least two distinct products and a dominant semantically compatible title, excludes special-event/promotion/tournament authority, and fails closed on weak or contested evidence. The additive local alias table bootstraps existing databases and refreshes within One Piece imports. Multiword aliases flow through the same escaped FTS plan and phrase-aware scorer; all remaining query terms stay mandatory and explicit result selection is unchanged.

The active event catalogue derived 55 aliases: 17 OP, 3 EB, 33 ST, and 2 PRB. OP13 resolves to Carrying On His Will with 165 supporting base-set products versus a 3-product compatible runner-up. The live API and 390×844 Vendor Workspace return Booster Box, Booster Box Case, Booster Pack, and Sleeved Booster Pack for `OP13 booster`, show `Understood OP13 as Carrying On His Will`, retain 40 OP13 single results, and return zero for `OP13 Charizard`. Focused 19/19 and full 302/302 tests, TypeScript, warning-free lint, production build, private health, diff hygiene, zero horizontal overflow, and clean console pass. Same-session conformance passes but is not independent Product Owner review; no provider, source catalogue, selected identity, inventory, or public system changed.

The Product Owner then reported that `Monkey.D.Luffy OP16 022` matched while the equivalent unpadded `OP16 22` did not. The FTS index stored collector token `022`, so prefix retrieval discarded `22` before ranking. `PHR-UX-016` now canonicalizes bounded one-to-three-digit One Piece collector tokens to three digits before retrieval, visibly disclosing `Understood collector 22 as 022`. Live verification returns the same Normal and Alternate Art `OP16-022` identities for `22` and `022`, while `Zoro OP16 22` returns zero; all terms remain mandatory.

## 2026-08-01 — Pokémon And One Piece Artwork Readiness

The Product Owner asked Phronesis to fix missing catalogue thumbnails in one pass and anticipate the widest safe Pokémon and One Piece coverage before the next day's event. Runtime diagnosis proved the screenshot's `Mega Dragonite ex` assets existed in TCGdex, but TCGplayer's commerce title appended `- 152/217`; that longer string produced no provider search result. One Piece discovery also relied on the raw user phrase rather than visible collector identities, provider mappings were process-memory only, and a healthy zero-art result was labelled operational.

Under `PHR-STRUCT-20260801-001`, the accepted `PHR-API-004` objective was revised to normalize bounded discovery titles, query visible identities, persist complete-identity-guarded mappings, expose truthful `NO_MATCH`, and add explicit event prewarming. `PHR-TECH-007` now permits only a configurable bounded prewarm over verified local mappings, not an unbounded image crawl.

The active `.data/mobile-review.sqlite` reconciliation compared 43,732 Pokémon products with 23,444 TCGdex cards and 6,895 One Piece products with 4,450 deduplicated official Bandai cards. It retained 32,566 exact Pokémon and 3,224 exact One Piece product mappings. A 1,000-image priority hot set cached with zero failures. Unsafe earlier fallbacks for Prize Pack, prerelease, release-event, serial-numbered, tournament, manga, and other special products were removed; those products and unsupported sealed items remain placeholders unless an authoritative exact or curated image exists.

Focused 35/35 and full 300/300 tests, TypeScript, lint, diff, production build, private health, same-origin image, and 390×844 visual checks pass. The four exact Dragonite thumbnails render at natural width 245 with zero overflow; representative official One Piece images render at natural width 600 with no console errors. Same-session conformance passes but is not independent review. No pricing, inventory, credential, external account, public deployment, or upstream catalogue state changed.

## 2026-07-31 — Purchase-Fed Event Flip And Display Case Inventory

The Product Owner defined three operational inventory lanes. General Inventory remains the ownership, acquisition-cost, and broad sealed/supplies control. Every event Purchase must feed an Event Flip panel so a handler can sort exact cards, select several, edit intended Sale prices, and add them to a physical Display Case. Display Case must show what should be exposed, decrease through Sales, increase through purchase allocations, and support rapid end-of-event verification. Binder Inventory must be preserved as a later product lane.

`PHR-STRUCT-20260731-006` assigns `PHR-WORKFLOW-013` and `PHR-WORKFLOW-014`; `PHR-WORKFLOW-015` records Binder intent without premature implementation. Event Flip derives immediately from finalized receipt-backed Inventory rather than copying queue or ownership state. Exact `SINGLE` lots are actionable. Exact sealed, aggregate Bulk, and description-only manual Purchases remain visible but General-only until a separately approved itemization workflow establishes exact identity.

Display Case is a reserved allocation over owned lots. Allocation changes Case-reserved and generally available quantities but not total owned. Prepared Sheet stock remains a separate no-lot source presented beside event flips. Both Event Ledger Sale surfaces share one source-labelled picker. Explicit Case-linked Sales atomically update Case, the underlying General Inventory lot, the Event Ledger, and sold-item evidence; reversal restores both only when later General count evidence has not made restoration ambiguous. Handler price remains intended/list evidence, while the actual whole-Sale amount remains on the Event Ledger.

The implementation adds retry-safe allocation/return, append-only price/movement/count evidence, combined verification CSV, reservation-safe disposition/count/receipt-void guards, dedicated Event Flip and Display Case destinations, and owned/reserved/available presentation in General Inventory. Focused 6/6 and full 290/290 tests, TypeScript, lint, production build, diff hygiene, private health, desktop, and 390px no-overflow/clean-console gates pass. The browser review prompted a full-width phone search and conditional sticky batch bar so the empty state remains unobstructed. No live event was mutated. Product Review, commit, and push remain pending.

The Product Owner then approved a faster Vendor Workspace path: before finalizing an eligible exact-card purchase, the buyer may mark the cart line for Display Case and must enter its intended Case price. The receipt, receipt-backed Inventory lot, initial Case price, and Case reservation must commit together. Cards not selected for Case continue to surface in Event Flip, preserving that workflow as the sorting and exception queue.

The quantity amendment distinguishes acquisition from placement: an exact purchase may contain multiple copies, but direct Case quantity defaults to one and is independently editable only up to the purchased quantity. Any remainder stays generally available and continues to surface in Event Flip.

## 2026-07-31 — Event Stock Control And Intelligent Set Search

The Product Owner directed Phronesis to ingest human-maintained event stock from Google Sheets into local SQL, let sellers choose the exact option at Sale time from either Event Ledger surface, and produce sold plus expected-leftover/physical-verification evidence. The same direction required the catalogue search to understand intent at higher confidence after `Charizard v sh03` failed to find `SWSH03: Darkness Ablaze`.

`PHR-STRUCT-20260731-005` assigns `PHR-WORKFLOW-012` and `PHR-UX-016`. The implemented design uses an owner-scoped native Sheet with exact Item Name, Price, Quantity, Color, and Variation columns, explicit CSV export, strict validation, and a SHA-256-recorded immutable event manifest in local SQLite. Full Event Ledger and Vendor Workspace Quick Sale reuse one exact-option picker and the canonical Event Ledger transaction. Tracked Sale rows atomically append negative movements; reversal appends compensation. Manual lines remain explicitly untracked. Physical counts remain append-only observations, and reports separate whole-Sale actual amount, imported list price, expected leftover, counted quantity, and variance.

Catalogue retrieval and ranking now share one bounded, escaped intent plan. `SH03`, `SH3`, `SWSH03`, and `SWSH3` resolve as the same numbered-set intent, all other logical query tokens remain required, and the UI displays `Understood SH03 as SWSH03` without rewriting or auto-selecting catalogue identity.

The native Sheet, complete disposable import/Sale/count/report/reversal workflow, exact live SH03 result, 10,000-option median search of 29.93 ms, 284/284 tests, TypeScript, warning-free lint, production build, diff hygiene, private health, and 390px no-overflow/clean-console gates pass. No live user event was mutated. Authenticated live Sheet sync, global Inventory allocation, broader typo/OCR interpretation, external transactions, commit, and push remain outside this increment. Same-session Chief Architect conformance passes; Product Review remains pending.

## 2026-07-31 — Vendor Workspace Lite Event Ledger

The Product Owner directed Phronesis to let a buyer record an incidental Sale without leaving Vendor Workspace while retaining Event Ledger as the seller's panel. Both interfaces must feed the same event control.

`PHR-STRUCT-20260731-004` assigns `PHR-UX-015`. Vendor Checkout is now an Event station with default `Purchase intake` and `Quick sale`. The Lite mode records one overall Sale amount, one to 25 manually described item/quantity rows, payment method, and optional note through the canonical active event, authorized `/api/event-ledger`, validation, `PurchaseLedgerRepository`, idempotency, returned summary, and immutable activity. Event start, full activity, cash adjustment, reversal, correction, close, and reconciliation remain exclusively in `/event-ledger`; manual Sales do not mutate Inventory.

An isolated production-runtime review started a $100.00 drawer, entered a two-item $25.50 Cash Sale from Vendor Workspace at 390px, and observed $125.50 expected cash plus $25.50 gross sales immediately in both the Lite panel and full Event Ledger, including both sold-item descriptions. Purchase intake remained present, desktop and phone layouts had no horizontal overflow, required controls met 44px, and the browser console was clean. Full 279/279 tests, TypeScript, lint, production build, diff hygiene, and private-service health pass. Same-session Chief Architect conformance passes; Product Review, commit, and push remain pending.

## 2026-07-31 — Complete Phone Application Shell

During Event Ledger Product Review, the Product Owner asked where the rest of Phronesis was. Inspection confirmed a shared-shell defect: the persistent desktop sidebar was hidden below the `md` breakpoint, but the top bar offered no mobile navigation replacement. The operator could use the current workflow and Search but could not move to another Phronesis destination without editing the URL.

`PHR-STRUCT-20260731-003` assigns `PHR-UX-014`, which now passes the same server entitlement-filtered `navigationItems` list to the desktop sidebar and an accessible phone drawer. The drawer exposes Opportunities, Vendor Workspace, Event Ledger, Market Watch, Inventory, and Settings when authorized, preserves active-route state, and supports explicit close, backdrop, Escape, focus containment/restoration, body-scroll restoration, and automatic desktop-breakpoint dismissal. Search and User remain available at 390px.

Focused navigation tests pass 5/5 and the full suite passes 278/278. Standalone TypeScript, warning-free lint, production build, diff hygiene, private-service health, complete six-route phone navigation, 44–52px touch targets, zero horizontal overflow, desktop recovery, and zero-console-error checks pass. Same-session Chief Architect conformance passes; Product Review, commit, and push remain pending.

## 2026-07-31 — Event Cash Ledger Approval

The Product Owner approved replacing the purchase-only event operating experience with a frictionless Event Cash Ledger. Each event begins with an explicit opening cash amount and one event currency. Operators record Sales and Purchases throughout the event; payment method determines whether an entry affects expected drawer cash. Closing records actual counted cash and exposes the exact over/short variance.

The approved amendment requires every manual Sale to state what was actually sold and permits more than one manually described item in a single Sale. One Sale owns one overall amount plus one to 25 description/quantity item lines. Manual Sales are deliberately independent of catalogue and Inventory identity and do not decrement an Inventory lot. Existing evaluated purchases preserve immutable receipts and Inventory intake and gain one atomic linked cash-ledger entry, avoiding double entry.

`PHR-WORKFLOW-006` is reopened as an approved additive revision under `PHR-STRUCT-20260731-002`. Payment processing, customer CRM, tax, settlement, accounting export, profit claims, multi-currency events, and automatic manual-sale Inventory reconciliation remain outside scope. Implementation and validation proceed automatically through the canonical workflow; Product Review remains the acceptance gate.

Implementation now passes the complete 278-test suite after the separately documented `PHR-UX-014` phone-shell correction, standalone TypeScript, warning-free lint, production build, private runtime health, desktop review, and 390px no-overflow/minimum-touch-target review. Live workflow review proved a two-item cash Sale, a non-cash Purchase that did not alter expected drawer cash, and immutable closing variance; its disposable review records were removed at that gate. Same-session Chief Architect conformance passes. The feature remains Product Review pending and has not been declared CTO accepted.

## 2026-07-30 — LigaMagic/TCGplayer Acquired-Data Validation

The Product Owner deferred listing readiness to the backlog and made LigaMagic/TCGplayer arbitrage validation the immediate priority. Listing readiness is now bounded as `PHR-WORKFLOW-011`: readiness gates, internal reservations, price/margin evidence, draft review, and cancellation, explicitly excluding publication, payment, shipping, repricing, and settlement.

The acquired LigaMagic run `dry-run-20260730T203243818Z` was reconciled against pricing fingerprint `529fe0c52e646b1755700508acaa7580f18547668aae55324f224fd4a9262a9c`. An initial relaxed alias experiment was rejected after it produced unrelated-edition matches. Structural compatibility removed those mappings; price-distribution review then caught Japanese and Retro Frame qualifiers being lost. The accepted algorithm requires two or more unique anchors, one conflict-free target, structural label compatibility, and preservation of language/material-treatment qualifiers.

The accepted result is 71,954 exact plus 14,438 alias mappings: 86,392 matches (39.35% of supported Normal/Foil identities), 86,032 two-sided price pairs, 133,146 supported unmatched rows, zero ambiguities, and 109,763 quarantined Textless rows. Two consecutive builds produced fingerprint `ada5cb0288f45d16636bc3e34aab144709d0ff0b12c9eda629aa5ce6fcff20d2`. Arbitrage now uses delivered/listing TCGplayer evidence for US acquisition and market/listing evidence for US resale. The 261-test suite, TypeScript, warning-free lint, build, private restart, and live API pass. CTO accepts the data-validation checkpoint; candidates correctly remain `IDENTITY_VERIFIED` until owner costs and real executable availability are supplied.

## 2026-07-30 — Inventory Disposition Ledger

The Product Owner directed Phronesis to move on after Inventory reconciliation acceptance. The autonomous workflow selected the roadmap's next declared dependency: explain inventory leaving a lot before listing readiness. `PHR-WORKFLOW-010` adds explicit Sale, Loss, Damage, Transfer Out, and Correction records with known-quantity enforcement and mandatory reasons.

Disposition creation is workspace-idempotent and atomically decrements materialized operational quantity. Sales record gross proceeds plus optional channel/counterparty; transfers require a destination. Reasoned reversal restores quantity without deleting the original record, while a count revision blocks reversal after newer physical evidence. Receipt quantity, approximate intake, acquisition cost, provenance, and prior counts remain invariant. View-only users see the ledger without controls; mutations require `INVENTORY:OPERATE` and server-side ownership checks.

The supported suite passes 259/259, standalone TypeScript, warning-free lint, production build, and diff hygiene are clean. Private 1280×720 and 390×844 review passed with no horizontal overflow or console warnings; the tailnet Inventory route returns HTTP 200. No sample disposition or external transaction was created. Same-session Chief Architect conformance passes and CTO accepts the increment under `PHR-WORKFLOW-002`. Listing readiness is the next inventory maturity step; settlement, accounting, authentication activation, LigaMagic scheduling, and public deployment remain gated.

## 2026-07-30 — Inventory Location And Count Reconciliation

The Product Owner directed Phronesis to continue immediately after receipt-backed Inventory acceptance. The autonomous workflow selected the next declared maturity step: organize lots physically and reconcile counts without changing source receipts. `PHR-WORKFLOW-009` adds normalized workspace locations, visible Unassigned state, derived on-hand quantity basis, and reasoned append-only MOVE and COUNT events.

Operators with `INVENTORY:OPERATE` can atomically move a lot, record a non-negative physical count, or do both. A first count matching intake still establishes COUNTED evidence; an actual repeat no-op is rejected. Zero remains a visible discrepancy. Exact receipt quantity, approximate Bulk intake, acquisition cost, and receipt provenance remain invariant. Voided and foreign-workspace resources fail closed. View-only users receive the inventory view without mutation controls.

The supported suite passes 252/252, standalone TypeScript, warning-free lint, production build, and diff hygiene are clean, and the private 1280px plus 390×844 review passed without horizontal overflow or console warnings. No sample data was added to the live inventory. Same-session Chief Architect conformance passes and CTO accepts the increment under `PHR-WORKFLOW-002`. Sales/disposition rules, required authentication, LigaMagic scheduling, external transactions, and public deployment remain gated.

## 2026-07-30 — Receipt-Backed Inventory Intake

After official FX acceptance, the Product Owner directed Phronesis to continue the development roadmap. The autonomous canonical workflow selected the first Inventory Management capability because the already-approved event purchase ledger contained sufficient product intent and reliable source evidence. `PHR-WORKFLOW-008` now creates one workspace inventory lot per finalized receipt line without requiring duplicate operator entry.

Exact lots preserve catalogue SKU, printing, condition, quantity, unit and total acquisition cost, notes, operator, event, receipt, and timestamp. Bulk remains one aggregate lot with selected product lines and only explicitly approximate count/weight; Phronesis does not manufacture item identities. Checkout and intake are atomic, existing receipt lines reconcile idempotently, and administrative receipt voids preserve but deactivate linked lots with their reason. `/inventory` and `/api/inventory` require the assigned Inventory module and are workspace-scoped.

The supported suite passes, standalone TypeScript, lint, production build, and diff hygiene are clean, and private desktop plus 390×844 review passed with no console warnings or horizontal overflow. The persistent private service was restarted after build verification. Same-session Chief Architect conformance passes and CTO accepts the increment under `PHR-WORKFLOW-002`. Required authentication, daily LigaMagic scheduling, external transactions, and public deployment remain gated.

## 2026-07-30 — Automatic Official BCB PTAX FX

The Product Owner directed Phronesis to make regional FX automatic using official information. `PHR-API-007` now retrieves the latest Banco Central do Brasil PTAX closing USD quotation on authorized regional use, at most hourly, and preserves separate buy and sell evidence. US→Brazil costing uses the official sell quote; Brazil→US costing uses the official buy quote. The provider searches an eight-day period for weekend/holiday resilience, validates the response, coalesces concurrent work, and preserves last-good evidence with a sanitized error on failure.

The private JarvisSSD deployment persisted the July 30 close at buy 5.0733 and sell 5.0739 BRL/USD. Settings makes FX provenance read-only and retains only operating costs as owner inputs. All 245 tests, standalone TypeScript, lint, production build, diff hygiene, live API, desktop, 390px regional-panel, forced-refresh, throttle, and browser-console checks pass. Same-session Chief Architect conformance passes and CTO accepts the increment under the autonomous canonical workflow. Direction-specific costs remain unset, so actionable arbitrage is still gated. No LigaMagic schedule, credential, transaction, dependency, unofficial provider, or public deployment was introduced.

## 2026-07-30 — LigaMagic Authenticated Export Snapshot

The Product Owner defined LigaMagic pricing semantics (`Compra` is the consumer price paid to a store; `Venda` is the store's buy offer) and authorized one supervised export plus a complete non-scheduled dry run across the account's collections. The initial Playwright-launched persistent browser could not support the required login. Read-only inspection of the existing TCGPlayer Pricing Tool established its proven boundary: ordinary Chrome owns manual authentication, and Playwright attaches over CDP only after the saved session exists. Phronesis adopted that pattern without reading or copying Safari/default-browser cookies.

The supervised Lote 1 pilot completed with 9,396 rows and a sanitized trace of the authenticated collection-export POST. It also proved that LigaMagic's shorter `Padrão LigaMagic CSV` is a price-free 13-column format; Phronesis now requires the explicit 19-column collection-model export. A fail-closed Lote 19 discrepancy revealed that collection labels count physical quantity rather than rows: two byte-identical exports contained 8,865 rows whose `Quantidade` summed exactly to 8,938 advertised cards. The contract now records and validates both measures.

The final `PHR-API-005` dry run exported all 37 collections and reconciled 329,976 advertised cards across 329,903 rows. The merged snapshot contains 329,301 unique identities, 602 identical cross-collection duplicates, zero conflicting duplicates, and quantified `Compra`/`Venda` coverage. Raw source hashes, sanitized receipts, manifest, and SQLite evidence remain ignored and local. All 238 tests, standalone TypeScript, lint, diff hygiene, and production build pass. No credential, schedule, canonical pricing activation, scraping, marketplace mutation, push, or deployment occurred. The 03:00 schedule and arbitrage crosswalk remain separate authorization gates.

## 2026-07-30 — Authentication Configuration And Private Publication

### Source

Current CTO chat.

### User Intent

- Configure GitHub OAuth for the invite-only employee identity system.
- Bootstrap the initial owner identity.
- Commit, push, and deploy the accepted development checkpoint before continuing.

### Result

- Rotated authentication credentials are present only in ignored local configuration; no secret or runtime identity database entered repository history.
- The local identity schema is current and the initial owner invitation is pending a live GitHub callback.
- Authentication remains `OPTIONAL` until that callback and resulting owner membership are verified.
- The six-commit implementation branch through `f1a49c5` was pushed as `codex/phr-price-monitoring-20260730`; draft GitHub PR `#5` targets `main`.
- The launch-managed private JarvisSSD deployment was restarted and returned HTTP 200 through loopback and tailnet HTTPS. Five catalogue checkpoints report `CURRENT`, and OAuth initiation produces the canonical GitHub callback URL.

### Acceptance State

CTO authorized publication and private deployment. Canonical merge and required-auth activation remain gated on PR adoption and successful live owner sign-in respectively.

## 2026-07-30 — Store Championship Artwork, Provider Settings, And Login Gate

The Product Owner reported that intelligent catalogue search found the correct Store Championship Urza's Saga but its thumbnail remained blank, directed provider registration/enabling into Settings, and asked what was required to activate Employee login. The artwork failure came from using the user's qualified search text against Scryfall and then requiring equal set labels between Scryfall and the pricing catalogue.

`PHR-API-004-R1` now queries Magic by each visible canonical name and permits provider set-label drift only when exact name plus collector number yields one candidate. The Foil Store Championship SKU now returns and renders the verified Scryfall artwork; the separate Winner product remains a placeholder because no unique provider artwork is available. `PHR-UX-012` makes Settings the provider status/control surface and adds the exact employee-login checklist. Credential entry remains intentionally locked until authenticated owner-only encrypted storage exists, because compatibility mode treats every tailnet request as administrator. Full verification passes 234/234 plus type, lint, build, diff, private runtime, visual, and console gates. External GitHub OAuth application creation and credentials remain the user-controlled activation gate.

## 2026-07-30 — Card-Show Operations Improvement Program

The Product Owner approved autonomous implementation of the previously discussed improvement brief: repair Market Watch refresh, collect target/notes before manual tracking, lay module-scoped employee-login foundations, show recommended offer immediately, add an event purchase ledger with mixed Bulk, and recover missing sealed/First Partner artwork without false identity matches.

The completed program is `PHR-TECH-010`, `PHR-UX-010`, `PHR-ARCH-012`, `PHR-UX-011`, `PHR-WORKFLOW-006`, and `PHR-API-004` under `PHR-STRUCT-20260730-005`. GitHub remains the installed identity proof and required authentication is deliberately activation-gated; passkey lifecycle work is deferred to a separate security decision. Vendor operators may finalize their own receipts, while administrative voids are audited. Vendor Workspace keeps one-action tracking; the composer applies to manual/global additions.

Live verification repaired the reported Urza's Saga failure by reconciling its unique Scryfall “Store Championships” identity to the catalogue's “Game Day & Store Championship Promos” label and refreshing it to `$469.04`. A separate `server-only` import defect that terminated the four-daily observer was also corrected. All 232 tests, standalone TypeScript, lint, build, diff, and private runtime gates pass. JustTCG is configured but still explicitly disabled; eBay and CardTrader credentials are absent. The CTO accepted the completed program automatically under `PHR-WORKFLOW-002`; local feature-branch checkpoint `6c38c1f` was created and nothing was pushed or published.

## 2026-07-30 — Thumbnail Runtime Reliability Remediation

The Product Owner reported blank thumbnails for Mox Opal, Mulan, and several Pokémon results through the private phone review surface. Runtime diagnosis separated honest identity gaps from implementation defects. Scryfall successfully returned Mox Opal search identities but rejected Phronesis's Node image download with HTTP 400 `generic_user_agent`, which the same-origin image route surfaced as HTTP 502. Lorcast contained both requested Winterspell Mulan printings but treated the TCGplayer hyphenated partial title as search syntax and returned no records.

Under bounded `PHR-TECH-007-R1` remediation, provider image downloads now send a stable Phronesis User-Agent and Lorcana provider discovery derives a punctuation-safe query from the first exact catalogue result. Strict set/collector attachment, cache security, pricing, and buying logic are unchanged. The exact Mox request now returns locally retained HTTP 200 JPEG data; `Mulan - res` renders both strict Winterspell artworks. Twelve representative small/normal assets were prewarmed. The remaining Mox special variants and Pokémon foreign-language, code-card, sealed, or ambiguous records retain honest placeholders. Same-session Engineer and Chief Architect evidence passed; CTO accepted the patch for canonical adoption.

GitHub authentication was restored, and PR `#4` merged the remediation with the already accepted `PHR-UX-009` panel normally into `main` at `cd7363f7c0f7fc14c10558cc9569e976f2cc8663`.

## 2026-07-30 — Visible Phronesis Intelligence Panel

After completing Pokémon/Lorcana event readiness, the autonomous roadmap continuation assigned `PHR-UX-009`. Ready Snapshot evaluations now expose the existing Asset Assessment, evidence coverage, confidence, business conclusion, primary signals, opportunities, risks, and current Decision Resolver action. Detailed model evidence remains progressively disclosed through the established Intelligence Console; no intelligence score, formula, provider request, Strategy, Offer Ladder, or decision path was duplicated.

Focused checks pass 6/6, lint/build/diff and application TypeScript pass, the full suite retains exactly 17 established failures with three new passes, and standalone TypeScript retains only the 29 known `TS5097` errors. Desktop 1280px and mobile 390px browser reviews passed with a 44px disclosure target and no horizontal overflow. Same-session Designer and Chief Architect conformance pass. CTO accepted the exact patch for canonical adoption. Riftbound remains deferred.

GitHub PR `#4` merged the accepted panel normally into `main` at `cd7363f7c0f7fc14c10558cc9569e976f2cc8663` together with the bounded thumbnail reliability remediation.

## 2026-07-30 — Pokémon Improvement, Lorcana Activation, And Riftbound Deferral

The Product Owner explicitly deferred Riftbound and directed autonomous continuation through Pokémon improvement, Lorcana acquisition/ingestion, and then the already-approved roadmap. `PHR-TECH-008` added an explicit fail-closed Pokémon set-alias registry, improving representative Pikachu mappings from 12/40 to 25/40. A catalogue-only TCGplayer read produced a 30,531-row Lorcana receipt with SHA-256 `35cc2651ad5b88d6db9d32732652f6fe9dd03b1cf4220af728e4a1aec9cc2814`; 6,243 Lorcana products are now searchable in the private review database.

Runtime verification exposed and remediated a pre-existing local-cache gap: Lorcast returns AVIF, which the cache requested but rejected. Strict AVIF container-brand validation is now implemented; bounded Pokémon and Lorcana results were prewarmed locally. Focused 18/18, lint/build/diff, and desktop/mobile checks pass; the full suite retains exactly 17 established failures and standalone TypeScript retains only the 29 known `TS5097` test-import errors. Same-session conformance passes. Riftbound remains deferred, the dirty Pricing Update Tool repository was not changed, and the next approved product increment is the visible Phronesis Intelligence panel after canonical adoption.

GitHub PR `#3` adopted the exact reviewed patch into `main` as merge commit `a7891cf574aaf05fb4da8ddf7559448c9c1619de`. The private desktop/phone service restarted successfully with its tailnet-only mapping intact; deployed API checks returned 25 strict Pokémon mappings, 30 Lorcana mappings, and Lorcana `CURRENT` at the verified checkpoint. PHR-TECH-008 is complete.

## 2026-07-29 — Product Review Acceptance And Deployment Authorization

The Product Owner accepted the current interdependent Product Review tree, including `PHR-WORKFLOW-004`, `PHR-TECH-005`, `PHR-TECH-006`, `PHR-UI-002`, `PHR-API-002`, `PHR-UX-008`, and `PHR-TECH-007`, and instructed Phronesis to deploy it and continue development. GitHub PR `#1` merged the accepted implementation into `main` at commit `8ed1b98da2879f44976b008e6991588d78f4f49e`; the canonical checkout matched `origin/main`, and the existing private desktop/phone service returned HTTP 200 after merge. Public hosting, Pricing Update Tool mutation, provider-wide bulk acquisition, unofficial Riftbound assets, and new external credentials remain outside that authorization.

## 2026-07-29 — Official Bandai One Piece Artwork And Durable Local Cache

The Product Owner instructed Phronesis to consider Bandai authorization given and requested local image retention. Under `PHR-STRUCT-20260729-006`, the official Bandai English card list became the operational One Piece identity/artwork source and Scrydex became fallback-only. `PHR-TECH-007` adds a same-origin, exact-allowlist durable raster cache under ignored `.data/artwork/` storage; authorization provenance, source identity, retrieval time, length, MIME, and hashes are retained without credentials.

Strict set, card-number, normalized-name, and explicit base/parallel/reprint/SP evidence control matching. Ambiguous variants continue to show placeholders, and artwork cannot change snapshot prices or buying decisions. The 12 unique official artworks mapped by the active `luffy` event search were prewarmed. Focused checks pass 23/23, lint/build/diff checks pass, desktop and 390px phone review pass, and the full suite remains at the unchanged 17-failure baseline with seven additional passing tests. Status is **PRODUCT REVIEW READY**; no upstream mutation, bulk provider catalogue acquisition, commit, push, deployment, or publication occurred. Riftbound remains gated on Riot approval and an app-specific key.

## 2026-07-29 — Cross-Game Thumbnails, Unified Search, And Artwork-First Variants

### User intent

- Find trustworthy thumbnail providers for Pokémon, Lorcana, One Piece, and Riftbound.
- Remove manual catalogue switching; search should automatically cover the relevant catalogues.
- When thumbnails do not visually distinguish finishes, show one result per unique artwork and select foil/holofoil/other finish after choosing the card.
- Determine whether Phronesis Intelligence already has a roadmap for the buying decision dashboard.

### Decisions and implementation

- Assigned `PHR-API-002` and `PHR-UX-008`.
- Connected Pokémon through TCGdex; retained Lorcast for Lorcana and Scryfall for Magic.
- Approved Scrydex as the One Piece candidate subject to Product Owner-owned credentials/terms; required Riot's official API for Riftbound subject to app approval/key.
- Implemented one five-category search, visible game badges, deterministic artwork grouping, and exact Finish-before-Condition selection.
- Registered Lorcana and Riftbound for future verified upstream receipts without changing or triggering the Pricing Update Tool.
- Confirmed that Phronesis Intelligence already executes inside `evaluatePurchase`; documented a separate recommended visible panel that reuses current engine outputs.

### Acceptance state

Implementation, focused verification, desktop/mobile Designer review, and same-session Chief Architect conformance are complete. The package is Product Review ready. Product Owner acceptance, canonical adoption, commit, push, deployment, publication, One Piece credential activation, and Riftbound Riot approval remain pending.

## 2026-07-29 — Event Snapshot Activation And Thumbnails

The Product Owner directed immediate acquisition of the freshest possible snapshot data for the August 1 event and requested thumbnails. Under `PHR-STRUCT-20260729-004`, Engineering recovered the completed July 29 18:20 cycle through read-only local Postgres exports because the observer began after the transient CSVs had been deleted. Magic, Pokémon, and One Piece are now active in the isolated review repository, source evidence is archived, and the persistent observer is following future four-daily completions. The upstream schedule, code, database rows, inventory, prices, and publication behavior were not changed and no extra run was triggered.

`PHR-UI-002` adds fixed thumbnail slots and non-blocking strict Scryfall matching for Magic. The source catalogues supplied virtually no image URLs, so Pokémon and One Piece retain honest placeholders pending an approved identity artwork provider. Focused tests pass 14/14, lint/build/diff checks pass, the full suite retains its established 17 failures, standalone TypeScript retains only the established 27 `TS5097` errors, and desktop/390px review passed without horizontal overflow. Same-session conformance is complete and status is **PRODUCT REVIEW READY**; no commit, push, deployment, public release, or price/inventory mutation occurred.

## 2026-07-29 — PHR-TECH-005 Private Mobile Review Access

The Product Owner requested a quick way to follow and review Phronesis from a phone while away from the Mac. Tailscale was already installed, online, and serving two unrelated private endpoints. Engineering added a third, isolated private handler on HTTPS 9443 that proxies only a loopback Phronesis review server on 3100. A per-user LaunchAgent keeps the review server alive and recovered successfully after a forced child-process termination. The exact private URL passed TLS, 390x844 rendering, stale-data disclosure, catalogue search, lint, focused tests, build, and diff checks. Funnel, public deployment, anonymous access, credentials, existing handlers, commit, push, and live-data activation were untouched. The Mac must remain awake and online, and the phone must join the same tailnet.

## 2026-07-29 — PHR-WORKFLOW-004 Snapshot-Powered Vendor Workspace

### Product intent

The Product Owner directed Phronesis to merge the former Vendor Workspace concept with the new snapshot approach, follow Pricing Update Tool catalogue downloads at their existing four-daily cadence, and pivot the primary device from phone to desktop while retaining mobile as a backup. The autonomous canonical workflow was authorized through implementation, bounded remediation, Designer review, and Chief Architect conformance, with Product Owner interaction reserved for the visible Product Review gate or critical risk.

### Result and decisions

- Assigned `PHR-WORKFLOW-004` under Structure `PHR-STRUCT-20260729-002`.
- Pricing Update Tool remains the schedule/acquisition owner; Phronesis follows verified completion checkpoints read-only.
- Magic, Pokémon, and One Piece catalogues share one strict adapter/repository/search boundary.
- `/vendor` is the desktop-first buying station; `/price-lookup` remains a shared-data compatibility surface.
- Exact snapshot evidence feeds the existing Business Profile, evaluation, offer-ladder, and decision engines.
- Imports are transactional, fail-closed, last-good preserving, and idempotent per completion; later identical catalogues still advance freshness.

### Acceptance state

Implementation, deterministic verification, real-catalog performance, desktop/mobile runtime review, Designer conformance, and Chief Architect conformance are complete. Focused tests pass 34/34, lint/build/diff checks pass, and a 792,927-row Magic catalogue imports in under 15 seconds. The supported full suite reproduces the established 17 behavioral failures, and standalone TypeScript reproduces the established 27 `TS5097` errors. Status is **PRODUCT REVIEW READY**. No commit, push, deployment, public release, or live production data activation has occurred; Product Owner acceptance remains required.

## 2026-07-28 — PHR-UX-007 Bridge-v34 VoiceOver Isolation Recovery

The Product Owner directed canonical Debugger recovery for the preserved assignment `019fa79e-34a1-75e9-9516-99399a01cbcf`. The latest compact-native matrix was rejected as product-defect evidence because its first run was interrupted while system VoiceOver was enabled and its fourth run inherited that device-wide state, preventing ordinary scrolling semantics. Jarvis bridge v34 now verifies VoiceOver OFF before and after every serialized native scenario and enforces finite 120/180-second allowances. Debugger preserved every product change, the authority artifacts, and the assignment identity; no fresh reproducible Phronesis defect justified another source edit. Acceptance remains pending one fresh bridge-v34 matrix, followed by Designer and Chief Architect conformance if it passes.

## 2026-07-28 — PHR-UX-007 Compact Native Evidence Recovery

The latest authority-receipted Worker generation passed complete web semantic evidence and genuine native VoiceOver utterance capture. Its compact iPhone run failed `testSealedExpansion`: the expander remained at approximately y=904 below the viewport, eight 0.08-second drags left the scroll indicator at 0%, and accessibility exposed only the 20-point text-label frame. Debugger fingerprint `phronesis/runtime-evidence/policy-v31-compact-sealed-expander-noop-scroll-v1` now gives the label a full-width 44-point hit target and uses re-resolved interior coordinates with a 0.2-second hold inside the owning `ScrollView`. Focused pricing tests, runtime-evidence preflight, and diff validation passed; native runtime conformance remains unclaimed until serialized Mac Worker validation. No customer-facing pricing behavior changed. The preserved assignment then returns to Designer and Chief Architect conformance if fresh evidence passes.

## 2026-07-28 — PHR-UX-007 Decision-Critical Spoken Semantics Repair

Fresh conformance review accepted the Worker generation's authority and artifact integrity but found that web and native spoken evidence omitted decision-critical result content. Engineering added complete semantic result summaries on web, replaced truncation-prone combined native cards with separately traversable facts, strengthened genuine VoiceOver transcript assertions, and made the VoiceOver test plus complete result content mandatory in the Worker contract. Deterministic checks pass. Accessibility conformance remains unclaimed until a fresh internally coherent serialized Mac Worker generation supplies matching immutable artifacts and hashes.

## 2026-07-28 — Mobile Pricing Lookup

### Source And Intent

Jarvis assignment `019fa79e-34a1-75e9-9516-99399a01cbcf` supplied an approved Product Brief, Chief Architect Structure, and Designer Direction. Ramon needs a phone-first, one-lookup delivered-price reference for English Pokémon singles and sealed product, with movement history and explicit uncertainty.

### Decisions And Scope

- Assigned `PHR-UX-007`.
- One strict file-contract importer and row model serve singles and sealed products.
- SKU plus condition is the price identity; collector number is search-only.
- Change-only SQLite history, FTS-backed repository boundaries, configurable categories and thresholds, market-price movement, and strict sealed-shipping rules preserve the approved architecture.
- Initial bounded configuration is `$20` asking-price threshold, seven-day stale threshold, and `$1.27` assumed single shipping.
- No live extraction, recommendations, fees/profit, deployment, credentials, external mutation, or Pricing Tool change is authorized.

### Dependencies And Acceptance State

The required 200%/400% zoom remediation was strengthened after review: pointer-media emulation is no longer used as the Worker gate. Explicit non-shipping zoom scenario URLs place only the Singles condition panel in normal flow, preserving sticky search and ordinary sticky phone behavior. Focused tests, preflight, scoped lint, and production build pass; fresh serialized Mac Worker evidence is still required before zoom or final conformance can be claimed.

Policy-v26 evidence was internally coherent but did not prove web reduced-motion or increased-contrast behavior and attributed contrast only to native evidence. Engineering added explicit scoped web media-query behavior and a stricter target contract requiring separate web diagnostics, screenshots, and web-scoped manifest results. Focused deterministic checks pass. Final conformance still requires a fresh serialized Mac Worker generation and matching authority receipt; prior evidence was not altered or promoted.

Fresh host evidence subsequently reproduced `testSealedExpansion` at its pre-tap hittability assertion across accessibility-environment runs. The UI test had been swiping the application container rather than the SwiftUI scroll view that owns the expander. Engineering narrowly redirected the bounded scroll loop to that owning scroll view, used slow settled gestures, and added the runtime hierarchy to any remaining failure diagnostic. Product behavior is unchanged and fresh serialized Mac Worker execution remains required.

Engineering implementation and deterministic repository checks are complete. Fresh host-preflight remediation added a local Next.js evidence entry point, a non-shipping executable iOS app/UI-test host, and a project-native machine-readable preflight harness. A subsequent visual retry produced no captures while preserving the assignment. Debugger recovery verified the evidence route in the compiled manifest, pinned the evidence server to Webpack, and added an explicit readiness contract for the isolated browser.

The preserved policy-v10 evidence generation then misclassified web and iOS as not applicable despite listing both in its changed-surface plan and requested a local web entry point that already existed. Later generations reached the route and exercised native targets. Policy v14 is nevertheless rejected as final authority because its referenced server-log hash does not match the artifact, its focus artifact reports the Singles condition selector without visible focus while the manifest says the check passed, and its claimed web screen-reader pass cites only iOS accessibility nodes. Engineering added an explicit selector focus outline and made separate hashed web focus and screen-reader artifacts mandatory in the target contract. One fresh internally coherent serialized Mac Worker generation remains required, and no runtime pass is claimed. Production import certification is blocked on a representative sanitized Pricing Tool export plus authoritative schema/version; columns were not guessed. Locked dependencies were restored offline, relevant local Next.js 16.2.10 guides were read, focused tests/lint/build passed, and the full suite retained its documented 150-pass/17-failure baseline. Designer/Architect conformance and CTO acceptance have not occurred.

Policy v15 then captured keyboard and focus traversal against Next.js's HTTP 500 error document after the evidence server logged an incomplete generated JSON read. Engineering isolated Worker output from ordinary Next.js activity by pairing `JARVIS_RUNTIME_EVIDENCE=1` with `.next-evidence` and made repository preflight enforce both sides. The rejected generation remains historical evidence; fresh Worker execution is still required.

Fresh host review subsequently returned keyboard-operation and visible-focus failures without diagnostics. Engineering added a scoped focus-visible fallback with forced-colors behavior and made separate diagnostic-bearing keyboard and focus artifacts mandatory in the Worker contract. Deterministic checks pass, but runtime conformance remains unclaimed until the Worker produces one fresh coherent generation.

Fresh host evidence later declared 18 native controls but recorded zero forward and reverse Tab targets, so visible focus had no reachable control to inspect. Engineering added a bounded fallback that waits for native Tab behavior and advances in logical DOM order only when focus remains unchanged, plus an opaque `:focus` treatment alongside `:focus-visible`. Repository preflight now guards both repairs. Fresh serialized Mac Worker evidence remains required; no runtime pass is inferred from source.

The next fresh host generation still declared 18 controls but observed zero forward and reverse Tab targets. The unchanged-focus fallback had completed from a zero-delay `keydown` timer, allowing the serialized runner to inspect focus first. Engineering moved unchanged-focus completion to synchronous `keyup` handling while retaining native traversal and a short missing-keyup safeguard. The opaque focus treatment is unchanged. Deterministic verification passes, but keyboard and visible-focus conformance remain unclaimed pending fresh Worker evidence.

Policy v20 again returned `keyboard_operation: fail` with `no diagnostic`. Because focused product checks passed and the host supplied no actionable product trace, Engineering did not mutate lookup behavior blindly. The Worker handoff now requires structured forward/reverse traversal and activation traces plus non-empty failure diagnostics naming the control, key, before/after states, and page URL. Fresh serialized evidence remains required.

Policy v19 then returned contrast and keyboard-operation failures without top-level diagnostics. Its underlying artifacts demonstrated six command-palette labels at 4.12:1 and Space-key failures on Price Lookup disclosures. Engineering raised those labels to zinc-400, added explicit Space operation to the disclosures, and made non-null contrast, keyboard, and focus diagnostics mandatory. Focused checks and production build pass; a fresh serialized generation is still required.

Designer review of a fresh coherent generation then found four bounded defects: only one sealed row appeared before the compact expander, the error scenario also rendered the loaded-category empty state, the search focus artifact lacked a visible indicator, and the large-iPhone evidence used only a special accessibility environment. Engineering restored the approved two-row sealed cap, made error and empty states mutually exclusive, added an explicit opaque search focus outline/ring, and split baseline versus accessibility large-iPhone Worker requirements. Fresh runtime conformance remains unclaimed pending the next serialized generation.

The next host generation's top-level iOS summary obscured two actionable per-device failures. Its compact-iPhone log identified a too-small `pricing-search` hit area, while its failed VoiceOver transcript began in the unrelated Coin app because system assistive focus was not reset after service activation. Engineering gave the evidence-host search field an explicit 44-point target, reactivated and foreground-verified Phronesis before VoiceOver traversal, and added preflight guards for both repairs. Focused checks, lint, and the production build pass; the full-suite and standalone-TypeScript baselines are unchanged. Fresh serialized Mac Worker evidence remains required, so no runtime acceptance is claimed.

Fresh web zoom evidence then failed at 200% and 400%. Its diagnostics ruled out horizontal overflow and isolated every failure to the sticky Singles condition panel covering the Singles heading or first card identity. Engineering added a fine-pointer CSS reflow fallback for the Worker's 640px and 320px desktop zoom viewports while retaining sticky behavior on coarse-pointer phones, updated the evidence contract, and added deterministic guards. Fresh serialized Mac Worker evidence remains required; rejected artifacts are diagnostic history only.

This ledger preserves material product-development context across chat sessions. It does not claim to be a verbatim transcript unless a transcript is explicitly attached and identified. Never store credentials or unnecessary sensitive information here.

## 2026-07-31 — Independent Event Employee Permissions

The CTO directed that Event Ledger and Event Flip be individually selectable for employees in Settings. `PHR-ARCH-012` was enhanced with first-class `EVENT_LEDGER` and `EVENT_FLIP` permissions across invitation editing, timed worker access, navigation, pages, and APIs. Existing Vendor Workspace and Inventory assignments migrate to the corresponding event permission at the same access level to prevent surprise access loss.

## 2026-07-31 — Timed Event Worker Login

### User Intent

- Let event workers access Phronesis for the duration of an event using a system-generated code and no external account.

### CTO Direction

- Assigned `PHR-ARCH-014`: a separate event-bound authentication path with one-time codes, narrow operational module assignments, automatic expiry/event-close invalidation, and owner revocation.
- Permanent GitHub identity remains mandatory for owner/administrator operations; temporary workers never receive Administration or permanent membership.

### Acceptance State

Implemented locally; verification is in progress. Production enforcement remains gated on transition from OPTIONAL to REQUIRED authentication mode.

## 2026-07-28 — Canonical Repository Reconciliation

### User Intent

- Confirm that development from JarvisSSD is connected to GitHub and adequately documented.
- Reconcile the canonical repository after review found unpublished commits, uncommitted governance and relocation records, new shared-workflow artifacts, and stale completion metadata.

### CTO Direction

- Assign `PHR-WORKFLOW-003` to the shared master-workflow adoption and `PHR-TECH-004` to repository reconciliation.
- Operate only from `/Volumes/JarvisSSD/Projects/Phronesis`; retain the former checkout and migration evidence as rollback.
- Record npm as canonical, preserve pnpm artifacts locally without committing them, and exclude `.DS_Store` noise.
- Reconcile documentation, verify the known baseline, create intentional commits, and publish ordinary `main` without rewriting history.

### Acceptance State

Accepted. Documentation and ownership were reconciled under `PHR-TECH-003`, `PHR-WORKFLOW-003`, and `PHR-TECH-004`. Lint, diff hygiene, and Git integrity passed. The supported suite remained at 142/159 with the same 17 behavioral failures, and standalone TypeScript retained the same 27 `TS5097` errors. Commit `b96450b` published the four previously local July commits plus the reconciliation checkpoint to `origin/main` through an ordinary fast-forward. No force push, history rewrite, deployment, dependency installation, rollback cleanup, pnpm deletion, or secret publication occurred.

## 2026-07-28 — PHR-UX-007 Development-Chrome And Stale-Date Repair

Authoritative rendered review rejected otherwise coherent evidence because the Next.js development indicator covered narrow-layout product controls and result text, while the stale scenario showed conflicting category and row snapshot dates. Engineering disabled the indicator only for the isolated evidence runtime, aligned every visible stale fixture price with category-scoped freshness, and added deterministic source/preflight guards. Fresh serialized Mac Worker evidence remains required; production import certification remains blocked on the authoritative sanitized Pricing Tool export schema.

## 2026-07-28 — PHR-UX-007 Sealed Expansion Evidence Repair

Fresh serialized Mac Worker evidence failed the native sealed-expansion UI test. Engineering preserved the assignment and repaired the bounded evidence interaction: the disclosure now toggles explicitly, and the test re-resolves its stable accessibility identifier after SwiftUI inserts the third card and changes the control's frame. Repository-owned deterministic checks cover the contract. No runtime conformance is claimed until the Mac Worker reruns the native target; production import certification remains blocked on the authoritative sanitized export schema.

The next serialized run still failed `testSealedExpansion`. The remaining stale handle was the element captured before the bounded scroll: the test re-resolved only after activation. Engineering now queries by stable identifier throughout scrolling, re-resolves immediately before tapping, asserts the control is hittable and exposes the expected `collapsed` label/value, then independently re-resolves the post-insertion `expanded` state. Deterministic source checks cover both re-resolution boundaries. Fresh serialized evidence remains required.

## 2026-07-28 — PHR-UX-007 Policy-v31 Evidence-Contract Repair

Designer conformance confirmed the authority receipt and all referenced hashes but rejected incomplete zoom diagnostics, a development-runtime-contaminated and duplicate-heavy web spoken sequence, and inconsistent accessible names in keyboard/focus artifacts. Engineering added explicit names for the lookup and condition controls and strengthened the repository-owned Worker contract to require complete zoom measurements and clean product-rooted semantic reading order. No rejected evidence was promoted or modified. Fresh serialized Mac Worker evidence remains required, and production import certification remains blocked on the authoritative sanitized export schema.

Fresh review then showed the zoom artifacts could still report pass with null controls and empty identities while exposing only aggregate zero-intersection counts. Engineering added stable SKU/value probes to every rendered result identity and replaced prose-only zoom diagnostics with an exact schema requiring unique visible controls, positive control/result/field bounds, at least one non-empty identity, and explicit search/condition intersection outcomes for every identity. Runtime conformance remains unclaimed pending a new coherent Worker generation and matching authority receipt.

## 2026-07-28 — PHR-UX-007 Mandatory Zoom Remediation

Fresh review required a source change rather than another evidence-only retry. Engineering found that zoom CSS made search static while its rendered element still carried sticky utility classes, allowing host tooling to continue treating it as an overlay. The bounded repair now structurally removes sticky classes from both search and the Singles condition panel during 200%/400% reflow, exposes separate reflow markers, and requires fresh Worker diagnostics to prove both controls are static/non-sticky, non-intersecting, and free of horizontal overflow. Ordinary phone layouts retain sticky controls. Runtime conformance remains unclaimed pending a fresh serialized Mac Worker generation.

Fresh review kept 200% and 400% zoom failed because sticky/fixed controls could obscure decision content. Engineering found the current zoom CSS also put search into normal flow, contradicting the approved Designer Direction. The bounded repair now keeps search sticky while structurally removing sticky positioning only from the Singles condition panel. Deterministic tests and the Worker preflight require sticky search, static/non-sticky condition state, zero condition/result-identity intersections, and zero horizontal overflow. Focused tests, scoped lint, preflight, diff validation, and production build pass; the established full-suite and standalone-TypeScript baselines are unchanged. Runtime zoom conformance remains unclaimed until a fresh internally coherent serialized Mac Worker generation supplies matching immutable artifacts and hashes.

The final Engineer pass found obsolete search selectors still present in all zoom CSS paths and a Worker contract that still expected `position: static`. Those selectors were removed, the contract now requires sticky search plus zero search/result intersections, and the conflicting Designer text was reconciled. Focused tests passed 10/10, preflight/scoped lint/diff/build passed, and the full suite and standalone-TypeScript checks reproduced the established 152-pass/17-failure and 27-`TS5097` baselines. Fresh Worker evidence remains the conformance gate.

The next authority-receipted generation reached the Price Lookup and passed every recorded web and iOS check except web screen-reader output, whose source accessibility tree was empty and named zero nodes. Debugger recovery identified the repository contract error: `Accessibility.getPartialAXTree` with relatives disabled cannot supply a descendant subtree. The contract now uses `Accessibility.queryAXTree` on the unique `.pricing-lookup` backend node within the navigation page-target session, records query provenance, reconstructs AX order from relationships, and rejects empty output. No customer-facing behavior changed; the same assignment returns to serialized Mac Worker validation before Designer conformance.

## 2026-07-26 — Autonomous Canonical Workflow Direction

### Source

Current CTO chat.

### User Intent

- Preserve the CTO -> Chief Architect -> Engineer workflow while eliminating manual role-by-role prompting.
- Continue approved work autonomously and request user interaction only when critically risky input or a materially consequential product decision is required.

### CTO Direction

- Amend `PHR-WORKFLOW-002` so gates are evidence checkpoints rather than conversational permission prompts.
- Automatically perform role handoffs, bounded remediation, conformance review, and final memory updates within the approved objective.
- Preserve user control over irreversible destruction without recovery, production/public changes outside the objective, secrets and security, force-push/history rewriting, material financial or legal exposure, suspected loss/corruption, and unresolved choices that materially change the requested outcome.
- Do not treat ordinary validation failures, reversible implementation choices, or recoverable migration phases as critical escalation by themselves.

### Acceptance State

Workflow governance updated and effective for subsequent Phronesis work. The role boundaries and documentation-first contract remain mandatory; repeated `Prompt`, `Implement`, `Review`, and `Final Review` commands are no longer required after objective approval.

## 2026-07-26 — Repository Relocation Direction

### Source

Current CTO chat.

### User Intent

- Move Phronesis from `/Users/ramonnogueira/Developer/Phronesis` to `/Volumes/JarvisSSD/Projects/Phronesis` without manually moving or renaming project content.
- Use the most reliable automated method and preserve a rollback path.

### Confirmed State

- The destination exists and is empty.
- JarvisSSD has sufficient capacity.
- The source Git repository is healthy, four commits ahead of `origin/main`, and contains two intentional untracked pnpm artifacts.
- Dependency symlinks and complete local Git state require preservation.

### CTO Direction

- Assigned permanent Feature ID `PHR-TECH-003`.
- `PHR-STRUCT-20260726-001` authorizes a Chief Architect migration specification and Engineer work order only.
- The required strategy is staged copy, verification, atomic cutover, new-path validation, and retention of the source as rollback.
- Migration execution, deletion of the source, push, publication, and external access remain unauthorized pending later CTO gates.

### Acceptance State

Chief Architect specification and Engineer prompt completed. The CTO approved the architecture and `PHR-STRUCT-20260726-002` authorizes execution phases 1–6: preflight, backup/evidence, staged copy, staged verification, atomic cutover, and offline validation. Because the active Codex task remains sandboxed to the old workspace, documentation-path updates are deferred until the user reopens Codex at the destination. Source cleanup, commit, push, publication, dependency installation, and network access remain unauthorized.

Attempt one created and verified the Git bundle but produced an incomplete 1.6 MiB staging copy with only 53 files, an incomplete `.git`, missing dependency content, and broken symlinks. Attempt two correctly classified volatile Codex refs but Apple `rsync -E` again failed on healthy provenance-tagged Git content. Both failures were preserved under quarantine.

The autonomous workflow issued bounded remediation through `PHR-STRUCT-20260726-005`: a macOS pax archive copied the repository while excluding only root `.next/`. Attempt three verified 42,248 files and 811,862,702 bytes, exact Git and content state, zero broken symlinks, matching required metadata, and no missing source extended attributes. `PHR-STRUCT-20260726-006` authorized and completed atomic cutover.

The canonical checkout is now `/Volumes/JarvisSSD/Projects/Phronesis`. The old `/Users/ramonnogueira/Developer/Phronesis` checkout remains intact as rollback. Backup bundles, archives, evidence, and both failed-stage quarantines remain preserved. Offline validation passed Git integrity and lint; the full suite remains at the documented 142-pass/17-failure baseline, and standalone TypeScript retains the documented 27 `TS5097` errors. No dependency installation, network access, commit, push, deployment, source cleanup, or compatibility symlink occurred.

## 2026-07-22 — Checkpoint Stabilization Direction

### Source

Current CTO chat.

### User Intent

- Structure the July 22 stopping-point summary as the next Chief Architect assignment.
- Stabilize and review the uncommitted checkpoint before selecting another product feature.

### CTO Direction

- `PHR-STRUCT-20260722-002` authorizes a read-only Chief Architect conformance review of the complete current working tree under `PHR-WORKFLOW-002`.
- The Architect must reconcile the user-provided historical snapshot with later `PHR-UX-006` and Structure-isolation changes.
- The Architect must return readiness evidence, remediation needs, and a proposed commit/publication sequence.
- Commit, push, deployment, publication, and selection of the next product feature remain unauthorized.

### Acceptance State

Chief Architect review completed with verdict `REQUIRES ENGINEER REMEDIATION`. The CTO accepted the verdict and authorized bounded local verification/test-infrastructure remediation under `PHR-STRUCT-20260722-003`. Engineer evidence was returned, including a supported full-suite command, correction of `TS2367`, package-manager analysis, and truthful disclosure of 17 behavioral test failures, 27 existing `TS5097` errors, and the restricted build environment failure. Final conformance under `PHR-STRUCT-20260722-004` returned `READY FOR CTO ACCEPTANCE`; the remaining failures were classified as visible baseline debt rather than July 22 regressions. The CTO accepted the local checkpoint and `PHR-STRUCT-20260722-005` authorized hunk-level staging plus exactly four local commits. Commit verification found that the four unpublished commits had the correct order and final tree but the governance commit absorbed identity and navigation hunks from shared documents. `PHR-STRUCT-20260722-006` now authorizes a recoverable reconstruction using an exact safety branch and mixed reset. Push, publication, deployment, dependency installation, external access, and product-scope expansion remain unauthorized.

## 2026-07-22 — Structure Command Project Isolation

### Source

Current CTO chat and user-provided screenshot of a Phronesis Chief Architect task.

### User Intent

- Fix the Chief Architect workflow after a bare `Prompt` command resolved to a Muamba Arte Structure document instead of Phronesis authority.

### Confirmed Problem

- Phronesis had role contracts and product memory but no repository-owned canonical Structure file.
- A separate Chief Architect task therefore followed an ambiguous Structure reference, found `CTO-STRUCT-20260722-002` for Muamba Arte, and correctly refused to invent Phronesis scope—but used the wrong source to reach that refusal.

### Decisions

- Extend `PHR-WORKFLOW-002` with strict project isolation.
- Make `docs/product-development/CURRENT_CTO_STRUCTURE.md` the only Phronesis source for bare role commands.
- Require Phronesis identity, repository-root, `PHR-` prefix, and readiness checks before prompts or implementation.
- Reject Muamba Arte, `MA-*`, and other cross-project artifacts unless the CTO explicitly authorizes comparison or import.

### Acceptance State

Implemented on 2026-07-22. Role-contract, Structure identity, command-routing, and cross-project rejection checks passed. Existing Phronesis product behavior was not changed.

## 2026-07-22 — Application Structure

### Source

Current CTO chat.

### User Intent

- Make application structure the next development objective.

### Decisions

- Organize the product lifecycle around Discover, Decide, Monitor, Manage, and Administer (`PHR-UX-006`).
- Expose only operational destinations in primary navigation: Opportunities, Vendor Workspace, Market Watch, and Settings.
- Preserve Purchase Evaluation and opportunity details as contextual routes.
- Keep Manage, Cards, Alerts, Analytics, Inventory, Portfolio, and mobile behavior outside this implementation scope.

### Resulting Artifacts

- `docs/ux/PHR-UX-006-application-information-architecture.md`
- `docs/prompts/PHR-UX-006-implementation-prompt.md`
- `docs/testing/PHR-UX-006-application-structure-validation.md`
- `docs/release-notes/PHR-UX-006.md`
- Typed navigation configuration and focused regression tests.

### Acceptance State

Implemented and accepted on 2026-07-22 through the sequential CTO, Chief Architect, Engineer, conformance, and CTO gates. This was same-session review, not independent approval. Focused tests, lint, production build, TypeScript validation, and diff checks passed.

## 2026-07-22 — Development Resumption and Governance Upkeep

### Source

Current CTO chat. Earlier chat transcripts were not available in the repository and were not reconstructed.

### User Intent

- Resume development after a break of more than ten days.
- Replace the legacy project identity with Phronesis everywhere.
- Review Phronesis against strong documentation practices.
- Install a Canonical Workflow with CTO, Chief Architect, and Engineer roles.
- Make product conversations durable historical memory and use this chat as the CTO interface.
- Consider a clean restart if it produces a materially cleaner application without losing available knowledge.

### Decisions

- Phronesis is the sole canonical repository and product identity (`PHR-ARCH-010`).
- Product development uses the three-role gated workflow (`PHR-WORKFLOW-002`).
- The current primary chat operates as the CTO interface; repository artifacts, not transient chat context, are durable memory (`PHR-TECH-002`).
- Existing Git history and architecture are preserved. A rebuild is not authorized by this upkeep session and requires evidence plus a separate CTO decision.
- Unavailable prior transcripts are an explicit memory gap. They may be imported later only from an authorized source.

### Resulting Artifacts

- `docs/architecture/PHR-ARCH-010-phronesis-product-identity.md`
- `docs/workflows/PHR-WORKFLOW-002-canonical-product-development.md`
- `docs/technical/PHR-TECH-002-product-development-memory.md`
- `.agents/README.md` and `.agents/roles/`
- `docs/reviews/2026-07-22-documentation-practices-review.md`

### Open Questions

- Should the external Git repository and local checkout directory be renamed in a coordinated follow-up?
- Are prior product-development chat exports available for governed import?

### Acceptance State

Implemented and verified on 2026-07-22. Lint, production build, identity scan, traceability checks, role-file checks, and diff checks passed. Standalone `npx tsc --noEmit` exposed a pre-existing test configuration defect (`TS5097` for `.ts` import extensions); Next.js production type checking passed. External GitHub repository and active checkout-directory renames remain a coordinated follow-up.
## 2026-08-01 — PriceCharting Bulk Evidence Import Implementation

### Source

Current CTO chat: explicit command `Implement PHR-API-011`.

### User Intent

- Build the previously specified repeatable PriceCharting CSV ingestion system before recurring acquisition and later One Piece/Magic profiles.
- Maximize exact Pokémon coverage without weakening physical identity or TCG Direct Low precedence.

### Decisions And Result

- Implemented immutable receipts, strict 27-column parsing, normalized staging, reason-coded Pokémon resolver v9, collision quarantine, independent observations, atomic pointer promotion, coverage metrics, Graded Area consumption, and Settings health.
- Dry-run remains default; `--apply` is explicit and was not executed against the owner file.
- The owner source hash `a06dcdde0093d82d9c727f390d5d5913eadba1cb1334eb7f683cb34f0d4faac1` staged 91,572 rows and resolver v9 proved 33,379 collision-free exact candidates, including 32,099 with graded evidence. Dry-run receipt `3` remains non-active.
- TCGplayer price lanes, Direct Low, artwork, recommended offers, and event/inventory systems remain isolated.

### Evidence And Acceptance State

- Resolver v9 increased accepted mappings by 11,731 over v3 without enabling fuzzy matching. Explicit modern/promo/base/championship/Prize Pack set routing, natural-Holo and `Non-Holo` semantics, qualifier-boundary safety, Poké Ball/Master Ball patterns, Shadowless, SH-numbered Shiny, player annotations, sibling-proven finishes, and four printed-name alias families are fixture-gated; generic League, unsupported collectible, name-only, collector-only, and under-specified legacy-finish shortcuts remain prohibited.
- Focused 21/21 and full 338/338 tests, TypeScript, warning-free lint, production build, and diff hygiene passed after the coverage increase.
- Same-session conformance verdict: product-review ready. This is not independent approval.
- Active PriceCharting bulk receipt remains `NULL`; owner activation, recurrence, One Piece, and Magic remain unresolved follow-ups.

## 2026-08-02 — Celebrations Mini Tin Variant Identity

### User Intent

- Treat Celebrations regional Mini Tins as separately priced TCGplayer identities rather than alternate images of one Display product.
- Reuse the TCG-derived catalogue to reconcile each tin image precisely.

### Decision And Result

- Phronesis preserves the existing distinct TCG-derived SKUs for Kanto, Johto, Hoenn, Sinnoh, Unova, Kalos, Alola, and Galar while grouping them conceptually as one Mini Tin family.
- A deterministic exact-set/Mini-Tin rule maps those regions to source assets `gen1` through `gen8`; the Display is explicitly excluded without display-specific evidence.
- Eight mappings were applied to the active database. Exact community sealed mappings rose from 356 to 364 and visible sealed coverage rose from 483 to 491 of 2,894.

### Acceptance State

Implementation and active application are product-review ready. Focused 14/14 and full 369/369 tests, TypeScript, warning-free lint, diff hygiene, and direct SQLite mapping verification passed. No commit or push was requested.

## 2026-08-02 — Temporary Artwork Review Tab

### User Intent

- Explain why the embedded Settings review panel showed no products.
- Put the sealed-artwork workflow in a separate temporary tab.

### Decision And Result

- The zero counters were a failed queue API load, not exhausted or deleted review data. The active database retains 884 pending products.
- Added a dedicated `/artwork-review` Administration navigation destination and removed the panel from Settings.
- Hardened Safari loading with a current-origin endpoint, explicit query serialization, abort-state handling, and resilient response parsing.
- Restarted the existing loopback/tailnet-only private review service; the new page and queue API return HTTP 200, and the existing Tailscale mapping remains healthy.

### Acceptance State

Implemented and live for Product Owner review. Focused 11/11 and full 369/369 tests, TypeScript, warning-free lint, production build, diff hygiene, direct database audit, local page/API checks, and private-service status passed. No commit or push was requested.

## 2026-08-02 — Shared-SKU Packaging Galleries

### User Intent

- Properly display products that share one SKU and price identity but have multiple legitimate wrapper or packaging artworks.
- Prefer gathering those pictures under the product identity and presenting them as a carousel instead of forcing one representative image.

### Decision And Result

- Artwork multiplicity is separate from catalogue identity multiplicity. Multiple wrappers for one priced SKU form an ordered packaging gallery; independently priced TCG-derived editions, regions, or named variants remain separate SKUs.
- Added bulk gallery approval and atomic undo to Artwork Review, separate gallery provenance and coverage, ordered artwork API output, and an accessible Vendor Workspace Snapshot carousel.
- Applied the Aerodactyl, Lapras, and Zapdos wrappers to `Fossil Booster Pack [1st Edition]` as one three-image gallery. The separate Unlimited identity remains unresolved because those sources visibly carry the 1st Edition mark.

### Acceptance State

Implemented and live for Product Owner review. Focused 16/16 and full 370/370 tests, TypeScript, warning-free lint, production build, diff hygiene, transactional/idempotency/undo evidence, live API verification, private page checks, and tailnet health passed. Same-session review is not independent approval. No commit or push was requested.
## 2026-08-03 — Assignable Artwork Review Worker Access

### User Intent

- Assign Artwork Review as the sole task for a permanent employee or temporary worker.
- Let a worker reach Phronesis without installing Tailscale or another client.

### Decision And Result

- Added a dedicated `ARTWORK_REVIEW` module instead of granting broad Administration. `VIEW` reads the queue/images, `OPERATE` records manual candidate and gallery decisions, and `ADMIN` alone runs source refresh or assisted recovery.
- Added the module to permanent employee selectors and timed worker codes, with page/API/navigation enforcement. An artwork-only worker receives only the Artwork Review destination.
- Migrated the live authorization database additively and backfilled only the existing Owner with `ARTWORK_REVIEW:ADMIN`.
- Confirmed the installed Tailscale client supports Funnel, which would provide a normal public HTTPS link to browser-only workers. The current 9443 mapping remains Serve/tailnet-only; no public exposure was activated.

### Acceptance State

Implemented and live for Product Owner review. Full 373/373 tests, TypeScript, warning-free lint, production build, diff hygiene, live migration audit, private service health, and HTTPS page verification pass. Authentication remains `OPTIONAL`; strict task isolation requires a separately approved change to `REQUIRED`. Commit, push, and Funnel activation were not requested or performed.

## 2026-08-03 — Isolated Public Event Worker Gateway

### User Intent

- Safely make temporary worker access public while the Product Owner is remote on a phone.
- Avoid requiring workers to install Tailscale and do not interrupt the Product Owner's existing private route.

### Decision And Result

- Preserved tailnet-only owner Serve on port `9443` and left global authentication compatibility unchanged.
- Added a separate loopback gateway on `127.0.0.1:3101`, public through Tailscale Funnel only on port `10000`; Phronesis remains loopback-only on `127.0.0.1:3100`.
- Public ingress blocks Settings, permanent authentication, activation, developer routes, and owner administration at the gateway. Application authorization detects public ingress before `OPTIONAL` compatibility and accepts only a valid timed event session with its assigned modules.
- Added Secure event cookies behind Funnel TLS, module-derived landing after code redemption, and a copyable public login link in Settings.
- When the inactive remote desktop deferred GUI LaunchAgents, restored private access first, removed stale development children, and placed both verified production processes into named detached `screen` sessions. Validated LaunchAgent definitions remain installed for the next normal login.
- Activated `https://ramons-macbook-pro.tailaa2d39.ts.net:10000/event-access`. Disable only this public ingress with `tailscale funnel --https=10000 off`.

### Acceptance State

Implemented and publicly live. Public login and health return 200; public Settings and permanent GitHub auth return 404; uncredentialed Artwork Review redirects to event login; private 9443 Settings remains 200. Loopback binding, Funnel topology, detached runtime supervision, 376/376 tests, TypeScript, warning-free lint, production build, plist validation, and diff hygiene pass. No commit or push was requested.

## 2026-08-03 — Event-Independent Timed Artwork Task Access

### User Intent

- Generate random temporary Artwork Review access without opening an unrelated Event Ledger event.
- Keep transactional worker access correctly attached to event operations.

### Decision And Result

- Added immutable server-derived grant scopes: Artwork Review alone becomes `TASK`; Vendor Workspace, Event Ledger, Event Flip, or Inventory makes the grant `EVENT` and requires an active event.
- Task access ends by timer or revocation and ignores unrelated event lifecycle. Event access still ends when its event closes.
- Settings now renders without an event, defaults to Artwork Review only, disables transactional controls until an event exists, and labels task versus event history. Worker login copy is no longer event-only.
- Migrated the live authorization database additively. Its one existing grant remains event-bound, and no permission or session was broadened.
- Rebuilt and restarted only the loopback Phronesis application; the separate gateway and Funnel topology were not changed.

### Acceptance State

Implemented and live for Product Owner phone review. Focused 11/11 and full 378/378 tests, TypeScript, warning-free lint, production build, diff hygiene, legacy/live migration audits, new UI-copy probes, public/private HTTP checks, loopback bindings, and detached-service supervision pass. No commit or push was requested.

## 2026-08-03 — Resilient Copy Controls

### User Intent

- Fix the public worker-link copy button that appeared inert on iPhone.
- Make the correction reusable for other Phronesis features.

### Decision And Implementation

- Assigned `PHR-UX-025` and centralized copy behavior behind an awaited modern API, direct-tap compatibility fallback, and selectable manual recovery.
- Replaced direct browser clipboard calls for worker codes, public worker links, and employee activation links.
- Added visible/ARIA feedback without logging, persisting, or transmitting copied values.

### Acceptance State

Implemented and live for Product Owner phone review. Focused 4/4 and full 382/382 tests, TypeScript, warning-free lint, production build, shared-control adoption, private/public route probes, public Settings denial, loopback supervision, and 390×844 no-overflow validation pass. Commit and push remain pending.

## 2026-08-03 — Timed Worker Issued-Code Continuity

### User Intent

- Preserve access to generated worker information after navigating away from Settings.
- Avoid forcing the owner to recreate an entire grant when an unused code was lost.

### Decision And Implementation

- The server remains hash-only and cannot reveal old plaintext. The authenticated owner tab retains only the latest unused code in ephemeral session storage and restores it after owner-only server reconciliation.
- Active and redeemed history rows always expose the stable public login link.
- Active unused grants support two-step code replacement. Rotation immediately invalidates the prior code, preserves scope/expiry/entitlements, returns the new code once, and emits a secret-free audit record.

### Acceptance State

Implemented and live for Product Owner phone review. Focused 16/16 and full 386/386 tests, TypeScript, warning-free lint, production build, code-rotation invalidation/audit proof, browser-session reconciliation/cleanup proof, diff hygiene, 390×844 no-overflow review, final private/public health checks, loopback supervision, and public Settings denial pass. Commit and push remain pending.
## 2026-08-03 — Arbitrage And Regional Acquisition Recovery

### User Intent

- Explain why the Cross-market decision queue showed zero.
- Determine whether the TCG catalogue snapshots are current.
- Implement recurring LigaMagic acquisition and add LigaPokemon.

### Decisions And Implementation

- Assigned `PHR-TECH-012` and `PHR-API-013` under `PHR-STRUCT-20260803-007`.
- Diagnosed a split data plane: the live detached raw-Next runtime opened a database with zero regional matches, while the verified operational database retained 131,869 matches and 130,183 matched rows with consumer price evidence.
- Standardized runtime and maintenance database resolution, restored observer supervision, and added bounded Magic reconciliation after new source evidence.
- Added daily 03:00 LigaMagic orchestration with locking, atomic status, same-day idempotency, complete-snapshot gating, and automatic crosswalk promotion.
- Added an isolated LigaPokemon connector and snapshot namespace. A full run requires a successful owner-authenticated pilot; no Pokémon regional promotion or anonymous marketplace scraping was added.
- Completed owner-assisted LigaPokemon authentication and validated its distinct 20-column CSV contract. The Lote 1 pilot reconciled 9,772 advertised cards to 9,772 rows/cards.
- Attempted all 18 collections. Lote 10 repeatedly advertised 9,704 cards but exported 9,700; two independent files were byte-identical. Phronesis retained the raw evidence, classified `SOURCE_COUNT_MISMATCH`, and did not create or promote an incomplete snapshot.
- The Product Owner authorized Lote 10's 9,700-card export as authoritative. Phronesis encoded an exact, provider/label/count-specific rule that retains 9,704 as source provenance and does not create a general tolerance.
- The next full run passed Lote 10 and reached Lote 4, which repeatedly advertised 9,870 cards but exported 9,868 in byte-identical files. No authority was inferred for this second mismatch; the complete snapshot remains blocked.
- Confirmed the external TCG acquisition dashboard is down and its enabled four-daily schedule has not completed a catalogue after 2026-08-01. This is an upstream operational dependency rather than a Phronesis import defect.

### Acceptance State

Implementation and same-session conformance are Product Review ready. Full repository gates pass. The private supervisor is consolidated to one wrapper/observer/Next listener and returns 50 ranked identity-verified rows instead of zero. The 03:00 agent is loaded; LigaMagic remains `REAUTHENTICATION_REQUIRED`. LigaPokemon is authenticated and pilot-verified; Lote 10 now carries explicit Product Owner export authority, while full recurrence remains fail-closed on the separately unauthorized Lote 4 mismatch. The external TCG scheduler remains.

## 2026-08-06 — Dashboard Tool Hub And Approved Brand Identity

### User Intent

- Make Dashboard the first authenticated page.
- Present every authorized Phronesis tool as a card in a landing-page hub.
- Add a collapsible desktop sidebar while preserving mobile navigation.
- Correct the new shell to use the recently approved Phronesis icon, favicon, and iOS identity.

### Decision And Implementation

- Assigned `PHR-UX-027` and reserved `/` for Dashboard; Opportunities moved to `/opportunities` with its existing authorization unchanged.
- Centralized tool descriptions and identity in the server-filtered navigation model, making Dashboard cards entitlement-aware by construction.
- Added a persistent accessible desktop icon rail and preserved the modal mobile drawer.
- Changed temporary worker login success to enter Dashboard; explicit safe permanent-login callbacks remain supported.
- A first-pass CSS `P` substitute was rejected after Product Owner review. The feature worktree predated canonical brand commit `8d655f5`; the exact favicon, Apple icon, and PNG mark were recovered, hash-bound in tests, and applied to Dashboard plus desktop/mobile shell.
- Follow-up Product Owner review showed that the installed Safari copy still targeted the retired `ramons-mac-studio…:9444` origin, the toolbar retained stale icon state, and Event Operations persisted over later Vendor content. The application had no web-app manifest at installation time, while the outer Vendor checkout wrapper was explicitly sticky.
- The approved remediation adds an origin-relative standalone manifest, approved 192/512 icon derivatives, explicit Apple web-app metadata, and a 512-pixel application icon route. It removes sticky positioning only from the outer Event Operations wrapper so later full-width controls remain unobstructed.
- Tailscale identified the current node as `ramons-macbook-pro` while its old `:9444` rule still used `ramons-mac-studio`. The isolated scanner-review mapping was restored at `https://ramons-macbook-pro.tailaa2d39.ts.net:9444/` without changing the canonical port-3100 runtime or public worker gateway.

### Acceptance State

Implementation and same-session conformance are Product Review ready. Focused 8/8, full 423/423, TypeScript, full lint, Next.js 16.2.12 build, approved-asset SHA-256 proof, desktop expanded/collapsed review, 390×844 review, live manifest/head inspection, and 1280-pixel Event Operations zero-overlap geometry pass. The prior Safari application must be removed and reinstalled once because its retired start URL is stored locally. Commit, push, and canonical deployment were not requested in this turn.

## 2026-08-06 — Physical Duplex File Recovery And Vision Completion

### User Intent

- Determine why the cards visibly scanned but no files were created.
- Recover the batch and continue the private Pokémon recognition workflow without an unnecessary rescan.

### Decision And Implementation

- PaperStream's retained batch metadata proved 18 full-resolution pages in nine authoritative FRONT/BACK pairs. The profile had batch folders enabled but automatic release disabled, so the completed scan remained in manual-release storage.
- Copied rather than moved every retained original, byte-compared the Windows copies, and sealed/imported physical `v2` session `phr-pokemon-duplex-20260806-001` with manifest SHA-256 `75c0670a8e49d000ea81fb04f63d46b18c9463a276df76538a9361b2e1d50f88`.
- Diagnosed a macOS 27 beta Apple Neural Engine compilation stall in local Vision OCR, bound native request main stages to CPU, and added narrowly scoped failed/expired session-job recovery.

### Acceptance State

Physical `v2` acquisition and processing are complete: nine front jobs completed, nine backs remain linked evidence-only, and all nine results safely abstained below the review threshold. Full 424/424 repository tests, Swift 5/5, TypeScript, lint, production/release builds, durable-store inspection, and service health pass. Enable **Release after scan** in PaperStream's supported UI before another routine batch. Auto-accept, commercial mutation, commit, push, and deployment remain gated.

## 2026-08-06 — Repository Publication And Private Deployment Authorization

### User Intent

- Commit, push, and deploy the complete accumulated implementation properly.

### Decision

- The entire approved feature worktree is in scope: Dashboard/PWA identity, timed-access continuity, Scanner-to-Offer duplex and batch workflow, Windows acquisition bridge, and macOS recognition recovery.
- Publish the existing `codex/phr-local-card-recognition-20260804` branch with a clean implementation commit followed by the repository-required Handoff seal commit.
- Deploy only to the existing private tailnet runtime and recurring recognition worker. This does not authorize auto-accept, purchase/inventory mutation, marketplace publication, or merge into canonical `main`.

### Acceptance State

Product Owner authorization received. Final application, native-worker, build, continuity, remote-SHA, and private-runtime health evidence must pass before the deployment is represented as complete.

## 2026-08-06 — Scanner Recognition Recovery, Per-Card Material, And Actionable Offer

### User Intent

- Correct the apparent 1/9 Pokémon identification result and work toward a qualified 9.9/10 accuracy target.
- Allow condition and variation correction inside Review, including Barbaracle as Reverse Holofoil.
- End a scan with TCG Low, TCG Market, LigaPokemon/LigaMagic Low, and Suggested Offer totals.
- Define “20% off TCG Low” as an offer equal to 80% of TCG Low.
- Stop routine processing/capture of card backs and use the retained nine-card evidence while the owner is away.

### Decisions And Implementation

- Diagnosed the 1/9 result as a candidate-visibility defect: eight of eight supported English fronts had exact candidates, but the homogeneous Holofoil filter hid seven variant sets. Batch material is now a default and per-card review owns condition plus the exact selected candidate variation.
- Added language-safe pre-retrieval observations. Spanish Toxicroak `55/147` is visibly identified but remains blocked from an English market SKU.
- Added server-authoritative `tcg-low-80`, current TCG/Liga valuation snapshots, source/currency-separated totals, and coverage.
- Added `v3` front-only bridge evidence and collapsed retained reverse evidence. No unattended scan was run; physical simplex validation remains supervised.

### Acceptance State

Implementation and same-session conformance are Product Review ready. Live replay reports 9/9 observed identities and 8/8 exact candidate coverage for supported English cards; this is not a powered holdout or auto-accept qualification. Repository publication is required on the existing `codex/phr-local-card-recognition-20260804` branch.

## 2026-08-06 — Past Event Ledger Reports

### User Intent

- Find past Event Ledger reports without knowing a hidden route.
- Make historical report access obvious and easy directly from Event Ledger.

### Decision And Implementation

- Assigned `PHR-UX-028` and added a prominent `Past event reports` archive to the Event Ledger header.
- Added bounded newest-first closed-event discovery, local name/location/date search, and sales/purchase/variance previews over canonical repository summaries.
- Added exact workspace-scoped closed-event reopening through a durable `eventId` URL, browser history restoration, and one-click return to the current event.
- Reused canonical summary, preserved close reconciliation, Event Stock evidence/reports, and immutable activity; a selected historical report suppresses all write and event-start controls.
- Rebuilt and restarted the existing private production service. Live read-only validation reopened the prior Battlezone report while preserving the active Battlezone ledger.

### Acceptance State

Implementation and same-session conformance are Product Review ready and privately live. Focused Event Cash Ledger coverage, full 438/438 tests, TypeScript, warning-free lint, production build, live archive/search/direct-link/Back behavior, desktop/phone no-overflow checks, 44-pixel controls, private HTTP 200, and zero console errors pass. No ledger evidence was mutated during validation; independent Product Owner acceptance remains pending.

## 2026-08-06 — iPhone Installed-WebApp Safe-Area Repair

### User Intent

- Make the installed phone application's top controls fully visible and reachable below the iPhone status bar and Dynamic Island.

### Decision And Implementation

- Extended `PHR-UX-027` because it already owns standalone installation and shared-shell behavior.
- Added `safe-area-inset-top` above a complete 64-pixel top bar, retained the existing zero-inset browser geometry, and made shortcut help plus command search safe-area-aware.
- Portalled mobile navigation to `document.body` so the sticky header's backdrop filter cannot constrain its fixed backdrop or panel; the drawer now spans the complete device viewport and consumes top/bottom safe areas.
- Rebuilt and restarted the existing private production service.

### Acceptance State

Implementation and same-session conformance are Product Review ready and privately live. Focused 8/8 and full 438/438 tests, TypeScript, warning-free lint, Next.js 16.2.12 production build, 390×844 geometry, 44-pixel controls, full-height body-portalled drawer, no horizontal overflow, private HTTP 200, and zero console errors pass. Final visual confirmation on the owner's physical iPhone remains pending after the installed WebApp is refreshed or fully relaunched.
