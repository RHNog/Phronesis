# PHR-UX-016 — Intent-Aware Catalogue Search

## 2026-08-07 — Conservative Typo Recovery

- Name misspellings such as `Gsrdevoir` can now recover `Gardevoir` only after the original search returns no result.
- Corrections are category-scoped, distance-bounded, ambiguity-aware, visibly disclosed, and limited to alphabetic name terms.
- Set codes, collector numbers, digits, short words, and exact terms are never corrected, and Phronesis still requires manual product selection.
- `Gsrdevoir SV75` returns the exact Gardevoir GX Hidden Fates: Shiny Vault printing first in the live phone workflow.

## 2026-08-01 — One Piece Set-Code Resolution

- One Piece OP/EB/ST/PRB set codes now resolve to human catalogue titles derived from exact imported single-card evidence rather than hard-coded release names.
- `OP13 booster` is disclosed as `Understood OP13 as Carrying On His Will` and returns the four loaded sealed formats.
- One Piece collector searches now treat unpadded `22` as printed `022`, with visible interpretation and all other query terms still mandatory.
- Weak, special-event-only, or ambiguous aliases fail closed; unrelated query terms remain mandatory and result selection stays manual.
- The active catalogue produced 55 aliases, and verification passes 302/302 tests plus TypeScript, warning-free lint, build, private API, and 390×844 visual gates.

## 2026-07-31 — Product Review Ready

- Catalogue search now interprets bounded Pokémon numbered-set shorthand and leading-zero variants without changing identity or selecting a card automatically.
- `Charizard v sh03` is disclosed as `Understood SH03 as SWSH03` and returns the `SWSH03: Darkness Ablaze` Charizard V first.
- Candidate retrieval and ranking share one escaped, all-token query plan, preserving existing multi-catalogue and artwork-first behavior.
- Verified inside the 284/284 full suite plus TypeScript, lint, production build, live API, and 390px no-overflow/clean-console gates.
