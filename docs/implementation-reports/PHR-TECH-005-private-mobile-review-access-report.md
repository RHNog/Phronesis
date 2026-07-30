# PHR-TECH-005 Engineer and Conformance Report

## Outcome

Private phone review is operational at the Mac's Tailscale DNS name on HTTPS port 9443. The service is loopback-only locally, persistent through the logged-in macOS session, automatically restarts after process failure, and displays the current working tree with an isolated stale review database.

## Repository changes

- Forwarded explicit Next.js arguments through `scripts/start-phronesis.mjs`.
- Added `review:phone` and `review:phone:status` commands.
- Added dynamic tailnet health reporting in `scripts/private-review-status.mjs`.
- Added an environment-scoped Next.js development-origin allowlist.
- Ignored local `.data/` databases.
- Added deterministic private-access security coverage.

## System changes

- Installed `~/Library/LaunchAgents/com.phronesis.private-review.plist`.
- Added only the Tailscale Serve handler `HTTPS 9443 -> http://127.0.0.1:3100`.
- Preserved existing handlers on 443 and 8443.

## Conformance

Chief Architect and security verdict: **CONFORMS**. Access is private to the existing tailnet, does not use Funnel, binds no public interface, exposes no credential, and is reversible without affecting the two pre-existing services. Designer/mobile verdict: **CONFORMS** at 390x844 with stale-data disclosure and no horizontal overflow.

## Recovery and teardown

```text
npm run review:phone:status
tailscale serve --https=9443 off
launchctl bootout gui/$(id -u)/com.phronesis.private-review
launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/com.phronesis.private-review.plist
```

No commit, push, public deployment, Funnel, production-data activation, credential change, or existing-handler mutation occurred.
