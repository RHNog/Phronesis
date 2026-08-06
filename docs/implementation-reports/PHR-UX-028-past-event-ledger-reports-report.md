# PHR-UX-028 — Past Event Ledger Reports Implementation Report

Implemented a visible closed-event archive directly inside `/event-ledger`. The existing active/latest Event Ledger behavior remains the default, while `Past event reports` exposes a bounded newest-first list with local name, location, and date search. Each card previews gross sales, purchase spend, and closing variance before selection.

`PurchaseLedgerRepository` remains the sole report authority. It now lists up to 100 workspace-scoped closed-event summaries and reopens one exact closed event by workspace and event ID. The authorized GET Route Handler returns that index and accepts an optional untrusted `eventId`; missing, active, unknown, and cross-workspace identities fail with the same generic report-not-found boundary.

The selected report reuses the canonical Event Ledger cash summary, preserved close reconciliation, Event Stock evidence, sold/leftover report links when a manifest exists, and immutable activity. Historical selection is explicitly labelled read-only, hides every write/start control, and provides `Back to current event`. Next navigation stores selection in the URL and preserves browser Back/Forward behavior.

The private production runtime was rebuilt and restarted in the existing detached `phronesis-scanner-review` session. Live data showed the active Battlezone Card Show plus one prior Battlezone report; archive search, exact selection, report deep link, read-only controls, current-event return, and Back restoration all passed without modifying ledger evidence.

Validation passed: focused Event Cash Ledger tests, full 438/438 suite, TypeScript, warning-free lint, Next.js 16.2.12 production build, 1440×900 and 390×844 no-overflow checks, 44-pixel archive controls, direct-link/history verification, live private HTTP 200, and zero browser console errors.
