# PHR-LOCAL-CARD-RECOGNITION-20260804 — Controlled Lane Slice Plan

## Plan Identity

- Assignment: `PHR-LOCAL-CARD-RECOGNITION-20260804`
- Project: `Phronesis`
- Canonical repository: `/Volumes/JarvisSSD/Projects/Phronesis`
- Workflow revision: `2.20.0`
- Delivery lane: `Controlled`
- Plan ID: `PHR-PLAN-20260804-002`
- Plan fingerprint input: `PHR-LOCAL-CARD-RECOGNITION-20260804|2.20.0|CONTROLLED|S1:PHR-TECH-013-A|S1W:PHR-TECH-015|S2:PHR-TECH-013-B|S3:PHR-TECH-014|S4:PHR-WORKFLOW-016|S5:PHR-API-015|S6:PHR-UX-026|AUTHORIZED:2026-08-04|AUTO_ACCEPT:BENCHMARK_GATED|PUBLISH:DISABLED`
- Plan fingerprint: `6e3ad12423e6abd178d7a722958e416b204885b859b7cf1ce5f5f9a217861f2d`
- Approved product brief: Product Owner-approved local card-recognition brief and CTO structure, 2026-08-04.

## Lane Rationale

Native signed code, valuable physical assets, raw scan privacy, high-precision recognition claims, cross-repository contracts, and external listing boundaries require Controlled Lane checkpoints and explicit rollback evidence.

## Ordered Slices

| Slice | Feature | Product-facing outcome | Accountable role | Dependencies | Acceptance checkpoint | Rollback boundary |
|---|---|---|---|---|---|---|
| S1 | `PHR-TECH-013-A` | Actual macOS/fi-8170 capabilities and evidence-safe probe | Engineer | Connected scanner only for physical gate | Swift tests, disconnected run, then supervised low-value duplex evidence | Remove standalone probe; no product/runtime state |
| S1W | `PHR-TECH-015` | Temporary supported Windows PaperStream capture with sealed Mac import | Engineer | macOS 27 ICA compatibility blocker; working local Windows VM | cross-platform tests, VM preflight, then supervised low-value duplex evidence | remove dedicated share/tools; preserve captured evidence |
| S2 | `PHR-TECH-013-B` | Durable signed acquisition agent and normalized session transport | Engineer | Accepted S1 | restart/disconnect/jam/duplicate delivery tests | Disable agent; retain immutable evidence spool |
| S3 | `PHR-TECH-014` | Versioned corpus and calibrated recognition with abstention | Engineer | Accepted acquisition contract and licensed corpus | powered unseen holdout and rollback activation | return active pointer to last-good corpus/index |
| S4 | `PHR-WORKFLOW-016` | Offline English Pokémon scanner-to-offer workflow | Designer then Engineer | Accepted S2/S3 | end-to-end offer with traceability and no unresolved line | feature flag/session rollback; no purchase mutation |
| S5 | `PHR-API-015` | Marketplace-neutral recognized-asset interchange and draft adapters | Engineer | Accepted canonical output | schema conformance and draft-plan import | disable adapter/export version |
| S6 | `PHR-UX-026` | Windows parity and multi-card/binder expansion | Architect/Designer/Engineer | Accepted first release | platform/game-specific qualification | independent adapter/feature rollback |

## Final Integration Checks

- Offline scanner-to-offer flow on qualified English Pokémon cards.
- Evidence reproducibility from content hashes and recorded versions.
- No auto-accept without powered precision evidence.
- No downstream publication side effect.
- Windows and additional games inherit contracts, not unproven accuracy claims.
- Repository documentation, validation, conformance, Product Review, adoption, and remote continuity receipts agree on the exact checkpoint.

## Product Owner Decision Conditions

Return to the Product Owner only if:

- Windows topology requires LAN exposure or a different deployment model.
- Corpus licensing, raw-retention policy, or physical-card risk exceeds the approved brief.
- The first-game recommendation must change.
- A paid/cloud runtime, automatic condition grading, or automatic publishing becomes necessary.
- The physical fi-8170 test shows unacceptable damage or unsupported driver behavior.
- A workflow Critical Escalation Condition is reached.

## Current Slice

S1 software is verified but its physical gate remains blocked by the unsupported macOS 27 ICA runtime. The Product Owner authorized contingency S1W and then explicitly authorized autonomous implementation through the end of the approved brief on 2026-08-04. S1W is complete: Windows duplex acquisition, sealing, Mac hash/import evidence, operator handling, and repository gates pass. On 2026-08-05 the Product Owner changed S4's first product line from English Magic to English Pokémon; this bounded revision preserves the original Feature IDs and all review, auto-accept, and publication gates. The Pokémon-first revision is implemented and privately operational: append-only live replay produced eight reviews and ten abstentions, and the private phone workflow passed. Auto-accept remains disabled until a powered unseen holdout passes the approved policy, while downstream adoption and publication remain separate explicit gates.
