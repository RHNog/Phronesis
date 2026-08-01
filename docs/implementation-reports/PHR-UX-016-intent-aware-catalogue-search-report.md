# PHR-UX-016 Engineer Report — Intent-Aware Catalogue Search

Date: 2026-08-01

Status: **IMPLEMENTED — PRODUCT REVIEW PENDING**

## Delivered

- Added one deterministic pricing search plan shared by FTS candidate retrieval and relevance ranking.
- Added bounded Pokémon numbered-set normalization so `SH03`, `SH3`, `SWSH03`, and `SWSH3` express the same `SWSH03` intent; leading-zero equivalence also covers numbered SWSH, SV, SM, and XY codes.
- Preserved every logical user token as an AND group while allowing only normalized, quote-escaped alternatives inside each group.
- Added exact set-code relevance weight and returned interpretation metadata without changing catalogue identity or automatically selecting a product.
- Added concise Vendor Workspace feedback such as `Understood SH03 as SWSH03`.
- Added catalogue-derived One Piece OP/EB/ST/PRB aliases backed by exact single-card collector codes, distinct-product evidence, semantic compatibility, and dominance checks.
- Added an additive local alias table that bootstraps populated databases and refreshes inside One Piece import transactions.
- Added coalesced dashed/spaced code input, escaped multiword FTS phrases, phrase-aware scorer coverage, and merged category-specific interpretations in global search.
- Added category-scoped One Piece collector padding so one-to-three-digit numeric input such as `22` retrieves printed `022` identities without relaxing any other query term.

## Evidence

Deterministic query-plan and imported-catalogue regression tests pass inside the 284/284 full suite. The rebuilt private API interprets `Charizard v sh03` as `SWSH03` and returns `Charizard V`, `SWSH03: Darkness Ablaze`, `#019/189` first, followed by the distinct VMAX printing. A 390px private workflow displays the interpretation and intended card with zero horizontal overflow and no browser error logs. TypeScript, lint, production build, diff hygiene, and private-service health pass. See `docs/testing/PHR-UX-016-intent-aware-catalogue-search-validation.md`.

The 2026-08-01 enhancement derives 55 aliases from the active One Piece catalogue. OP13 is backed by 165 Carrying On His Will products, and the private API/UI now returns all four matching sealed formats for `OP13 booster` while retaining singles and enforcing unrelated terms. Focused 19/19 and full 302/302 tests, TypeScript, warning-free lint, production build, diff hygiene, private health, API latency, and 390×844 visual/console/overflow checks pass.

The collector-padding amendment closes the reported `022`/`22` retrieval gap. The live private API returns the same Normal and Alternate Art `OP16-022` Monkey.D.Luffy identities for both forms, visibly interprets only the unpadded form, and rejects `Zoro OP16 22`. The full 302/302 suite and all static/build gates remain green.

## Boundaries

The interpreter is bounded high-confidence query expansion, not unbounded fuzzy matching, catalogue reconciliation, or automatic identity adoption. One Piece release titles are not hard-coded. Special-event/reprint labels and weak or contested mappings fail closed. Misspellings and natural-language/OCR interpretation beyond documented structures remain future measured search-quality work.
