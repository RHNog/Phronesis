# PHR-WORKFLOW-002 Release Notes

Phronesis now defines CTO, Chief Architect, and Engineer role contracts with explicit product, design, implementation, conformance-review, and acceptance gates.

## 2026-07-26 — Autonomous Handoffs

Approved objectives now move automatically through CTO intent, Chief Architect design, Engineer implementation, conformance review, bounded remediation, and CTO acceptance. Evidence gates remain mandatory, but separate role commands are no longer required. User interaction is reserved for narrowly defined critical-risk or materially outcome-changing decisions.

Role commands are now project-isolated. The repository-owned Current CTO Structure is the only authority for bare `Prompt`, `Implement`, and `Review` commands, and every role must reject mismatched project identities and non-`PHR-*` work items before acting.
