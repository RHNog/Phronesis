# PHR-TECH-016 Conformance Review

Status: Implementation conforms — no-client Funnel live; branded domain gated.

- The gateway binds to loopback, validates one configured hostname, overwrites ingress trust markers, and exposes no secret-bearing health response.
- Restricted ingress cannot use optional compatibility or event-worker authority.
- Owner, administration, development, activation, and timed-worker paths are blocked at transport and remain application-authorized as defense in depth.
- Private owner access is unchanged; event-worker access retains its exact path, cookie, marker, and application authorization on the shared public port.
- Focused 18/18, full 458/458, TypeScript, lint, production build, isolated registration lifecycle, live origin rejection/acceptance distinction, database integrity, loopback/tailnet checks, and distributed public probes satisfy implementation acceptance criteria.
- The public Funnel activation was explicitly authorized and uses the only externally verified host mode. Cloudflare/DNS/custom-domain activation is correctly withheld pending authenticated owner-controlled provider access.

This review is same-session conformance evidence, not independent security certification.

The Sign Up invite preserves this boundary: only the explicitly enabled, validated Funnel origin is advertised. The unresolved custom origin is not shown, and disabling public mode falls back without weakening restricted-public authorization.
