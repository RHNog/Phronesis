# PHR-ARCH-014 Implementation Report

Implemented a separate event-worker authentication boundary: SQLite grants, one-time codes, timed hashed sessions, throttling, audit, revocation, permanent-identity-first authorization, permanent-identity-only administration APIs, Settings management, and mobile worker login.

Temporary grants allow only `VENDOR_WORKSPACE` and `INVENTORY` at `VIEW` or `OPERATE`. They never satisfy identity-required endpoints or create Better Auth users/memberships.

Verification: `docs/testing/PHR-ARCH-014-timed-event-worker-access-validation.md`.

## 2026-08-03 Artwork Review Amendment

Added `ARTWORK_REVIEW` across the typed module domain, SQLite entitlement migration, permanent employee Settings, timed worker Settings, entitlement-filtered navigation, page boundary, API boundary, and UI capability rendering. A worker assigned only `ARTWORK_REVIEW:OPERATE` can review individual candidates and packaging galleries but cannot run `REFRESH` or `ASSIST`, which require `ARTWORK_REVIEW:ADMIN`.

The live migration preserved existing assignments and backfilled one Owner with `ARTWORK_REVIEW:ADMIN`. Permanent employee invitations and timed worker grants include one-click `Artwork Review only` presets. Full 373/373 tests, standalone TypeScript, warning-free lint, production build, diff hygiene, private service health, database audit, and live HTTPS page checks pass. No Funnel, public deployment, commit, or push occurred.

## 2026-08-03 Isolated Public Gateway Amendment

Added an independent loopback Node gateway on configurable port 3101, a durable launchd definition, transport-level owner-path blocking, overwritten public-ingress and forwarded-TLS headers, ordinary request and upgrade proxying, module-derived worker landing, Secure event cookies behind TLS termination, and authorization that evaluates the public marker before `OPTIONAL` compatibility.

The Product Owner explicitly authorized activation while working remotely by phone. The gateway is live through Tailscale Funnel at `https://ramons-macbook-pro.tailaa2d39.ts.net:10000/event-access`; the existing private 9443 Serve mapping is unchanged and remains tailnet-only. Public Settings and permanent authentication return 404, uncredentialed module pages redirect to event login, and only valid timed event sessions can authorize public ingress.

Both services bind only to loopback. Because the remote Mac had no active desktop host and deferred its GUI LaunchAgents, the verified live processes were moved into named detached `screen` sessions; the validated LaunchAgent definitions remain installed for the next normal login. The implementation and activation pass 376/376 tests, standalone TypeScript, warning-free lint, production build, plist validation, public/private HTTP probes, Funnel status inspection, secret-pattern review, and diff hygiene. Disable only the public path with `tailscale funnel --https=10000 off`.

## 2026-08-03 Timed Task Scope Amendment

Added an explicit grant scope discriminator without rebuilding the live grant table. Legacy rows default to `EVENT`; task rows use the backward-compatible empty legacy event storage while application models expose null event identity and treat `scope_type` as authoritative. Repository creation derives scope from entitlements rather than trusting the client: Artwork Review alone becomes `TASK`, while any transactional module becomes `EVENT` and must resolve to an active workspace event.

List, redemption, authorization, status mapping, API validation, Settings, and worker-login copy now understand both scopes. Task authorization rechecks grant/session expiry and revocation but not unrelated events; event authorization retains the active-event check. The live database migration preserved one existing event grant, and a database backup preceded the additive schema change. The rebuilt live runtime passes 378/378 tests and all static/build/runtime gates.
