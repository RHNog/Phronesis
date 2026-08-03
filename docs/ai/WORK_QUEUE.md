<!-- handoff: {"branch":"codex/phr-price-monitoring-20260730","config_digest":"24af9188f29175240948655dcb0825cf42575569652aa5b2f688a4110d8542af","document":"WORK_QUEUE","generated":true,"generated_at":"2026-08-03T19:18:36Z","generation_id":"7e375683e087884acf2b","head":"5ac3d5eba48ca12adbb3378941fd17d5cc222323","schema_version":"1","worktree_fingerprint":"e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"} -->
# Work Queue

> Machine-generated from `docs/ai/ACTIVE_TASK.md` and `docs/BACKLOG.md`. Edit the sources, then
> run `update-work-queue`.

| Rank | Priority | Source ID | Work |
|---:|---:|---|---|
| 1 | P0 | `ACTIVE-001` | Monitor the separately activated public event-worker window and disable Funnel port 10000 when that approved window ends. |
| 2 | P0 | `BACKLOG-001` | Disable Funnel port 10000 with `tailscale funnel --https=10000 off` when the approved public worker window ends; do not alter private port 9443. |
| 3 | P0 | `BACKLOG-002` | Configure Product Owner-approved US-to-Brazil fixed BRL and percentage costs and Brazil-to-US fixed USD and percentage costs; never infer unknown costs as zero. |
| 4 | P0 | `BACKLOG-003` | Verify one real executable listing or dealer offer with price, quantity, counterparty, timestamp, and notes before promoting any arbitrage candidate to `ACTIONABLE`. |
| 5 | P1 | `BACKLOG-004` | Reconcile the highest-value remaining LigaMagic edition gaps using exact evidence only; preserve the fuzzy-match and Textless prohibitions. |
| 6 | P1 | `BACKLOG-005` | Activate required employee authentication only after a live owner callback and membership verification. |
| 7 | P1 | `BACKLOG-006` | Decide whether to authorize the daily 03:00 LigaMagic export schedule after the supervised profile remains reliable. |
| 8 | P2 | `BACKLOG-007` | Implement marketplace-neutral listing readiness under `PHR-WORKFLOW-011`; publication, payments, shipping, settlement, and automatic repricing remain separate gates. |
| 9 | P2 | `BACKLOG-008` | Add licensed or first-party active-listing and sold-copy evidence without promoting estimates into transaction truth. |
| 10 | P3 | `BACKLOG-009` | Resume Riftbound only after Riot authorization and provider prerequisites exist. |

## Ordering policy

Active-task remaining work is P0. Backlog items use their explicit P0–P3 marker
and default to P2. Ties retain source order.
