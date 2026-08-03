# PHR-UX-024 — Sealed Artwork Review Queue

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
