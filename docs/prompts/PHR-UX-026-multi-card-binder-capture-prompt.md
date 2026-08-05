# PHR-UX-026 — Implementation Work Order

## Feature ID

`PHR-UX-026`

## Required Reading

- `docs/ux/PHR-UX-026-multi-card-binder-capture.md`
- `docs/design/PHR-UX-026-multi-card-binder-capture.md`
- `docs/technical/PHR-TECH-014-local-recognition-corpus-engine.md`

## Implementation Requirements

- Implement normalized multi-region contracts, validation, deterministic ordering, and append-only correction revisions.
- Provide a one-full-frame fallback and manual region editor foundation.
- Route every active region through the same recognition contract.
- Add a local Vision rectangle-detection command that returns top-left-origin normalized suggestions with deterministic reading order.
- Add a deterministic labeled benchmark with IoU matching, precision, recall, exact-count rate, latency, and failure strata.
- Keep suggestions outside active repository revisions during this increment.

## Constraints

- Do not claim or activate automatic binder segmentation or recognition accuracy without a labeled immutable holdout and separate Product Review.

## Testing Expectations

- Full-frame, multi-region, rotation, correction, reject/restore, overlap policy, invalid bounds, revision history, and accessibility tests.
- Rectangle normalization/order/deduplication, nested-page suppression, invalid worker output, IoU matching, duplicate prediction, threshold validation, synthetic underpowered qualification, and Swift contract tests.
