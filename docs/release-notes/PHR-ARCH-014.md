# PHR-ARCH-014 — Timed Event Worker Access

Phronesis now supports account-free, event-bound worker login. An owner can generate a single-use code from Settings for an active event, choose a one-to-24-hour duration, and assign Vendor Workspace and/or Inventory operations. The worker receives a scoped HttpOnly session.

Temporary access ends at expiry or event closure and can be revoked immediately. Codes and session tokens are stored only as hashes, redemption is throttled, and this path can never access Administration or create permanent membership. The isolated public gateway enforces event sessions even while the separate private owner path retains `PHRONESIS_AUTH_MODE=OPTIONAL` compatibility.

## 2026-08-03 Artwork Review Assignment

- Added `Artwork Review` to permanent employee module selectors and timed worker-code assignments.
- Separated manual review (`OPERATE`) from catalogue-wide refresh and assisted recovery (`ADMIN`). Timed workers can never receive the latter.
- Changed the Artwork Review page, navigation, queue/image reads, and manual mutations to use the dedicated module instead of broad Administration.
- Migrated existing membership schemas additively and backfilled the new module only for Owner/Admin memberships.
- Preserved the existing tailnet-only service. Browser-only public delivery through Tailscale Funnel is available as a separately approved operational action; it was not enabled by this release.

## 2026-08-03 Public Worker Gateway

- Activated a separate public login at `https://ramons-macbook-pro.tailaa2d39.ts.net:10000/event-access`; workers need only a browser and an owner-generated event code.
- Public traffic reaches a loopback-only gateway that blocks Settings, permanent authentication, developer paths, and grant/employee/provider administration before forwarding.
- Public authorization ignores anonymous `OPTIONAL` compatibility and permanent owner identity. It accepts only a valid, current event-access cookie and still enforces assigned modules at the application boundary.
- Preserved the owner route on tailnet-only port `9443`; no public request is routed directly to Phronesis on port `3100`.
- Added module-correct post-login landing, Secure cookies behind Funnel TLS, a Settings copyable public link, validated unattended runtime definitions, and an explicit one-command Funnel shutdown.

## 2026-08-03 Event-Independent Artwork Review Task

- Artwork Review-only temporary codes no longer require an Event Ledger event.
- Temporary grants now carry immutable `TASK` or `EVENT` scope. `TASK` is permitted only for Artwork Review; adding Vendor Workspace, Event Ledger, Event Flip, or Inventory forces `EVENT` scope and requires an active event.
- Task sessions end by expiry or revocation and are unaffected by unrelated event lifecycle. Event sessions retain immediate event-closure invalidation.
- Settings stays usable without an event, defaults to Artwork Review only, disables event-bound choices until an event exists, and labels issued task/event access explicitly.
- Existing grants migrated additively as `EVENT`; no historical or active access was broadened.
- Worker-facing login now says temporary worker access instead of implying every code joins an event.

## 2026-08-03 Issued-Code Continuity And Safe Replacement

- The latest unused code now survives page navigation in the same authenticated owner tab through ephemeral session storage and is restored only after the server confirms that grant remains active.
- Active and redeemed access rows always retain the public worker login-link copy control.
- An active row whose code is no longer available locally now offers a two-step `Replace lost code` action. Confirmation rotates the server hash, invalidates the old code immediately, preserves access scope and expiry, returns the new code once, and records a secret-free audit event.
- Redeemed, expired, revoked, event-closed, malformed, or unauthorized browser-session values are removed and can never be recovered from the server.
