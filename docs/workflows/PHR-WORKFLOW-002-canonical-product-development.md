> **HISTORICAL PROJECT WORKFLOW — NON-AUTHORITATIVE**
>
> This document is preserved as project-specific history and evidence. The shared Master Canonical Product Development Workflow at `/Volumes/JarvisSSD/Projects/_shared/governance/MASTER_CANONICAL_PRODUCT_DEVELOPMENT_WORKFLOW.md` governs current workflow. Project-specific requirements in this file remain applicable only when incorporated through this project's pointer, role supplements, or current structure.

# PHR-WORKFLOW-002: Canonical Product Development Workflow

## Feature ID

`PHR-WORKFLOW-002`

## Title

Three-Role Canonical Product Development Workflow

## Status

Historical / Superseded

## Priority

Critical

## Category

Workflow / Architecture / Developer Notes / Testing

## Objective

Establish CTO, Chief Architect, and Engineer as explicit, non-overlapping roles with durable artifacts, evidence-based gates, and autonomous handoffs that interrupt the user only for critical risk or indispensable product direction.

## Background

Phronesis already has extensive implementation and documentation, but agent authority and handoff behavior were implicit. Long pauses and changing AI sessions make implicit workflow unreliable.

## Problem Statement

Without role contracts, an agent can silently combine product decisions, architecture decisions, implementation, and acceptance. Conversation context can disappear, documentation can become stale, and completed work can be difficult to audit.

Role names and bare commands can also exist in multiple projects. Without a repository-owned Structure pointer and identity checks, a Phronesis role can accidentally treat another project's work order as authoritative.

## Proposed Solution

Use the following canonical flow. Once the user supplies an outcome, the workflow advances between roles without requiring repeated user commands:

```text
Product conversation
  -> CTO product brief and priority
  -> Chief Architect specification and work order
  -> automatic Engineer handoff when the work order remains within intent and the risk envelope
  -> Engineer implementation, tests, and implementation report
  -> automatic Chief Architect conformance review
  -> automatic remediation loop when bounded and non-critical
  -> CTO acceptance and memory update
  -> user interruption only for a Critical Escalation Condition
```

Gates are evidence checkpoints, not conversational permission prompts. Documentation-first work may combine roles sequentially in one session when the scope stays within the approved outcome and risk envelope. The agent must declare role transitions, preserve role-specific artifacts and checks, and must not describe same-session review as independent approval.

## Standing Autonomous Authorization

The user's approved objective grants standing authority to perform the ordinary, necessary, and proportionate work needed to reach that objective, including repository inspection, specifications, implementation prompts, local edits, tests, builds, bounded remediation, conformance review, and memory updates.

The workflow must make reasonable low-risk assumptions, record them, and continue. It must not stop merely because a new role begins, a validation attempt fails, documentation needs reconciliation, or a reversible implementation detail must be selected.

Standing authority does not broaden the user's objective. New product scope must be separately justified as necessary to the approved outcome or returned to the user when it materially changes that outcome.

## Critical Escalation Conditions

Pause and obtain user direction only when at least one of these conditions applies:

- an irreversible or destructive operation lacks a verified recovery path;
- production deployment, public publication, customer-visible release, or mutation of a live external system was not explicitly part of the approved objective;
- credentials, secrets, personal data, access control, security posture, or privacy could be materially exposed or weakened;
- force push, published-history rewriting, permanent data deletion, source-checkout deletion, or destruction of the last verified rollback is proposed;
- the action can create material financial cost, contractual commitment, legal/compliance exposure, or communication to another person or organization;
- two or more plausible product choices would materially change user-visible behavior, priority, business rules, or the requested outcome and repository evidence cannot resolve the choice;
- verification shows suspected data loss, repository corruption, security compromise, or a recovery procedure whose safety cannot be established;
- required authority, credentials, hardware access, or user-controlled external state is genuinely unavailable.

An ordinary test failure, lint error, build defect, documented technical debt item, reversible refactor, recoverable migration phase, or disagreement that can be resolved from the specification is not by itself a critical escalation.

## Autonomous Remediation Loop

When Engineer verification or Chief Architect review finds a non-critical defect:

1. Chief Architect records the deviation and issues a bounded remediation amendment.
2. Engineer performs the remediation and returns fresh evidence.
3. Chief Architect repeats conformance review.
4. The loop continues while it makes meaningful progress and remains within the approved objective and risk envelope.

The CTO records final acceptance automatically when objective evidence satisfies the acceptance criteria. The user receives a concise completion report rather than being asked to approve every internal gate.

## Functional Requirements

- CTO owns product intent, priorities, scope, acceptance, and Product Development Memory.
- Chief Architect owns system design, boundaries, feature specifications, implementation prompts, risk analysis, and conformance review.
- Engineer owns only the approved work order, implementation, tests, and factual implementation reporting.
- No role may claim another role's approval.
- Role handoffs and bounded remediation proceed automatically without requiring bare `Prompt`, `Implement`, `Review`, or `Final Review` commands.
- Only Critical Escalation Conditions interrupt the user; other ambiguity is resolved from approved intent, repository evidence, and the safest reversible option.
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

Roles must not broaden the approved objective, disclose secrets, or cross a Critical Escalation Condition without user direction.

### Extensibility

Specialist agents may assist a role but do not receive independent product authority.

## User Stories

- As product owner, I want the CTO role to preserve intent and decisions across sessions.
- As Chief Architect, I want approved product intent before defining implementation boundaries.
- As Engineer, I want an implementation-grade work order and objective acceptance criteria.
- As product owner, I want routine role transitions and remediation to happen autonomously so I am interrupted only for consequential decisions or critical risk.

## Acceptance Criteria

- `AGENTS.md` declares the canonical workflow and default CTO-session behavior.
- Role contracts exist for all three roles.
- Handoff gates and escalation conditions are explicit.
- An approved objective can progress CTO -> Chief Architect -> Engineer -> review -> acceptance without repeated user commands.
- The conversation ledger records product decisions and session outcomes.

## Edge Cases

- Small housekeeping may be completed in one session, but must not bypass a required feature specification.
- Urgent fixes may compress the workflow; retrospective documentation and conformance review remain required.
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

- Whether future tooling should generate machine-readable handoff and escalation records automatically.

## Traceability

- Originating work order: CTO resumption and upkeep request, 2026-07-22.
- Related implementation prompt: `docs/prompts/PHR-WORKFLOW-002-implementation-prompt.md`.
- Related tests: `docs/testing/PHR-WORKFLOW-002-canonical-workflow-validation.md`.
- Related release notes: `docs/release-notes/PHR-WORKFLOW-002.md`.
- Last modified: 2026-07-26.
- Modification reason: Replace conversational permission gates with autonomous evidence gates and narrowly defined critical-risk escalation.
