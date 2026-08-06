# PHR-TECH-016 Validation

Date: 2026-08-06

Result: Pass — gateway implementation ready; external activation intentionally gated.

- Synthetic gateway tests pass for clean HTTPS origin validation, loopback binding, explicit hostname enforcement, Host mismatch denial, marker overwrite, forwarded HTTPS normalization, health, normal sign-up proxying, and owner-path blocking.
- Restricted-public application authorization is evaluated before public-event and optional-compatibility paths.
- Next Proxy requires a Better Auth session on restricted ingress even while the private application remains `OPTIONAL`.
- `/settings`, `/api/administration/*`, `/dev/*`, employee activation, and timed-worker login are transport-blocked.
- An actual Next.js validation target behind the gateway returned `/sign-up` `200`, `/settings` `404`, `/event-access` `404`, and redirected unauthenticated `/` to `/sign-in?callbackUrl=%2F` without exposing a loopback hostname.
- Existing public event gateway tests remain green in the 437/437 full suite.
- Warning-free lint, TypeScript, production build, and diff checks pass.
- Cloudflare/DNS/tunnel state was not changed. Provider activation and public end-to-end checks remain a separate owner-controlled deployment action.
