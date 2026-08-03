# PHR-UX-024 — Sealed Artwork Review Queue

## Feature ID

`PHR-UX-024`

## Title

Owner-Governed Pokémon Sealed Artwork Review Queue

## Status

In Progress — Assisted Recovery Amendment

## Priority

High

## Category

UX / UI / Workflow / Database / Artwork / Administration / Testing

## Objective

Recover defensible Pokémon sealed representative imagery automatically, while giving an authorized Phronesis owner or administrator a fast, auditable way to review the genuinely uncertain remainder without weakening the existing exact-artwork contract.

## Background

The exact community recovery under `PHR-API-004` maps 356 of 2,892 Pokémon sealed products (12.31%). Another 1,019 catalogue products have at least one plausible source candidate, but filename evidence cannot prove exact packaging, wrapper art, year, edition, or configuration. Automatically adopting those candidates creates false matches. Human review can convert a subset into explicitly owner-approved representative imagery.

## Problem Statement

The current ambiguity report is JSON intended for engineering audit. It is not practical for a product owner to inspect images, compare source filenames against catalogue identities, record a decision, or reverse a mistake. The initial review queue also overstates its practical ceiling: 598 products have exact-set and compatible-class candidates, while 421 products have only broad mixed-product guesses. Requiring the owner to review every row wastes operating time, but automatically accepting the entire queue would manufacture incorrect packaging evidence.

## Proposed Solution

Add an Administration Settings panel backed by a local review queue and a conservative assisted-recovery pass. A staging command reads the pinned public `ptcg-assets` manifest, generates review candidates for ambiguous Pokémon sealed identities, and persists only metadata in the local pricing database. The assisted pass may adopt a candidate only when the catalogue set and product class are exact and a versioned policy proves that the image is a safe representative rather than an exact package claim. Automated decisions receive `ASSISTED_REPRESENTATIVE` provenance and append-only audit evidence. The UI shows the unresolved remainder one product at a time with set, class, candidate filename, lazy-loaded image, and explicit owner actions. Exact, assisted-representative, and owner-representative coverage remain separately reported and every representative decision is reversible.

## Functional Requirements

- Stage all current ambiguous `ptcg-assets` candidates without a paid API request or image download.
- Provide a deterministic, versioned assisted pass that can be dry-run or applied repeatedly without duplicate decisions.
- Automatically adopt only exact-set, compatible-class representative candidates allowed by the documented safety policy.
- Exclude mixed-product guesses, edition-specific products, composite/case products, explicit wrapper-art variants, and otherwise value-sensitive ambiguity from automatic adoption.
- Store source revision, product identity key, source path, source URL, reason, and deterministic candidate order.
- Show queue totals for exact, owner representative, assisted representative, pending, rejected, visible, and total sealed products.
- Allow search by product, set, SKU, or source path.
- Lazy-load candidate images through the existing authenticated durable artwork proxy only when displayed.
- Allow `Approve representative`, `Reject`, `Restore`, and `Undo approval` actions.
- Never overwrite a current exact artwork resolution.
- Remove an approved product from the pending queue while retaining alternative candidates and history for reversal.
- Record actor, action, timestamp, identity key, candidate source, and optional reason as append-only review evidence.
- Surface active representative provenance to the Vendor Workspace artwork response so downstream UI can distinguish owner-approved from Phronesis-assisted imagery and label both truthfully.
- Preserve exact community mappings and all unrelated catalogue, pricing, checkout, inventory, event, and provider evidence.

## Non-Functional Requirements

### Performance

- Staging must remain bounded to the local Pokémon sealed catalogue and the pinned source tree.
- Queue reads must paginate and must not download candidate images eagerly.
- UI interactions should update without a full Settings reload.

### Scalability

- Candidate and event tables must support later providers and games through category, provider, and source-revision fields.

### Maintainability

- Candidate generation remains in the community artwork source layer; review persistence remains in the pricing repository; the route returns minimal DTOs.

### Reliability

- Staging is idempotent and preserves review events.
- Acceptance, assisted adoption, and reversal are transactional.
- Re-running the same assisted policy is idempotent and cannot overwrite exact or owner-approved artwork.
- Identity changes make old candidates ineligible until restaged.

### Accessibility

