# Asset Visual Identity

## Feature ID

`PHR-UI-001`

## Title

Canonical Asset Visual Identity and Image Cache

## Status

Completed

## Priority

High

## Category

UI, UX, Technical

## Objective

Make card artwork a consistent, reusable asset identity across Project Phronesis, beginning with Market Watch and the Universal Asset Picker.

## Background

Platform v1.0 already normalizes provider artwork on card identities, but image selection, fallback presentation, and cache diagnostics were owned by an isolated UI helper. Market Watch did not display artwork.

## Problem Statement

Modules could independently select URLs or render broken images, and the watchlist lacked the requested visual anchor. The previous component also bypassed Next.js image optimization.

## Proposed Solution

Create a provider-agnostic image layer under `components/cards/`. `CardThumbnail` is the canonical module-facing component. `CardImage` owns presentation and extension slots. `CardImageCache` resolves normalized repository, replay, and provider candidates once per asset and display size. Next.js and the browser cache the optimized image response. `CardImagePlaceholder` handles missing and failed artwork.

## Functional Requirements

- Resolve candidates in Repository, Replay, Provider order.
- Reuse a prior resolution as Cached for the lifetime of the application session.
- Render a Project Phronesis placeholder for absent or failed artwork.
- Expose overlay and action slots without changing component hierarchy later.
- Display source diagnostics in developer mode.
- Use the canonical thumbnail in Market Watch and Universal Asset Picker results.
- Expose reusable viewport-clamped hover/focus preview presentation through the canonical image candidates without adding provider discovery.
- Show watchlist name, printing, collector number, game, current price, target, difference, trend, and status with artwork as the row anchor.
- Show picker thumbnail, card name, set, collector number, finish, and language.

## Non-Functional Requirements

### Performance

Images lazy load, use explicit dimensions and responsive `sizes`, use provider size variants, and pass through Next.js image optimization and HTTP/browser caching.

### Scalability

Additional providers and a future local cache add normalized candidates without changing card UI components.

### Maintainability

No module should implement independent card artwork selection or fallback logic.

### Reliability

Network and decoding errors transition to the placeholder without a broken-image surface.

### Accessibility

Artwork has contextual alternative text; placeholder state has an explicit accessible label.

### Offline Support

Previously browser-cached optimized images may remain available; uncached images fall back cleanly. Durable offline image storage is future scope.

### Security

Next.js only accepts remote images from explicitly configured provider artwork hosts.

### Extensibility

The stable figure hierarchy includes optional selected state, overlay, and quick-action slots.

### Responsiveness

Thumbnail dimensions remain stable on mobile and desktop to prevent layout shift.

## User Stories

- As a collector, I want artwork to anchor each asset so I can scan lists quickly.
- As a developer, I want image provenance and cache state so I can diagnose provider behavior.

## Acceptance Criteria

- Mox Opal, Lightning Bolt, Collected Company, and Elsa – Spirit of Winter render repository artwork in Market Watch.
- Repeated component resolution returns Cached without selecting or downloading another URL.
- Missing or failed artwork renders the Phronesis placeholder.
- Search and printing results use `CardThumbnail`.
- Hover, selected state, overlays, and actions use the existing component hierarchy.
- Vendor Workspace can enlarge canonical artwork without rendering a separate image-selection path.

## Edge Cases

- Empty candidate lists use Placeholder.
- A candidate with only one image size uses it for all display sizes.
- Provider URL failure uses Placeholder.
- A newly available image can be adopted through explicit cache invalidation.

## Dependencies

- Platform v1.0 Identity and Provider SDK boundaries.
- Existing Scryfall-normalized image URLs.
- Repository-owned seed identities for Market Watch.
- Next.js 16 Image component and remote pattern configuration.

## Future Enhancements

- Cache Storage or IndexedDB for explicit offline image-byte persistence.
- Face switching, contextual overlays, and quick actions.
- Repository-owned image freshness metadata and provider failover.

## Technical Notes

The cache stores image resolutions, not image bytes. Next.js image optimization plus browser HTTP caching owns byte reuse. This separation keeps provider selection testable and keeps storage policy replaceable.

## UI / UX Notes

All artwork uses a 5:7 aspect ratio, rounded-lg radius, zinc border, subtle shadow, cyan hover border, and cyan selected ring.

## Success Metrics

- Zero broken-image surfaces.
- One canonical visual component consumed by implemented list/search surfaces.
- Zero provider calls caused by initial Market Watch image rendering.

## Open Questions

- Durable offline byte-cache quota and invalidation policy remain future decisions.

## Traceability

- Originating work order: Asset Visual Identity, Epic 1 Market Watch v1.0.
- Related implementation prompt: `docs/prompts/PHR-UI-001-implementation-prompt.md`.
- Related tests: `tests/card-image-cache.test.ts`.
- Related release notes: `docs/release-notes/PHR-UI-001.md`.
- Last modified: 2026-08-01.
- Modification reason: Record `PHR-UX-017` adoption of the canonical image hierarchy for reusable hover/focus preview presentation.
