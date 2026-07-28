# PHR-WORKFLOW-003: Shared Master Workflow Adoption

## Feature ID

`PHR-WORKFLOW-003`

## Status

Completed

## Priority

Critical

## Category

Workflow / Architecture / Developer Workflow

## Objective

Adopt the shared Master Canonical Product Development Workflow by stable pointer while preserving project identity, durable local memory, Structure authority, and historical Phronesis workflow evidence.

## Proposed Solution

- Reference the shared master from `.agents/WORKFLOW.md`.
- Declare Phronesis identity, JarvisSSD root, `PHR` prefix, Structure, memory, and design context locally.
- Mark `PHR-WORKFLOW-002` historical rather than maintaining a competing workflow copy.
- Register Designer and Debugger supplements and `docs/design/` for conditional gates.

## Acceptance Criteria

- `AGENTS.md` and `.agents/WORKFLOW.md` reference master revision 1.2.0 and the JarvisSSD root.
- CTO, Architect, Designer, Engineer, and Debugger supplements are discoverable.
- `PHR-WORKFLOW-002` is explicitly historical.
- Registry, Atlas, decisions, validation, release notes, prompts, and memory agree.

## Traceability

- Related prompt: `docs/prompts/PHR-WORKFLOW-003-shared-master-workflow-adoption-prompt.md`.
- Related tests: `docs/testing/PHR-WORKFLOW-003-shared-master-workflow-adoption-validation.md`.
- Related release notes: `docs/release-notes/PHR-WORKFLOW-003.md`.
- Last modified: 2026-07-28.
