# PHR-UX-016 Engineer Report — Intent-Aware Catalogue Search

Date: 2026-07-31

Status: **IMPLEMENTED — PRODUCT REVIEW PENDING**

## Delivered

- Added one deterministic pricing search plan shared by FTS candidate retrieval and relevance ranking.
- Added bounded Pokémon numbered-set normalization so `SH03`, `SH3`, `SWSH03`, and `SWSH3` express the same `SWSH03` intent; leading-zero equivalence also covers numbered SWSH, SV, SM, and XY codes.
- Preserved every logical user token as an AND group while allowing only normalized, quote-escaped alternatives inside each group.
- Added exact set-code relevance weight and returned interpretation metadata without changing catalogue identity or automatically selecting a product.
- Added concise Vendor Workspace feedback such as `Understood SH03 as SWSH03`.

## Evidence

Deterministic query-plan and imported-catalogue regression tests pass inside the 284/284 full suite. The rebuilt private API interprets `Charizard v sh03` as `SWSH03` and returns `Charizard V`, `SWSH03: Darkness Ablaze`, `#019/189` first, followed by the distinct VMAX printing. A 390px private workflow displays the interpretation and intended card with zero horizontal overflow and no browser error logs. TypeScript, lint, production build, diff hygiene, and private-service health pass. See `docs/testing/PHR-UX-016-intent-aware-catalogue-search-validation.md`.

## Boundaries

The interpreter is bounded high-confidence query expansion, not unbounded fuzzy matching, catalogue reconciliation, or automatic identity adoption. Misspellings and natural-language/OCR interpretation beyond documented structures remain future measured search-quality work.
