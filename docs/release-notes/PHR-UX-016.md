# PHR-UX-016 — Intent-Aware Catalogue Search

## 2026-07-31 — Product Review Ready

- Catalogue search now interprets bounded Pokémon numbered-set shorthand and leading-zero variants without changing identity or selecting a card automatically.
- `Charizard v sh03` is disclosed as `Understood SH03 as SWSH03` and returns the `SWSH03: Darkness Ablaze` Charizard V first.
- Candidate retrieval and ranking share one escaped, all-token query plan, preserving existing multi-catalogue and artwork-first behavior.
- Verified inside the 284/284 full suite plus TypeScript, lint, production build, live API, and 390px no-overflow/clean-console gates.
