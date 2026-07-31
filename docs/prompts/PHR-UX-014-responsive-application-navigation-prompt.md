# PHR-UX-014 Engineer Work Order — Responsive Application Navigation

## Project Context

Project Phronesis is an evidence-driven decision intelligence platform for collectible markets. Documentation is part of implementation, and `PHR-UX-014` repairs the shared mobile application shell without weakening module authorization.

## Feature ID

`PHR-UX-014`

## Objective

Add a complete, accessible, permission-filtered mobile navigation path to every `AppShell` route while preserving the existing desktop sidebar.

## Required Reading

- `docs/ux/PHR-UX-014-responsive-application-navigation.md`
- `docs/ux/PHR-UX-006-application-information-architecture.md`
- `docs/architecture/PHR-ARCH-011-internal-identity-module-authorization.md`
- `lib/navigation/ProductNavigation.ts`
- `components/ui/AppShell.tsx`

## Implementation Requirements

- Pass the `AppShell` server-filtered `navigationItems` to both desktop and mobile navigation.
- Add a phone-only drawer trigger to the shared top bar.
- Render typed labels, routes, lifecycle areas, and current state from the supplied list.
- Implement explicit close, Escape, backdrop, route-selection, focus containment/restoration, and body-scroll restoration.
- Keep Search and user controls usable at 390px and retain the existing desktop shell at `md` and above.
- Keep all interactive targets at least 44px and avoid horizontal overflow.

## Constraints

- Do not duplicate navigation metadata or permission resolution.
- Do not import the unrestricted primary-navigation array into the mobile drawer.
- Do not treat navigation visibility as an authorization boundary.
- Do not change destination routes, module ownership, page authorization, workflow behavior, or dependencies.

## Expected Architecture

`AppShell` remains the server authorization boundary and computes one filtered list. `Sidebar` consumes that list on desktop. `Topbar` passes the same list into a focused client-side `MobileNavigation` component for route state and interaction behavior.

## Testing Expectations

- Extend navigation coverage for the filtered shared-shell handoff and accessible mobile control contract.
- Run the focused navigation test, full behavioral suite, standalone TypeScript, lint, production build, and `git diff --check`.
- Review the live application at 390px and desktop width, including route selection, active state, focus behavior, touch targets, overflow, and console output.

## Documentation Updates

- Add validation, implementation report/conformance note as appropriate, and release notes for `PHR-UX-014`.
- Update Feature Registry, Atlas, roadmap/changelog, prompt history, Event Ledger validation, and product conversation memory where the shell correction changes prior evidence.

## Acceptance Criteria

- Every authorized primary destination is reachable from the phone header.
- Unauthorized navigation metadata is never sent through the mobile presentation path.
- Accessibility, responsiveness, deterministic verification, and live browser evidence satisfy the specification.

## Non-Goals

- New routes, destination renaming, account-menu implementation, breadcrumbs, recents, public deployment, or authorization-policy changes.

## Notes For AI Coding Agents

- Preserve unrelated user changes and the active Event Cash Ledger worktree.
- Keep edits scoped to the shared shell and traceability artifacts.
- Sequential same-session conformance is not independent approval.
