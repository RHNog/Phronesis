# PHR-TECH-006 Validation Record

Date: 2026-07-29
Verdict: **READY FOR PRODUCT REVIEW**

## Operational evidence

- The Pricing Update Tool's existing 18:00 cycle completed Magic, Pokémon, and One Piece catalogue downloads between 18:20:49 and 18:21:53 America/New_York. No additional cycle was triggered.
- Because the Phronesis observer began after those transient files were removed, current rows were recovered by read-only export from the local `SUPGames` database.
- Raw and normalized evidence is retained under ignored `.data/pricing-catalogues/20260729_182153/`.
- Active review repository: `.data/mobile-review.sqlite`.
- Magic: 795,931 input rows, 162,091 products, 349,896 change-only observations, checkpoint `2026-07-29T18:21:30-04:00`.
- Pokémon: 221,545 input rows, 46,621 products, 221,545 observations, checkpoint `2026-07-29T18:21:44-04:00`.
- One Piece: 34,842 input rows, 7,290 products, 34,842 observations, checkpoint `2026-07-29T18:21:53-04:00`.
- All three category status responses report current, non-stale July 29 data.
- The persistent observer is active and polls for later verified completions every ten seconds.

## Integrity evidence

- Raw source SHA-256: Magic `8ddafd92b115ca36c87a26955143612e42ccc6565b29e18bc6832f0e788ffdc0`; Pokémon `af36e21a0492dfdf385bb570afce6d9807711bf923d7698e97c33628e5365fbb`; One Piece `4fbe86bdaae016e7d1baf6f667d9ad2830f7cd954e4cd8b4024fb1e7fcd96e1c`.
- Normalized Magic SHA-256: `317a7f9bdfbd391963980dc8d0484b39a056d2639198b6d73e2be9a0ba21e98c`; the Pokémon and One Piece normalized files are byte-identical to their raw exports.
- The observed composite Magic table contained 795,931 Magic, 221,545 Pokémon, and 34,842 One Piece rows. Focused coverage proves configured sibling lines are skipped and an unknown line remains a fail-closed schema error.
- Archive tests prove hash verification, deterministic receipt paths, and idempotent reuse before import.

## Repository verification

- Focused event-readiness suite: **14/14 passed** across ingestion, archive, artwork, thumbnail, and cache contracts.
- `npm run lint`: passed.
- `JARVIS_RUNTIME_EVIDENCE=1 npm run build`: passed application compilation, type checking, static generation, and the new artwork API route.
- Supported full suite: **169 passed / 17 failed**. The 17 failures reproduce the established behavioral baseline.
- `npx tsc --noEmit`: exactly the established 27 `TS5097` test-import configuration errors and no other TypeScript errors.
- `git diff --check`: passed.

## Remaining operational watchpoint

The first future real scheduled receipt has not yet occurred since archive-before-import was added. The persistent observer is active, focused tests cover the path, and existing July 29 data remains last-good if a future receipt fails. Confirm the next scheduled receipt in the archive and category status; do not trigger an extra upstream run solely for verification.

## Negative-effect declarations

No Pricing Update Tool source, schedule, credential, database row, marketplace inventory, store price, or publication state was changed. No archive retention deletion, commit, staging, push, deployment, or public release occurred.
