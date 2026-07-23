# PHR-WORKFLOW-002: Canonical Product Development Workflow

## Feature ID

`PHR-WORKFLOW-002`

## Title

Three-Role Canonical Product Development Workflow

## Status

Completed

## Priority

Critical

## Category

Workflow / Architecture / Developer Notes / Testing

## Objective

Establish CTO, Chief Architect, and Engineer as explicit, non-overlapping roles with durable artifacts, approval gates, and evidence-based handoffs.

## Background

Phronesis already has extensive implementation and documentation, but agent authority and handoff behavior were implicit. Long pauses and changing AI sessions make implicit workflow unreliable.

## Problem Statement

Without role contracts, an agent can silently combine product decisions, architecture decisions, implementation, and acceptance. Conversation context can disappear, documentation can become stale, and completed work can be difficult to audit.

Role names and bare commands can also exist in multiple projects. Without a repository-owned Structure pointer and identity checks, a Phronesis role can accidentally treat another project's work order as authoritative.

## Proposed Solution

Use the following canonical flow:

```text
Product conversation
  -> CTO product brief and priority
  -> Chief Architect specification and work order
  -> CTO approval when scope or tradeoffs materially change
  -> Engineer implementation, tests, and implementation report
  -> Chief Architect conformance review
  -> CTO acceptance and memory update
```

Documentation-first work may combine gates in one session only when the scope is explicit, reversible, and does not require a material product choice. The artifacts and role-specific checks remain mandatory.

## Functional Requirements

- CTO owns product intent, priorities, scope, acceptance, and Product Development Memory.
- Chief Architect owns system design, boundaries, feature specifications, implementation prompts, risk analysis, and conformance review.
- Engineer owns only the approved work order, implementation, tests, and factual implementation reporting.
- No role may claim another role's approval.
- Material ambiguity, destructive action, external publication, and scope expansion return to the CTO.
- Every meaningful change must have a permanent Feature ID and documentation-first traceability.
- Every handoff must identify inputs, outputs, decisions, open questions, and the next accountable role.
- `docs/product-development/CURRENT_CTO_STRUCTURE.md` is the only Phronesis Structure authority for bare `Prompt`, `Implement`, and `Review` commands.
- Before acting on a bare role command, verify the Phronesis project identity, repository root, `PHR-` Feature ID prefix, and required Structure status.
- Another project's workspace, cloud document, Feature ID, conversation, or Structure file has no authority in Phronesis unless the CTO explicitly approves an import or comparison.

## Non-Functional Requirements

### Maintainability

Role contracts must live in discoverable repository files and use stable terminology.

### Reliability

The workflow must remain usable after a new chat starts with no transient conversation context.

### Security

Roles must not broaden authorization, disclose secrets, or perform external actions without appropriate approval.

### Extensibility

Specialist agents may assist a role but do not receive independent product authority.

## User Stories

- As product owner, I want the CTO role to preserve intent and decisions across sessions.
- As Chief Architect, I want approved product intent before defining implementation boundaries.
- As Engineer, I want an implementation-grade work order and objective acceptance criteria.

## Acceptance Criteria

- `AGENTS.md` declares the canonical workflow and default CTO-session behavior.
- Role contracts exist for all three roles.
- Handoff gates and escalation conditions are explicit.
- The conversation ledger records product decisions and session outcomes.

## Edge Cases

- Small housekeeping may be completed in one session, but must not bypass a required feature specification.
- Urgent fixes may compress the workflow; retrospective documentation and independent conformance review remain required.
- If no Chief Architect or Engineer session is separately available, one agent may execute sequential roles but must label role transitions and may not fabricate independent approval.
- If a Structure file identifies another project or a non-`PHR-*` work item, the role must stop before producing a prompt or editing files and report a project-boundary violation.

## Dependencies

- `PHR-TECH-001` Documentation-First Development System.
- `PHR-TECH-002` Product Development Memory.

## Technical Notes

Canonical artifacts are defined in `.agents/README.md`, `.agents/roles/`, and `docs/product-development/CURRENT_CTO_STRUCTURE.md`.

## Success Metrics

- Every implementation-grade change has an identifiable CTO intent, architecture work order, engineering evidence, review, and acceptance state.
- A fresh agent can resume using repository memory without relying on an unavailable chat transcript.

## Open Questions

- Whether future automation should generate structured session records from chat exports.

## Traceability

- Originating work order: CTO resumption and upkeep request, 2026-07-22.
- Related implementation prompt: `docs/prompts/PHR-WORKFLOW-002-implementation-prompt.md`.
- Related tests: `docs/testing/PHR-WORKFLOW-002-canonical-workflow-validation.md`.
- Related release notes: `docs/release-notes/PHR-WORKFLOW-002.md`.
- Last modified: 2026-07-22.
- Modification reason: Install the three-role Canonical Workflow and isolate Phronesis role commands from cross-project Structure contamination.
