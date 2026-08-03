# PHR-API-012 Implementation Report

## Outcome

Implemented the approved multi-game PriceCharting receipt extension and daily acquisition routine. Magic and English One Piece owner exports were reconciled against the canonical local database as dry runs; no active evidence pointer was changed.

## Architecture

- `PriceChartingBulkImport.ts` owns exact schema parsing, profile-specific normalization/resolution, receipt staging, collision quarantine, and atomic activation.
- `PriceChartingDailySync.ts` owns allow-listed acquisition, request pacing, daily state, immutable download storage, profile verification, and per-game import orchestration.
- `server.ts` owns server-only credential retrieval and construction.
- Settings stores the two download URLs through the existing encrypted provider vault and never reads their values back into the client.
- The one-shot/watch script is operationally ready but no LaunchAgent or external schedule was installed.

## Identity Findings

PriceCharting `tcg-id` values are not compatible with Phronesis `pricing_latest.source_sku` for the supplied Magic and One Piece exports. Resolution therefore requires the independently corroborated physical tuple: game, English language, canonical set, exact normalized name, collector when present, finish/treatment/distribution, and one unique target. This prevents apparently convenient but corrupt cross-catalogue joins.

## Results

- Magic v2: 109,841 accepted, 523 ambiguous, 3,712 collision rows, 15,409 unmatched, 694 sealed review, 6 unsupported, and 1 quarantined out of 130,186 rows.
- One Piece v3: 4,731 accepted, 331 ambiguous, 108 collision rows, 952 unmatched, 89 English sealed review, and 5,643 non-English unsupported out of 11,854 rows.
- The exact hashes, denominators, fingerprints, and lane counts are recorded in the validation document and immutable receipt reports.

## Operational Boundary

Activation requires the owner’s encrypted Magic and One Piece CSV download URLs. Host scheduling remains a separate explicit operational action. Failed or partial daily runs preserve each game’s last-good active receipt.

## Verification

- Focused PriceCharting test set: 30/30 passed.
- Pokémon v9 regression cases: 21/21 passed within the focused set.
- Full suite: 347/347 passed.
- TypeScript and warning-free full lint passed.
- Next.js 16.2.12 production build passed with all 47 routes/pages generated.
- Diff hygiene passed.
