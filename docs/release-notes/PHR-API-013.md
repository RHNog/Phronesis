# PHR-API-013 — Recurring Liga Network Acquisition

## Summary

Phronesis adds a daily 03:00 LigaMagic acquisition definition, overlap-safe orchestration, atomic provider status, automatic Magic crosswalk promotion, and an isolated LigaPokemon profile/pilot/snapshot connector.

## Operational Impact

- LigaMagic can refresh through the already proven owner-authenticated export profile and promotes only complete conflict-free snapshots.
- LigaPokemon owner authentication and the one-collection pilot are complete. The exact 20-column contract is implemented and Lote 1 reconciled 9,772/9,772 cards.
- The Product Owner authorized Lote 10's 9,700-card, Lote 4's 9,868-card, Lote RF 3's 9,982-card, and Lote RF 6's 7,679-card exports as authoritative through exact provenance-bearing rules that retain their source labels.
- Full LigaPokemon acquisition now succeeds across all 18 collections: 167,912 authoritative rows/cards and unique identities, with zero duplicate conflicts. The durable orchestrator records LigaPokemon `SUCCESS`; `PHR-API-014` now rebuilds the exact isolated Pokémon crosswalk before future success receipts. LigaMagic remains independently `REAUTHENTICATION_REQUIRED`.
- A failure in one provider preserves the other provider's last-good evidence and produces a sanitized provider-specific result.
- The 03:00 per-user LaunchAgent is loaded. Its initial run recorded LigaMagic `REAUTHENTICATION_REQUIRED` plus LigaPokemon `NOT_CONFIGURED`; after owner connection, LigaPokemon advanced to a verified pilot and an explicit full-run `SOURCE_COUNT_MISMATCH`. No incomplete snapshot replaced last-good evidence.

## Boundaries

No public marketplace scraping, automated login, credential capture, CAPTCHA bypass, transaction, or LigaPokemon Arbitrage candidate exposure is included.
