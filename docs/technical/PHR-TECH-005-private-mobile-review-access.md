# PHR-TECH-005 — Private Mobile Review Access

## Feature ID

`PHR-TECH-005`

## Status

Product Review Ready

## Priority

Critical

## Category

Technical / Developer Workflow / Security / Review

## Objective

Let the Product Owner inspect the current Phronesis review build from a phone while away from the Mac, without publicly deploying unfinished code or exposing the local development server to the internet.

## Approved Solution

Run the existing Phronesis development/review server persistently on loopback port `3100` and publish only that loopback service through the Mac's already configured Tailscale tailnet on a dedicated HTTPS port. Preserve the existing Tailscale services on ports 443 and 8443.

## Requirements

- Private tailnet access only; Tailscale Funnel/public exposure is prohibited.
- Bind Next.js to `127.0.0.1`, never `0.0.0.0`, for remote review.
- Use a dedicated Tailscale HTTPS port that does not replace existing services.
- Keep the review server alive through the user's logged-in macOS session and restart it after recoverable failure.
- Use an isolated, stale-labelled review database until live-data activation is separately accepted.
- Provide status, recovery, and teardown commands.
- The Mac must remain powered on, awake, online, and signed into Tailscale.

## Controlled-Lane Slices

1. Add repository-owned review start/status commands and argument forwarding.
2. Install a reversible per-user LaunchAgent and private Tailscale Serve mapping.
3. Verify loopback, tailnet HTTPS, mobile-width rendering, non-public configuration, and documentation.

## Acceptance Criteria

- The private HTTPS URL returns `/vendor` from the current working tree.
- Access requires the same Tailscale tailnet.
- Existing Tailscale Serve handlers remain unchanged.
- The service recovers after process exit without requiring the Mac terminal to remain open.
- A documented command reports local and private health.

## Non-Goals

- Public deployment, Funnel, anonymous access, cloud hosting, GitHub publication, or production data activation.
- Remote code editing or shell access from the phone.
- Keeping the Mac awake or bypassing macOS login/security controls.

## Recovery

Remove only the dedicated `9443` Serve handler, boot out only `com.phronesis.private-review`, and retain the repository and review database unless the Product Owner requests removal.

## Phone Use

1. Install or open Tailscale on the phone and sign into the same tailnet.
2. Open the private HTTPS URL returned by `npm run review:phone:status`.
3. Optionally add the page to the phone's Home Screen.

The Mac must remain powered on, awake, online, and logged into the user session.

## Traceability

- Origin: Product Owner hot-fix direction on 2026-07-29.
- Implementation prompt: `docs/prompts/PHR-TECH-005-private-mobile-review-access-prompt.md`.
- Last modified: 2026-07-29.
