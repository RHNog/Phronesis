<!-- handoff: {"document":"PROJECT_STATE","owner":"human-and-agent","schema_version":"1"} -->
# Project State

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
- Persistent private review service at `https://ramons-macbook-pro.tailaa2d39.ts.net:9443/vendor` while the Mac and tailnet are available.

## Current constraints

- The public event-worker gateway is not internet-exposed. Tailscale Funnel activation on port 10000 requires explicit Product Owner approval for a bounded event window; the existing private 9443 mapping must remain unchanged.
- Handoff continuity is publishable only after a clean implementation commit and a successful local bare `./handoff` seal; hosted GitHub checks verify that committed result.
- The active private runtime has no `PKMNPRICES_API_KEY` or `PSA_API_TOKEN`. Sealed ingestion and live PSA lookup remain dormant until server-side registration and service restart; PkmnPrices sealed access must be enabled by the provider plan.
- Beckett/BCCG, TAG, CGC, and SGC expose official public lookup pages but no documented machine API found in the 2026-08-01 research, so Phronesis does not automate them.
- Arbitrage candidates remain `IDENTITY_VERIFIED` until the Product Owner supplies direction-specific fixed and percentage costs and an operator records real executable availability.
- The LigaMagic 03:00 export schedule remains disabled; the current snapshot was acquired through the supervised, non-scheduled profile.
- Required employee authentication remains activation-gated; compatibility mode must not be represented as enforced login.
- External marketplace orders, publication, payments, shipping, automatic repricing, and settlement are not implemented or authorized.
- Pricing Update Tool owns upstream catalogue acquisition and its schedule; Phronesis observes verified completion and does not mutate that repository.
- Development must continue only from the canonical JarvisSSD checkout.

## Known risks

- 133,146 supported LigaMagic identities remain unmatched; 72,554 of them contain consumer-price evidence that must not be joined by fuzzy matching.
- Cross-market gross spreads are benchmarks, not executable profit, until cost and availability gates pass.
- Private review availability depends on the host Mac remaining awake, online, and connected to Tailscale.
- Human-readable historical handoff sections contain superseded point-in-time commit and test claims; the generated Handoff package and current Git evidence are authoritative for resumption.
