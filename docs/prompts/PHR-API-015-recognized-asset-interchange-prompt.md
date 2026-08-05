# PHR-API-015 — Implementation Work Order

## Feature ID

`PHR-API-015`

## Required Reading

- `docs/api/PHR-API-015-recognized-asset-interchange.md`
- `docs/architecture/PHR-ARCH-015-local-card-acquisition-recognition-platform.md`
- `docs/workflows/PHR-WORKFLOW-011-marketplace-neutral-listing-readiness.md`

## Implementation Requirements

- Implement strict Recognized Asset Envelope v1 types, parsing, canonical serialization, checksums, duplicate rejection, and immutable evidence references.
- Export only accepted or operator-reviewed assets with resolved material and current bindings.
- Add pure draft adapters for TCGplayer, LigaMagic, and LigaPokémon plus conformance fixtures.
- Unknown versions, unresolved fields, stale mappings, duplicate assets, and abstentions fail closed.

## Constraints

- Do not modify or invoke TCGPLAYER Tools, browser automation, credentials, or publishers. The external project is dirty and remains an independent consumer.

## Testing Expectations

- Schema round trips, stable checksums, every fail-closed branch, adapter fixtures, and proof that adapters expose no publication operation.
