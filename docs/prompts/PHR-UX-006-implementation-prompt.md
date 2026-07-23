# PHR-UX-006 Implementation Prompt

## Project Context

Phronesis is a professional TCG decision operating system. Documentation is part of implementation. Follow the originating specification and preserve the existing decision, identity, market, and watchlist boundaries.

## Feature ID

`PHR-UX-006`

## Objective

Implement the lifecycle-based application structure and production navigation without changing existing workflow behavior or breaking existing routes.

## Required Reading

- `docs/ux/PHR-UX-006-application-information-architecture.md`
- `docs/PRODUCT_SPEC.md`
- `docs/ARCHITECTURE.md`
- `docs/workflows/PHR-WORKFLOW-001-market-watch-mvp.md`
- `docs/ux/PHR-UX-002-global-command-palette.md`
- `docs/ux/PHR-UX-003-capability-aware-workflows.md`
- Installed Next.js guides: project structure, layouts and pages, and linking and navigating.

## Implementation Requirements

- Create one typed primary-navigation configuration.
- Expose only Opportunities, Vendor Workspace, Market Watch, and Settings as primary production destinations.
- Remove placeholder anchors and the primary Purchase Evaluation entry.
- Derive active product-area state from the route, including contextual ownership for opportunity detail and evaluation routes.
- Keep existing URLs operational.
- Preserve the global command palette and current workspace compositions.
- Add focused tests for configuration integrity and route matching.

## Constraints

- Do not redesign workspace content.
- Do not create Inventory, Portfolio, Alerts, Cards, Analytics, or mobile features.
- Do not modify domain engines, provider behavior, persistence formats, or business rules.
- Do not expose developer routes in production navigation.
- Do not use placeholder `#` links.
- Preserve unrelated working-tree changes.

## Expected Architecture

A typed, presentation-neutral navigation model owns identifiers, product areas, labels, operational routes, lifecycle states, and matchers. The shell consumes this model. Route files remain thin composition boundaries and existing feature/domain modules remain in place.

## Testing Expectations

- Unit-test navigation uniqueness, operational links, and the absence of placeholder targets.
- Unit-test active-area matching for all current routes and contextual routes.
- Run relevant existing shell, command palette, workflow, and watchlist tests.
- Run lint and the production build.
- Manually verify keyboard navigation and direct loading of preserved routes.

## Documentation Updates

- Mark `docs/ux/PHR-UX-006-application-information-architecture.md` completed only after evidence passes.
- Add `docs/testing/PHR-UX-006-application-structure-validation.md`.
- Add `docs/release-notes/PHR-UX-006.md`.
- Update `docs/FEATURE_REGISTRY.md`, `docs/ROADMAP.md`, `docs/ARCHITECTURE.md`, `docs/ATLAS.md`, `docs/PROMPTS.md`, and relevant changelogs.
- Return implementation evidence for Chief Architect conformance review and CTO acceptance.

## Acceptance Criteria

- All acceptance criteria in the specification pass with recorded evidence.
- Existing routes remain available.
- Primary navigation has no dead, placeholder, or falsely enabled destinations.
- Existing product workflow behavior remains unchanged.

## Non-Goals

- New product capabilities.
- URL migration.
- Full responsive/mobile redesign.
- Authentication or permission implementation.
- Independent product-area dashboards.

## Notes For AI Coding Agents

- Preserve unrelated user changes.
- Keep edits scoped to the specification.
- Present improvement suggestions separately from implementation.
- Do not claim CTO acceptance.
