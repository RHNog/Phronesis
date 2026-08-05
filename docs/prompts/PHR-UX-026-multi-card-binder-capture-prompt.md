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

## Constraints

- Do not claim automatic binder segmentation or recognition accuracy without a labeled benchmark.

## Testing Expectations

- Full-frame, multi-region, rotation, correction, reject/restore, overlap policy, invalid bounds, revision history, and accessibility tests.
