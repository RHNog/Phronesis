# PHR-UX-016 Intent-Aware Catalogue Search Validation

Date: 2026-07-31

Feature: `PHR-UX-016`

Verdict: **PASS — PRODUCT REVIEW PENDING**

## Root Cause

The prior FTS query required `sh03` to be a literal indexed-token prefix. The catalogue stores the set as `SWSH03`, so retrieval returned no candidate before relevance ranking could see that the operator intended Darkness Ablaze.

## Deterministic Verification

- Query-plan tests cover case normalization, `SH03`/`SH3`/`SWSH03`/`SWSH3`, leading-zero equivalence, unknown identifiers, FTS escaping, all-token coverage, and the six-alternative bound.
- Imported-catalogue regression proves `Charizard v sh03` returns `Charizard V` from `SWSH03: Darkness Ablaze`, collector `019/189`, first.
- Existing name-only, sealed, condition, artwork grouping, multi-catalogue, and pricing tests remain green inside the 284/284 full suite.
- Standalone TypeScript, repository-wide warning-free lint, production build, and `git diff --check` pass.

## Private Runtime Verification

- Live API response includes `Understood SH03 as SWSH03`.
- The first single is `Charizard V` / `SWSH03: Darkness Ablaze` / `019/189`; the distinct `Charizard VMAX` / `020/189` remains a separate second result.
- The 390px Vendor Workspace showed the interpretation and two intended artworks with document width equal to scroll width and no browser error logs.

## Negative-Effect Declaration

No catalogue identity, crosswalk mapping, selected product, provider, source data, or pricing evidence is rewritten. Unknown input remains literal, and the operator must still select the exact visible printing.
