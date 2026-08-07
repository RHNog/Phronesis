# PHR-TECH-016 Implementation Report

Implemented a dedicated loopback restricted-access gateway for `access.phronesis.com`. It requires the configured Host, overwrites trust-bearing headers, marks requests as restricted public, normalizes forwarded HTTPS state, streams normal HTTP/upgrade traffic, and blocks Settings, administration, development, employee activation, and timed-worker login before application code.

The authorization DAL and Next Proxy recognize the restricted marker before `DISABLED`/`OPTIONAL` compatibility and event-worker sessions. Only a valid Better Auth session with an active Phronesis membership can authorize modules. Better Auth accepts the clean configured public origin without changing its private canonical origin.

The 2026-08-07 activation revision extended the existing public event gateway into an explicitly configured dual-policy ingress. Permanent-account entry paths and Better Auth session-cookie requests receive the strict restricted marker; event-worker entry remains public-event. Both policies strip spoofed markers and forward to the same current build. Cookie presence selects policy only and never grants authority.

The existing port-10000 Funnel is now public in TLS-terminated TCP mode, so visitors need no Tailscale software or tailnet membership. Its verified invitation is `https://ramons-mac-studio.tailaa2d39.ts.net:10000/sign-up`. Settings and administration remain transport-blocked, while `/event-access` remains operational. Tailscale HTTPS proxy mode was rejected after distributed connection failures; the runbook preserves the exact working mode and rollback.

No Cloudflare, GoDaddy, DNS, certificate, or Access-policy state was mutated because no authenticated owner-controlled provider session was available. The branded `access.phronesis.com` route remains gated.

Verification is recorded in `docs/testing/PHR-TECH-016-restricted-public-custom-domain-ingress-validation.md`.

Owner-facing link selection has an explicit activation signal. The live runtime sets `PHRONESIS_RESTRICTED_PUBLIC_ORIGIN=https://ramons-mac-studio.tailaa2d39.ts.net:10000` and `PHRONESIS_RESTRICTED_PUBLIC_MODE=ENABLED`, so Settings advertises the externally verified route. A future `access.phronesis.com` value must not replace it until DNS, certificate, tunnel, and end-to-end checks pass.
