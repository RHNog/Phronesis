# PHR-API-017 — Provider Price History And Movement Validation

Date: 2026-08-07

Verdict: **PASS — PRODUCT REVIEW READY**

## Automated Evidence

- `tests/provider-price-history.test.ts` verifies independent USD TCGplayer and BRL Liga series, bounded ranges, chronological values, exact Liga quality, and responsive presentation wiring.
- Route validation accepts only bounded category/SKU/condition/range input and requires `VENDOR_WORKSPACE:VIEW`.
- Full suite: 470/470 passing.
- TypeScript, repository-wide ESLint, production build, and `git diff --check`: passing.

## Operational Evidence

- Pre-change operational and authentication backups are retained under `.data/backups/20260807T153757Z/`; both backup and live integrity checks return `ok`.
- Additive live history contains 777,509 LigaMagic and 191,775 LigaPokémon observations.
- Gardevoir GX SV75 exposes six retained TCGplayer Market observations in 30D and one LigaPokémon Retail Average observation in 7D without cross-currency aggregation.

## Responsive Browser Evidence

- Tested at 390×844 against the deployed private runtime.
- 7D, 30D, 3M, and 1Y controls switch the local query; TCGplayer and LigaPokémon provider selection changes the displayed series and currency.
- Every range and provider button measured 44 pixels high.
- Document/body scroll widths measured 375 pixels inside a 390-pixel viewport; no horizontal overflow occurred.
- PriceCharting stayed below the raw-card card, closed by default, and exposed its own history only after expansion.
- Browser console errors: zero.

## Safety Boundaries

No movement control triggers acquisition, merges currencies, interpolates missing points, changes selected identity, or mutates provider evidence.
