# PHR-TECH-007 — Durable Local Artwork Cache

## Feature ID

`PHR-TECH-007`

## Status

Product Review Ready

## Priority

Critical Event Reliability

## Category

Technical / Local Storage / Reliability / Security / Provider Governance

## Objective

Keep already-authorized provider artwork locally so Vendor Workspace remains fast and substantially usable during unreliable card-show connectivity without repeatedly requesting the same image.

## Background

Phronesis currently caches provider search responses and image URL choices but the browser still retrieves image bytes from remote hosts. The Product Owner requested local artwork retention and attested that Bandai One Piece artwork use is authorized.

## Proposed Solution

- Add one same-origin image route backed by ignored `.data/artwork/` storage.
- Accept only HTTPS URLs from an exact provider-host allowlist and approved path boundaries.
- Hash the canonical source URL for the local key; retain source host/path, retrieval time, content type, byte length, content checksum, and authorization provenance in a sidecar metadata record.
- Validate status, raster MIME, magic bytes, and maximum response size before atomic persistence.
- Coalesce simultaneous requests for the same image.
- Serve cached bytes locally with immutable browser caching; on failure, preserve the existing placeholder behavior.

## Functional Requirements

- Scryfall, TCGdex, Lorcast, Bandai One Piece, and verified TCGplayer image hosts are eligible only through exact allowlist validation.
- SVG, HTML, redirects to an unapproved host, credentials in URLs, custom ports, oversized bodies, and invalid raster signatures fail closed.
- Cache files remain outside Git and contain no credentials.
- The first valid request may use the provider; later requests use local bytes until explicitly invalidated.
- One Piece official image suffixes remain part of immutable asset identity.

## Non-Functional Requirements

### Reliability

Atomic writes and content hashes prevent partial files from becoming visible.

### Security

The route is not a general-purpose proxy. Only exact approved hosts and paths can be fetched.

### Performance

Artwork loads lazily. The implementation does not bulk-download entire provider catalogues; visible or explicitly prewarmed unique artworks populate the cache.

### Offline Support

Previously cached artwork remains available while providers or network access are unavailable, provided the local Phronesis service is running.

## Acceptance Criteria

- A validated remote raster is written once and subsequently served without another provider call.
- Invalid host, path, MIME, signature, or size cannot write cache state.
- Provider artwork URLs returned to Vendor Workspace are same-origin local-cache URLs.
- Existing placeholders remain the failure path.
- Focused tests, lint, build, diff, and desktop/mobile runtime review pass.

## Authorization Provenance

On 2026-07-29 the Product Owner instructed Phronesis to consider Bandai authorization given. The system records this as a Product Owner attestation, not independent legal verification.

## Traceability

- Product direction: 2026-07-29 local artwork retention and Bandai authorization attestation.
- Implementation prompt: `docs/prompts/PHR-TECH-007-durable-local-artwork-cache-prompt.md`.
- Related provider feature: `PHR-API-002`.
- Validation: `docs/testing/PHR-TECH-007-durable-local-artwork-cache-validation.md`.
- Release note: `docs/release-notes/PHR-TECH-007.md`.
- Last modified: 2026-07-29.
