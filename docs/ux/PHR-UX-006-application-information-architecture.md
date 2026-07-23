# Application Information Architecture

## Feature ID

`PHR-UX-006`

## Title

Lifecycle-Based Application Structure

## Status

Completed

## Priority

High

## Category

UX, UI, Workflow, Architecture

## Objective

Give Phronesis a durable application structure organized around the professional collector and trading-card operator lifecycle: discover opportunities, decide whether to buy, monitor selected assets, manage owned assets, and administer business policy.

## Background

Phronesis has working Hot Opportunities, Vendor Workspace, Purchase Evaluation, Market Watch, and Settings surfaces. The current sidebar grew feature-by-feature, mixes active and placeholder destinations, and exposes Purchase Evaluation as a peer of the Vendor Workspace even though evaluation is part of the decision workflow.

The next development phase requires a stable product map before additional capabilities are added. This structure must preserve the existing domain engines and routes while making the user's operating flow clear.

## Problem Statement

The current navigation is a flat feature list. It does not communicate which destinations are primary workflows, which capabilities are embedded steps, or which entries are not yet available. Placeholder `#` links appear actionable, and the relationship between Vendor Workspace and Purchase Evaluation is unclear.

## Proposed Solution

Organize the product into five durable product areas:

1. **Discover** — find actionable buying opportunities.
2. **Decide** — identify an asset, evaluate a purchase, negotiate, and record the decision.
3. **Monitor** — follow assets and market movement after interest is established.
4. **Manage** — manage owned inventory and portfolio outcomes; this is a reserved future area until an approved feature makes it operational.
5. **Administer** — configure business profiles, providers, preferences, and developer controls according to capability and permission.

The initial production navigation is intentionally smaller than the complete product map:

| Product area | Navigation label | Route | Initial state | Decision question |
|---|---|---|---|---|
| Discover | Opportunities | `/` | Operational | What should I buy today? |
| Decide | Vendor Workspace | `/vendor` | Operational | Should I buy this asset, and at what price? |
| Monitor | Market Watch | `/watchlists` | Operational | What changed in the assets I am watching? |
| Administer | Settings | `/settings` | Operational | Which policies and preferences govern my decisions? |

Purchase Evaluation remains operational at `/evaluate` for compatibility but becomes a decision-flow route reached from context, not a primary navigation destination. Opportunity detail at `/opportunities/[id]` remains a contextual route. Developer tools under `/dev` remain outside production navigation.

Manage is part of the durable product map but must not appear as an enabled production destination until inventory or portfolio scope is separately approved and implemented.

## Functional Requirements

- Replace the flat feature list with the four operational primary destinations defined above.
- Order the destinations by workflow: Opportunities, Vendor Workspace, Market Watch, Settings.
- Remove placeholder `#` navigation targets.
- Use stable navigation identifiers independent of display labels.
- Derive selected navigation state from the current route rather than requiring each page to provide a label.
- Treat `/evaluate` and `/opportunities/[id]` as contextual descendants of Decide and Discover respectively.
- Keep `/dev/identity` and `/dev/justtcg` out of production navigation.
- Preserve all existing routes and bookmarked URLs during this structural phase.
- Provide a single navigation configuration that owns label, route, product area, capability state, and route-matching behavior.
- Render unavailable future areas only when the UI explicitly communicates their lifecycle state; never use a false actionable link.
- Keep the global command palette available across operational application routes.
- Give each primary screen a consistent page contract: product-area context, decision question, primary action, content region, loading behavior, empty state, and error recovery.

## Non-Functional Requirements

### Performance

Navigation configuration and active-route resolution must be synchronous and must not trigger provider requests. Use Next.js links so operational routes can benefit from client-side navigation and prefetching.

### Scalability

New capabilities must join an existing product area or require an explicit CTO decision to create a new area. Navigation must support future permissions and capability states without embedding provider logic in components.

### Maintainability

Labels, URLs, active matching, product-area ownership, and lifecycle state must have one source of truth. Pages must not duplicate sidebar selection strings.

### Reliability

Existing URLs remain valid. A missing or disabled capability must never lead to a dead anchor or misleading navigation state.

### Accessibility

Navigation must have an explicit accessible name, use semantic links, expose the current page with `aria-current`, and remain keyboard operable. Icons, if later introduced, cannot replace text labels.

