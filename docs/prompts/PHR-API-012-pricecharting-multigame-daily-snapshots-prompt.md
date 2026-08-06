# PHR-API-012 — Engineer Implementation Prompt

## Objective

Implement the approved `PHR-API-012` specification: versioned Magic and English One Piece PriceCharting reconciliation plus a secure restart-safe once-daily CSV acquisition routine.

## Required Reading

- `AGENTS.md`
- `.agents/roles/engineer.md`
- `docs/DOCUMENTATION_FIRST_DEVELOPMENT.md`
- `docs/api/PHR-API-011-pricecharting-bulk-evidence-import.md`
- `docs/api/PHR-API-012-pricecharting-multigame-daily-snapshots.md`
- `docs/testing/PHR-API-012-pricecharting-multigame-daily-snapshots-validation.md`
- Relevant local Next.js 16.2.12 Client Component, Route Handler, and environment-variable guides.

## Scope

1. Generalize `PriceChartingBulkImport` to `magic-en` and `onepiece-en` while preserving Pokémon v9.
2. Add profile-specific parsing, set aliases, collector normalization, physical-treatment compatibility, and indexed resolution.
3. Keep `tcg-id` informational unless all independent physical evidence already agrees.
4. Make repository evidence reads category-aware and health multi-profile aware.
5. Add encrypted `PRICECHARTING_MAGIC_CSV_URL` and `PRICECHARTING_ONEPIECE_CSV_URL` registration fields.
6. Add a provider-host-allow-listed downloader, per-day state, game-contract validation, ten-minute spacing, one-shot/watch CLI, and package scripts.
7. Add deterministic fixtures for both games and the downloader. Do not use live network calls in automated tests.
8. Run both owner files in dry-run mode, iterate only explicit rules, and document coverage/residuals.
9. Update registry, Atlas, decisions, roadmap, release notes, implementation report, conformance review, current Structure, and conversation history.

## Safety Boundaries

- Do not activate the owner files as part of validation unless the CTO explicitly requests activation.
- Do not install a LaunchAgent or mutate external scheduling state.
- Do not print, return, or persist secret-bearing download URLs outside the encrypted vault.
- Do not weaken one-to-one collision quarantine.
- Do not let PriceCharting observations overwrite TCGplayer pricing lanes or event data.
- Do not add fuzzy scores, edit-distance matching, or price-based tie breakers.

## Verification

- Focused PriceCharting importer and daily-sync tests.
- Complete supported test suite.
- `npx tsc --noEmit --incremental false`.
- Warning-free lint.
- Production build.
- `git diff --check` and scoped diff review.
- Owner-file dry runs against the current canonical catalogue with hashes, denominators, method counts, collision counts, residual reason codes, and active-pointer evidence.

## Deliverable

Return code, tests, documentation, reproducible owner-file reports, and a same-session Chief Architect conformance verdict. Do not commit, push, deploy, install a scheduler, or activate owner receipts without explicit authorization.
