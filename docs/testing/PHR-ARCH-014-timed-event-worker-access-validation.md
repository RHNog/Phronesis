# PHR-ARCH-014 Validation

Date: 2026-07-31

Coverage: one-time code issuance/redemption, operational module allowlisting, Administration denial, expiry, revocation, event-closure invalidation, attempt throttling, full regression, lint, TypeScript, production build, and responsive review.

Commands: focused Node test, `npm test`, `npm run lint`, `npx tsc --noEmit`, and `npm run build`.

Results: focused lifecycle tests 4/4; full supported suite 294/294; ESLint passed; standalone TypeScript passed; Next.js 16.2.12 production build passed. A 390×844 browser review confirmed 48px code-entry/button targets and no horizontal overflow on login or Settings.

## 2026-08-03 Artwork Review Amendment

Result: Pass — Product Review Ready.

- Full supported suite: 373/373 pass, including artwork-only timed authorization, `ADMIN` denial, employee schema migration, owner/admin backfill, one-destination navigation, page/API/UI tier assertions, and both `Artwork Review only` Settings presets.
- `npx tsc --noEmit --incremental false`: pass.
- `npm run lint`: pass with no warnings.
- `npm run build`: pass on Next.js 16.2.12 with `/artwork-review` dynamic route present.
- `git diff --check`: pass.
- Live `.data/phronesis-auth.sqlite` audit: one Owner has `ARTWORK_REVIEW:ADMIN`; no operator/viewer was implicitly granted the module.
- Private runtime: restart and health status pass; 9443 remains tailnet-only and `/artwork-review` returns HTTPS 200.
- Security boundary: timed workers may receive only `VIEW` or `OPERATE`; manual review mutations require `OPERATE`; refresh and assisted recovery require `ADMIN`; broad `ADMINISTRATION` remains unavailable.
- Private-runtime caveat: the configured owner route remains `PHRONESIS_AUTH_MODE=OPTIONAL`. The separately activated public gateway is nevertheless fail-closed and authorizes only valid timed event sessions; whole-private-app `REQUIRED` rollout remains a separate owner-login change.

## 2026-08-03 Isolated Public Gateway Amendment

Result: Pass — Implemented And Publicly Active.

- Full supported suite: 376/376 pass, including gateway origin validation, loopback proxy behavior, marker overwrite, owner-only path denial, permanent-auth denial, health response, public-ingress fail-closed ordering, Secure-cookie forwarding, and module-correct landing.
- Standalone TypeScript, warning-free lint, Next.js 16.2.12 production build, and `git diff --check`: pass.
- Launch definition: `plutil` reports valid XML; configured `/usr/local/bin/node` is Node 24.18.0 on the target host.
- Security review: no credential material is embedded in the gateway, launch definition, or authorization changes.
- Runtime binding: `lsof` confirms Phronesis on `127.0.0.1:3100` and the gateway on `127.0.0.1:3101`; neither listens on a LAN interface.
- Funnel status: public HTTPS is enabled only on port `10000` to gateway `3101`; private `9443` remains tailnet-only to Phronesis `3100`.
- Public probes: `/event-access` and `/healthz` return 200; `/settings` and `/api/auth/github` return 404; `/artwork-review` without an event cookie redirects to the public event login.
- Private continuity: `https://ramons-macbook-pro.tailaa2d39.ts.net:9443/settings` returns 200 before and after activation.
- Remote resilience: named detached `screen` sessions remain listed for `phronesis-private` and `phronesis-public-gateway`; production LaunchAgent definitions validate and are installed for the next normal login.
- Operational rollback: `tailscale funnel --https=10000 off` removes internet reachability without modifying private Serve.

## 2026-08-03 Timed Task Scope Amendment

Result: Pass — Implemented And Live.

- Focused lifecycle and gateway suites: 11/11 pass.
- Full supported suite: 378/378 pass.
- No-event proof: Artwork Review-only grant creation, one-time redemption, `VIEW`/`OPERATE` authorization, unrelated closed-event immunity, and immediate revocation pass.
- Event-bound proof: Vendor-only and Artwork-plus-Inventory grants fail without an active Event Ledger event; existing event-closure invalidation still passes.
- Migration proof: a legacy table receives `scope_type='EVENT'` additively and preserves its event identity. The live database reports one `EVENT` grant and the required non-null scope column.
- `npx tsc --noEmit --incremental false`, warning-free `npm run lint`, Next.js 16.2.12 production build, and `git diff --check`: pass.
- Live UI/runtime: private Settings contains the no-event task copy; public worker login contains generalized worker copy; private 9443 and public login return 200; public Settings returns 404; uncredentialed Artwork Review redirects; both services bind only to loopback and remain in detached sessions.

## 2026-08-03 Issued-Code Continuity Amendment

Result: Pass — Implemented And Live.

- Focused timed-access, issued-code storage, and copy suites: 16/16 pass.
- Full supported suite: 386/386 pass.
- Rotation proof: an active unused code is replaced with a different valid code, the prior code fails immediately, only the replacement redeems, authorization remains unchanged, and one secret-free audit event is recorded. Post-redemption rotation fails.
- Browser-session proof: an active unexpired code restores only when owner-authorized server truth confirms the same active grant. Expired, redeemed/revoked/missing, malformed, and targeted-cleanup cases are removed correctly.
- UI contract: same-tab continuity, stable history login links, two-step `Replace lost code` confirmation, and the owner-only `PATCH` route are present.
- TypeScript, warning-free lint, Next.js 16.2.12 production build, and `git diff --check`: pass.
- A 390×844 browser review confirms Settings and public login remain free of horizontal overflow. No real credential was created or rotated for visual testing.
- Final live runtime: private Settings and public login return 200; public Settings remains 404; app and gateway remain loopback-only in detached supervisors.
