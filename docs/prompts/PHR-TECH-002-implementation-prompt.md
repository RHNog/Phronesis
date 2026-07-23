# PHR-TECH-002 Implementation Prompt

## Project Context

Phronesis requires durable product memory across AI sessions.

## Feature ID

`PHR-TECH-002`

## Objective

Create a repository-owned conversation ledger that links CTO intent to canonical decisions and artifacts.

## Required Reading

- `docs/technical/PHR-TECH-002-product-development-memory.md`
- `docs/workflows/PHR-WORKFLOW-002-canonical-product-development.md`

## Implementation Requirements

- Add the ledger and current-session entry.
- Require future CTO acceptance to update memory.
- Clearly disclose unavailable transcripts.

## Constraints

- Do not invent prior conversations or store credentials.
- Do not duplicate canonical specifications inside the ledger.

## Testing Expectations

- Validate the ledger structure, source disclosure, links, and role requirements.

## Documentation Updates

- Feature Registry, Decisions, Atlas, handoff, release notes, validation, and changelog.

## Acceptance Criteria

- All criteria in `PHR-TECH-002` pass.

## Non-Goals

- Automatic recovery of unavailable chat history.
