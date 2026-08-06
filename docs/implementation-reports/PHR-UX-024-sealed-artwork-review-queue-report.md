# PHR-UX-024 — Implementation Report

## 2026-08-02 Packaging Gallery Amendment

### Delivered

- Transactional `pricing_artwork_galleries` persistence keyed by catalogue SKU and identity, with deterministic positions and atomic reversal.
- `OWNER_APPROVED_PACKAGING_GALLERY` provenance and separate gallery coverage reporting.
- Bulk `Approve all as packaging gallery` and product-level undo actions in the temporary Artwork Review tab.
- Ordered galleries in the artwork API and an accessible carousel in Vendor Workspace Snapshot Evidence.
- Conflict protection against exact/curated resolution replacement and against single-candidate mutations while a gallery is active.

### Applied Result

The active `Fossil Booster Pack [1st Edition]` identity now presents Aerodactyl, Lapras, and Zapdos wrappers as one three-image gallery. The first image remains the compact thumbnail; all three are available for operator verification in Snapshot Evidence. Product identity, quantity, price evidence, and cart behavior are unchanged. The Unlimited Fossil booster identity remains unresolved because the staged images are edition-specific.

### Verification

Focused 16/16 and full 370/370 tests, standalone TypeScript, warning-free lint, production build, diff hygiene, live API order/provenance inspection, page HTTP checks, and private-service health passed. Review was performed in the same session and is not independent approval.

## Delivered

- Candidate metadata staging from the immutable public community source.
- Local candidate, append-only event, and active representative-provenance tables.
- Transactional accept/reject/restore/undo repository operations.
- Administration-authorized queue and durable-image API.
- Responsive Settings UI with lazy images, search, state filters, counts, and pagination.
- Representative provenance in the artwork API and truthful Vendor Workspace labelling.
- Dedicated `npm run artwork:review-stage` command and focused tests.
- Versioned pure assisted-selection policy plus `npm run artwork:review-assist` dry-run/apply command.
- Separate `ASSISTED_REPRESENTATIVE` provenance, idempotent application, and owner reversal.
- Settings action and separate assisted/owner coverage tiles.

## Measured Result

The active private catalogue retains 356 exact sealed mappings and now has 118 Phronesis-assisted representatives. Visible coverage increased from 356 / 2,894 (12.30%) to 474 / 2,894 (16.38%). The v1 policy left 901 products pending and refused 966 source ambiguities from automation: 421 broad mixed-product guesses, 504 value-sensitive/composite variants, and 41 package variants. The prior 47.51% value is retained only as a theoretical queue ceiling, not a verified match rate.

## Deviations

The review service used `.data/mobile-review.sqlite`, while the first recovery pass had populated `.data/pricing-lookup.sqlite`. Runtime verification exposed the mismatch. The verified exact importer and review staging were safely applied to the private-service database before handoff.

## Remaining Boundary

The 901 pending plus 1,519 unmatched/unsupported products require stronger package evidence, another sealed source, image understanding, or curated owner uploads. This release does not infer case, configuration, edition, wrapper-art, or mixed-product identity.
