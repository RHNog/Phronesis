# PHR-API-005 Release Notes

Phronesis now has a verified local LigaMagic acquisition path using the marketplace's supported authenticated collection CSV export. Authentication stays in an ordinary dedicated Chrome profile; automation attaches only after the owner-created session exists.

The completed dry run covers all 37 account collections and 329,976 cards. `Compra` remains the price a consumer pays a store, while `Venda` remains the store's offer to buy from a consumer. Raw evidence, receipts, hashes, and the merged SQLite snapshot remain private and ignored.

Daily scheduling, canonical price activation, cross-market identity matching, FX/landed-cost calculations, and arbitrage recommendations are not enabled by this release.
