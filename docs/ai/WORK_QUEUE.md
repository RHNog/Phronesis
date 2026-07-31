<!-- handoff: {"branch":"codex/phr-price-monitoring-20260730","config_digest":"24af9188f29175240948655dcb0825cf42575569652aa5b2f688a4110d8542af","document":"WORK_QUEUE","generated":true,"generated_at":"2026-07-31T01:32:52Z","generation_id":"cb808ad1679d3a2b2140","head":"33bac5b617fab21c714f0071517e193f90aedc14","schema_version":"1","worktree_fingerprint":"e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"} -->
# Work Queue

> Machine-generated from `docs/ai/ACTIVE_TASK.md` and `docs/BACKLOG.md`. Edit the sources, then
> run `update-work-queue`.

| Rank | Priority | Source ID | Work |
|---:|---:|---|---|
| 1 | P0 | `ACTIVE-001` | Obtain the four owner-controlled cost inputs: US-to-Brazil fixed BRL, US-to-Brazil percentage, Brazil-to-US fixed USD, and Brazil-to-US percentage. |
| 2 | P0 | `ACTIVE-002` | After costs are stored, verify one current listing or dealer offer and confirm that only positive, fresh, fully evidenced economics become `ACTIONABLE`. |
| 3 | P0 | `BACKLOG-001` | Configure Product Owner-approved US-to-Brazil fixed BRL and percentage costs and Brazil-to-US fixed USD and percentage costs; never infer unknown costs as zero. |
| 4 | P0 | `BACKLOG-002` | Verify one real executable listing or dealer offer with price, quantity, counterparty, timestamp, and notes before promoting any arbitrage candidate to `ACTIONABLE`. |
| 5 | P1 | `BACKLOG-003` | Reconcile the highest-value remaining LigaMagic edition gaps using exact evidence only; preserve the fuzzy-match and Textless prohibitions. |
| 6 | P1 | `BACKLOG-004` | Activate required employee authentication only after a live owner callback and membership verification. |
| 7 | P1 | `BACKLOG-005` | Decide whether to authorize the daily 03:00 LigaMagic export schedule after the supervised profile remains reliable. |
| 8 | P2 | `BACKLOG-006` | Implement marketplace-neutral listing readiness under `PHR-WORKFLOW-011`; publication, payments, shipping, settlement, and automatic repricing remain separate gates. |
| 9 | P2 | `BACKLOG-007` | Add licensed or first-party active-listing and sold-copy evidence without promoting estimates into transaction truth. |
| 10 | P3 | `BACKLOG-008` | Resume Riftbound only after Riot authorization and provider prerequisites exist. |

## Ordering policy

Active-task remaining work is P0. Backlog items use their explicit P0–P3 marker
and default to P2. Ties retain source order.
