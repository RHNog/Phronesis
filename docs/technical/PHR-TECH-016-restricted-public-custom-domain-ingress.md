# PHR-TECH-016 — Restricted Public Account Ingress

## Feature ID

`PHR-TECH-016`

## Title

Restricted Public Account Gateway

## Status

Completed — No-Client Public Funnel Live; Custom Domain Pending

## Priority

Critical

## Category

Technical / Infrastructure / Security / Authentication / Networking / Deployment

## Objective

Let trusted account holders create accounts and use their assigned Phronesis modules from an ordinary browser without installing Tailscale. Activate the existing public Funnel as the immediate no-client transport without weakening the event-worker boundary, then retain `https://access.phronesis.com` as the branded transport once owner-controlled DNS and tunnel sessions are available.

## Background

Tailscale Serve is appropriate for private tailnet access. Tailscale Funnel can expose a service publicly, but official Tailscale documentation limits Funnel hostnames to the tailnet's `*.ts.net` domain. The Product Owner controls `phronesis.com`, so a separately terminated public hostname can provide a clearer user experience.

## Problem Statement

Pointing ordinary DNS directly at a tailnet address does not make the service usable to non-tailnet browsers, and CNAME-ing a custom hostname to Funnel does not provide a valid custom-domain TLS endpoint. Directly exposing the current optional-auth application would also preserve compatibility access, which is unacceptable on a public edge.

## Proposed Solution

Use two deployment phases with one authorization contract:

1. The already-public Tailscale Funnel on port `10000` becomes the immediate no-client pilot transport. Its loopback gateway classifies only explicit permanent-account entry paths or requests carrying a Better Auth session cookie as restricted-public. Event-worker entry paths and event-only requests retain the public-event marker. The gateway strips client-supplied trust markers, applies the path policy for the selected surface, and proxies both surfaces to the same current Phronesis build. Cookie presence selects the strict policy but never grants authority; Phronesis still validates the signed Better Auth session, active membership, and exact module entitlement.
2. The existing dedicated loopback restricted-access gateway remains the preferred branded deployment. A future Cloudflare Tunnel routes only `access.phronesis.com` to it after provider authentication and DNS validation.

Phronesis treats restricted-public traffic as strict identity-only ingress: no `DISABLED`/`OPTIONAL` compatibility, no timed worker authorization, and no anonymous module access.

## Functional Requirements

- Bind the restricted gateway only to `127.0.0.1`.
- Require an explicit expected public hostname in deployment configuration.
- Reject mismatched Host values before proxying.
- Strip and overwrite restricted-public and public-event ingress headers.
- Mark every forwarded request as restricted-public HTTPS traffic.
- Expose a local health endpoint that reveals no secrets.
- Under restricted-account policy, block Settings, all administration APIs, developer routes, provider credential routes, direct employee activation, and timed event-worker login at the gateway.
- Permit sign-up, sign-in, sign-out, account-pending, Better Auth account endpoints, static assets, and module routes.
- When the shared Funnel pilot is explicitly configured, validate the expected Funnel hostname before selecting restricted-public behavior.
- Route `/sign-up`, `/sign-in`, `/access-pending`, `/access-denied`, and non-worker Better Auth endpoints through restricted-public policy even before a permanent session exists.
- Route `/event-access` and `/api/auth/event-access` through public-event policy even when another cookie is present.
- Route protected application and API requests carrying a Better Auth session cookie through restricted-public policy; a forged or stale cookie must still fail application authentication.
- Strip both Phronesis ingress markers before setting exactly one trusted marker on every proxied request.
- Preserve the existing public event-worker URL, login, event cookie, and exact Event Ledger authorization behavior while both public surfaces use the current application build.
- Make protected route Proxy checks require a Better Auth session on restricted-public ingress even when the private application remains `OPTIONAL`.
- Make DAL/API authorization accept only an active permanent membership on restricted-public ingress.
- Preserve existing tailnet Serve routes and the public Funnel hostname/port. Do not expose any additional occupied Serve port.

## Non-Functional Requirements

### Performance

Gateway overhead must remain bounded to header normalization, path policy, Host validation, and streaming proxy behavior.

### Reliability

The pilot shares one public transport process with event-worker access but keeps authorization markers, cookies, path policy, and application authorization distinct. Gateway or Funnel failure may affect both public surfaces, but must leave private owner access unchanged. The future branded tunnel remains independently deployable.

### Security

