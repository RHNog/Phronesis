# PHR-TECH-005 Implementation Prompt

## Objective

Create a persistent, private, phone-accessible Phronesis review URL through the Mac's existing Tailscale tailnet.

## Required Reading

- `docs/technical/PHR-TECH-005-private-mobile-review-access.md`
- `.agents/roles/engineer.md`
- Local `tailscale serve --help`

## Implementation Requirements

- Forward explicit Next.js arguments through the existing application/observer launcher.
- Add repository-supported review start and health/status commands.
- Install a per-user LaunchAgent for loopback port 3100 using the canonical JarvisSSD checkout and isolated review database.
- Add a Tailscale Serve HTTPS handler on port 9443 without modifying existing handlers.
- Verify local and tailnet HTTPS responses and document exact recovery.

## Constraints

- Never use Tailscale Funnel, public deployment, `0.0.0.0`, credentials, or anonymous access.
- Do not modify existing Serve handlers on 443 or 8443.
- Do not stage, commit, push, or activate live production data.
- Preserve the active PHR-WORKFLOW-004 Product Review candidate.

## Acceptance

Return the private URL, exact system mutations, health evidence, mobile requirements, and teardown instructions. Continue automatically through security and architecture conformance.
