<!-- handoff: {"document":"PROJECT_STATE","owner":"human-and-agent","schema_version":"1"} -->
# Project State

## 2026-08-05 Local Card Recognition State

- `PHR-TECH-014`, `PHR-WORKFLOW-016`, `PHR-API-015`, and the `PHR-UX-026` region foundation are implemented in the isolated `codex/phr-local-card-recognition-20260804` worktree. English Pokémon is the first active lane, and the scanner-to-offer path is privately operational at tailnet-only `:9444`; real-corpus qualification remains gated.
- `PHR-UX-026` now has benchmark-only local Vision rectangle suggestions and a sealed localization benchmark. A real smoke test exposed an internal-rectangle false localization, so automatic region adoption remains disabled pending a labeled binder holdout.
- The Windows batch-folder watcher imports sealed bundles idempotently, the local macOS Vision worker produces OCR/feature evidence, and canonical catalogue retrieval is read-only and explicitly game- and language-gated.
- The exact 18-frame physical bundle has an append-only second recognition revision. Current truth is eight English Pokémon faces in `REVIEW` with exact catalogue-variant candidates and ten abstentions covering nine backs plus one Spanish card; all 18 prior decisions remain auditable.
- Auto-accept remains disabled until a provenance-approved English Pokémon corpus and powered unseen holdout qualify the policy. Automatic binder segmentation, consumer-project adoption, public deployment, and publication remain gated.
- Persistent user LaunchAgents supervise the isolated loopback scanner app and recurring recognition worker. Existing `:9443` and public `:10000` services remain unchanged; no purchase, inventory, external repository, marketplace, or publication state changed.
- Physical `v2` session `phr-pokemon-duplex-20260806-001` preserves nine reciprocal front/back pairs. Nine front jobs completed and nine backs remain evidence-only; all nine recognition decisions safely abstained. PaperStream had retained the files because automatic release was disabled, so future routine scans require **Release after scan** enabled through its supported UI.
- The macOS 27 beta ANE compilation stall is contained by CPU-bound Vision requests. Session-scoped recovery changes only failed or expired active jobs and preserves completed evidence and attempt history.

## 2026-08-03 Arbitrage Recovery State

- `PHR-TECH-012` and `PHR-API-013` are implemented and fully validated. Private Arbitrage recovery and the 03:00 calendar schedule are active.
- The private server now runs the repository supervisor against `.data/mobile-review.sqlite`; `/api/regional/arbitrage` returns 50 ranked `IDENTITY_VERIFIED` rows, evenly split across both directions.
- The canonical `.data/mobile-review.sqlite` has five 2026-08-01 TCG checkpoints, 329,301 Liga evidence rows observed 2026-07-30, 131,869 matched identities, and 130,183 matched identities with consumer price evidence.
- The external TCG acquisition dashboard is down. Its enabled 00:00/06:00/12:00/18:00 schedule has stale `last_fired_date` values and no completed catalogue after 2026-08-01; Phronesis is therefore not current to the intended upstream cadence.
- Repository recurrence schedules LigaMagic and LigaPokemon at 03:00, rebuilds Magic reconciliation only after a complete snapshot, and records overlap-safe atomic status. LigaMagic remains `REAUTHENTICATION_REQUIRED`. LigaPokemon authentication, exact 20-column schema, and Lote 1 pilot are verified. Lote 10's 9,700-card export is Product Owner-authoritative with its 9,704 source claim preserved; full acquisition now fails closed on Lote 4's separately unauthorized 9,870-advertised versus 9,868-exported mismatch.

## Mission

Phronesis is a private, evidence-driven decision operating system for collectible-card buying, monitoring, event purchasing, inventory operations, and cross-market opportunity analysis.

## Canonical repository and Git state

- Canonical root: `/Volumes/JarvisSSD/Projects/Phronesis`.
- Rollback-only checkout: `/Users/ramonnogueira/Developer/Phronesis`; it is not an active development source.
- Active branch at Handoff preparation: `codex/phr-price-monitoring-20260730`.
- Pull request: `RHNog/Phronesis#5`; the 2026-08-03 repair replaces its failing CI-side preparation step with read-only committed-state validation.
- The pre-repair seal ended at `827858f113ec295c4d2d0d9cf4726aa30a4d4533`; the next generated Handoff package must record the implementation commit that includes the event-worker gateway and `PHR-TECH-011` repair.
- Verified arbitrage implementation commit: `66e0500d295d079e96e54e6e821b95e6ca46b70d`.
- Handoff framework adoption baseline: `885b645c7266e52963509774c35e181c06bec9be`.
- At reconciliation, the local branch and `origin/codex/phr-price-monitoring-20260730` both resolved to `885b645`; the branch was 15 commits ahead of `origin/main` and zero behind.
- The generated Handoff package records the exact post-documentation branch and commit; it supersedes the preparation baseline above for session resumption.

## Current capabilities

