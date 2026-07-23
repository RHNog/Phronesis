# PHR-UX-006 Release Notes

## Lifecycle-Based Application Structure

Phronesis now presents a compact operational navigation organized around the user lifecycle:

- Opportunities for discovery.
- Vendor Workspace for buying decisions.
- Market Watch for monitoring.
- Settings for business policy and administration.

Purchase Evaluation and opportunity details remain available as contextual routes. Placeholder Cards, Alerts, and Analytics links were removed, and future Manage capabilities remain outside production navigation until separately approved.

Navigation metadata and active-route ownership now have one typed source of truth. Operational links use Next.js client-side navigation, and existing routes and workflow behavior are preserved.

## Verification

Focused navigation tests, lint, TypeScript validation, production build, and diff checks passed on 2026-07-22.
