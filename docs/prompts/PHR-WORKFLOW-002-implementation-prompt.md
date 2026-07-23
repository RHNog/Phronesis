# PHR-WORKFLOW-002 Implementation Prompt

## Project Context

Phronesis uses documentation-first, AI-assisted product development.

## Feature ID

`PHR-WORKFLOW-002`

## Objective

Install explicit CTO, Chief Architect, and Engineer role contracts with gated handoffs.

## Required Reading

- `docs/workflows/PHR-WORKFLOW-002-canonical-product-development.md`
- `docs/DOCUMENTATION_FIRST_DEVELOPMENT.md`

## Implementation Requirements

- Add discoverable role contracts and workflow instructions.
- Make the primary chat the CTO interface.
- Preserve product, architecture, implementation, review, and acceptance authority boundaries.
- Add a repository-owned Phronesis Structure command source with project identity, Feature ID prefix, readiness, and repository-boundary checks.
- Make every role reject another project's Structure and work-item identifiers.

## Constraints

- Do not grant tools or agents authority beyond user authorization.
- Do not fabricate independent approvals when one agent performs sequential roles.
- Do not use external/global Structure files to resolve Phronesis commands.

## Testing Expectations

- Validate required files, terminology, gates, and links.

## Documentation Updates

- Feature Registry, Decisions, Atlas, handoff, release notes, validation, changelog, and conversation ledger.

## Acceptance Criteria

- All criteria in `PHR-WORKFLOW-002` pass.

## Non-Goals

- Automated orchestration or external issue-tracker integration.
