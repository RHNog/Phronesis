# PHR-UX-016 Intent-Aware Catalogue Search Validation

Date: 2026-08-01

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

## 2026-08-01 — One Piece Catalogue-Derived Alias Enhancement

### Root Cause

One Piece single cards store printed collector identifiers such as `OP13-001`, while sealed rows store `Carrying On His Will` and have no collector number. The prior all-token plan correctly required both `OP13` and `booster`, but no individual FTS row contained both literal values.

### Deterministic Verification

- Pure tests cover OP/EB/ST/PRB compact, dashed, spaced, padded, and unpadded normalization plus collector-code extraction.
- Derivation tests prove distinct-product counting, special-event exclusion, one-product rejection, tied-candidate rejection, and dominant-title adoption.
- Repository tests prove multiword phrase retrieval, literal OP13 single retention, strict rejection of `OP13 Charizard`, dashed input support, sealed ranking, and unified interpretation propagation.
- Focused pricing tests pass 19/19; the supported full suite passes 302/302.
- Standalone TypeScript, warning-free lint, production build, and `git diff --check` pass.

### Active Catalogue And Runtime Verification

- The active catalogue derives 55 mappings: 17 OP, 3 EB, 33 ST, and 2 PRB.
- OP13 selects `Carrying On His Will` from 165 exact base-set products versus a 3-product compatible runner-up.
- Live `OP13 booster` returns Booster Box, Booster Box Case, Booster Pack, and Sleeved Booster Pack; `OP13` retains 40 visible singles; `OP13 Charizard` returns zero.
- Measured loopback API response was 21.58 ms.
- At 390×844 the Vendor Workspace displayed the interpretation and four results with document scroll width below viewport width and no browser warnings/errors.

### Recovery And Safety

The alias table is additive and reproducible from existing catalogue rows. Removing the table or derivation call returns search to literal behavior without changing source products. Weak, special-only, or ambiguous codes remain literal, and search never selects or persists a product automatically.

## 2026-08-01 — One Piece Collector Padding Amendment

### Root Cause

SQLite FTS stores the printed collector suffix as `022`; an unpadded `22*` prefix cannot retrieve that token. Although ranking already understood numeric equivalence, the intended candidate was eliminated before ranking.

### Deterministic Verification

- Pure tests cover `22` → `022`, already padded `022`, and fail-closed `000`, four-digit, and alphanumeric inputs.
- Imported-catalogue regression proves `Monkey.D.Luffy OP16 22` and `Monkey.D.Luffy OP16 022` return the same `OP16-022` identities.
- `Zoro OP16 22` returns zero, proving collector expansion does not weaken the remaining required terms.
- The supported full suite passes 302/302; standalone TypeScript, warning-free lint, production build, and diff hygiene pass.

### Live Runtime Verification

The rebuilt private API discloses `Understood collector 22 as 022` and returns both loaded `OP16-022` identities: Normal and Alternate Art. Padded input returns the same two identities without redundant collector interpretation. The private LaunchAgent is healthy and serving the rebuilt application.

## 2026-08-07 — Conservative Name Typo Correction

### Deterministic Verification

- Vocabulary and trigram tables are category-scoped and rebuild transactionally from canonical catalogue product names.
- Corrections run only after the original literal/structured plan returns zero products.
- Tests cover insertion/deletion/substitution/transposition distance, length bounds, ambiguous runner-up rejection, structured-token preservation, and the two-correction maximum.
- `Gsrdevoir SV75` resolves to `Gardevoir SV75`; the exact Gardevoir GX Hidden Fates: Shiny Vault `SV75/SV94` printing ranks first.
- Exact queries, digits, set codes, collector numbers, short terms, and ambiguous names remain unchanged.
- Focused pricing tests: 20/20; full suite: 470/470; TypeScript, warning-free lint, production build, and diff hygiene pass.

### Live Runtime Verification

At 390×844, the private Vendor Workspace visibly presented `Did you mean Gardevoir? Showing matches for Gardevoir.`, returned the intended SV75 printing, introduced no horizontal overflow, and logged no browser errors. Selection remained manual and the correction created no catalogue, reconciliation, or pricing mutation.
