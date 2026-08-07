# PHR-TECH-016 Restricted Public Custom-Domain Runbook

## Intended topology

`https://access.phronesis.com` → Cloudflare Tunnel → `http://127.0.0.1:3102` restricted gateway → `http://127.0.0.1:3200` Phronesis.

Tailscale Serve remains the private owner transport. Tailscale Funnel is not used for this hostname because Funnel issues and serves only tailnet `*.ts.net` names.

## Current state

- The restricted gateway and application enforcement are implemented and tested.
- `PHRONESIS_RESTRICTED_PUBLIC_ORIGIN=https://access.phronesis.com` is configured locally as a Better Auth trusted origin.
- `PHRONESIS_RESTRICTED_PUBLIC_MODE` remains `DISABLED`, so owner Sign Up invites use the working private application origin until the public route passes activation.
- No Cloudflare account, tunnel, DNS route, Access policy, tunnel token, public process, or LaunchAgent was created by this implementation.
- The private scanner-review application remains on loopback port `3200` and tailnet port `9444`.

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
7. Complete every activation check below, then set `PHRONESIS_RESTRICTED_PUBLIC_MODE=ENABLED` and restart Phronesis so owner Sign Up invitations may advertise the verified public origin.
8. Install unattended services only after the foreground checks below pass. Service definitions must reference credentials by protected file or environment, never inline in the repository.

## Activation checks

- `GET /healthz` on loopback gateway returns `200`.
- A request with any Host other than `access.phronesis.com` returns `404`.
- `/sign-up` and `/sign-in` return `200` through the public hostname.
- `/` without a permanent session redirects to `/sign-in`.
- `/settings`, `/api/administration/*`, `/dev/*`, `/activate`, and `/event-access` return `404`.
- A timed-worker cookie cannot authorize the custom hostname.
- A new account reaches `/access-pending` and has zero modules.
- After owner approval, the account sees exactly its assigned modules.
- Private tailnet Settings and the existing event-worker URL remain unchanged.

## Rollback

1. Disable or delete only the `access.phronesis.com` public-hostname route in Cloudflare.
2. Stop the restricted gateway and tunnel processes.
3. Set `PHRONESIS_RESTRICTED_PUBLIC_MODE=DISABLED` and restart Phronesis so new invitations immediately return to the private origin.
4. Confirm that loopback `3200`, private tailnet `9444`, and the separate event-worker gateway retain their prior health.
5. Leave account, membership, entitlement, and audit records intact unless a separately approved data action is required.

## Secret boundary

Never commit Cloudflare API tokens, tunnel tokens, origin certificates, Better Auth secrets, passwords, session cookies, activation codes, or Access identity assertions. Obscure hostnames are not authorization controls.
