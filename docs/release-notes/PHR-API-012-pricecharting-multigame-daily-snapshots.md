# PHR-API-012 — PriceCharting Multi-Game Daily Snapshots

## Release State

Implemented — Product Review Ready; activation and host scheduling remain owner-gated.

## Delivered

- Added deterministic, versioned Magic and English One Piece reconciliation profiles to the receipt-backed PriceCharting importer while preserving Pokémon v9 behavior.
- Added explicit Magic set/treatment aliases and One Piece prefixed-collector, PRB, parallel, manga, SP, distribution, language, and set-routing rules.
- Kept sealed, Japanese, ambiguous, colliding, malformed, and absent-catalogue rows inactive with reason-coded evidence.
- Added encrypted Settings fields for the Magic and One Piece subscription CSV download URLs.
- Added a server-only daily downloader with a PriceCharting HTTPS allow-list, same-host redirect checks, exact schema/game validation, immutable downloads, ten-minute request spacing, per-game atomic activation, persistent UTC-day state, retry, and one-shot/watch commands.
- Added profile-aware provider health and evidence reads.

## Owner-File Outcome

- Magic: 109,841 of 129,485 eligible singles accepted (84.83%); 16,432 contain graded evidence.
- English One Piece: 4,731 of 6,122 eligible singles accepted (77.28%); 2,299 contain graded evidence.
- Both supplied files were staged as dry-run receipts. No active PriceCharting pointer, TCGplayer lane, recommendation, inventory, or event record changed.

## Activation

1. In Settings, securely register `PRICECHARTING_MAGIC_CSV_URL` and `PRICECHARTING_ONEPIECE_CSV_URL` from the owner’s Legendary subscription download controls.
2. Run `npm run pricecharting:sync` for a one-shot validated activation.
3. After owner approval, keep `npm run pricecharting:watch` alive through the approved host service manager. Phronesis targets 06:15 UTC and skips already-successful games for the same UTC day.

Phronesis does not install or enable a host scheduler as part of this release.
