# PHR-UX-027 — Dashboard Tool Hub Design Direction

## Experience Goal

The first authenticated view should feel like the front door to Phronesis: calm, legible, and immediately actionable. It should explain the available product surface without turning the Dashboard into a second analytics workspace.

## Information Hierarchy

1. Phronesis Dashboard identity and a short orientation statement.
2. Authorized-tool count and an explicit statement that access is role-aware.
3. A responsive grid of tool cards.
4. Persistent primary navigation: collapsible rail on desktop, existing drawer on mobile.

## Tool Cards

- The complete card is a link.
- Each card presents icon, product area, tool label, concise purpose, and directional affordance.
- Cards come from authorized primary navigation metadata; do not create a separate manual Dashboard inventory.
- Cards contain no invented freshness, health, count, or business metrics.
- Hover and focus may elevate border and icon treatment but must not move surrounding content.

## Sidebar

- Reuse the approved Phronesis application icon exactly; do not synthesize a lettermark.
- Expanded width stays near the existing 260-pixel footprint.
- Collapsed width becomes an approximately 80-pixel icon rail.
- Keep the Phronesis mark visible in both states.
- In collapsed state, labels become visually hidden but remain available to assistive technology and browser tooltips.
- Put the collapse control in the sidebar header with explicit expand/collapse labelling.
- Persist only the UI preference; authorization remains server-owned.

## Responsive Behavior

- Phone: existing topbar button and modal drawer; one-column tool cards.
- Phone drawer identity uses the same approved application mark as desktop, favicon, and iOS home-screen metadata.
- Tablet: two-column tool cards.
- Desktop: collapsible sidebar and two-to-three-column tool cards depending on content width.

## Installed Web App

- Installation metadata is same-origin and environment-neutral: `start_url` and `scope` are `/`.
- Standalone launch does not imply offline capability; the authenticated Phronesis runtime must remain reachable.
- Manifest icons are mechanical 192- and 512-pixel derivatives of the approved application artwork. The browser favicon and Apple touch icon remain the approved assets.
- A previously installed Safari web app retains its locally captured origin and icon cache. When that origin is retired, remove and reinstall the local web app from the current canonical tailnet URL.

## Vendor Workspace Containment

- Event Operations is a normal-flow sibling of catalogue and evidence content.
- It must not remain pinned while later full-width Buying Decision or certificate controls scroll beneath it.
- Internal cart affordances may remain sticky only within the bounds of the Event Operations card.

## Accessibility Gate

- Visible focus on all cards, navigation links, and sidebar controls.
- Minimum 44-pixel interactive targets.
- `aria-current="page"` on active destinations.
- Collapse button reports state with `aria-expanded`.
- No information communicated by icon or color alone.

## Conformance Boundary

This feature changes application entry and navigation presentation. It does not change tool-level authorization, business workflows, or operational data.
