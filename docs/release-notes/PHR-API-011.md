# PHR-API-011 — PriceCharting Bulk Evidence Import

## Status

Implemented — Product Review Ready; Activation Pending

## Delivered

- Added an owner-operated PriceCharting 27-column CSV importer with dry-run default and explicit `--apply` activation.
- Added immutable source receipts, normalized staging, reason-coded resolution, one-to-one collision quarantine, independent market observations, coverage metrics, and an atomic active-receipt pointer.
- Added exact imported PriceCharting evidence to the Vendor Workspace Graded Area, with the live API retained as a separate fallback.
- Added PriceCharting bulk-import health to Settings.
- Preserved all TCGplayer-owned prices, Direct Low precedence, artwork, recommended offers, inventory, and event systems.

## Operational Note

The owner Pokémon export completed dry-run with 91,572 staged rows and resolver-v9 coverage of 33,379 collision-free automatic candidates, including 32,099 with graded evidence. This is 80.78% of eligible English single rows and 76.33% of the local Pokémon singles catalogue. It has not been activated. Recurring download, sealed automatic matching, One Piece, and Magic remain later releases.
