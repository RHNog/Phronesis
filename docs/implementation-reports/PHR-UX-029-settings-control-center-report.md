# PHR-UX-029 — Settings Control Center Implementation Report

Date: 2026-08-06

Phronesis Settings is now an application control center instead of one endless document. `/settings` opens a concise Overview, and Business profiles, Regional economics, Provider connections, People & access, and Temporary access are each reachable in one action.

One typed metadata registry owns panel IDs, labels, descriptions, categories, and visual identity. The protected Server Component normalizes the initial `panel` query; a focused Client Component owns immediate switching, native history integration, heading focus, desktop navigation, the phone selector, and overview cards.

Existing settings components remain mounted while hidden, so an unfinished client-side edit survives moving to another panel and back. Hidden panels occupy no layout space and leave the accessibility tree. All prior APIs, runtime status props, provider-secret boundaries, and `ADMINISTRATION` authorization remain unchanged.

Desktop uses a bounded sticky navigation rail with one focused work surface. At phone width the rail becomes a 44-pixel section selector and overview cards become a single column. Valid panel URLs survive reload and Back/Forward; unknown values safely resolve to Overview.

The rebuilt private production service is live. Automated, TypeScript, lint, build, desktop, phone, URL/history, state-preservation, and browser-console gates pass as recorded in `docs/testing/PHR-UX-029-settings-control-center-validation.md`.
