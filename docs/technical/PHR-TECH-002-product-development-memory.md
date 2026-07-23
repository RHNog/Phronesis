# PHR-TECH-002: Product Development Memory

## Feature ID

`PHR-TECH-002`

## Title

Conversation-Derived Product Development Memory

## Status

Completed

## Priority

Critical

## Category

Technical / Workflow / Developer Notes / Architecture

## Objective

Turn CTO conversations into durable, repository-owned product memory without treating a chat window as the only source of truth.

## Background

Chat conversations contain valuable intent, corrections, tradeoffs, and decisions. Chat context is not guaranteed to be complete, exportable, or available to a future agent.

## Problem Statement

The repository has Atlas, decisions, prompts, and handoffs, but no canonical record connecting product conversations to the decisions and artifacts they caused.

## Proposed Solution

Maintain `docs/product-development/CONVERSATION_HISTORY.md` as the chronological CTO session index. Each entry records the date, source availability, user intent, decisions, resulting Feature IDs, artifacts, unresolved questions, and acceptance state. Detailed product truth remains in its owning specification or decision document; the ledger links to it.

## Functional Requirements

- Record the current CTO session as the first governed entry.
- Record future material CTO sessions before closure.
- Preserve user intent faithfully; distinguish quotation, summary, decision, and inference.
- Never claim to contain unavailable prior transcripts.
- Link every implemented decision to permanent Feature IDs and canonical documents.
- Keep secrets, credentials, and unnecessary personal data out of the ledger.
- Treat the repository as durable memory and the current chat as the active CTO interface.

## Non-Functional Requirements

### Maintainability

Entries must be concise indexes, not duplicate specifications.

### Reliability

Memory must survive a fresh chat, model change, or local context loss.

### Security

Do not persist secrets or sensitive transcript content. Summarize only what is necessary for product continuity.

### Extensibility

The Markdown ledger may later be generated from a structured local format or authorized transcript export.

## User Stories

- As product owner, I want my product conversations to remain discoverable and actionable after a long break.
- As a future agent, I want to distinguish approved decisions from discussion and inference.

## Acceptance Criteria

- The conversation ledger exists and records this resumption session.
- Role instructions require ledger updates at CTO acceptance.
- Missing historical transcripts are disclosed rather than reconstructed.
- Canonical product truth is linked instead of duplicated.

## Edge Cases

- Prior chats not present in the repository cannot be recovered automatically.
- A conversation containing no material product decision may be omitted or recorded as no-decision.
- A user may correct a summary; corrections append to history and update affected canonical documents.

## Dependencies

- `PHR-WORKFLOW-002` Canonical Product Development Workflow.

## Future Enhancements

- Import authorized chat exports with deduplication and redaction.
- Add schema validation for structured session records.

## Success Metrics

- A new CTO session can identify current intent, accepted decisions, and open questions from repository files alone.

## Open Questions

- Whether historical chat exports exist and should be imported in a future governed task.

## Traceability

- Originating work order: CTO resumption and upkeep request, 2026-07-22.
- Related implementation prompt: `docs/prompts/PHR-TECH-002-implementation-prompt.md`.
- Related tests: `docs/testing/PHR-TECH-002-product-memory-validation.md`.
- Related release notes: `docs/release-notes/PHR-TECH-002.md`.
- Last modified: 2026-07-22.
- Modification reason: Establish durable conversation-derived product memory.
