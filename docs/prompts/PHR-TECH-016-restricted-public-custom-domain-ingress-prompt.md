# PHR-TECH-016 Engineer Work Order

## Project Context

Phronesis has private tailnet review and a separate event-worker Funnel gateway. This feature adds a distinct restricted-public permanent-account gateway and custom-domain deployment path.

## Feature ID

`PHR-TECH-016`

## Objective

Implement and validate a loopback-only strict-account gateway suitable for `access.phronesis.com`, without activating external DNS or a tunnel.

## Required Reading

- `docs/technical/PHR-TECH-016-restricted-public-custom-domain-ingress.md`
- `docs/architecture/PHR-ARCH-016-trusted-account-registration.md`
- `docs/architecture/PHR-ARCH-014-timed-event-worker-access.md`
- `scripts/public-event-gateway.mjs`
- Official Tailscale Funnel and chosen tunnel-provider custom-hostname documentation

## Implementation Requirements

- Add a dedicated configurable loopback gateway with Host validation, strict path policy, marker overwrite, HTTPS forwarding, health, and streaming proxy behavior.
- Teach Proxy and server authorization to fail closed for restricted-public traffic unless a permanent Better Auth session and active module assignment exist.
- Add deterministic gateway and authorization tests.
- Add a deployment/rollback runbook for `access.phronesis.com`.

## Constraints

- Do not mutate Tailscale Serve/Funnel, Cloudflare, DNS, certificates, or external accounts.
- Do not expose Settings, administration APIs, developer paths, invitation activation, or timed event-worker login.
- Do not bind a gateway or application to a non-loopback interface.
- Do not commit credentials.

## Expected Architecture

Custom-domain tunnel -> dedicated loopback gateway -> current Phronesis loopback service. Private Serve and event-worker Funnel remain independent.

## Testing Expectations

- Header/path/Host/health gateway tests.
- Restricted-public auth tests in OPTIONAL and REQUIRED configurations.
- Existing event gateway, auth, lint, TypeScript, build, and diff tests.

## Documentation Updates

- Validation, release notes, Feature Registry, Atlas, Decisions, Roadmap, Prompts, Current CTO Structure, and Conversation History.

## Acceptance Criteria

The gateway is deployment-ready and fail-closed, with no live public activation.

## Non-Goals

- Creating a Cloudflare account, moving nameservers, activating DNS/tunnel routes, or replacing Tailscale.

## Notes For AI Coding Agents

- Preserve unrelated services and configuration.
- Treat public activation as a separate critical deployment gate.
