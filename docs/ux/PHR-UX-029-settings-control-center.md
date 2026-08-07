# PHR-UX-029 — Settings Control Center

## Feature ID

`PHR-UX-029`

## Title

Settings Control Center

## Status

Implemented — Privately Live; Product Review Ready

## Priority

High

## Category

UX / UI / Settings / Navigation / Accessibility / Responsive Design

## Objective

Replace the single endless Settings document with a responsive control center that makes every settings panel reachable in one deliberate navigation action while preserving all existing controls and authorization boundaries.

## Background

Settings currently renders business profiles, regional economics, provider connections, people/module access, and temporary worker access in one vertical stack. Reaching later panels requires substantial scrolling, and the page does not communicate its information architecture.

## Problem Statement

Operators cannot scan Settings, bookmark a specific panel, or move between unrelated administrative tasks efficiently. Long interactive panels compete for attention and create a poor phone and installed-WebApp experience.

## Proposed Solution

Introduce a Settings workspace with an Overview and five named panels: Business profiles, Regional economics, Provider connections, People & access, and Temporary access. Desktop uses a sticky left navigation rail plus one focused content surface. Phone uses a compact section selector and an overview card grid. Only the selected panel occupies layout space, while mounted panel state is preserved during same-page switching. A validated `panel` query parameter provides direct links and browser-history restoration.

## Functional Requirements

- Show a concise Settings header and overview that explains the available administrative areas.
- Reach any panel from the Settings navigation without scrolling through preceding panels.
- Preserve the existing panel components, APIs, server-side secrets boundary, and `ADMINISTRATION` authorization requirement.
- Represent the selected panel in `?panel=` using stable values: `overview`, `business`, `regional`, `providers`, `people`, and `temporary`.
- Normalize unknown or missing panel values to `overview` without throwing.
- Update browser history when the operator switches panels and restore the panel on Back/Forward.
- Keep already mounted panel state intact while changing sections so unfinished edits are not silently discarded.
- Give each navigation item a title, short purpose, visual icon, current state, and accessible relationship to its panel.
- On the overview, provide one large, touch-safe card per working panel.

## Non-Functional Requirements

### Performance

Panel switching is immediate and does not require a server round trip. Existing data-fetch behavior remains bounded to the settings session.

### Maintainability

Panel metadata is centralized in one typed configuration so labels, descriptions, URL values, desktop navigation, mobile selector, and overview cards cannot drift.

### Reliability

Unknown URLs fall back safely. Browser history and reload preserve the selected valid panel.

### Accessibility

Navigation has explicit labels and current state, controls are keyboard operable, panel headings receive focus after selection, hidden panels are removed from the accessibility tree, and touch targets are at least 44 pixels.

### Security

The redesign changes presentation only. It does not broaden module access, expose secrets, or move protected mutations to the client.

### Responsiveness

At 390 pixels the page has no horizontal overflow, the selector/cards are reachable with one hand, and content remains single-column. Desktop uses a bounded sticky rail and wide content area.

## User Stories

- As an owner, I want to jump directly to people access or provider connections so I do not scroll through unrelated financial settings.
- As a phone operator, I want a compact section selector so Settings behaves like an application control center.
- As an administrator sharing an internal link, I want the URL to reopen the exact panel.

## Acceptance Criteria

- No settings panel requires scrolling past another settings panel to reach it.
- All five existing panels remain functionally present and authorized exactly as before.
- Overview cards, desktop rail, and phone selector choose the same centralized panel identity.
- Direct valid panel URLs and Back/Forward navigation restore the correct panel; invalid values show Overview.
- Unfinished client-side state survives switching away and back during the same Settings session.
- Desktop and 390-pixel installed-WebApp review pass with no horizontal overflow, no console errors, and at least 44-pixel controls.

## Edge Cases

- A bookmarked panel is no longer recognized: Overview opens.
- A selected panel is very tall: only that panel scrolls in the normal application document; navigation remains readily available on desktop.
- Authentication readiness is disabled: existing panel-level warning states remain unchanged.
- Browser scripting is delayed: server-rendered Overview remains a coherent entry surface before hydration.

## Dependencies

- `PHR-UX-012` Provider Connections Settings.
- `PHR-ARCH-012` Employee Activation And Module Access.
- `PHR-ARCH-014` Timed Event Worker Access.
- `PHR-UX-027` installed-WebApp shared shell.

## Future Enhancements

- Panel-specific unsaved-change indicators and cross-panel search.
- Role-filtered settings navigation for non-owner administration roles.

## Technical Notes

Keep `app/settings/page.tsx` as a Server Component responsible for runtime status and initial query validation. Place interactive selection/history behavior in a focused Client Component. Preserve panel component instances with the HTML `hidden` attribute rather than unmounting them during same-page switching.

## UI / UX Notes

- Use a dark elevated shell with cyan active state and restrained violet secondary accents.
- Desktop navigation stays within the dynamic viewport below the shared top bar.
- Overview cards prioritize title and outcome rather than implementation language.
- Do not use accordions that recreate a long document or a modal for core settings.

## Success Metrics

- Any settings panel is reachable from `/settings` in one click/tap.
- Switching between panels causes zero vertical search through unrelated content.
- Direct panel links survive reload and browser history.

## Open Questions

- None blocking.

## Traceability

- Originating request: Product Owner Settings redesign request, 2026-08-06.
- Related implementation prompt: `docs/prompts/PHR-UX-029-settings-control-center-prompt.md`.
- Related tests: `tests/settings-control-center.test.ts`.
- Related release notes: `docs/release-notes/PHR-UX-029.md`.
- Last modified: 2026-08-06.
- Modification reason: Implementation, responsive validation, and private deployment completed.
