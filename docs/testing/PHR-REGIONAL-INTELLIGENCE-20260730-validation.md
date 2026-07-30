# Regional Vending And Arbitrage Intelligence Validation

Date: 2026-07-30
Features: `PHR-ARCH-013`, `PHR-API-006`, `PHR-UX-013`, `PHR-WORKFLOW-007`
Verdict: **PASS — PRODUCT REVIEW READY**

## Full-data crosswalk

- LigaMagic run: `dry-run-20260730T203243818Z`.
- LigaMagic SQLite SHA-256: `0eb89b4efc0ab997e78256ec7c87cbaf020a9b4b41f51f4891e9308e2394800d`.
- Pricing fingerprint: `529fe0c52e646b1755700508acaa7580f18547668aae55324f224fd4a9262a9c`.
- Source identities: 329,301.
- Exact unique mappings: 71,954.
- Unmatched: 147,584.
- Ambiguous adopted mappings: 0.
- Unsupported/Textless quarantined: 109,763.

## Semantics And Financial Gates

- Compra renders as Brazilian consumer retail evidence.
- Venda renders as a dealer-buy benchmark with an explicit executable-offer warning.
- Missing or older-than-48-hour FX, incomplete direction costs, stale source data, and missing availability each prevent `ACTIONABLE`.
- A verification record supplies the executable acquisition price used in recalculation; it is not a boolean override.
- Verification is rejected until the candidate is fully costed.

## Deterministic Verification

- Focused regional suite: 3/3 passed.
- Supported full suite: 241/241 passed.
- Standalone TypeScript: passed with zero diagnostics.
- ESLint: passed with zero warnings.
- Next.js 16.2.12 production build: passed.
- `git diff --check`: passed.

## Runtime Product Review

- `/api/regional/arbitrage` returned exact cross-market candidates from the operational database.
- Vendor Workspace search for `mox opal` selected Double Masters #275 Normal and rendered exact Brazil evidence:
  - Compra low R$999.75, average R$1,074.56, high R$1,499.99.
  - Venda dealer benchmark R$649.84.
- Opportunities loaded 50 candidates and correctly labelled them `IDENTITY_VERIFIED` while FX/costs remained unconfigured.
- 390×844 review reported no horizontal overflow; the existing desktop-first/mobile-stack behavior remained intact.
- Browser console review found no feature error.

## Negative-Effect Declaration

No 03:00 schedule, scraping, credential access, marketplace transaction, paid commitment, public deployment, destructive migration, force push, history rewrite, or Textless adoption occurred. The retained rollback checkout under `~/Developer/Phronesis` was not modified.
