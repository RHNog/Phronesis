<!-- handoff: {"document":"PROJECT_STATE","owner":"human-and-agent","schema_version":"1"} -->
# Project State

## Mission

Phronesis is a private, evidence-driven decision operating system for collectible-card buying, monitoring, event purchasing, inventory operations, and cross-market opportunity analysis.

## Canonical repository and Git state

- Canonical root: `/Volumes/JarvisSSD/Projects/Phronesis`.
- Rollback-only checkout: `/Users/ramonnogueira/Developer/Phronesis`; it is not an active development source.
- Active branch at Handoff preparation: `codex/phr-price-monitoring-20260730`.
- Verified arbitrage implementation commit: `66e0500d295d079e96e54e6e821b95e6ca46b70d`.
- Handoff framework adoption baseline: `885b645c7266e52963509774c35e181c06bec9be`.
- At reconciliation, the local branch and `origin/codex/phr-price-monitoring-20260730` both resolved to `885b645`; the branch was 15 commits ahead of `origin/main` and zero behind.
- The generated Handoff package records the exact post-documentation branch and commit; it supersedes the preparation baseline above for session resumption.

## Current capabilities

- Desktop-first Vendor Workspace with responsive mobile review, automatic multi-catalogue search, exact finish/condition selection, visible buying intelligence, recommended offers, and event checkout.
- Verified local catalogue ingestion for Magic, Pokémon, One Piece, and Lorcana, with provider-backed artwork and fail-closed placeholders when identity is not unique. Riftbound remains deferred.
- User-scoped persistent Market Watch with exact catalogue identity, targets, notes, history, manual refresh, and Vendor Workspace entry.
- Optional GitHub-backed employee identity foundation with workspace-owned module entitlements and activation invitations.
- Receipt-backed inventory intake, locations, physical counts, and append-only disposition evidence.
- LigaMagic snapshot evidence crossed against TCGplayer: 71,954 exact plus 14,438 qualifier-preserving alias mappings, 86,392 matched identities, 86,032 two-sided price pairs, zero ambiguous adoptions, and 109,763 quarantined Textless rows.
- Official Banco Central do Brasil PTAX buy/sell evidence and two-way US/Brazil arbitrage calculations with explicit truth gates.
- Persistent private review service at `https://ramons-macbook-pro.tailaa2d39.ts.net:9443/vendor` while the Mac and tailnet are available.

## Current constraints

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
