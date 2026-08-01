# PHR-ARCH-014 — Timed Event Worker Access

Phronesis now supports account-free, event-bound worker login. An owner can generate a single-use code from Settings for an active event, choose a one-to-24-hour duration, and assign Vendor Workspace and/or Inventory operations. The worker receives a scoped HttpOnly session.

Temporary access ends at expiry or event closure and can be revoked immediately. Codes and session tokens are stored only as hashes, redemption is throttled, and this path can never access Administration or create permanent membership. Production enforcement still requires `PHRONESIS_AUTH_MODE=REQUIRED`.
