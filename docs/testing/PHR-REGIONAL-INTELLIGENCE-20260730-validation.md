# Regional Vending And Arbitrage Intelligence Validation

Date: 2026-07-30
Features: `PHR-ARCH-013`, `PHR-API-006`, `PHR-UX-013`, `PHR-WORKFLOW-007`
Verdict: **PASS — ACQUIRED DATA VALIDATED; OPERATIONAL COST GATE REMAINS**

## Full-data crosswalk

- LigaMagic run: `dry-run-20260730T203243818Z`.
- LigaMagic SQLite SHA-256: `0eb89b4efc0ab997e78256ec7c87cbaf020a9b4b41f51f4891e9308e2394800d`.
- Pricing fingerprint: `529fe0c52e646b1755700508acaa7580f18547668aae55324f224fd4a9262a9c`.
- Source identities: 329,301.
- Supported Normal/Foil identities: 219,538.
- Exact unique mappings: 71,954.
- Evidence-derived edition-alias mappings: 14,438 across 406 conflict-free aliases.
- Total matched: 86,392 (39.35% of supported identities).
- Comparable LigaMagic Compra and TCGplayer NM price pairs: 86,032 (99.58% of matched identities).
- Unmatched supported identities: 133,146; 72,554 retain LigaMagic consumer-price evidence for later reconciliation.
- Ambiguous adopted mappings: 0.
- Unsupported/Textless quarantined: 109,763.
- Deterministic crosswalk fingerprint, identical across two consecutive builds: `ada5cb0288f45d16636bc3e34aab144709d0ff0b12c9eda629aa5ce6fcff20d2`.

### Fail-closed remediation evidence

- An initial alias experiment was rejected before acceptance because relaxed edition labels admitted unrelated sets.
- Structural token compatibility removed those false aliases.
- Price-distribution review then identified `War of the Spark (Japanese)` incorrectly losing its language qualifier and a Retro Frame label losing its treatment qualifier.
- Qualifier preservation now keeps 72 supported Japanese rows and 10 supported Retro Frame rows unmatched unless the TCGplayer target explicitly preserves that dimension.
- No fuzzy match, language collapse, treatment collapse, Textless adoption, or ambiguous mapping remains in the accepted run.

## Semantics And Financial Gates

- Compra renders as Brazilian consumer retail evidence.
- Venda renders as a dealer-buy benchmark with an explicit executable-offer warning.
- US-to-Brazil uses TCGplayer delivered/listing evidence as acquisition cost; Brazil-to-US uses TCGplayer market/listing evidence as resale value. One TCGplayer field is no longer silently reused for both directions.
- Missing or stale official FX, incomplete direction costs, stale source data, and missing availability each prevent `ACTIONABLE`; `PHR-API-007` subsequently made PTAX automatic.
- A verification record supplies the executable acquisition price used in recalculation; it is not a boolean override.
- Verification is rejected until the candidate is fully costed.

## Deterministic Verification

- Focused regional suite: 7/7 passed.
- Supported full suite: 261/261 passed.
- Standalone TypeScript: passed with zero diagnostics.
- ESLint: passed with zero warnings.
- Next.js 16.2.12 production build: passed.
- `git diff --check`: passed.

## Runtime Product Review

- `/api/regional/arbitrage` returned HTTP 200 after the private-service restart and exposed exact cross-market candidates from the operational database.
- Both directions correctly remain `IDENTITY_VERIFIED` because owner-specific fixed/variable costs are empty; there are zero executable-availability records.
- Vendor Workspace search for `mox opal` selected Double Masters #275 Normal and rendered exact Brazil evidence:
  - Compra low R$999.75, average R$1,074.56, high R$1,499.99.
  - Venda dealer benchmark R$649.84.
- Opportunities loaded 50 candidates and correctly labelled them `IDENTITY_VERIFIED` while FX/costs remained unconfigured.
- 390×844 review reported no horizontal overflow; the existing desktop-first/mobile-stack behavior remained intact.
- Browser console review found no feature error.

## Negative-Effect Declaration

No 03:00 schedule, scraping, credential access, marketplace transaction, paid commitment, public deployment, destructive migration, force push, history rewrite, fuzzy identity adoption, or Textless adoption occurred. No owner cost or executable-availability evidence was invented. The retained rollback checkout under `~/Developer/Phronesis` was not modified.
