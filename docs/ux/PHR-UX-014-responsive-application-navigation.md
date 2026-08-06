# PHR-UX-014 Responsive Application Navigation

## Feature ID

`PHR-UX-014`

## Title

Responsive Application Navigation

## Status

Implemented — Product Review Pending

## Priority

High

## Category

UX / UI / Application Shell / Accessibility / Authorization Presentation

## Objective

Keep every authorized Phronesis destination reachable from the shared application shell at phone widths while preserving the persistent desktop sidebar.

## Background

`PHR-UX-006` established one typed primary-navigation configuration and a desktop sidebar. It explicitly deferred compact navigation. The production shell currently hides that sidebar below the `md` breakpoint but does not render an equivalent mobile control, so entering a workflow directly on a phone strands the operator on that route.

## Problem Statement

At a 390px phone viewport, the top bar exposes Search and the user control only. Opportunities, Vendor Workspace, Event Ledger, Market Watch, Inventory, and Settings may exist and be authorized, but there is no application-level path to reach them.

## Proposed Solution

Add an accessible mobile navigation drawer to the shared top bar. `AppShell` must pass the same server-filtered `navigationItems` array to the desktop sidebar and the mobile control. The drawer presents the canonical product label, authorized destination labels and lifecycle areas, current-route state, and explicit close behavior. Desktop navigation remains unchanged.

## Functional Requirements

- Show a clearly labelled mobile-navigation trigger below the desktop-sidebar breakpoint.
- Open a full-height, dismissible navigation drawer without changing the current route.
- Render only the permission-filtered navigation items already calculated by `AppShell`.
- Preserve the order, labels, routes, areas, and active-route ownership from `ProductNavigation.ts`.
- Close the drawer after destination selection, Escape, backdrop activation, or the explicit close button.
- Keep Search and the user control reachable in the phone top bar.
- Preserve the persistent desktop sidebar at `md` width and above.

## Non-Functional Requirements

### Performance

The drawer must use the existing in-memory navigation configuration and must not issue provider or authorization requests when opened.

### Scalability

New primary destinations added to the canonical configuration must appear automatically when authorized.

### Maintainability

Desktop and mobile navigation must not duplicate product-navigation metadata or permission logic.

### Reliability

Closing the drawer must restore page scrolling, and route transitions must not leave an overlay mounted.

### Accessibility

The trigger exposes expanded state and its controlled panel. The drawer is an appropriately named modal surface, moves focus inside on open, contains keyboard focus while open, closes on Escape, and returns focus to its trigger when dismissed. Every interactive target is at least 44px high or wide, and the active destination uses `aria-current="page"`.

### Offline Support

Navigation uses existing Next.js application links and local assets; opening the drawer has no network dependency.

### Security

Mobile visibility is derived only from server-filtered module entitlements. Navigation hiding remains presentation behavior and never replaces page or API authorization.

### Extensibility

The component accepts typed `PrimaryNavigationItem` values and remains independent of any particular destination count.

### Responsiveness

The phone header must fit at 390px without horizontal overflow. The mobile control is hidden at `md` and above; the desktop sidebar remains hidden below `md`.

## User Stories

- As an event operator on a phone, I can move from Event Ledger to any other authorized Phronesis workspace without editing the URL.
- As a restricted operator, I see the same allowed destinations on phone and desktop and no unauthorized destination names.
- As a keyboard or assistive-technology user, I can open, traverse, identify, and dismiss navigation predictably.

## Acceptance Criteria

- At 390px, the shared header exposes an `Open navigation` control on every `AppShell` page.
- Opening it reveals every and only authorized primary destination from `navigationItems`.
- Each navigation link reaches its canonical route and closes the drawer.
- Current destination state is correct for primary and contextual routes.
- Focus, Escape, backdrop, scroll locking, and trigger-focus restoration behave as specified.
- Search and user controls remain visible and all phone-header/drawer controls meet the 44px target.
- Desktop retains the existing sidebar and does not show the mobile trigger.
- Focused tests, full suite, standalone TypeScript, lint, production build, diff hygiene, and 390px browser review pass.

## Edge Cases

- An operator with only one visible module sees only destinations owned by that module.
- A contextual route selects its owning primary destination.
- An unknown or developer route does not falsely select a production destination.
- An empty filtered list renders no invented links.
- Repeated open and close cycles do not retain body scroll locking.

## Dependencies

- `PHR-UX-006` lifecycle-based application structure.
- `PHR-ARCH-011` internal module authorization and `getVisibleModules()`.
- Existing shared `AppShell`, `Topbar`, and typed product-navigation configuration.

## Future Enhancements

- Optional recent-destination shortcuts after separate product approval.
- Optional account actions once the user-menu workflow is implemented.

## Technical Notes

Keep entitlement resolution in the server `AppShell`. Pass the resulting typed list into both responsive renderers. Route-awareness may remain at the smallest client component via `usePathname`. Do not import the unrestricted default navigation list into the mobile drawer.

## UI / UX Notes

Use a left-side dark drawer consistent with the established Phronesis shell, a subdued backdrop, lifecycle-area context beside each plain destination label, cyan active treatment, and explicit close affordance. Navigation is infrastructure, so it should be immediate and visually quieter than the workflow content it reveals.

## Success Metrics

- Zero authorized `AppShell` destinations are unreachable at 390px.
- Zero unauthorized destinations are introduced by the mobile renderer.
- Zero horizontal overflow or browser-console errors in phone review.

## Open Questions

- None for this remediation.

## Traceability

- Originating direction: Product Owner mobile review feedback on 2026-07-31, “Where is the rest of Phronesis?”, assigned as `PHR-STRUCT-20260731-003`.
- Related implementation prompt: `docs/prompts/PHR-UX-014-responsive-application-navigation-prompt.md`.
- Related tests: `tests/application-navigation.test.ts` and `docs/testing/PHR-UX-014-responsive-application-navigation-validation.md`.
- Related release notes: `docs/release-notes/PHR-UX-014.md`.
- Last modified: 2026-07-31.
- Modification reason: initial specification after the missing mobile-shell path was identified during Event Ledger Product Review.
