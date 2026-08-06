# Engineer Report — Regional Vending And Arbitrage Intelligence

Date: 2026-07-30

## Outcome

Phronesis now converts the verified LigaMagic snapshot into exact Brazilian market context in Vendor Workspace and a truthfully gated two-way arbitrage queue.

## Delivered

- Versioned exact cross-market identity bridge with source fingerprints, rejection reasons, idempotent rebuild, and Textless quarantine.
- Regional evidence DAL preserving Compra/Venda semantics and freshness.
- Automatically refreshed official BCB PTAX BRL/USD evidence and owner-managed direction-specific cost profile in Settings (`PHR-API-007`).
- Brazilian quick-sale, market, patient, and dealer-buy benchmark views for exact selected printings.
- US→Brazil and Brazil→US economics with gross cost, net profit, ROI, and blocker states.
- Append-only executable availability records requiring price, quantity, counterparty label, observation time, and notes.
- Opportunities verification queue with module-authorized reads and mutations.

## Full-Data Result

The accepted source pair now yields 71,954 exact mappings plus 14,438 evidence-derived edition-alias mappings, for 86,392 matched identities and 39.35% supported coverage. Of those, 86,032 have both LigaMagic Compra and TCGplayer Near Mint price evidence. The repeated crosswalk fingerprint is `ada5cb0288f45d16636bc3e34aab144709d0ff0b12c9eda629aa5ce6fcff20d2`.

133,146 supported identities remain explicitly unmatched, including every edition-label conflict that lacks sufficient evidence. All 109,763 Textless rows remain quarantined and no ambiguous row was adopted. Language and material-treatment qualifiers cannot disappear through an edition alias.

## Arbitrage Price Semantics

US-to-Brazil acquisition now selects TCGplayer delivered/listing evidence, while Brazil-to-US resale selects TCGplayer market/listing evidence. LigaMagic Compra remains the Brazilian consumer-side benchmark in both analyses. Tests prove the two directions consume the appropriate TCGplayer field.

## Remaining Product Configuration

Official FX is operational at the recorded BCB PTAX close. Cross-border fixed and variable costs remain intentionally empty in the operational profile, and no availability verification exists. The owner must enter those business-specific assumptions in Settings before Phronesis calculates net arbitrage; a real listing or buy offer must then be verified before any candidate becomes actionable. These are truth gates, not implementation defects.

The 03:00 LigaMagic export schedule remains disabled.
