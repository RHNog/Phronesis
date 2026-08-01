# PHR-API-008 PkmnPrices Sealed Ingestion Validation

Date: 2026-08-01

Feature: `PHR-API-008`

Verdict: **PASS — PRODUCT REVIEW READY; LIVE ACTIVATION GATED**

## Automated Verification

- Deterministic provider tests prove strict newest-release-first traversal, an exact 100-credit UTC-day ceiling, minimum-one charging for empty pages, exact sealed identity resolution, and fail-closed 403 plan denial.
- The importer calls only `/v1/sealed`; no PkmnPrices single-card, set, or detail endpoint is used.
- SQLite usage, release progress, staged product, and exact-resolution state survive restart and prevent budget overrun.
- The full supported suite passes 314/314. Standalone TypeScript, warning-free ESLint, diff hygiene, and the Next.js 16.2.12 production build pass.

## Activation Evidence

- `PKMNPRICES_API_KEY` is not configured in the active private runtime, so no paid request and no provider credit was consumed during validation.
- Official PkmnPrices documentation states that `/v1/sealed` requires Pro or Business access. A key without sealed access is surfaced as `ACCESS_REQUIRED` without spending credits on another endpoint.
- Once a sealed-enabled key is registered and the private service is restarted, the supervised worker runs immediately and again after each UTC reset, consuming at most the remaining portion of the 100-credit sealed-only policy budget.

## Negative-Effect Declaration

No ambiguous provider record can alter a local sealed identity or artwork resolution. Existing catalogue, inventory, checkout, and event transaction data were not mutated during verification.
