# PHR-ARCH-014 — Timed Event Worker Access

## Feature ID

`PHR-ARCH-014`

## Status

Implemented — Product Review Pending

## Priority

High

## Category

Architecture / Security / Authentication / Authorization / UI / Database

## Objective

Allow an owner to issue a short-lived, self-generated code that lets an event worker use explicitly assigned operational modules without a GitHub account.

## Background And Problem

Permanent Phronesis membership currently requires an invited GitHub identity. Event staff are temporary, frequently use a phone, and should not need an external account or inherit owner privileges merely to record purchases, sales, and inventory movements.

## Proposed Solution

Add an event-access grant and session boundary alongside Better Auth. An authenticated administrator creates a named grant for the currently active event, chooses a duration and operational modules, and receives a single-use human-readable code. The worker redeems that code at `/event-access`; Phronesis stores only code and bearer-token hashes and sets an HttpOnly session cookie. Every authorization rechecks the grant, session, expiry, and active event.

## Functional Requirements

- Only a permanent identity with `ADMINISTRATION:ADMIN` may list, create, or revoke grants.
- A grant belongs to exactly one workspace and active event.
- The owner provides a worker label, duration from one to 24 hours, and at least one allowed operational module.
- Temporary access is limited to `VENDOR_WORKSPACE` and `INVENTORY`, with `VIEW` or `OPERATE` access. `ADMINISTRATION`, pricing administration, and permanent membership are never available.
- Codes are single-use and shown only in the creation response.
- Redemption creates a separate random session and an HttpOnly, SameSite=Lax cookie.
- A session expires at the earliest of its configured expiry, grant revocation, or event closure.
- Settings shows active and historical grants and permits immediate revocation.
- The sign-in screen presents both permanent GitHub sign-in and event-code access.
- Authorization audit records issuance, redemption, revocation, and event-session logout.

## Non-Functional Requirements

### Security

- Store codes using salted scrypt hashes and session tokens using SHA-256 hashes; never persist or log plaintext credentials.
- Use constant-time comparisons, one-time redemption, generic invalid-code responses, and per-client attempt throttling.
- A temporary session must never satisfy identity-required administration endpoints.
- Prefer permanent authenticated identity when both permanent and temporary cookies exist.

### Reliability And Performance

- Validate temporary access from the local SQLite database on each protected request so closure and revocation take effect immediately.
- Grant creation and redemption must be transactional.

### Accessibility And Responsiveness

- Code entry, generation, copying, and revocation must work with keyboard and touch targets on desktop and phone.
- Status and errors use live-region semantics and do not depend on color alone.

## User Stories

- As an owner, I can generate an event code for a worker without creating an external account.
- As a worker, I can enter one code on my phone and work until the event or timer ends.
- As an owner, I can revoke a worker immediately.

## Acceptance Criteria

- A valid one-time code creates a scoped timed session and cannot be redeemed twice.
- The temporary session authorizes only its assigned operational modules and never administration.
- Expired, revoked, or event-closed sessions are rejected immediately.
- Grant management and worker login are usable on mobile.
- Unit/integration tests cover issuance, redemption, permissions, expiry, closure, revocation, and rate limiting.

## Edge Cases

- Creation fails when no event is active.
- An event that closes between issuance and redemption makes the code unusable.
- Multiple workers may have independent grants for the same event.
- Logout revokes only the presented temporary session, not the grant or other workers.

## Dependencies

- `PHR-ARCH-011` internal identity and module authorization.
- `PHR-ARCH-012` employee activation and module access.
- `PHR-WORKFLOW-006` Event Ledger and active-event lifecycle.

## Non-Goals / Future Enhancements

- Permanent password or passkey accounts.
- SMS/email delivery, device management, Binder permissions, or offline credential redemption.
- Fine-grained per-route grants beyond the two event-operational modules.

## Traceability

- Originating direction: CTO request on 2026-07-31.
- Related implementation prompt: `docs/prompts/PHR-ARCH-014-timed-event-worker-access-prompt.md`.
- Related tests: `tests/timed-event-access.test.ts`.
- Last modified: 2026-07-31.
- Modification reason: initial approved feature specification.