- All actions use labelled buttons with at least 44px touch targets, visible focus states, status announcements, and non-color-only state labels.

### Offline Support

- Queue metadata and decisions remain local. Images already in the durable cache remain available; uncached images require access to the approved GitHub raw host.

### Security

- Reads and mutations require `ADMINISTRATION`; mutations require `ADMIN` access.
- Candidate URLs must pass the existing artwork source allow-list.
- No provider secret or source credential is involved.

### Extensibility

- The provenance model must distinguish `EXACT`, `OWNER_APPROVED_REPRESENTATIVE`, and `ASSISTED_REPRESENTATIVE` and allow later curated-source tiers.

### Responsiveness

- Desktop uses a product summary beside candidate images; mobile stacks without horizontal overflow.

## User Stories

- As the owner, I want to compare an uncertain sealed SKU with its candidate images so I can approve useful artwork safely.
- As the owner, I want exact and representative coverage reported separately so I understand data quality.
- As the owner, I want to undo a mistaken approval so recovery does not require database access.

## Acceptance Criteria

- The current source stages the ambiguous review population locally and reports deterministic counts.
- Accepting a candidate activates its image with representative provenance and does not overwrite exact artwork.
- The assisted pass reports considered, applied, already-applied, and policy-skipped counts and leaves unsafe products pending.
- Reject, restore, and undo actions are persisted and survive restart.
- Vendor artwork responses identify active representative images.
- The queue is usable at desktop and 390px widths.
- Focused tests, full tests, TypeScript, lint, production build, and diff hygiene pass.

## Edge Cases

- A product may have multiple wrapper arts; each remains independently reviewable.
- A stale candidate whose identity key no longer matches the catalogue cannot be accepted.
- An existing exact mapping blocks representative approval.
- A source candidate removed by a later revision remains in immutable event history but is not newly offered.
- Reversal removes only the matching owner-approved or assisted representative mapping and cannot delete provider-exact or curated artwork.
- Repeated staging and repeated mutations are idempotent or return a safe conflict.

## Dependencies

- `PHR-API-004` Product Artwork Coverage.
- `PHR-TECH-007` Durable Artwork Cache.
- `PHR-UX-021` Secure Administration Settings.
- Existing pricing repository and authorization DAL.

## Future Enhancements

- Side-by-side reference photos from additional sealed-specific sources.
- Additional evidence sources and image understanding for the unresolved value-sensitive variants.
- Confidence calibration based on owner decisions without automatic adoption.

## Technical Notes

- Add local candidate, append-only event, and active-resolution provenance tables through idempotent repository initialization.
- Reuse `pricing_artwork_resolutions` for active image URLs, with an adjunct provenance row that distinguishes owner-approved and assisted representatives.
- Stage through a dedicated no-image-download command; image bytes flow through `/api/pricing/image` only on demand.

## UI / UX Notes

- Place the queue in Settings after provider connections.
- Lead each card with the catalogue product, set, product class, and reason.
- Show candidate source filename directly beneath the image.
- Use explicit wording: `Approve representative`, never `Verify exact`.
- Keep an Accepted/Rejected filter so decisions can be reversed without SQLite access.

## Success Metrics

- Owner can process a single-candidate decision in three clicks or fewer.
- Zero exact mappings are overwritten.
- Exact, assisted-representative, and owner-representative coverage remain independently measurable.
- Automated recovery increases useful visible coverage without treating the prior 47.51% theoretical queue ceiling as a verified match rate.

## Open Questions

- None blocking. Automated adoption is limited to the versioned conservative policy; all other decisions remain one-at-a-time and owner reversible.

## Traceability

- Originating prompt: Product Owner request on 2026-08-02 to quantify compute and build a simple manual sealed-image review tool.
- Related implementation prompt: `docs/prompts/PHR-UX-024-sealed-artwork-review-queue-prompt.md`.
- Related tests: `tests/sealed-artwork-review.test.ts` and repository/UI source assertions; focused 17/17 and full 366/366 pass.
- Related release notes: `docs/release-notes/PHR-UX-024-sealed-artwork-review-queue.md`.
- Last modified: 2026-08-02.
- Modification reason: Product Owner authorized Phronesis to perform the defensible review work automatically and reserve human review for genuine ambiguity.