- The tunnel points only to the loopback gateway, never directly to the application.
- The gateway fails closed on missing/mismatched deployment hostname.
- Restricted-account ingress never honors compatibility mode or timed-worker cookies.
- Better Auth cookie detection is routing only; possession of a cookie name or forged value never authorizes a request.
- Administration remains transport-blocked and application-authorized as defense in depth.
- No tunnel credential, API token, origin certificate, session secret, or account data is committed.
- Further custom-domain activation requires Product Owner control of DNS/tunnel credentials and a verified rollback command.

### Extensibility

Cloudflare Access may later provide an additional outer allowlist or device posture check, but it never replaces Phronesis membership/module authorization.

## User Stories

- As a trusted collaborator, I want a normal Phronesis URL that opens in a browser without Tailscale.
- As the owner, I want public transport to remain strictly authenticated even while private compatibility mode is retained.
- As the owner, I want Settings and administration unavailable through the public hostname.

## Acceptance Criteria

- Synthetic gateway tests prove Host validation, marker overwrite, HTTPS forwarding, health, owner-path blocking, and normal-route proxying.
- Restricted-public authorization tests prove compatibility and event-worker fallbacks cannot authorize a protected module.
- The existing private review and public event-worker gateway tests remain green.
- A deployment runbook documents `access.phronesis.com`, tunnel/DNS prerequisites, health checks, rollback, and secret boundaries.
- The existing Funnel on port `10000` serves Sign Up and permanent-account access without requiring a visitor-side Tailscale installation, while event-worker access remains functional.
- The live Funnel uses TLS-terminated TCP forwarding to the loopback HTTP gateway because regional validation rejected the host's Tailscale HTTPS reverse-proxy mode with connection-level failures.
- No custom DNS, certificate, or custom-domain route is activated without an authenticated owner-controlled provider action.

## Edge Cases

- A client-supplied Phronesis ingress header is overwritten and cannot gain authority.
- A public request with a valid event-worker cookie remains denied by the restricted gateway.
- A permanent user with no membership is routed to pending access.
- A permanent user assigned Administration still cannot reach Settings through the public gateway.
- Tunnel loss leaves loopback and private tailnet paths operational.

## Dependencies

- `PHR-ARCH-016` trusted account registration.
- `PHR-ARCH-011` server authorization.
- A DNS/tunnel provider under Product Owner control.
- The already-enabled Tailscale Funnel for immediate no-client access.
- Official Tailscale Funnel and chosen tunnel-provider documentation.

## Future Enhancements

- Cloudflare Access email allowlist or device posture as an outer gate.
- Managed tunnel health alerting.
- Dedicated public application host separate from the development Mac.

## Technical Notes

Current route: Tailscale Funnel `:10000` in TLS-terminated TCP mode -> `127.0.0.1:3101` dual-policy gateway -> `127.0.0.1:3200` current Phronesis build. Recommended branded route: Cloudflare Tunnel public hostname `access.phronesis.com` -> `http://127.0.0.1:<restricted-gateway-port>` -> the same Phronesis loopback service. Funnel is not the custom-domain endpoint because Funnel officially permits only tailnet-domain names. Private Serve remains the owner path.

## UI / UX Notes

Application code and the WebApp manifest remain hostname-neutral. The verified live invitation is `https://ramons-mac-studio.tailaa2d39.ts.net:10000/sign-up`; visitors do not install or join Tailscale. Share `https://access.phronesis.com` only after its separate tunnel activation and strict end-to-end verification; configuration as a future Better Auth trusted origin alone is not activation evidence.

## Success Metrics

- Trusted people can register and use assigned modules from a browser with no Tailscale client.
- Zero restricted-public requests receive compatibility access.
- Existing event-worker access remains functional on the same public Funnel URL.
- Private owner access remains available during gateway/tunnel failure.

## Open Questions

- Cloudflare and GoDaddy sessions are not available in the current browsers. Branded-domain activation remains blocked on owner-controlled provider authentication, but no-client access does not wait on it.

## Traceability

- Originating prompt: Product Owner request, 2026-08-06.
- Related implementation prompt: `docs/prompts/PHR-TECH-016-restricted-public-custom-domain-ingress-prompt.md`.
- Related tests: `docs/testing/PHR-TECH-016-restricted-public-custom-domain-ingress-validation.md`.
- Related runbook: `docs/technical/PHR-TECH-016-restricted-public-custom-domain-runbook.md`.
- Related implementation report: `docs/implementation-reports/PHR-TECH-016-restricted-public-custom-domain-ingress-report.md`.
- Related conformance review: `docs/reviews/PHR-TECH-016-restricted-public-custom-domain-ingress-conformance-review.md`.
- Related release notes: `docs/release-notes/PHR-TECH-016.md`.
- Last modified: 2026-08-07.
- Modification reason: authorize immediate no-client account access over the existing public Funnel while preserving the dedicated branded-domain design and both authorization boundaries.
