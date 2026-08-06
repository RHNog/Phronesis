# PHR-API-009 Grading Certificate Lookup

## Feature ID

`PHR-API-009`

## Title

Embedded Grading Certificate Verification

## Status

Implemented — Product Review Ready; PSA Credential Activation Pending

## Priority

High

## Category

API / Provider / Security / Vendor UX / Certification

## Objective

Let a Vendor Workspace operator verify a grading certificate inside Phronesis when the grader provides an authorized machine interface, without presenting scraped data as official evidence.

## Research Decision

- PSA publishes a bearer-authenticated public API for single-certificate verification. It is the first functional connector.
- Beckett provides an official web lookup for BGS, BVG, and BCCG, but no documented public API was found.
- TAG provides an official eight-digit certificate search and public DIG links, but no documented JSON API was found.
- CGC provides an official rate-limited web verification form with description, grade, and holder images, but no documented public API was found.
- SGC provides an official certificate verification form, but no documented public API was found.

Phronesis must not automate or parse those web forms without provider authorization. `CCG` in the request is treated as CGC; BCCG remains represented under Beckett.

## Proposed Solution

Create a normalized certificate-lookup registry and server-only route. PSA uses `PSA_API_TOKEN` and returns normalized verification evidence. Beckett/BCCG, TAG, CGC, and SGC appear in the same in-app panel with an explicit `OFFICIAL_API_REQUIRED` state until an approved interface is available. No unsupported provider request leaves Phronesis.

## Functional Requirements

- Certificate input is normalized and validated per provider before any network call.
- PSA accepts digits only and calls only the documented HTTPS cert endpoint with a server-only bearer token.
- PSA responses normalize validity, server message, cert number, grade, identity description, year, brand, subject, variety, label type, specification number, and available images without inferring missing fields.
- Provider credentials never appear in errors or browser responses.
- Unsupported providers return a stable capability result and do not scrape or open another browser.
- The Vendor Workspace panel remains usable by keyboard and phone.

## Non-Functional Requirements

### Security

Use an allowlisted origin, encoded path segment, request timeout, no redirects, and server-only credentials. Avoid recording certificate queries until a retention policy is approved.

### Reliability

Distinguish invalid input, not found, not configured, provider unavailable, and unsupported integration.

### Extensibility

Every future grader adapter implements the same normalized provider contract.

## Acceptance Criteria

- A configured PSA lookup completes inside Phronesis and renders normalized official evidence.
- An unconfigured PSA lookup reports configuration required without leaking a token.
- Beckett/BCCG, TAG, CGC, and SGC never issue an automated request and visibly state that official API authorization is required.
- Deterministic tests cover validation, PSA normalization, failure states, and no-network unsupported providers.

## Non-Goals

- Scraping, bypassing rate limits, population reports, graded price estimates, authenticity guarantees, or auto-attaching a cert to Inventory.

## Traceability

- Originating request: Product Owner grader verification research and implementation direction, 2026-08-01.
- Related implementation prompt: `docs/prompts/PHR-API-009-grading-certificate-lookup-prompt.md`.
- Related tests: `tests/grading-certificate-lookup.test.ts`.
- Related release notes: `docs/release-notes/PHR-API-009.md`.
- Last modified: 2026-08-01.
- Modification reason: Provider-capability research, implementation, and verification evidence recorded.
