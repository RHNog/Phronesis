# PHR-API-009 Grading Certificate Lookup Validation

Date: 2026-08-01

Feature: `PHR-API-009`

Verdict: **PASS — PRODUCT REVIEW READY; PSA ACTIVATION GATED**

## Automated Verification

- Validation covers provider-specific certificate normalization, the fixed official PSA endpoint, bearer-token placement, normalized PSA evidence, redacted failures, and unsupported-provider zero-network behavior.
- Beckett/BGS/BVG/BCCG, TAG, CGC, and SGC return `OFFICIAL_API_REQUIRED`; Phronesis neither scrapes their pages nor opens a browser.
- The full supported suite passes 314/314. TypeScript, warning-free ESLint, diff hygiene, and production build pass.

## Live UI Verification

- Vendor Workspace exposes one keyboard- and phone-compatible in-app Certificate lookup disclosure.
- PSA is identified as the native connector. Other registered graders remain selectable and explain the official-interface gate without issuing a request.
- `PSA_API_TOKEN` is absent from the private runtime, so no live certificate query was transmitted during validation.

## Negative-Effect Declaration

Certificate input is not persisted, unsupported providers receive no automated traffic, and no credential is exposed to client code, logs, or API errors.
