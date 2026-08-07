# PHR-UX-013 — Regional Vending And Arbitrage Presentation

## 2026-08-07 — Vendor Evidence Stack Restored And Privately Live

- Vendor Workspace again combines TCGplayer and exact regional raw-card evidence in one selected-card pricing card: LigaMagic for Magic and LigaPokémon for English Pokémon.
- The regional read model now consumes the promoted Pokémon tables as well as Magic, returns provider/run provenance, preserves Pokémon condition/language, selects the newest exact match, and fails closed for unsupported games.
- LigaMagic uses the latest complete last-good snapshot `dry-run-20260730T203243818Z`; a later reauthentication-required attempt does not erase or masquerade as usable evidence. LigaPokémon uses promoted run `dry-run-20260805T070105248Z`.
- PriceCharting is once again an optional collapsed card directly below TCGplayer/Liga, loads only on expansion, resets when the selected printing changes, and retains grading-certificate lookup inside the same secondary disclosure.
- Buying decision no longer duplicates or owns the regional evidence panel. TCGplayer valuation, offer calculation, artwork, checkout, and watch behavior remain unchanged.

## 2026-07-31 — Product Review Ready

- `US → Brazil` and `Brazil → US` now reverse acquisition and exit markets explicitly, including benchmark meaning, currency, calculation, target profile, and explanatory copy.
- Settings now preserves the four direction-specific cost controls and adds nullable route-specific targets for acquisition value, gross value, gross spread, net profit, profit margin, ROI, and evidence age.
- Candidate cards separate gross proceeds, gross spread, total cost, net profit, profit margin, and ROI and explain target misses independently from identity, freshness, cost, and availability gates.
- LigaMagic catalogue reconciliation now includes evidence-derived aliases, collector-less historical products, explicit promo/catalogue families, bidirectional treatment/name mappings, physical Art Series and signature conventions, one-letter collector suffixes, one- and two-face tokens, World Championship metadata, generic variants, and pre-Exodus conventions.
- The accepted crosswalk rises to 131,869 unique mappings: 64.66% of supported emitted identities and 83.04% of supported identities carrying LigaMagic consumer prices. The accepted comparable set has two-market price evidence for 98.44% of mappings.
- Target-side collision enforcement guarantees zero duplicate TCGplayer targets in the accepted set. Ambiguous identities, `Textless` shells, historically impossible Foil shells, Art Series Foil mirrors, Normal mirrors of foil-only treatments, and unsupported catalogue gaps remain quarantined. No match, target, cost, availability, credential, or transaction was fabricated.
