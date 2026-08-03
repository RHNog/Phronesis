# PHR-ARCH-014 — Timed Event Worker Access

Phronesis now supports account-free, event-bound worker login. An owner can generate a single-use code from Settings for an active event, choose a one-to-24-hour duration, and assign Vendor Workspace and/or Inventory operations. The worker receives a scoped HttpOnly session.

Temporary access ends at expiry or event closure and can be revoked immediately. Codes and session tokens are stored only as hashes, redemption is throttled, and this path can never access Administration or create permanent membership. Production enforcement still requires `PHRONESIS_AUTH_MODE=REQUIRED`.

## 2026-08-03 Artwork Review Assignment

- Added `Artwork Review` to permanent employee module selectors and timed worker-code assignments.
- Separated manual review (`OPERATE`) from catalogue-wide refresh and assisted recovery (`ADMIN`). Timed workers can never receive the latter.
- Changed the Artwork Review page, navigation, queue/image reads, and manual mutations to use the dedicated module instead of broad Administration.
- Migrated existing membership schemas additively and backfilled the new module only for Owner/Admin memberships.
- Preserved the existing tailnet-only service. Browser-only public delivery through Tailscale Funnel is available as a separately approved operational action; it was not enabled by this release.
