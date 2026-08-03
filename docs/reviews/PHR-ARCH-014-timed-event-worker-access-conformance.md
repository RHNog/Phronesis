# PHR-ARCH-014 Conformance Review

Date: 2026-07-31

Verdict: `READY FOR PRODUCT REVIEW`

The implementation conforms to the specified separation between permanent identity and temporary event access. Grant administration remains permanent-identity-only; temporary authorization is event-bound, time-bound, module-allowlisted, revocable, and invalidated by event closure. Plaintext credentials are returned only once and are not persisted.

Evidence: 294/294 supported tests pass; focused lifecycle tests pass 4/4; ESLint, standalone TypeScript, and Next.js 16 production build pass. At a 390×844 viewport, worker inputs/buttons are 48px tall with no horizontal overflow, and the Settings panel remains within the viewport.

Known activation boundary: `PHRONESIS_AUTH_MODE=OPTIONAL` intentionally retains anonymous compatibility access. True access restriction requires the existing production switch to `REQUIRED`; this is an activation gate, not a conformance defect in the temporary-session path.

## 2026-08-03 Artwork Review Amendment

Verdict: `READY FOR PRODUCT REVIEW`.

The dedicated module conforms to least privilege: permanent employees may receive explicit access, temporary workers may receive at most `OPERATE`, and system-wide refresh/assisted recovery remain `ADMIN`. Existing owner/admin continuity is preserved by a narrow migration backfill; operators, viewers, invitations, and existing worker sessions are not broadened. Full 373/373 tests and all static/build/runtime gates pass. This same-session conformance review is not independent approval.

## 2026-08-03 Isolated Public Gateway Amendment

Verdict: `IMPLEMENTATION CONFORMS — PUBLIC ACTIVATION GATED`.

The gateway is isolated from the existing owner transport, listens only on loopback, overwrites rather than trusts its ingress marker, blocks owner/permanent-auth paths before application routing, and makes public ingress ignore anonymous compatibility and permanent identity. The application still enforces the exact timed-session module as a second boundary. All 376 tests and static/build gates pass. This same-session review does not authorize Tailscale Funnel activation.
