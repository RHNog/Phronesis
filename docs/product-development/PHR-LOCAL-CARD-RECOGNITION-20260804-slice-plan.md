# PHR-LOCAL-CARD-RECOGNITION-20260804 — Controlled Lane Slice Plan

## Plan Identity

- Assignment: `PHR-LOCAL-CARD-RECOGNITION-20260804`
- Project: `Phronesis`
- Canonical repository: `/Volumes/JarvisSSD/Projects/Phronesis`
- Workflow revision: `2.20.0`
- Delivery lane: `Controlled`
- Plan ID: `PHR-PLAN-20260804-001`
- Plan fingerprint input: `PHR-LOCAL-CARD-RECOGNITION-20260804|2.20.0|CONTROLLED|S1:PHR-TECH-013-A|S2:PHR-TECH-013-B|S3:PHR-TECH-014|S4:PHR-WORKFLOW-016|S5:PHR-API-015|S6:PHR-UX-026`
- Plan fingerprint: `dbe1741ebe0bcc8e75638a441d3e75c6baa19ef4b4e35cf95c40ea66ceb6d29c`
- Approved product brief: Product Owner-approved local card-recognition brief and CTO structure, 2026-08-04.

## Lane Rationale

Native signed code, valuable physical assets, raw scan privacy, high-precision recognition claims, cross-repository contracts, and external listing boundaries require Controlled Lane checkpoints and explicit rollback evidence.

## Ordered Slices

| Slice | Feature | Product-facing outcome | Accountable role | Dependencies | Acceptance checkpoint | Rollback boundary |
|---|---|---|---|---|---|---|
| S1 | `PHR-TECH-013-A` | Actual macOS/fi-8170 capabilities and evidence-safe probe | Engineer | Connected scanner only for physical gate | Swift tests, disconnected run, then supervised low-value duplex evidence | Remove standalone probe; no product/runtime state |
| S2 | `PHR-TECH-013-B` | Durable signed acquisition agent and normalized session transport | Engineer | Accepted S1 | restart/disconnect/jam/duplicate delivery tests | Disable agent; retain immutable evidence spool |
| S3 | `PHR-TECH-014` | Versioned corpus and calibrated recognition with abstention | Engineer | Accepted acquisition contract and licensed corpus | powered unseen holdout and rollback activation | return active pointer to last-good corpus/index |
| S4 | `PHR-WORKFLOW-016` | Offline English Magic scanner-to-offer workflow | Designer then Engineer | Accepted S2/S3 | end-to-end offer with traceability and no unresolved line | feature flag/session rollback; no purchase mutation |
| S5 | `PHR-API-015` | Marketplace-neutral recognized-asset interchange and draft adapters | Engineer | Accepted canonical output | schema conformance and draft-plan import | disable adapter/export version |
| S6 | `PHR-UX-026` | Windows parity and multi-card/binder expansion | Architect/Designer/Engineer | Accepted first release | platform/game-specific qualification | independent adapter/feature rollback |

## Final Integration Checks

- Offline scanner-to-offer flow on qualified English Magic cards.
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

S1 was automatically accepted because it is a reversible decomposition of the approved brief. Its software checkpoint is verified and conforms to the work order. Physical acceptance remains blocked until the scanner is connected and the Product Owner supplies low-value cards.