- Independently assignable `ARTWORK_REVIEW` authorization for permanent employees and timed workers, with manual `OPERATE` separated from system-wide `ADMIN` refresh/recovery powers.
- A dedicated loopback public event-worker gateway that overwrites its ingress marker, blocks owner-only and permanent-authentication paths, and requires a valid timed event session before Phronesis authorization. Its durable launch definition is implemented but public Funnel activation remains gated.
- GitHub pull-request validation separated into dependency-backed project gates and exact committed Handoff continuity verification; GitHub does not prepare or mutate Handoff state.
- Editable employee-owned Vendor purchase carts with exact unit value/quantity correction, Bulk total/count correction, visible removal, unsaved-change protection, and downstream receipt integrity.
- Sealed-only PkmnPrices ingestion with newest-release-first scheduling, an exact 100-credit UTC-day local ceiling, durable restart-safe progress, exact artwork adoption, and Settings/provider health.
- Compact recommended-offer disclosure immediately above the Vendor Workspace cart, showing TCG Low/Market evidence and expandable opening/target/walk-away values.
- Embedded grading certificate panel with an implemented official PSA API adapter and registered no-network authorization gates for Beckett/BCCG, TAG, CGC, and SGC.
- Desktop-first Vendor Workspace with catalogue results beside the canonical Event station/cart, responsive semantic phone stacking, automatic multi-catalogue search, exact finish/condition selection, visible buying intelligence, recommended offers, and event checkout.
- Intent-aware catalogue search with static Pokémon shorthand and evidence-derived One Piece OP/EB/ST/PRB code-to-title resolution across singles and sealed products.
- Vendor catalogue verification with canonical enlarged artwork preview and a safely encoded manual TCGplayer cross-check that never mutates selected identity.
- Verified local catalogue ingestion for Magic, Pokémon, One Piece, and Lorcana, with provider-backed artwork and fail-closed placeholders when identity is not unique. Riftbound remains deferred.
- User-scoped persistent Market Watch with exact catalogue identity, targets, notes, history, manual refresh, and Vendor Workspace entry.
- Optional GitHub-backed employee identity foundation with workspace-owned module entitlements and activation invitations.
- Receipt-backed inventory intake, locations, physical counts, and append-only disposition evidence.
- LigaMagic snapshot evidence crossed against TCGplayer: 71,954 exact plus 14,438 qualifier-preserving alias mappings, 86,392 matched identities, 86,032 two-sided price pairs, zero ambiguous adoptions, and 109,763 quarantined Textless rows.
- Official Banco Central do Brasil PTAX buy/sell evidence and two-way US/Brazil arbitrage calculations with explicit truth gates.
- Persistent private review service at `https://ramons-mac-studio.tailaa2d39.ts.net:9443/vendor` while the Mac and tailnet are available.
- Persistent tailnet-only Scanner to Offer service at `https://ramons-mac-studio.tailaa2d39.ts.net:9444/vendor/scanner` with a recurring Windows-bundle recognition worker. Tailscale retains a MacBook-name Serve alias, but the live tailnet DNS identity is currently `ramons-mac-studio`; install/open the web app only from the resolving origin.
- Local content-addressed scan evidence, recoverable recognition jobs, Apple Vision evidence, review/abstention, operator material confirmation, exact-condition price binding, local offer drafts, recognized-asset envelopes, and pure TCGplayer/Liga draft adapters.

## Current constraints

- The public event-worker gateway is active through Tailscale Funnel on port 10000 following a separately authorized activation. It accepts only timed event sessions; the existing private 9443 mapping remains tailnet-only and unchanged. Disable the public path with `tailscale funnel --https=10000 off` when the bounded event window ends.
- Handoff continuity is publishable only after a clean implementation commit and a successful local bare `./handoff` seal; hosted GitHub checks verify that committed result.
- The active private runtime has no `PKMNPRICES_API_KEY` or `PSA_API_TOKEN`. Sealed ingestion and live PSA lookup remain dormant until server-side registration and service restart; PkmnPrices sealed access must be enabled by the provider plan.
- Beckett/BCCG, TAG, CGC, and SGC expose official public lookup pages but no documented machine API found in the 2026-08-01 research, so Phronesis does not automate them.
- Arbitrage candidates remain `IDENTITY_VERIFIED` until the Product Owner supplies direction-specific fixed and percentage costs and an operator records real executable availability.
- The LigaMagic 03:00 export schedule is loaded under `PHR-API-013`; its saved session currently requires owner reauthentication before it can replace the July 30 last-good snapshot.
- Required employee authentication remains activation-gated; compatibility mode must not be represented as enforced login.
- External marketplace orders, publication, payments, shipping, automatic repricing, and settlement are not implemented or authorized.
- Pricing Update Tool owns upstream catalogue acquisition and its schedule; Phronesis observes verified completion and does not mutate that repository.
- Development must continue only from the canonical JarvisSSD checkout.

## Known risks

- 133,146 supported LigaMagic identities remain unmatched; 72,554 of them contain consumer-price evidence that must not be joined by fuzzy matching.
- Cross-market gross spreads are benchmarks, not executable profit, until cost and availability gates pass.
- Private review availability depends on the host Mac remaining awake, online, and connected to Tailscale.
- Human-readable historical handoff sections contain superseded point-in-time commit and test claims; the generated Handoff package and current Git evidence are authoritative for resumption.
