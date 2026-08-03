# PHR-ARCH-014 Implementation Report

Implemented a separate event-worker authentication boundary: SQLite grants, one-time codes, timed hashed sessions, throttling, audit, revocation, permanent-identity-first authorization, permanent-identity-only administration APIs, Settings management, and mobile worker login.

Temporary grants allow only `VENDOR_WORKSPACE` and `INVENTORY` at `VIEW` or `OPERATE`. They never satisfy identity-required endpoints or create Better Auth users/memberships.

Verification: `docs/testing/PHR-ARCH-014-timed-event-worker-access-validation.md`.

## 2026-08-03 Artwork Review Amendment

Added `ARTWORK_REVIEW` across the typed module domain, SQLite entitlement migration, permanent employee Settings, timed worker Settings, entitlement-filtered navigation, page boundary, API boundary, and UI capability rendering. A worker assigned only `ARTWORK_REVIEW:OPERATE` can review individual candidates and packaging galleries but cannot run `REFRESH` or `ASSIST`, which require `ARTWORK_REVIEW:ADMIN`.

The live migration preserved existing assignments and backfilled one Owner with `ARTWORK_REVIEW:ADMIN`. Permanent employee invitations and timed worker grants include one-click `Artwork Review only` presets. Full 373/373 tests, standalone TypeScript, warning-free lint, production build, diff hygiene, private service health, database audit, and live HTTPS page checks pass. No Funnel, public deployment, commit, or push occurred.

## 2026-08-03 Isolated Public Gateway Amendment

Added an independent loopback Node gateway on configurable port 3101, a durable launchd definition, transport-level owner-path blocking, overwritten public-ingress and forwarded-TLS headers, ordinary request and upgrade proxying, module-derived worker landing, Secure event cookies behind TLS termination, and authorization that evaluates the public marker before `OPTIONAL` compatibility.

The existing private 9443 Serve mapping is unchanged. The gateway implementation and static launch definition pass 376/376 tests, standalone TypeScript, warning-free lint, production build, plist validation, secret-pattern review, and diff hygiene. No Tailscale Funnel was activated; internet exposure remains a separate Product Owner action.
