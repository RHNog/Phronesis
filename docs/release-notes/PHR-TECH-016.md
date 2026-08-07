# PHR-TECH-016 — Restricted Public Custom-Domain Ingress

Phronesis includes a deployment-ready loopback gateway for `access.phronesis.com`. The public path requires permanent account authentication even when the private tailnet app remains in optional compatibility mode, and it blocks Settings, administration, developer tools, activation, and timed-worker login.

The custom hostname is not externally active yet. Cloudflare Tunnel/DNS/Access activation remains an explicit owner-controlled deployment using the documented runbook; private Tailscale access is unchanged.

Added `PHRONESIS_RESTRICTED_PUBLIC_MODE`. The custom hostname may be configured as a future trusted origin while mode stays disabled; Phronesis advertises it in owner Sign Up invitations only after the documented end-to-end activation checks pass.
