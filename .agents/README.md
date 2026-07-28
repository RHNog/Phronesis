# Phronesis AI Product Development System

This directory defines Phronesis role supplements under the shared master workflow referenced by `.agents/WORKFLOW.md`.

## Project Boundary And Structure Commands

The canonical Phronesis Structure is `docs/product-development/CURRENT_CTO_STRUCTURE.md`. Bare role commands such as `Prompt`, `Implement`, and `Review` must resolve through that repository-owned file.

Never use another workspace, Google Drive document, global “current structure” file, Muamba Arte artifact, or non-`PHR-*` work item as authority for Phronesis. If project identity, repository root, Feature ID prefix, or Structure status does not match, stop before producing work and report the boundary violation.

## Canonical Flow

1. CTO translates product conversation into intent, priority, constraints, and acceptance criteria.
2. Chief Architect converts approved intent into architecture, a feature specification, and an implementation work order.
3. Engineer implements only the work order and returns code, tests, documentation updates, and factual evidence.
4. Chief Architect verifies architectural and specification conformance.
5. CTO accepts, rejects, or redirects the result and updates Product Development Memory.

After the user approves an objective, these handoffs are automatic. Do not wait for separate `Prompt`, `Implement`, `Review`, or `Final Review` messages when the next role can proceed safely from repository evidence. One AI session may perform roles sequentially; it must identify role transitions, retain all gates, and never describe its own output as independent approval.

Non-critical defects enter an automatic Architect -> Engineer -> Architect remediation loop. Interrupt the user only for the Critical Escalation Conditions defined in the shared master workflow.

## Required Artifacts

- Permanent Feature ID and specification.
- AI-ready implementation prompt when code or repository implementation is required.
- Test or validation record.
- Release note for completed behavior or governance.
- Dependent Atlas, decision, roadmap, handoff, and memory updates when affected.

## Handoff Contract

Every handoff identifies:

- accountable source and destination roles;
- approved Feature ID and scope;
- required reading and constraints;
- produced artifacts and verification evidence;
- deviations, risks, and unresolved questions;
- next gate and acceptance owner.

## Authority Boundary

Specialist tools and agents may assist a role. They do not gain independent product authority. Ordinary reversible work within the approved objective is authorized; critical-risk actions still require user direction under the shared master workflow.
