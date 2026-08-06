# PHR-UX-027 — Dashboard Tool Hub And Collapsible Navigation

## Feature ID

`PHR-UX-027`

## Title

Dashboard Tool Hub And Collapsible Navigation

## Status

Implemented — Product Review Ready

## Priority

High

## Category

UX / UI / Navigation / Authorization

## Objective

Make an entitlement-aware Dashboard the first authenticated Phronesis page and provide a clear hub where every tool available to the signed-in operator is represented by a navigable card. Preserve direct tool navigation in a desktop sidebar that can collapse to an icon rail and in the existing mobile drawer.

## Background

Phronesis has grown into a suite of operational tools. The current root route is the Opportunities workspace, so users arrive inside one tool without first seeing the authorized product surface or a stable home destination.

## Problem Statement

Users lack a landing page that explains and launches the Phronesis tools available to them. The persistent desktop sidebar also consumes a fixed width even when operators need more working space.

## Proposed Solution

- Reserve `/` for an authenticated Dashboard.
- Move Opportunities to `/opportunities` without changing its authorization requirement or workspace behavior.
- Add Dashboard to primary navigation independently of feature-module assignment.
- Use the approved `PHR-UI-001` Phronesis application mark in the Dashboard shell, browser favicon, and iOS home-screen metadata; synthetic placeholder marks are prohibited.
- Publish a same-origin web-app manifest with `/` as its relative start URL, standalone display metadata, and approved install-icon derivatives so an installed copy never embeds a machine-specific hostname or retired port from application code.
- Render one card per authorized non-Dashboard navigation destination, using the same server-filtered navigation model as the shell.
- Let desktop users collapse the sidebar to an icon rail and persist that preference in local browser storage.
- Treat the installed Safari WebApp as a first-class shell: keep the sidebar and its expand/collapse control within the dynamic viewport, theme every document/scrollbar gutter dark, respect safe-area insets, suppress horizontal and standalone overscroll bleed, and avoid browser-native keyboard conflicts outside standalone display mode.
- Provide discoverable standalone keyboard controls for search, sidebar toggle, Dashboard, and the first nine authorized tools, plus an in-app shortcut reference. Replace inert shell controls with real destinations.
- Preserve the existing accessible mobile navigation drawer.
- Send both permanent-user and temporary-worker successful login flows to Dashboard; the Dashboard then exposes only authorized tools.

## Functional Requirements

- Dashboard is the canonical authenticated landing route at `/`.
- Every successful login returns to Dashboard unless a validated explicit callback path was supplied by an authenticated permanent-user flow.
- Dashboard cards and navigation destinations derive from the same authorized module set.
- Dashboard itself remains visible to an authenticated user with at least one visible module and does not require a new authorization module.
- An unauthenticated Dashboard request redirects to sign-in; an authenticated identity with no visible modules is denied.
- Opportunities remains available at `/opportunities` to users with `INTELLIGENCE` access.
- Desktop sidebar supports expanded and collapsed states, retains recognizable icons and accessible names in both, and remembers the local preference.
- The collapsed rail keeps an Expand control visible above the independently scrollable tool list; neither sidebar state may push its reciprocal control below the WebApp viewport.
- In standalone display mode, `Cmd/Ctrl+K` opens search, `Cmd/Ctrl+B` toggles the desktop sidebar, `G` then `D` opens Dashboard, `G` then `1` through `G` then `9` open authorized tools in their visible order, `?` opens shortcut help, and `Escape` closes modal shell UI. The `G` navigation chord expires after 1.5 seconds. App navigation shortcuts must not fire from editable controls or override normal browser-session shortcuts. Digit navigation resolves from the physical digit key code so alternate keyboard layouts do not change the destination.
- Shortcut help is available from a labelled top-bar button and an accessible modal. The avatar control links to Settings instead of acting as a dead button.
- Expanded desktop, collapsed desktop, and mobile navigation retain the approved Phronesis mark.
- Mobile navigation continues to use the existing dismissible drawer.
- Vendor Workspace Event Operations remains in normal document flow and must not persist over Snapshot Evidence, Buying Decision, or certificate controls while scrolling or using a reduced desktop CSS viewport.

## Non-Functional Requirements

### Performance

Dashboard must use the existing server authorization lookup and navigation data without adding remote requests or client-side entitlement fetching.

### Scalability

Adding a primary navigation tool must automatically add an authorized Dashboard card when its navigation metadata is complete.

### Maintainability

Tool label, route, category, description, icon identity, and module association must live in one navigation model shared by Dashboard and shell.

### Reliability

Sidebar persistence failure or unavailable browser storage must leave the expanded navigation usable.

### Accessibility

All tool cards are semantic links. The collapse control exposes its state and purpose. Collapsed navigation retains accessible link names, visible focus, sufficient touch targets, and selected-page state.

### Offline Support

No offline application guarantee is introduced. The install manifest provides standalone launch metadata only; Phronesis still requires a reachable authenticated runtime. The local sidebar preference may remain available across sessions.

### Security

The Dashboard must never reveal cards for modules absent from the server-derived visible-module set. Client-side sidebar state is presentation-only and must not influence authorization.

### Extensibility

The navigation metadata supports future tools without Dashboard-specific conditionals.

### Responsiveness

