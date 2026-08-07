# PHR-TECH-016 Restricted Public Access Runbook

## Live no-client topology

`https://ramons-mac-studio.tailaa2d39.ts.net:10000` → Tailscale Funnel TLS termination → raw HTTP at `127.0.0.1:3101` dual-policy gateway → `127.0.0.1:3200` Phronesis.

The visitor does not install Tailscale or join the tailnet. Tailscale runs only on the host as the public relay transport. Private owner access remains at tailnet-only port `9444`. The same public port retains `/event-access` for account-free event workers.

## Current state

- `PHRONESIS_RESTRICTED_PUBLIC_ORIGIN=https://ramons-mac-studio.tailaa2d39.ts.net:10000` and `PHRONESIS_RESTRICTED_PUBLIC_MODE=ENABLED` are active in the ignored local environment.
- Settings → People & access advertises `https://ramons-mac-studio.tailaa2d39.ts.net:10000/sign-up`.
- The public gateway validates `ramons-mac-studio.tailaa2d39.ts.net`, strips both trust markers, sets exactly one marker, and sends permanent-account and event-worker requests to the same current build.
- The application runs in detached `screen` session `phronesis-scanner-review`; the public gateway runs in `phronesis-public-gateway`. Their listeners remain loopback-only on `3200` and `3101`.
- Funnel is persisted by Tailscale in background TLS-terminated TCP mode on port `10000`. On this host, Tailscale's HTTPS reverse-proxy mode produced `Broken pipe`/closed connections from independent public probes and must not be substituted without fresh regional validation.
- The previous public-gateway LaunchAgent is booted out for this login session because it targets the legacy checkout/build. Reboot/login persistence of the external-volume application remains gated on a supervised internal-volume or privacy-authorized deployment.
- GoDaddy and Cloudflare were signed out in every available browser. `access.phronesis.com` remains unresolved and no DNS, Cloudflare account, nameserver, certificate, or custom-domain route was changed.

## Live start and health commands

Start the current public gateway from the active release checkout:

```sh
PHRONESIS_PUBLIC_GATEWAY_PORT=3101 \
PHRONESIS_PUBLIC_GATEWAY_TARGET_PORT=3200 \
PHRONESIS_RESTRICTED_PUBLIC_HOSTNAME=ramons-mac-studio.tailaa2d39.ts.net \
node scripts/public-event-gateway.mjs
```

Persist the already-authorized Funnel mode:

```sh
tailscale funnel --bg --tls-terminated-tcp=10000 --yes tcp://127.0.0.1:3101
```

Expected checks:

- `GET /healthz` on loopback `3101` returns `200` and `restrictedAccounts: true`.
- Public `/sign-up` and `/sign-in` return `200`.
- Public `/settings`, `/api/administration/*`, `/dev/*`, and `/activate` return `404`.
- Public `/event-access` returns `200`; anonymous `/` redirects there.
- A Better Auth session request uses restricted-public policy; a stale or forged cookie cannot authorize anything.
- A new real account reaches `/access-pending` and has zero modules until private owner approval.
- Private tailnet `9444`, Scanner-to-Offer, and Event Ledger remain healthy.

## Live rollback while preserving event workers

1. Set `PHRONESIS_RESTRICTED_PUBLIC_MODE=DISABLED` and restore the private invite origin.
2. Restart Phronesis on loopback `3200`.
3. Restart `scripts/public-event-gateway.mjs` without `PHRONESIS_RESTRICTED_PUBLIC_HOSTNAME`; this restores legacy event-only policy on the same loopback port.
4. Leave Funnel `:10000` enabled so `/event-access` continues to work.
5. Confirm private tailnet `9444`, public `/event-access`, and database integrity.

To disable the whole public transport, including event workers, use only this exact command:

```sh
tailscale funnel --tls-terminated-tcp=10000 off
```

Do not use `tailscale funnel reset`; other Serve/Funnel configuration belongs to unrelated services.

## Future branded topology

`https://access.phronesis.com` → Cloudflare Tunnel → `http://127.0.0.1:3102` dedicated restricted gateway → `http://127.0.0.1:3200` Phronesis.

## Required owner-controlled activation

1. Confirm that `phronesis.com` DNS is managed by, or can delegate the chosen hostname to, Cloudflare.
2. Create a named Cloudflare Tunnel and keep its token outside the repository.
3. Create the public hostname `access.phronesis.com` with origin service `http://127.0.0.1:3102`. Configure the tunnel origin HTTP Host Header as `access.phronesis.com` so the gateway can validate it explicitly.
4. Prefer an outer Cloudflare Access email allowlist for the initial trusted pilot. This is defense in depth; Phronesis sessions, memberships, and module entitlements remain authoritative.
5. Start the gateway with:

   ```sh
   PHRONESIS_RESTRICTED_PUBLIC_HOSTNAME=access.phronesis.com \
   PHRONESIS_RESTRICTED_GATEWAY_PORT=3102 \
   PHRONESIS_RESTRICTED_GATEWAY_TARGET_PORT=3200 \
   npm run access:gateway
   ```

6. Start `cloudflared` with the provider-issued tunnel credential and route only to `127.0.0.1:3102`.
7. Complete every custom-domain activation check below, then replace the restricted-public origin with `https://access.phronesis.com` and restart Phronesis so owner Sign Up invitations advertise only the verified branded origin.
8. Install unattended services only after the foreground checks below pass. Service definitions must reference credentials by protected file or environment, never inline in the repository.

## Custom-domain activation checks

- `GET /healthz` on loopback gateway returns `200`.
- A request with any Host other than `access.phronesis.com` returns `404`.
- `/sign-up` and `/sign-in` return `200` through the public hostname.
- `/` without a permanent session redirects to `/sign-in`.
- `/settings`, `/api/administration/*`, `/dev/*`, `/activate`, and `/event-access` return `404`.
- A timed-worker cookie cannot authorize the custom hostname.
- A new account reaches `/access-pending` and has zero modules.
- After owner approval, the account sees exactly its assigned modules.
- Private tailnet Settings and the existing event-worker URL remain unchanged.

## Custom-domain rollback

1. Disable or delete only the `access.phronesis.com` public-hostname route in Cloudflare.
2. Stop the restricted gateway and tunnel processes.
3. Restore the verified Funnel origin and keep `PHRONESIS_RESTRICTED_PUBLIC_MODE=ENABLED`; disable the mode only if both public transports are intentionally unavailable.
4. Confirm that loopback `3200`, private tailnet `9444`, and the separate event-worker gateway retain their prior health.
5. Leave account, membership, entitlement, and audit records intact unless a separately approved data action is required.

## Secret boundary

Never commit Cloudflare API tokens, tunnel tokens, origin certificates, Better Auth secrets, passwords, session cookies, activation codes, or Access identity assertions. The ignored `.env.local` is runtime-only configuration and must not be copied into documentation or commits. Obscure hostnames and cookie names are not authorization controls.
