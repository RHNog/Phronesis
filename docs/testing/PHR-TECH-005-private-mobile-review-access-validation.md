# PHR-TECH-005 Validation

Date: 2026-07-29
Verdict: **PRODUCT REVIEW READY — PRIVATE SERVICE OPERATIONAL**

## Security and routing

- Next.js listens only on `127.0.0.1:3100`.
- Tailscale Serve exposes that loopback service only to the existing tailnet at HTTPS port 9443.
- TLS verification succeeds.
- Tailscale Funnel was not enabled.
- Existing private handlers on ports 443 and 8443 are unchanged.
- The Next.js cross-origin allowlist is injected from `PHRONESIS_PRIVATE_REVIEW_ORIGIN`; no wildcard origin is accepted.

## Reliability

- A per-user LaunchAgent runs from the canonical JarvisSSD checkout and uses `.data/mobile-review.sqlite`.
- The review database is excluded from Git.
- Terminating the Next.js child caused the launcher and LaunchAgent to recover automatically; the local and private URLs returned 200 afterward.
- `npm run review:phone:status` returns success only when both local health and the exact private proxy mapping are present.

## Phone-width runtime

- The exact private HTTPS URL was rendered at 390x844.
- The page loaded the stale-labelled July 15 review snapshot rather than claiming current live data.
- Black Lotus search returned 40 catalogue results.
- Document width remained below viewport width with no horizontal overflow.
- The initial Next.js cross-origin block was remediated with the single-host allowlist and did not recur after restart.

## Repository checks

- Focused private-review, snapshot-workspace, and catalogue-sync tests: 7/7 passed.
- `npm run lint`: passed.
- Isolated production build: passed.
- `git diff --check`: passed.

The Mac must remain powered on, awake, online, signed into Tailscale, and logged into the user session. This hot fix does not provide cloud hosting or remote code editing.