Cards form one column on phones, two columns on medium widths, and up to three columns on wide screens. The desktop collapsible sidebar appears at the existing desktop breakpoint; phones retain the drawer.

## User Stories

- As an operator, I want to start on a Dashboard, so I can see and enter every tool available to me.
- As a desktop operator, I want to collapse navigation, so I can devote more width to operational work.
- As a temporary worker, I want a clear authorized hub after login, so I can identify the tools assigned for my event session.

## Acceptance Criteria

- `/` renders Dashboard after authentication and no longer renders Opportunities.
- `/opportunities` renders the unchanged Opportunities workspace and remains protected by `INTELLIGENCE`.
- Dashboard contains exactly one card for each authorized non-Dashboard primary destination.
- The Dashboard shell, favicon, and iOS icon use the approved Phronesis artwork without a generated or CSS substitute.
- `/manifest.webmanifest` declares the approved name, relative `/` start URL and scope, standalone display mode, dark application colors, and approved 192/512-pixel icon derivatives.
- Browser metadata exposes the approved favicon, application icon, Apple touch icon, and web-app manifest from the current origin.
- A module-limited identity cannot see or navigate to unauthorized cards through the Dashboard.
- Desktop sidebar collapses and expands, persists the preference across reloads, and remains keyboard and screen-reader usable.
- The Expand control remains visible without page scrolling in the collapsed installed WebApp, the navigation list scrolls independently, and the sidebar is pinned to `100dvh`.
- The far-right scrollbar/overscroll gutter is dark in the installed Safari WebApp at every page height; no white document background is exposed during scrolling or resizing.
- Standalone shortcut help lists and implements search, sidebar, Dashboard, and tool-navigation commands; ordinary browser sessions retain native `Cmd/Ctrl+B`, `G`, and digit-key behavior.
- The top-bar avatar reaches Settings and no visible shell button is inert.
- Phone navigation remains operable without horizontal overflow.
- Event Operations scrolls with the Vendor Workspace document and never overlays the full-width Buying Decision or certificate controls at desktop widths or browser zoom.
- Permanent and event-access login success paths land on Dashboard by default.
- Navigation, authorization, TypeScript, lint, build, and responsive browser validation pass.

## Edge Cases

- Browser storage is unavailable: sidebar remains usable in its default expanded state.
- The navigation list is taller than the WebApp viewport: it scrolls between a fixed brand/toggle header and the fixed shell boundary without hiding Expand or Collapse.
- A browser tab, rather than an installed WebApp, receives `Cmd/Ctrl+B` or `G` followed by a navigation key: Phronesis does not intercept it.
- An installed Safari web app created under an obsolete hostname remains a separate local application artifact and must be reinstalled from the current canonical tailnet URL; the relative manifest prevents application code from introducing another host-specific launch target.
- A user has one module: Dashboard presents one tool card without empty categories.
- A route is loaded directly: route authorization remains authoritative and selected navigation state remains correct.
- An authenticated identity has no module: Dashboard fails closed through the existing access-denied flow.

## Dependencies

- `PHR-UX-006` lifecycle-based application structure.
- `PHR-UX-014` responsive application navigation.
- `PHR-ARCH-012` employee activation and module assignment.
- `PHR-ARCH-014` timed event worker access.

## Future Enhancements

- Operator-customizable card ordering and favorites.
- Non-sensitive operational summaries on cards when authoritative data contracts exist.

## Technical Notes

The server-owned `ProductNavigation` model remains the source for authorized navigation. Dashboard is a shell destination with no independent module, while the existing authorization gate requires at least one visible module before rendering it. Sidebar collapse state is local presentation state only. The sidebar detects standalone display mode only to enable app-specific shortcuts; authorization and navigation membership remain server-owned. Next.js file-based icon routes and `app/manifest.ts` own install metadata; the manifest uses only same-origin relative paths. Root CSS owns the dark document canvas, scrollbar colors, standalone overscroll containment, and safe-area variables. The Vendor checkout card remains adjacent to evidence but its outer workspace wrapper is static, not sticky.

## UI / UX Notes

Cards should be visually distinct, scan quickly, and communicate tool category and purpose without fabricated status metrics. The collapsed rail keeps the approved `PHR-UI-001` Phronesis mark, tool icons, selected state, focus treatment, and a clearly labelled expand control immediately below the brand header. The shortcut-help button is visually secondary but always reachable; shortcut labels use the operator's platform conventions. Do not redraw or approximate the product mark in CSS.

## Success Metrics

- All authorized tools are reachable in one interaction from Dashboard.
- Zero unauthorized tool cards appear under module-filtered test identities.
- No accessibility or horizontal-overflow regressions at phone and desktop validation widths.

## Open Questions

- None blocking initial implementation.

## Traceability

- Originating prompt: Product Owner request on 2026-08-05 for a landing-page hub, tool cards, collapsible sidebar, and Dashboard-first login.
- Related implementation prompt: `docs/prompts/PHR-UX-027-dashboard-tool-hub-prompt.md`.
- Related tests: `tests/application-navigation.test.ts`, `tests/authorization-foundation.test.ts`.
- Related release notes: `docs/release-notes/PHR-UX-027.md`.
- Last modified: 2026-08-06.
- Modification reason: Product Owner screenshot review added installed-WebApp viewport, dark-gutter, always-visible navigation control, functional shell button, and standalone shortcut requirements.
