# PHR-API-013 — Recurring Liga Network Acquisition

## Summary

Phronesis adds a daily 03:00 LigaMagic acquisition definition, overlap-safe orchestration, atomic provider status, automatic Magic crosswalk promotion, and an isolated LigaPokemon profile/pilot/snapshot connector.

## Operational Impact

- LigaMagic can refresh through the already proven owner-authenticated export profile and promotes only complete conflict-free snapshots.
- LigaPokemon owner authentication and the one-collection pilot are complete. The exact 20-column contract is implemented and Lote 1 reconciled 9,772/9,772 cards.
- Full LigaPokemon acquisition now fails closed with `SOURCE_COUNT_MISMATCH`: Lote 10 advertises 9,704 cards but two byte-identical exports contain 9,700.
- The Product Owner authorized Lote 10's 9,700-card export as authoritative through an exact provenance-bearing rule. A later Lote 4 mismatch remains fail-closed: 9,870 advertised versus 9,868 in two byte-identical exports.
- A failure in one provider preserves the other provider's last-good evidence and produces a sanitized provider-specific result.
- The 03:00 per-user LaunchAgent is loaded. Its initial run recorded LigaMagic `REAUTHENTICATION_REQUIRED` plus LigaPokemon `NOT_CONFIGURED`; after owner connection, LigaPokemon advanced to a verified pilot and an explicit full-run `SOURCE_COUNT_MISMATCH`. No incomplete snapshot replaced last-good evidence.

## Boundaries

No public marketplace scraping, automated login, credential capture, CAPTCHA bypass, transaction, or LigaPokemon arbitrage promotion is included.
