# PHR-UX-014 — Responsive Application Navigation

## 2026-07-31 — Product Review Ready

- Phronesis now exposes its complete authorized primary navigation from every phone-width application header.
- The mobile drawer uses the same server-filtered destination list as the desktop sidebar, including Opportunities, Vendor Workspace, Event Ledger, Market Watch, Inventory, and Settings when authorized.
- Current-route state, keyboard focus containment, Escape/backdrop/close behavior, body-scroll restoration, and automatic desktop-breakpoint recovery are included.
- Menu, Search, User, and drawer controls meet the 44px phone target; all destination rows measure 52px and the 390px shell has no horizontal overflow.
- All six live navigation paths, 278/278 tests, TypeScript, lint, production build, private-service health, and zero-console-error review pass.
