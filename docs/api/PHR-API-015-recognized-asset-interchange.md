# PHR-API-015 — Recognized Asset Interchange

## Feature ID

`PHR-API-015`

## Status

Planned

## Priority

Medium

## Category

API / Contract / Identity / Marketplace Integration / Audit

## Objective

Define an immutable marketplace-neutral `Recognized Asset Envelope v1` that downstream tools consume without re-running recognition or treating marketplace IDs as canonical identity.

## Requirements

- Include schema version, stable asset ID, canonical identity, decision status, confidence policy, evidence references, corpus/pipeline versions, condition/finish resolution, price/preset bindings, and validated market mappings.
- Export accepted or operator-reviewed results only; abstained results fail closed.
- TCGPLAYER Tools receives a thin adapter and conformance fixtures; projects do not share code, databases, credentials, or publishing authority.
- LigaMagic and LigaPokémon adapters consume the same envelope.
- Initial TCGPLAYER integration may produce a draft plan only and must not invoke browser-driven publication.

## Acceptance Criteria

- Schema validation and conformance fixtures pass in each consumer.
- Unknown schema versions, stale mappings, unresolved material fields, and duplicate asset IDs fail closed.
- Publication remains an explicit human-confirmed downstream action.

## Dependencies

- `PHR-ARCH-015` and `PHR-WORKFLOW-011`.

## Traceability

- Slice plan: `docs/product-development/PHR-LOCAL-CARD-RECOGNITION-20260804-slice-plan.md`.
- Last modified: 2026-08-04.
