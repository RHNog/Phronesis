# PHR-UX-027 — Dashboard Tool Hub Implementation Prompt

## Project Context

Phronesis is a growing suite of authorized operational tools. It needs a canonical authenticated home and a space-efficient shared navigation shell.

## Feature ID

`PHR-UX-027`

## Objective

Implement an entitlement-aware Dashboard at `/`, move Opportunities to `/opportunities`, add a persistent collapsible desktop sidebar while preserving the mobile drawer, and complete Product Owner remediation for same-origin web-app installation plus Vendor Workspace layout containment.

## Required Reading

- `docs/ux/PHR-UX-027-dashboard-tool-hub.md`
- `docs/design/PHR-UX-027-dashboard-tool-hub.md`
- `docs/ux/PHR-UX-014-responsive-application-navigation.md`
- `docs/architecture/PHR-ARCH-014-timed-event-worker-access.md`
- Relevant local Next.js layouts/pages, linking/navigation, and server/client component guides.

## Implementation Requirements

- Make Dashboard the authenticated root route.
- Rehome Opportunities at `/opportunities` without changing its behavior or access gate.
- Extend the canonical navigation model with Dashboard, descriptions, and reusable icon identities.
- Recover and reuse the approved Phronesis favicon, Apple touch icon, and shared product mark from canonical repository history.
- Render cards only for server-authorized tools.
- Add accessible, persistent desktop sidebar collapse behavior.
- Keep the current mobile drawer behavior.
- Make successful event-access login land on Dashboard; preserve safe explicit callback handling for permanent login.
- Add a Next.js App Router manifest with relative root start/scope, standalone display metadata, approved install-icon derivatives, and explicit Apple web-app metadata without claiming offline behavior.
- Keep Event Operations adjacent to the primary Vendor workflow but remove its outer sticky positioning so it cannot cover later full-width controls.
- Pin the desktop sidebar to the dynamic viewport, make its authorized tool list independently scrollable, and place an always-visible reciprocal expand/collapse control above that scroll region.
- Theme the root document, scrollbar track/thumb, and standalone overscroll canvas dark; use safe-area-aware shell padding and `viewport-fit=cover` without introducing horizontal overflow.
- Give the shared top bar a 64-pixel control row in addition to `env(safe-area-inset-top)` so iPhone status chrome cannot cover the menu, search, shortcut, or account controls. Consume the same top/bottom safe areas in the mobile drawer and shell modal overlays; preserve the original dimensions when the inset is zero.
- Render the mobile drawer overlay at the document-body boundary so sticky-header blur cannot constrain its fixed viewport geometry.
- Gate WebApp-specific keyboard interception behind standalone display mode. Implement search, sidebar toggle, Dashboard, and first-nine-tool shortcuts with editable-target protection, plus an accessible shortcut-help modal and visible help button.
- Replace the inert top-bar avatar button with a Settings link.

## Constraints

- Do not add a Dashboard authorization module.
- Do not trust client-side filtering for access control.
- Do not invent operational metrics.
- Do not introduce a new icon or state-management dependency.
- Do not draw a substitute Phronesis brand mark.
- Do not encode a Tailscale hostname, development hostname, or port in the manifest.
- Do not add a service worker or claim offline support.
- Do not override browser-native `Cmd/Ctrl+B`, `G`, or digit-key behavior in ordinary browser sessions.
- Preserve unrelated scanner/recognition worktree changes.

## Expected Architecture

`ProductNavigation` owns tool metadata. `AppShell` obtains visible modules server-side and guards shell-only Dashboard access by requiring at least one module. Dashboard receives authorized navigation items and renders them as links. A small reusable icon component serves Dashboard, desktop sidebar, and mobile drawer where appropriate. Sidebar collapse state is local client presentation state.

## Testing Expectations

- Update navigation route, filtering, and shell-contract tests.
- Update authorization-foundation expectations for the always-visible Dashboard destination.
- Cover Dashboard cards, Opportunities rehoming, and event-access landing behavior.
- Cover manifest identity/start behavior, approved icon derivatives, and absence of sticky positioning on the outer Event Operations wrapper.
- Cover dynamic-viewport containment, independently scrollable navigation, visible reciprocal controls, standalone shortcut gating, editable-target protection, functional Settings link, shortcut help, viewport-fit metadata, and dark scrollbar/overscroll CSS.
- Cover top-bar, mobile-drawer, shortcut-dialog, and command-palette safe-area classes plus the 64-pixel-plus-inset geometry contract.
- Run focused and full automated tests, TypeScript, lint, and production build.
- Validate expanded/collapsed desktop, mobile drawer, live manifest/head metadata, iPhone installed-WebApp top reachability, and Vendor Workspace scrolling at desktop width.

## Documentation Updates

- Feature Registry, Atlas, Prompt History, release notes, validation, implementation report, conformance review, CTO structure, and conversation history.

## Acceptance Criteria

- Every acceptance criterion in `docs/ux/PHR-UX-027-dashboard-tool-hub.md` passes with evidence.

## Non-Goals

- Custom Dashboard ordering, live operational metrics, or changes to tool business logic.

## Notes For AI Coding Agents

- Preserve unrelated user changes.
- Keep edits scoped to this feature.
- Do not claim independent conformance; record implementation evidence separately from final product acceptance.
