# PHR-UX-008 Implementation Prompt

## Project Context

Vendor Workspace is the desktop-first buying station and uses exact local snapshot SKUs. Search currently requires manual catalogue selection and duplicates finish products.

## Objective

Implement one all-catalogue search and artwork-first result grouping, then expose exact finish and condition selection after card choice.

## Required Reading

- `docs/ux/PHR-UX-008-unified-artwork-first-catalogue-search.md`
- `docs/workflows/PHR-WORKFLOW-004-snapshot-powered-vendor-workspace.md`
- `docs/api/PHR-API-002-cross-game-catalogue-artwork-providers.md`
- `docs/DECISIONS.md`

## Implementation Requirements

- Add one repository/API operation that searches all loaded categories and returns bounded globally ranked matches plus category freshness.
- Add deterministic artwork-identity grouping that collapses finish-only SKUs while preserving real artwork descriptors and collector identities.
- Remove the required catalogue selector and show game labels on results.
- Add an explicit finish selector before condition; every evaluation must still use one exact SKU.
- Preserve keyboard, desktop, mobile, stale/error, and last-good behavior.

## Constraints

- Do not change price math, Business Profiles, offer ladder, Intelligence engines, decision thresholds, upstream catalogues, or snapshot history.
- Do not infer one hidden catalogue when multiple valid games match.
- No commit, push, deployment, or public release.

## Testing Expectations

- Unified ranking, missing-category tolerance, grouping, variant selection, exact-SKU evaluation, keyboard, desktop, and 390px coverage.
- Focused tests, lint, build, full-suite baseline, standalone-TypeScript disclosure, and diff hygiene.
