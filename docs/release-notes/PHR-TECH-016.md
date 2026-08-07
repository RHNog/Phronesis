# PHR-TECH-016 — Restricted Public Account Ingress

Phronesis includes a deployment-ready loopback gateway for `access.phronesis.com`. The public path requires permanent account authentication even when the private tailnet app remains in optional compatibility mode, and it blocks Settings, administration, developer tools, activation, and timed-worker login.

Trusted people can now create accounts and use assigned modules from an ordinary browser at `https://ramons-mac-studio.tailaa2d39.ts.net:10000`; they do not install Tailscale or join the tailnet. New accounts still receive zero access until owner approval.

The existing event-worker Funnel now applies two explicit gateway policies on the same current build. Better Auth entry/session traffic receives strict restricted-public authorization; event-worker entry retains timed-event authorization. Settings, administration, developer, activation, and cross-surface login paths remain transport-blocked, and client-supplied trust headers are overwritten.

Port `10000` uses Tailscale TLS-terminated TCP forwarding because regional validation found that HTTPS reverse-proxy mode closed public connections on this host. The branded `access.phronesis.com` route remains pending authenticated GoDaddy/Cloudflare setup; private owner access is unchanged.

`PHRONESIS_RESTRICTED_PUBLIC_MODE` now advertises only the verified Funnel origin. A future custom hostname replaces it only after the documented branded activation checks pass.
