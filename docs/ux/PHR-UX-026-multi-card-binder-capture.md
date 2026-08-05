# PHR-UX-026 — Multi-Card And Binder Capture

## Feature ID

`PHR-UX-026`

## Status

Automatic Segmentation Benchmark Tooling Implemented — Real Holdout And Production Activation Deferred

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
- Automatic detection uses normalized top-left-origin coordinates and returns suggestions separately from active region revisions.
- Qualification requires a labeled, immutable binder holdout with exact-count, localization, precision, recall, latency, and failure-stratum evidence.
- Each real benchmark case binds a unique source-frame hash, unique label hash, and explicit labeling approval with approver, timestamp, and scope.
- Synthetic fixtures may validate contracts and deterministic behavior but can never qualify production activation.

## Acceptance Criteria

- Multi-region capture produces the same evidence-backed canonical assets as the one-card pipeline.
- Region correction remains auditable and reproducible.
- Invalid, overlapping, or out-of-bounds corrections fail validation without changing the active region revision.
- An underpowered benchmark reports `NOT_QUALIFIED`; no suggestion is inserted into the active repository without a later operator-confirmed adoption workflow.

## Non-Goals

- Claiming production binder segmentation accuracy without a labeled binder corpus.
- Condition grading or card identity inference inside the region editor.

## Dependencies

- Accepted one-card `PHR-WORKFLOW-016` release.

## Traceability

- Slice plan: `docs/product-development/PHR-LOCAL-CARD-RECOGNITION-20260804-slice-plan.md`.
- Design gate: `docs/design/PHR-UX-026-multi-card-binder-capture.md`.
- Related prompt: `docs/prompts/PHR-UX-026-multi-card-binder-capture-prompt.md`.
- Last modified: 2026-08-05.
- Modification reason: add benchmark-only local rectangle suggestions and qualification evidence without activating automatic binder segmentation.
