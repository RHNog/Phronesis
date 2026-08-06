<!-- handoff: {"document":"PROJECT_STATE","owner":"human-and-agent","schema_version":"1"} -->
# Project State

## 2026-08-05 Dedicated Application Icon State

- `PHR-ARCH-010` now uses the Product Owner-supplied compact Phronesis mark for favicon, browser application icon, and iOS home-screen metadata while leaving the full navigation logo unchanged.
- Canonical PNG SHA-256: `0fc335597c0f7fbe7407d6d8faec0b1d084a12b8937ec052405820565b5e0dbb`. Derived hashes: browser `2bdc7e40c845234eac0d148f787c26ec03b8d7ea6ca5417602543d8bab1ee632`, Apple `5e149948b3a4b92fc0cd5694d831931f4703fdd453739134025887abe9b9bdfe`, favicon `4ed3a7ecdb376d54aec6bd5bb2054874f1c718a2733c3debfbb5f59deb7c237e`.
- Focused 6/6 and full 404/404 tests, TypeScript, lint, production build, visual inspection, static metadata, HTTP asset integrity, and diff hygiene pass. The launch-managed private runtime is restarted and verified; repository publication is authorized in this delivery.

## 2026-08-05 Maximum Liga Equivalence State

- `PHR-API-015` is implemented and Product Review ready. The operational database has exactly one Liga disposition for every current Magic and English Pokémon target.
- Lucario V, Champion's Path, `27/73`, Holofoil now resolves the acquired `Champion&rsquo;s Path` LigaPokemon identity with R$29.99 low/average/high evidence.
- Pokémon: 46,642 total targets; 30,061 exact, 2,539 compatible, 102 ambiguous, and 13,940 unavailable. Exact-or-compatible evidence covers 32,600 / 43,748 singles (74.52%).
- Magic: 162,765 total targets; 131,883 exact and 30,882 unavailable.
- Compatible rows are comparison evidence only. Arbitrage remains bound to the original exact Magic source crosswalk.
- Full 404/404 tests, TypeScript, lint, production build, deterministic Pokémon rebuild, and live database audits pass. The launch-managed private runtime is restarted and verified; repository publication is authorized in this delivery.

## 2026-08-05 Regional Evidence And Catalogue Continuity State

- `PHR-API-014` now serves exact provider-labelled regional evidence in Vendor Workspace: LigaMagic for `magic-en` and LigaPokemon for `pokemon-en`. Unsupported categories, missing Pokémon tables, and every non-`MATCHED` identity return no evidence.
- Live Pikachu V `043/185` (`tcg:3191420d96ce55402e9e891c`) returns its August 5 TCGplayer snapshot plus LigaPokemon low R$38.99, average R$42.07, and explicit source provenance. Pokémon remains absent from Arbitrage.
- `PHR-TECH-012` separates fast capture from import/reconciliation. Atomic SHA-256 receipts and archives remain durable while one child drains them; interrupted imports recover idempotently and corrupt archives fail closed.
- A bounded read-only recovery from the Pricing Update Tool's latest PostgreSQL staging tables advanced all five operational categories to the August 5 12:21 run. Each category is `CURRENT` and `stale: false`.
- The private launch-managed runtime, capture observer, and Next server are healthy; `/vendor` and both live provider-evidence probes return HTTP 200.
- Verification passes 54 focused tests, 402/402 full tests, TypeScript, lint, production build, and diff hygiene.

## 2026-08-04 Timed Worker Session Continuity State

- `PHR-ARCH-014` now resumes a valid redeemed worker session for its complete remaining configured duration when the stable `/event-access` link is reopened in the same browser.
- The live grant and session involved in the report were not revoked; the previous login route ignored the existing session and rejected the correctly consumed one-time code on replay.
- Codes remain single-use. The HttpOnly cookie is bounded by the session deadline and server resume rechecks expiry, revocation, event closure, and entitlements.
- The Next.js 16.2.12 build is deployed through `com.phronesis.private-review`; private Inventory and public worker login return 200, while public Settings remains 404.

## 2026-08-04 LigaPokemon Reconciliation State

- `PHR-API-014` is implemented and live verified against snapshot `dry-run-20260804T041909649Z`.
- The isolated Pokémon tables contain 167,912 evidence rows and 25,200 exact accepted mappings; 24,884 mappings have both LigaPokemon consumer-low and TCGplayer Near Mint evidence.
- Two consecutive builds produced fingerprint `295be8d699da35d13b8df82a59a6d46ae9a51fd6f337e6c60b3a7f3259c91d9a`. Zero accepted target duplicates or missing targets remain.
- The Magic crosswalk remains 329,301 rows / 131,885 matches with fingerprint `38dfd400845f0aea1b9835b8a7502d3b0e2f3d46abdac75f5b41dd9d69fa1a42`.
- Exact Vendor Workspace evidence was subsequently approved and activated on 2026-08-05. Pokémon candidate exposure is still not implemented; the Arbitrage queue remains Magic-only pending Product Owner acceptance, complete route costs, and executable availability.

## 2026-08-03 Arbitrage Recovery State

- `PHR-TECH-012` and `PHR-API-013` are implemented and fully validated. Private Arbitrage recovery and the 03:00 calendar schedule are active.
- The private server now runs the repository supervisor against `.data/mobile-review.sqlite`; `/api/regional/arbitrage` returns 50 ranked `IDENTITY_VERIFIED` rows, evenly split across both directions.
- The canonical `.data/mobile-review.sqlite` has five 2026-08-01 TCG checkpoints, 329,301 Liga evidence rows observed 2026-07-30, 131,869 matched identities, and 130,183 matched identities with consumer price evidence.
- The external TCG acquisition dashboard is down. Its enabled 00:00/06:00/12:00/18:00 schedule has stale `last_fired_date` values and no completed catalogue after 2026-08-01; Phronesis is therefore not current to the intended upstream cadence.
- Repository recurrence schedules LigaMagic and LigaPokemon at 03:00, rebuilds provider-specific reconciliation only after a complete snapshot, and records overlap-safe atomic status. LigaMagic remains `REAUTHENTICATION_REQUIRED`. LigaPokemon authentication, exact 20-column schema, and Lote 1 pilot are verified. Exact Product Owner authorities preserve both source and exported quantities for Lote 10, Lote 4, Lote RF 3, and Lote RF 6. A full 18-collection snapshot succeeds at 167,912 unique identities with zero duplicate conflicts, durable status records LigaPokemon `SUCCESS`, and `PHR-API-014` now rebuilds its isolated exact crosswalk.

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
