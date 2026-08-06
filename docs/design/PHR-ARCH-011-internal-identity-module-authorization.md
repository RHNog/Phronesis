# PHR-ARCH-011 Designer Direction

Date: 2026-07-30
Verdict: **DIRECTION APPROVED FOR IMPLEMENTATION**

This is a same-session Designer gate and is not represented as independent approval.

## Experience contract

- Authentication is a short interruption, not a destination: one Phronesis explanation, one GitHub sign-in action, and automatic return to the intended safe internal route.
- No public-signup language, password form, pricing, or account-plan choice appears.
- When GitHub activation variables are absent, the page states that private access is not configured; it does not expose environment-variable values or present a failing button.
- An authenticated identity without an active membership receives a clear access-denied state rather than an empty application shell.
- Desktop presents a centered compact panel; the same content remains single-column and thumb-operable on phone.
- Module assignment removes unavailable primary navigation entries, but hidden navigation is never described as the security boundary.
- Existing private review remains unchanged while rollout mode is `DISABLED`; `REQUIRED` becomes an explicit activation step after credentials and owner bootstrap are present.

## Accessibility

- Preserve visible focus, native button semantics, minimum 44px interactive height, plain error text, and a meaningful page heading.
- Do not encode membership or configuration state with color alone.
