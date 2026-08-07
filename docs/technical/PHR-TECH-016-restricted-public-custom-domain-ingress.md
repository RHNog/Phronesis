# PHR-TECH-016 — Restricted Public Custom-Domain Ingress

## Feature ID

`PHR-TECH-016`

## Title

Restricted Public Custom-Domain Gateway

## Status

Implemented — External Activation Gated

## Priority

Critical

## Category

Technical / Infrastructure / Security / Authentication / Networking / Deployment

## Objective

Provide a deployment-ready path for trusted account holders to reach Phronesis at `https://access.phronesis.com` without installing Tailscale or seeing a `*.ts.net` hostname, while preserving private owner access and enforcing Phronesis membership/module authorization.

## Background

Tailscale Serve is appropriate for private tailnet access. Tailscale Funnel can expose a service publicly, but official Tailscale documentation limits Funnel hostnames to the tailnet's `*.ts.net` domain. The Product Owner controls `phronesis.com`, so a separately terminated public hostname can provide a clearer user experience.

## Problem Statement

Pointing ordinary DNS directly at a tailnet address does not make the service usable to non-tailnet browsers, and CNAME-ing a custom hostname to Funnel does not provide a valid custom-domain TLS endpoint. Directly exposing the current optional-auth application would also preserve compatibility access, which is unacceptable on a public edge.

## Proposed Solution

Use a dedicated loopback-only restricted-access gateway and route `access.phronesis.com` to it through a custom-domain tunnel such as Cloudflare Tunnel. The gateway validates the expected Host, strips any client-supplied Phronesis ingress markers, adds `x-phronesis-restricted-public: 1`, overwrites forwarded transport headers, blocks owner-only paths, and proxies to the existing loopback Phronesis service. Phronesis treats this marker as strict identity-only ingress: no `DISABLED`/`OPTIONAL` compatibility, no timed worker session, and no anonymous module access.

## Functional Requirements

- Bind the restricted gateway only to `127.0.0.1`.
- Require an explicit expected public hostname in deployment configuration.
- Reject mismatched Host values before proxying.
- Strip and overwrite restricted-public and public-event ingress headers.
- Mark every forwarded request as restricted-public HTTPS traffic.
- Expose a local health endpoint that reveals no secrets.
- Block Settings, all administration APIs, developer routes, provider credential routes, direct employee activation, and timed event-worker login at the gateway.
- Permit sign-up, sign-in, sign-out, account-pending, Better Auth account endpoints, static assets, and module routes.
- Make protected route Proxy checks require a Better Auth session on restricted-public ingress even when the private application remains `OPTIONAL`.
- Make DAL/API authorization accept only an active permanent membership on restricted-public ingress.
- Preserve existing tailnet Serve and event-worker Funnel configuration unchanged.

## Non-Functional Requirements

### Performance

Gateway overhead must remain bounded to header normalization, path policy, Host validation, and streaming proxy behavior.

### Reliability

The gateway and tunnel are separate from existing private Serve and public event-worker services. Failure or shutdown must leave private owner access unchanged.

### Security

- The tunnel points only to the loopback gateway, never directly to the application.
- The gateway fails closed on missing/mismatched deployment hostname.
- Public ingress never honors compatibility mode or timed worker cookies.
- Administration remains transport-blocked and application-authorized as defense in depth.
- No tunnel credential, API token, origin certificate, session secret, or account data is committed.
- Public activation requires explicit Product Owner control of DNS/tunnel credentials and a verified rollback command.

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
- No DNS, tunnel, certificate, or public route is activated without a separate explicit deployment action.

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
- Official Tailscale Funnel and chosen tunnel-provider documentation.

## Future Enhancements

- Cloudflare Access email allowlist or device posture as an outer gate.
- Managed tunnel health alerting.
- Dedicated public application host separate from the development Mac.

## Technical Notes

Recommended route: Cloudflare Tunnel public hostname `access.phronesis.com` -> `http://127.0.0.1:<restricted-gateway-port>` -> existing Phronesis loopback port. Tailscale Funnel is not the custom-domain endpoint because Funnel officially permits only tailnet-domain names. Private Serve remains the owner path.

## UI / UX Notes

Application code and the WebApp manifest must remain hostname-neutral. Share `https://access.phronesis.com` only after tunnel activation, strict end-to-end verification, and explicit `PHRONESIS_RESTRICTED_PUBLIC_MODE=ENABLED`; configuration as a future Better Auth trusted origin alone is not activation evidence.

## Success Metrics

- Trusted people see only the custom hostname.
- Zero restricted-public requests receive compatibility access.
- Private owner access remains available during gateway/tunnel failure.

## Open Questions

- Cloudflare account/DNS onboarding and any Access policy are deployment-time Product Owner actions.

## Traceability

- Originating prompt: Product Owner request, 2026-08-06.
- Related implementation prompt: `docs/prompts/PHR-TECH-016-restricted-public-custom-domain-ingress-prompt.md`.
- Related tests: `docs/testing/PHR-TECH-016-restricted-public-custom-domain-ingress-validation.md`.
- Related runbook: `docs/technical/PHR-TECH-016-restricted-public-custom-domain-runbook.md`.
- Related implementation report: `docs/implementation-reports/PHR-TECH-016-restricted-public-custom-domain-ingress-report.md`.
- Related conformance review: `docs/reviews/PHR-TECH-016-restricted-public-custom-domain-ingress-conformance-review.md`.
- Related release notes: `docs/release-notes/PHR-TECH-016.md`.
- Last modified: 2026-08-06.
- Modification reason: define a custom-domain restricted-public transport without weakening app authorization.
