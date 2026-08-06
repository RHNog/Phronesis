# Implementation Prompt — PHR-API-009 Grading Certificate Lookup

## Feature ID

`PHR-API-009`

## Objective

Implement an in-Phronesis certificate lookup framework with a functional official PSA adapter and truthful no-API states for Beckett/BCCG, TAG, CGC, and SGC.

## Required Reading

- `docs/api/PHR-API-009-grading-certificate-lookup.md`
- `lib/intelligence/certification/CertificationRegistry.ts`
- `node_modules/next/dist/docs/01-app/01-getting-started/15-route-handlers.md`
- `node_modules/next/dist/docs/01-app/02-guides/environment-variables.md`

## Implementation Requirements

- Create normalized provider capabilities, PSA adapter, authorized route, and Vendor Workspace panel.
- Keep tokens server-only; validate input; use fixed HTTPS origin, timeout, and manual redirects.
- Unsupported providers make zero network calls and never masquerade as verification.

## Constraints

- No scraping, browser automation, iframe workaround, population data, external write, dependency, deployment, commit, or push.

## Testing Expectations

- Cover PSA normalization and errors, credential redaction, provider input rules, unsupported zero-network behavior, UI state, TypeScript, lint, full tests, and build.

## Acceptance Criteria

- Every criterion in the specification passes.
