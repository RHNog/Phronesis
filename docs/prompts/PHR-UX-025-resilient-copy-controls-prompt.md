# PHR-UX-025 — Resilient Copy Controls Implementation Prompt

## Project Context

Phronesis needs event-ready copy interactions that remain recoverable on mobile Safari and clipboard-restricted browsers.

## Feature ID

`PHR-UX-025`

## Objective

Replace direct Clipboard API calls with one reusable, accessible, fallible-operation-aware copy system.

## Required Reading

- `docs/ux/PHR-UX-025-resilient-copy-controls.md`
- `docs/architecture/PHR-ARCH-014-timed-event-worker-access.md`
- Next.js local `use client` directive documentation.

## Implementation Requirements

- Centralize modern, legacy, and manual clipboard recovery.
- Await and handle all copy outcomes.
- Provide visible and screen-reader feedback.
- Replace worker-code, public-link, and activation-link direct calls.
- Add deterministic adapter tests.

## Constraints

- Do not log or persist copied values.
- Do not add a dependency.
- Preserve public/private authentication and gateway boundaries.

## Expected Architecture

A browser utility owns copy-method selection; a reusable client component owns UI state; feature panels provide values and wording.

## Testing Expectations

- Modern success, Safari-style rejection fallback, and manual recovery unit coverage.
- Full regression, TypeScript, lint, build, and responsive checks.

## Documentation Updates

- Feature Registry, Atlas, Prompt History, release notes, validation, implementation report, conformance review, CTO structure, and conversation history.

## Acceptance Criteria

- No silent copy failure remains in current Phronesis UI.

## Non-Goals

- Native share sheets or automatic message sending.

## Notes For AI Coding Agents

- Preserve unrelated user changes and do not expose access values in diagnostics.
