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
- Activation caveat: the configured runtime remains `PHRONESIS_AUTH_MODE=OPTIONAL`. Strict task isolation requires a separately approved promotion to `REQUIRED` after owner login verification.

## 2026-08-03 Isolated Public Gateway Amendment

Result: Pass — Implementation Ready; Public Activation Gated.

- Full supported suite: 376/376 pass, including gateway origin validation, loopback proxy behavior, marker overwrite, owner-only path denial, permanent-auth denial, health response, public-ingress fail-closed ordering, Secure-cookie forwarding, and module-correct landing.
- Standalone TypeScript, warning-free lint, Next.js 16.2.12 production build, and `git diff --check`: pass.
- Launch definition: `plutil` reports valid XML; configured `/usr/local/bin/node` is Node 24.18.0 on the target host.
- Security review: no credential material is embedded in the gateway, launch definition, or authorization changes.
- Operational boundary: public port 10000 was not activated and private 9443 was not modified.
