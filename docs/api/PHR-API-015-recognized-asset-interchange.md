# PHR-API-015 — Recognized Asset Interchange

## Feature ID

`PHR-API-015`

## Status

Implemented — Consumer Adoption Gated

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
- Canonical JSON serialization and SHA-256 bind every envelope to its exact content; timestamps do not participate in identity derivation.
- Envelope v1 uses `assetId`, `schemaVersion`, `canonicalIdentity`, `recognition`, `materialResolution`, `commercialBindings`, `marketMappings`, and `evidence` as top-level fields.
- Adapter outputs are newly derived artifacts with their own checksum and source-envelope checksum.

## Acceptance Criteria

- Schema validation and conformance fixtures pass in each consumer.
- Unknown schema versions, stale mappings, unresolved material fields, and duplicate asset IDs fail closed.
- Publication remains an explicit human-confirmed downstream action.
- TCGplayer draft CSV uses the existing `TCGplayer Id` and `Add to Quantity` boundary; Liga adapters emit provider-neutral draft rows until a provider-specific write contract is separately approved.

## Dependencies

- `PHR-ARCH-015` and `PHR-WORKFLOW-011`.

## Non-Goals

- Shared runtime code or databases with TCGPLAYER Tools.
- Credential handling, browser automation, marketplace mutation, or publication.
- Treating a provider identifier as canonical Phronesis identity.

## Traceability

- Slice plan: `docs/product-development/PHR-LOCAL-CARD-RECOGNITION-20260804-slice-plan.md`.
- Related prompt: `docs/prompts/PHR-API-015-recognized-asset-interchange-prompt.md`.
- Last modified: 2026-08-04.
- Modification reason: define the immutable v1 boundary and its fail-closed draft adapters before implementation.
