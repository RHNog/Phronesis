# PHR-MARKET-PERSONALIZATION-20260807 — Standard Lane Slice Plan

- Status: Completed — privately live; Product Review ready
- Lane: Standard
- Plan fingerprint: `PHR-MARKET-PERSONALIZATION-standard-v1`
- Features: `PHR-API-016`, `PHR-API-017`, `PHR-ARCH-017`, `PHR-UX-013`, `PHR-UX-016`
- Product approval: explicit Product Owner direction on 2026-08-07

## Ordered Slices

1. `S1 — Coverage`: add one bounded LigaPokémon distribution-treatment comparison tier, measure exact/compatible/ambiguous/unavailable transitions, and preserve strict crosswalk and Arbitrage isolation.
2. `S2 — History`: retain regional observations, project TCGplayer/Liga/PriceCharting history, and add the authorized range/provider contract.
3. `S3 — Personal settings`: add active-member settings persistence, My settings UI, provider visibility, and effective personal regional costs.
4. `S4 — Search`: add indexed vocabulary/trigrams, conservative Damerau-Levenshtein correction, visible interpretation, and fail-closed ambiguity rules.
5. `S5 — Experience`: integrate provider/range charts into the approved Vendor hierarchy and verify phone/desktop accessibility.
6. `S6 — Integration`: back up and migrate live data, rebuild latest Liga evidence, prove transition monotonicity, run full verification, deploy privately, perform conformance review, update product memory, commit/push, and seal Handoff continuity.

All six slices are implemented and verified. The final repository/Handoff commit and remote push are the publication step for this plan.

## Boundaries

- No fuzzy matching may become provider identity or reconciliation evidence.
- No ambiguous/unavailable Liga row may become price evidence.
- Compatible special-release proxies are comparison-only and excluded from Arbitrage.
- No chart may interpolate, merge currencies, or request an external provider.
- Personal settings do not grant modules, reveal credentials, or change another user's data.
- PriceCharting remains collapsed below TCGplayer/Liga current evidence.
- Existing public gateway Administration blocks remain intact.

## Evidence Gates

- Focused deterministic repository/API/UI tests per slice.
- Full supported test suite, standalone TypeScript, warning-free lint, production build, and diff hygiene.
- SQLite backup/integrity and no exact/compatible downgrade before live replacement.
- Authenticated loopback/tailnet API checks and 390-pixel no-overflow browser review.
- Same-session Chief Architect conformance is recorded as non-independent; Product Owner acceptance remains independent.
