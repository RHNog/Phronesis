# PHR-TECH-016 Implementation Report

Implemented a dedicated loopback restricted-access gateway for `access.phronesis.com`. It requires the configured Host, overwrites trust-bearing headers, marks requests as restricted public, normalizes forwarded HTTPS state, streams normal HTTP/upgrade traffic, and blocks Settings, administration, development, employee activation, and timed-worker login before application code.

The authorization DAL and Next Proxy recognize the restricted marker before `DISABLED`/`OPTIONAL` compatibility and event-worker sessions. Only a valid Better Auth session with an active Phronesis membership can authorize modules. Better Auth accepts the clean configured public origin without changing its private canonical origin.

No external provider state was mutated. Cloudflare Tunnel, DNS, Access policy, and unattended gateway/tunnel services remain gated by the owner-controlled runbook.

Verification is recorded in `docs/testing/PHR-TECH-016-restricted-public-custom-domain-ingress-validation.md`.

Owner-facing link selection now has an explicit activation signal. `PHRONESIS_RESTRICTED_PUBLIC_ORIGIN` may remain configured as a future Better Auth trusted origin, but it is not advertised until `PHRONESIS_RESTRICTED_PUBLIC_MODE=ENABLED`. This prevents configuration readiness from being mistaken for live DNS/tunnel availability.
