# PHR-TECH-016 Validation

Date: 2026-08-07

Result: Pass — no-client Funnel account access live; branded custom-domain activation remains gated.

- Synthetic gateway tests pass for clean HTTPS origin validation, loopback binding, explicit hostname enforcement, Host mismatch denial, marker overwrite, forwarded HTTPS normalization, health, normal sign-up proxying, and owner-path blocking.
- Restricted-public application authorization is evaluated before public-event and optional-compatibility paths.
- Next Proxy requires a Better Auth session on restricted ingress even while the private application remains `OPTIONAL`.
- `/settings`, `/api/administration/*`, `/dev/*`, employee activation, and timed-worker login are transport-blocked.
- An actual Next.js validation target behind the gateway returned `/sign-up` `200`, `/settings` `404`, `/event-access` `404`, and redirected unauthenticated `/` to `/sign-in?callbackUrl=%2F` without exposing a loopback hostname.
- Dual-surface gateway tests prove expected-host validation, spoofed-marker removal, exact marker selection, all supported Better Auth session-cookie names, permanent-account entry routing, explicit event-worker precedence, complete administration blocking, and legacy event-only compatibility.
- Focused gateway/authorization coverage passes 18/18. The full supported suite passes 458/458; standalone TypeScript, warning-free lint, and Next.js 16.2.12 production build pass.
- An isolated production Next process and temporary migrated database proved registration `200`, secure Better Auth cookie issuance, authenticated pending-room `200`, pending-account root redirect to `/access-pending`, Settings `404`, and event-worker login `200`. The isolated database and credential were removed afterward.
- The live origin probe traversed the public gateway and returned `PASSWORD_TOO_SHORT` rather than `INVALID_ORIGIN`; no probe account was created and live SQLite integrity remained `ok`.
- The owner invite card on private `9444` contains exactly `https://ramons-mac-studio.tailaa2d39.ts.net:10000/sign-up`.
- Tailscale HTTPS reverse-proxy mode was rejected after direct public-relay and distributed probes returned TLS close/`Broken pipe` failures. TLS-terminated TCP mode on the same port and gateway then returned Sign Up `200` from three independent regions.
- Final forced-public-relay checks after the production rebuild returned `/sign-up` `200`, `/event-access` `200`, and `/settings` `404`; local/tailnet Sign Up, Scanner-to-Offer, and Event Ledger returned `200`.
- Cloudflare and GoDaddy sessions were unavailable. Read-only DNS still shows GoDaddy nameservers and no `access.phronesis.com` record, so the branded hostname remains correctly unadvertised.
- The live app and gateway are supervised by detached `screen` sessions for the active login. Reboot/login persistence remains a disclosed infrastructure gate.
