# PHR-ARCH-017 — Personal Market Providers And Cost Structure Validation

Date: 2026-08-07

Verdict: **PASS — PRODUCT REVIEW READY**

## Persistence And Economics

- `tests/user-market-settings.test.ts` proves all-provider defaults, canonical provider writes, at-least-one enforcement, zero-valued overrides, workspace inheritance, official-FX preservation, audit insertion, and disabled-membership denial.
- Additive live tables `phronesis_user_market_provider` and `phronesis_user_cost_profile` exist; authentication database integrity is `ok`.
- Vendor Workspace server-loads active-member preferences. Regional arbitrage reads and availability verification receive the effective personal profile.

## Authorization And Transport

- `/user-settings` uses a database-backed Better Auth session plus active permanent membership and is independent of `ADMINISTRATION`.
- Anonymous restricted-public `/user-settings` redirects to Sign In; `/api/user/settings` returns 401.
- Restricted-public `/settings` remains transport-blocked with 404.
- Timed identities lack a permanent membership ID and never enter personal persistence.

## Product Gates

- Focused settings/history/search/reconciliation tests: 28/28 passing before full validation.
- Full suite: 470/470 passing.
- TypeScript, warning-free ESLint, Next.js production build, diff hygiene, private local health, restricted gateway health, and zero deployed browser console errors pass.

Signed-in form mutation was not fabricated during same-session browser review; repository/API authorization evidence covers the write contract. Product Owner review with a real permanent tester account remains the independent acceptance gate.
