# PHR-UX-026 — Multi-Card And Binder Capture

## Feature ID

`PHR-UX-026`

## Status

Future

## Priority

Low

## Category

UX / Capture / Computer Vision / Workflow

## Objective

Extend the frame-to-regions model to multiple cards, binder pages, cameras, and operator correction without changing canonical recognition or downstream contracts.

## Requirements

- Preserve one frame containing zero or more ordered regions.
- Let operators correct, split, merge, rotate, or reject regions without altering the immutable original.
- Reuse `PHR-TECH-014` recognition and `PHR-API-015` output.
- Complete a Designer gate before implementation.

## Acceptance Criteria

- Multi-region capture produces the same evidence-backed canonical assets as the one-card pipeline.
- Region correction remains auditable and reproducible.

## Dependencies

- Accepted one-card `PHR-WORKFLOW-016` release.

## Traceability

- Slice plan: `docs/product-development/PHR-LOCAL-CARD-RECOGNITION-20260804-slice-plan.md`.
- Last modified: 2026-08-04.
