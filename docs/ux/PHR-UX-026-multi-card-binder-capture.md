# PHR-UX-026 — Multi-Card And Binder Capture

## Feature ID

`PHR-UX-026`

## Status

Implemented Foundation — Automatic Binder Segmentation Deferred

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
- Preserve normalized coordinates (`x`, `y`, `width`, `height`) in `[0,1]` plus rotation and deterministic region order.
- Record corrections as append-only revisions referencing the immutable source frame and prior region revision.
- Initial automatic detection may return one full-frame region; multi-card automatic segmentation remains benchmark-gated.

## Acceptance Criteria

- Multi-region capture produces the same evidence-backed canonical assets as the one-card pipeline.
- Region correction remains auditable and reproducible.
- Invalid, overlapping, or out-of-bounds corrections fail validation without changing the active region revision.

## Non-Goals

- Claiming production binder segmentation accuracy without a labeled binder corpus.
- Condition grading or card identity inference inside the region editor.

## Dependencies

- Accepted one-card `PHR-WORKFLOW-016` release.

## Traceability

- Slice plan: `docs/product-development/PHR-LOCAL-CARD-RECOGNITION-20260804-slice-plan.md`.
- Design gate: `docs/design/PHR-UX-026-multi-card-binder-capture.md`.
- Related prompt: `docs/prompts/PHR-UX-026-multi-card-binder-capture-prompt.md`.
- Last modified: 2026-08-04.
- Modification reason: implement the future-safe multi-region contract and manual correction foundation without overstating automatic binder detection.
