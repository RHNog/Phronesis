# Official BCB PTAX Exchange Rate Validation

Date: 2026-07-30
Feature: `PHR-API-007`
Verdict: **PASS — CTO ACCEPTED**

## Official Provider Evidence

- Provider: Banco Central do Brasil PTAX OData `CotacaoDolarPeriodo`.
- Latest closing observation: 2026-07-30 13:07:32 Brasília time.
- PTAX buy: 5.0733 BRL/USD.
- PTAX sell: 5.0739 BRL/USD.
- Live `/api/regional/profile`: HTTP 200, BCB provenance, no refresh error.
- Two consecutive authorized reads retained identical `fxFetchedAt` and `fxLastAttemptAt`, proving the persisted one-hour throttle.
- Authorized forced refresh completed and updated `Last checked` without changing the official observation.

## Deterministic Verification

- Provider and direction-specific focused tests: passed.
- Supported full suite: 245/245 passed.
- Standalone TypeScript: passed with zero diagnostics.
- ESLint: passed with zero warnings.
- Next.js 16.2.12 production build: passed.
- `git diff --check`: passed.

## Runtime Review

- Desktop Settings rendered separate BCB buy/sell rates, purpose labels, observation, retrieval, source, and refresh control.
- 390×844 review showed the new regional panel bounded within the mobile content width.
- Existing provider-connection cards remain the only identified page-level horizontal overflow source; `PHR-API-007` introduced none.
- Browser console contained no errors or warnings during refresh verification.

## Negative-Effect Declaration

No dependency, credential, unofficial FX fallback, second scheduler, LigaMagic schedule, transaction, public deployment, destructive migration, force push, or history rewrite was introduced. The retained rollback checkout was not modified.
