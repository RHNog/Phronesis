<!-- handoff: {"branch":"codex/phr-price-monitoring-20260730","config_digest":"24af9188f29175240948655dcb0825cf42575569652aa5b2f688a4110d8542af","document":"WORK_QUEUE","generated":true,"generated_at":"2026-08-03T19:08:17Z","generation_id":"826b8dac8451e5b915f2","head":"747479031eb828bbaf17dd095c2f27f4c9efb66c","schema_version":"1","worktree_fingerprint":"e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"} -->
# Work Queue

> Machine-generated from `docs/ai/ACTIVE_TASK.md` and `docs/BACKLOG.md`. Edit the sources, then
> run `update-work-queue`.

| Rank | Priority | Source ID | Work |
|---:|---:|---|---|
| 1 | P0 | `ACTIVE-001` | Commit the implementation, create the Handoff seal, push, and verify the hosted pull-request checks. |
| 2 | P0 | `ACTIVE-002` | Present public event-worker activation as a separate Product Owner decision after the repair is green. |
| 3 | P0 | `BACKLOG-001` | Complete local validation, commit the event-worker gateway implementation, create a fresh Handoff seal, and confirm both GitHub pull-request jobs pass. |
| 4 | P0 | `BACKLOG-002` | Activate the public event-worker Funnel only during an explicitly approved event window after Product Owner review; keep private port 9443 unchanged. |
| 5 | P0 | `BACKLOG-003` | Configure Product Owner-approved US-to-Brazil fixed BRL and percentage costs and Brazil-to-US fixed USD and percentage costs; never infer unknown costs as zero. |
| 6 | P0 | `BACKLOG-004` | Verify one real executable listing or dealer offer with price, quantity, counterparty, timestamp, and notes before promoting any arbitrage candidate to `ACTIONABLE`. |
| 7 | P1 | `BACKLOG-005` | Reconcile the highest-value remaining LigaMagic edition gaps using exact evidence only; preserve the fuzzy-match and Textless prohibitions. |
| 8 | P1 | `BACKLOG-006` | Activate required employee authentication only after a live owner callback and membership verification. |
| 9 | P1 | `BACKLOG-007` | Decide whether to authorize the daily 03:00 LigaMagic export schedule after the supervised profile remains reliable. |
| 10 | P2 | `BACKLOG-008` | Implement marketplace-neutral listing readiness under `PHR-WORKFLOW-011`; publication, payments, shipping, settlement, and automatic repricing remain separate gates. |
| 11 | P2 | `BACKLOG-009` | Add licensed or first-party active-listing and sold-copy evidence without promoting estimates into transaction truth. |
| 12 | P3 | `BACKLOG-010` | Resume Riftbound only after Riot authorization and provider prerequisites exist. |

## Ordering policy

Active-task remaining work is P0. Backlog items use their explicit P0–P3 marker
and default to P2. Ties retain source order.
