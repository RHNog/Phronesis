# PHR-TECH-016 Engineer Work Order

## Project Context

Phronesis has private tailnet review, a public event-worker Funnel on port `10000`, and a deployment-ready dedicated restricted-public gateway. The Product Owner has now explicitly authorized no-client public account access. The branded domain remains unavailable until owner-controlled provider sessions exist.

## Feature ID

`PHR-TECH-016`

## Objective

Activate remote sign-up and assigned-module access for ordinary browsers through the existing public Funnel, without exposing Settings, administration, compatibility access, or event-worker authority to permanent-account requests. Preserve the dedicated `access.phronesis.com` gateway for later branded activation.

## Required Reading

- `docs/technical/PHR-TECH-016-restricted-public-custom-domain-ingress.md`
- `docs/architecture/PHR-ARCH-016-trusted-account-registration.md`
- `docs/architecture/PHR-ARCH-014-timed-event-worker-access.md`
- `scripts/public-event-gateway.mjs`
- `scripts/restricted-access-gateway.mjs`
- `tests/public-event-gateway.test.ts`
- Official Tailscale Funnel and chosen tunnel-provider custom-hostname documentation

## Implementation Requirements

- Extend the loopback public gateway with an explicitly configured dual-surface mode.
- Select restricted-public only for permanent-account entry paths or a Better Auth session cookie; select public-event for worker entry paths and event-only requests.
- Treat cookie presence as a routing hint only and retain signed session, membership, and entitlement validation in Phronesis.
- Strip untrusted ingress and forwarding headers, set exactly one trusted marker, validate the expected public hostname, and apply surface-specific path blocks.
- Proxy both public surfaces to the same current Phronesis build so static and application assets cannot diverge.
- Add deterministic dual-surface gateway tests, including spoofed markers, forged session cookies, owner-path blocks, event-worker continuity, and legacy event-only mode.
- Activate the existing Funnel route only after loopback and isolated lifecycle verification pass.
- Update the deployment/rollback runbook for both the live Funnel pilot and the later branded domain.

## Constraints

- Do not change or expose occupied Tailscale ports `443` or `8443`, and do not create another Funnel port.
- Preserve the current Funnel hostname and port `10000`; changing its loopback target is authorized only after event-worker regression checks pass.
- Do not create Cloudflare, GoDaddy, DNS, or certificate state without an authenticated owner-controlled provider session.
- Do not expose Settings, administration APIs, developer paths, invitation activation, or timed event-worker login.
- Do not bind a gateway or application to a non-loopback interface.
- Do not commit credentials.

## Expected Architecture

Immediate pilot: existing Funnel `:10000` -> dual-policy loopback gateway -> current Phronesis loopback service. Later branded route: custom-domain tunnel -> dedicated restricted gateway -> the same current Phronesis service. Private Serve remains independent.

## Testing Expectations

- Header/path/Host/health and dual-policy gateway tests.
- Restricted-public auth tests in OPTIONAL and REQUIRED configurations.
- Existing event gateway, auth, lint, TypeScript, build, and diff tests.
- Public-origin probes from outside the tailnet and isolated registration-to-pending lifecycle evidence.

## Documentation Updates

- Validation, release notes, Feature Registry, Atlas, Decisions, Roadmap, Prompts, Current CTO Structure, and Conversation History.

## Acceptance Criteria

The public Funnel serves account creation and assigned-module access to browsers without Tailscale, event-worker access remains intact, restricted-public administration returns `404`, and the owner invite card advertises only the verified live public origin.

## Non-Goals

- Creating a Cloudflare or GoDaddy account, moving nameservers, or claiming that `access.phronesis.com` is live before provider activation.

## Notes For AI Coding Agents

- Preserve unrelated services and configuration.
- Treat any further custom-domain or provider activation as a separate critical deployment gate.
- The Product Owner's 2026-08-07 instruction explicitly authorizes this existing-Funnel public activation; it does not authorize weakening either authorization boundary.
