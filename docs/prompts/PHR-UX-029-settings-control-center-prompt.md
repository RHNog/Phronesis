# PHR-UX-029 — Settings Control Center Engineer Work Order

## Project Context

Project Phronesis is an evidence-driven operating platform for collectible markets. Documentation is part of implementation; follow the feature specification before changing code.

## Feature ID

`PHR-UX-029`

## Objective

Replace the vertically stacked Settings page with an application-like, direct-linkable control center that preserves every existing setting and authorization boundary.

## Required Reading

- `docs/ux/PHR-UX-029-settings-control-center.md`
- `docs/ux/PHR-UX-012-provider-connections-settings.md`
- `docs/architecture/PHR-ARCH-012-employee-activation-module-access.md`
- `docs/architecture/PHR-ARCH-014-timed-event-worker-access.md`
- Relevant Next.js 16.2.12 App Router server/client and search-parameter guidance under `node_modules/next/dist/docs/`.

## Implementation Requirements

- Add a typed Settings workspace with Overview, Business profiles, Regional economics, Provider connections, People & access, and Temporary access.
- Centralize panel value, title, description, category, and visual identity.
- Parse the initial `panel` query in the Server Component and implement immediate client-side selection with URL/history synchronization.
- Preserve panel instances and unfinished state while allowing only the selected panel to occupy layout/accessibility space.
- Provide a desktop sticky navigation rail, phone section selector, and touch-safe overview cards.
- Retain the exact existing panel components, runtime-ready props, API routes, and `ADMINISTRATION` gate.

## Constraints

- Do not broaden authorization or expose provider/authentication secrets.
- Do not replace functional panels with summaries or duplicate their APIs.
- Do not require a server navigation for ordinary panel switching.
- Do not introduce a new icon dependency.

## Expected Architecture

`app/settings/page.tsx` remains the protected Server Component. A focused Client Component owns typed panel selection, history, focus, and presentation while importing the existing client panels. Panel metadata is one canonical constant.

## Testing Expectations

- Add deterministic structure tests for centralized panel IDs, safe normalization, URL history, preserved hidden panel instances, all existing settings components, and responsive navigation contracts.
- Run focused and full tests, TypeScript, lint, production build, desktop live review, and 390×844 installed-WebApp review.

## Documentation Updates

- `docs/FEATURE_REGISTRY.md`
- `docs/ATLAS.md`
- `docs/ROADMAP.md`
- `docs/release-notes/PHR-UX-029.md`
- `docs/testing/PHR-UX-029-settings-control-center-validation.md`
- `docs/reviews/PHR-UX-029-settings-control-center-conformance-review.md`
- Product-development memory and implementation report.

## Acceptance Criteria

- Every prior settings panel remains functional and reaches focused view in one navigation action without scrolling past another panel.
- Responsive, accessibility, URL, automated, build, and live-runtime evidence passes.

## Non-Goals

- Rebuilding the business rules inside individual panels.
- Settings search, settlement workflows, or a new authorization role.

## Notes For AI Coding Agents

- Preserve unrelated user changes.
- Keep edits scoped to the specification.
- Present future improvements separately from implementation.
