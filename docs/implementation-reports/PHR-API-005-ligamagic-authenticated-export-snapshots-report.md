# PHR-API-005 Engineer Report

Date: 2026-07-30
Feature: `PHR-API-005`

## Outcome

Phronesis can now reuse an owner-authenticated LigaMagic session to export every owned collection through the site's supported CSV workflow and assemble a complete, auditable local pricing snapshot. No schedule is enabled.

## Implementation

- Added ordinary-Chrome profile setup and post-login CDP attachment using installed Chrome and `playwright-core`.
- Added semantic discovery of all collection options, card-number ordering, and the exact priced collection CSV format.
- Added sanitized network/download receipts, hashes, mixed UTF-8/Windows-1252 decoding, exact 19-column schema validation, and integer-centavo `Compra`/`Venda` normalization.
- Added exact advertised-card reconciliation against summed CSV quantity, with unique-entry row counts retained separately.
- Added transactional SQLite snapshot assembly with source membership, duplicate classification, conflict quarantine, coverage, and atomic manifest evidence.
- Added `.data/**` to explicit lint ignores so private Chrome state is never treated as application source.

## Live evidence

The supervised pilot and all 37 collection exports completed through the authenticated export UI. The final snapshot reconciles 329,976 cards, 329,903 rows, 329,301 unique identities, 602 identical duplicates, and zero conflicts.

## Verification

The integrated 238-test suite, standalone TypeScript, lint, production build, and diff checks pass. Exact hashes and counts are recorded in the validation record.

## Remaining gates

The 03:00 schedule, canonical pricing activation, TCGplayer/Scryfall identity crosswalk, FX/landed-cost model, and arbitrage scoring/UI remain unimplemented and require subsequent scoped work.
