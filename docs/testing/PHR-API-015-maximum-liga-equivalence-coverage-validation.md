# PHR-API-015 — Maximum Liga Equivalence Coverage Validation

## Status

Engineering and private-deployment validation passed. Product Owner review of the broader compatible-evidence presentation remains pending.

## Defect Confirmation

- The reported TCGplayer target is `tcg:753da95f14a34c867b4f3f7f`: Lucario V, Champion's Path, `27/73`, Holofoil.
- LigaPokemon snapshot `dry-run-20260805T070105248Z` contains the same physical printing as `Lucario-V`, `Champion&rsquo;s Path`, collector `27`, Foil, with low/average/high all equal to 2,999 centavos.
- Literal `&rsquo;` text previously normalized as words and broke the otherwise exact set identity.
- Bounded entity decoding now produces one collision-safe exact source match. The live target ledger and source crosswalk both resolve the acquired Liga identity `f496a30e9a1f238032c39ee47e584e48a2945493bc984d8022f75b18640f02e4`.

## Live Pokémon Result

- Target products: 46,642 = 43,748 singles + 2,894 sealed.
- Exact: 30,061.
- Compatible: 2,539.
- Ambiguous: 102.
- Unavailable: 13,940, including all 2,894 sealed products for which the collection export has no sealed identity.
- Singles with exact or compatible evidence: 32,600 / 43,748 (74.52%).
- Targets with consumer-price evidence: 32,219 / 46,642 (69.08%, sealed included in the denominator).
- Source crosswalk exact matches: 25,549; source fingerprint `08a31825536d0a194a9caf3f0e1fc9abe7f85ddd28f3ccc3448a9fe78949b1ff`.
- Target-ledger fingerprint: `719d41e2cb52192901d694d675f9d1ecdd65145a3c7e16444d612397487575d1`.
- Two consecutive complete-snapshot builds produced the same source and target fingerprints.

## Live Magic Result

- Target products: 162,765 = 159,126 singles + 3,639 sealed.
- Exact accepted targets: 131,883.
- Unavailable: 30,882, including all 3,639 sealed products.
- Targets with consumer-price evidence: 130,181 / 162,765 (79.98%).
- Source crosswalk fingerprint: `b6354ac22dc140050a49bfbc16f43d58312251cfabff981714da0e0e10bddaab`.
- Target-ledger fingerprint: `287aec7a7532ad79f3c8c230d5c47042d301106c3199972383f82805b1b2b0fd`.
- Two consecutive complete-snapshot builds produced the same Magic source and target fingerprints.

## Isolation And Truth Audit

- `regional_product_equivalence` has one provider/category row for every current Magic and English Pokémon target.
- Exact and compatible evidence always points to an acquired provider identity and its original observation values.
- Ambiguous and unavailable targets have no adopted provider identity and receive no fabricated price.
- Candidate selection does not inspect price, rarity, color, or source row order.
- Compatible Pokémon finish-family evidence is visibly labelled and returned only through Vendor Workspace evidence lookup.
- Arbitrage still queries `regional_crosswalk WHERE status='MATCHED'`; no target-ledger or compatible row participates in opportunity calculations.

## Automated Gates

- Focused Lucario, complete-ledger, exact/compatible, ambiguity, sealed, provider-isolation, and UI assertions passed.
- Full repository suite: 404 / 404 passed.
- Standalone TypeScript: passed.
- Warning-free ESLint: passed.
- Next.js 16.2.12 production build: passed.
- Deterministic Magic and Pokémon complete-snapshot rebuilds: passed.
- Diff hygiene: passed.

## Deployment Verification

- The live operational database was rebuilt from the existing complete Liga snapshots without provider acquisition, credential operation, or external transaction.
- The launch-managed private runtime was restarted from the validated production build.
- Local and tailnet Vendor Workspace returned HTTP 200.
- The live Lucario API returned exact R$29.99 LigaPokemon evidence plus its exact disposition metadata.
- The public timed-worker path returned HTTP 200 while public Settings remained blocked at HTTP 404.
- Direct database audit found zero compatible rows in the exact Arbitrage crosswalks.