### Offline Support

The shell and navigation remain usable with locally available application assets. Offline behavior of each workspace remains owned by that workspace.

### Security

Developer routes and future administrative controls must not become discoverable through production navigation. Hiding a route is not authorization; protected features will still require their own access control.

### Extensibility

The model must accommodate nested destinations, badges, permissions, lifecycle status, and responsive presentation without changing domain engines.

### Responsiveness

Desktop retains a persistent sidebar. The same configuration must support a future compact/mobile navigation treatment; this feature does not authorize a full mobile redesign.

## User Stories

- As a buyer, I can understand the application's workflow from the navigation without learning its internal engine names.
- As a buyer, I can move from discovering an opportunity into the Vendor Workspace without mistaking evaluation for a separate product.
- As an operator, I can distinguish current capabilities from future product direction.
- As a returning user, my existing bookmarks continue to work.
- As a developer, I can add a route to the correct product area through one typed configuration.

## Acceptance Criteria

- Primary production navigation contains only Opportunities, Vendor Workspace, Market Watch, and Settings.
- No production navigation item uses `href="#"`.
- The current destination is derived correctly for `/`, `/opportunities/[id]`, `/vendor`, `/evaluate`, `/watchlists`, and `/settings`.
- `/evaluate`, existing opportunity detail routes, and `/dev/*` continue to resolve.
- Contextual routes identify with their owning product area without becoming primary sidebar items.
- Navigation configuration is typed, has unit coverage, and is the only source of primary navigation metadata.
- Existing identity, market, assessment, strategy, negotiation, decision, watchlist, and history behavior is unchanged.
- Lint, relevant unit tests, and production build pass.

## Edge Cases

- Unknown production routes show the existing not-found behavior and do not select an unrelated destination.
- Query strings and hashes do not change active product-area resolution.
- Nested opportunity routes resolve to Discover.
- Evaluation reached directly by an old bookmark resolves to Decide.
- Development routes do not select or reveal a production navigation entry.
- A future capability marked Planned or Unavailable cannot render as an actionable link.

## Dependencies

- `PHR-WORKFLOW-001` Market Watch MVP.
- `PHR-UX-002` Global Command Palette.
- `PHR-UX-003` Capability-Aware Workflows.
- Existing Next.js App Router application shell.

## Future Enhancements

- Manage area with Inventory and Portfolio after separate product approval.
- Monitor alerts and automation after separate product approval.
- Role-aware and organization-aware navigation.
- Responsive mobile navigation.
- Breadcrumbs and cross-workflow recents.

## Technical Notes

Follow the installed Next.js App Router guidance. Route groups may organize future source files without changing URLs, but moving existing routes is not required for this phase. Shared layouts preserve shell state across navigation. Use `next/link` for operational links and route-aware client logic only at the smallest shell boundary that needs the current pathname.

Suggested ownership:

```text
Product navigation configuration
  -> route matcher
  -> desktop sidebar
  -> future compact navigation

App Router route
  -> shared AppShell
  -> product-area context
  -> page decision contract
  -> existing workflow component
```

Do not relocate domain code into `app/`. Route files remain composition boundaries; feature and domain modules retain their existing ownership.

## UI / UX Notes

Use plain professional labels. Remove the flame emoji from the primary label. The sidebar should communicate product workflow, not a backlog of possible modules. Future areas may be explained on a roadmap or capability surface, but disabled-looking navigation should not crowd the initial shell.

## Success Metrics

- Zero dead or placeholder links in primary production navigation.
- Every primary destination answers one explicit decision question.
- One source of truth for primary navigation and route ownership.
- No regression in existing route availability or workflow behavior.

## Open Questions

- None required for the initial structural phase. Inventory, Portfolio, Alerts, and mobile navigation each require separate CTO scope approval.

## Traceability

- Originating prompt or work order: CTO direction on 2026-07-22 to make application structure the next development objective.
- Related implementation prompt: `docs/prompts/PHR-UX-006-implementation-prompt.md`.
- Related tests: `tests/application-navigation.test.ts` and `docs/testing/PHR-UX-006-application-structure-validation.md`.
- Related release notes: `docs/release-notes/PHR-UX-006.md`.
- Last modified: 2026-07-22.
- Modification reason: specified, implemented, verified, and accepted through the sequential role workflow.
