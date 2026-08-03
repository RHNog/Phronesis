# PHR-UX-024 — Sealed Artwork Review Queue

## 2026-08-02 Dedicated Review Tab Remediation

- Moved Pokémon sealed artwork review from Settings to a separate temporary `Artwork Review` Administration destination at `/artwork-review`.
- Hardened Safari queue loading with a current-origin absolute API endpoint, explicit query parameters, abort-state suppression, and malformed-response handling.
- Restored the private review service after the failed API runtime and verified 884 pending products remain in the active database.
- Confirmed both the dedicated page and queue endpoint return HTTP 200; no review candidates or decisions were deleted.

## 2026-08-02 Shared-SKU Packaging Galleries

- Added a one-to-many packaging-gallery model for products that have several legitimate wrapper or box artworks under one market SKU.
- Added one-click bulk approval and atomic undo in Artwork Review, with ordered storage, append-only audit evidence, explicit gallery provenance, and an independently reported coverage count.
- Added an accessible previous/next carousel with hover/tap enlargement to Vendor Workspace Snapshot Evidence; compact search results continue to use the gallery's first image.
- Applied Aerodactyl, Lapras, and Zapdos wrappers to the single `Fossil Booster Pack [1st Edition]` identity without changing its price, SKU, or checkout behavior.
- Intentionally left the separate Unlimited Fossil booster identity unresolved because the available source images visibly show 1st Edition packaging.

- Added a responsive Pokémon sealed artwork review panel to Settings.
- Stages uncertain `ptcg-assets` metadata locally without paid calls or eager image downloads.
- Shows exact, representative, visible, pending, accepted, and rejected counts separately.
- Supports search, pagination, lazy candidate images, approve representative, reject, restore, and undo approval.
- Keeps review history append-only and prevents representative decisions from overwriting exact artwork.
- Labels owner-approved representative images in Vendor Workspace with `packaging may vary`.
- Applied the already-verified 356 exact sealed mappings to the active private-review database before exposing its 1,019-item queue.
- Added a conservative `v1` assisted-recovery policy with a dry-run-by-default command and explicit `--apply` gate.
- Applied 118 exact-set/product-class representative images without touching the 356 exact mappings.
- Split owner-approved and Phronesis-assisted provenance and coverage in Settings and Vendor Workspace.
- Reduced the human exception queue from 1,019 to 901 products; 966 unsafe source ambiguities remain intentionally unapproved by automation.
