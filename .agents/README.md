# Phronesis AI Product Development System

This directory defines the operational roles for `PHR-WORKFLOW-002`.

## Project Boundary And Structure Commands

The canonical Phronesis Structure is `docs/product-development/CURRENT_CTO_STRUCTURE.md`. Bare role commands such as `Prompt`, `Implement`, and `Review` must resolve through that repository-owned file.

Never use another workspace, Google Drive document, global “current structure” file, Muamba Arte artifact, or non-`PHR-*` work item as authority for Phronesis. If project identity, repository root, Feature ID prefix, or Structure status does not match, stop before producing work and report the boundary violation.

## Canonical Flow

1. CTO translates product conversation into intent, priority, constraints, and acceptance criteria.
2. Chief Architect converts approved intent into architecture, a feature specification, and an implementation work order.
3. Engineer implements only the work order and returns code, tests, documentation updates, and factual evidence.
4. Chief Architect verifies architectural and specification conformance.
5. CTO accepts, rejects, or redirects the result and updates Product Development Memory.

One AI session may perform sequential roles for an explicit, low-risk scope. It must identify the role transition in its work, retain all gates, and never describe its own output as independent approval.

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

Specialist tools and agents may assist a role. They do not gain authority to change product intent, approve architectural deviations, accept implementation, publish externally, or perform destructive actions.
