# PHR-ARCH-014 — Timed Event Worker Access

## Feature ID

`PHR-ARCH-014`

## Status

Timed Task Access Implemented And Live

## Priority

High

## Category

Architecture / Security / Authentication / Authorization / UI / Database

## Objective

Allow an owner to issue a short-lived, self-generated code that lets a temporary worker use explicitly assigned operational modules without a GitHub account or, for non-transactional Artwork Review, an Event Ledger event.

## Background And Problem

Permanent Phronesis membership currently requires an invited GitHub identity. Event staff are temporary, frequently use a phone, and should not need an external account or inherit owner privileges merely to record purchases, sales, and inventory movements.

## Proposed Solution

Add a temporary-access grant and session boundary alongside Better Auth. An authenticated administrator creates a named grant, chooses a duration and operational modules, and receives a single-use human-readable code. Grants are classified immutably at creation: `TASK` for Artwork Review-only access or `EVENT` when any transactional module is assigned. `EVENT` grants belong to the current active event and close with it; `TASK` grants carry no event and end only by expiry or revocation. The worker redeems either code at `/event-access`; Phronesis stores only code and bearer-token hashes and sets an HttpOnly session cookie.

For workers who cannot install Tailscale, expose a separate localhost-only gateway through Tailscale Funnel. The gateway marks every forwarded request as public worker ingress, strips/overwrites any client-supplied marker, blocks owner-only authentication and administration paths at transport level, and leaves the existing private 9443 Serve mapping untouched. Public-ingress authorization fails closed regardless of global `OPTIONAL` compatibility mode and accepts only a valid event-access cookie.

## Functional Requirements

- Only a permanent identity with `ADMINISTRATION:ADMIN` may list, create, or revoke grants.
- A grant belongs to exactly one workspace. An `EVENT` grant also belongs to one active event; a `TASK` grant must not carry an event.
- The owner provides a worker label, duration from one to 24 hours, and at least one allowed operational module.
- Temporary access is limited to `VENDOR_WORKSPACE`, `EVENT_LEDGER`, `EVENT_FLIP`, `INVENTORY`, and `ARTWORK_REVIEW`, with `VIEW` or `OPERATE` access. `ADMINISTRATION`, pricing administration, and permanent membership are never available.
- `ARTWORK_REVIEW:OPERATE` permits manual candidate approval, rejection, restoration, representative undo, packaging-gallery approval, and packaging-gallery undo. Catalogue-wide candidate refresh and assisted recovery require `ARTWORK_REVIEW:ADMIN`, which a timed grant cannot receive.
- Artwork Review as the only entitlement creates a `TASK` grant without requiring or inheriting an Event Ledger event.
- Adding `VENDOR_WORKSPACE`, `EVENT_LEDGER`, `EVENT_FLIP`, or `INVENTORY` creates an `EVENT` grant and requires a current active event, even when Artwork Review is also assigned.
- Codes are single-use and shown only in the creation response.
- Redemption creates a separate random session and an HttpOnly, SameSite=Lax cookie.
- A task session expires at its configured expiry or grant revocation. An event session additionally ends immediately when its event closes.
- Settings shows active and historical grants and permits immediate revocation.
- The current active Event Ledger exposes a collapsed, in-context worker workflow that always grants exactly `EVENT_LEDGER:OPERATE`, lists only that event's Ledger grants, and disappears from historical reports.
- The sign-in screen presents both permanent GitHub sign-in and event-code access.
- Authorization audit records issuance, redemption, revocation, and event-session logout.
- A successful code redemption returns the first authorized module destination so an Artwork Review-only worker lands on `/artwork-review` instead of an unauthorized default module.
- Public worker ingress listens only on loopback, is forwarded through a dedicated Funnel port, and never reuses or replaces the private owner Serve port.
- Public ingress denies owner Settings, employee/grant administration, permanent activation/sign-in, developer routes, and non-event Better Auth endpoints before they reach Next.js.

## Non-Functional Requirements

### Security

- Store codes server-side using salted scrypt hashes and session tokens using SHA-256 hashes; never log plaintext credentials. The authenticated owner tab may retain only its latest unused issued code in `sessionStorage` so same-tab navigation does not destroy it; remove it when server truth no longer reports that grant as active.
- The server must never recover or return an existing plaintext code. If an unused code is lost outside the issuing browser session, owner-confirmed replacement rotates its salt/hash, invalidates the previous code immediately, preserves the grant scope/expiry/entitlements, and appends an audit event.
- Use constant-time comparisons, one-time redemption, generic invalid-code responses, and per-client attempt throttling.
- A temporary session must never satisfy identity-required administration endpoints.
- Prefer permanent authenticated identity when both permanent and temporary cookies exist.
- Public worker ingress ignores permanent identity and global `OPTIONAL` compatibility. It authorizes only a current temporary session and must fail closed for a missing, invalid, expired, or revoked cookie; event-scoped sessions must additionally fail when their event closes.
- Event cookies issued through HTTPS forwarding are `Secure`, including when the local Next.js runtime itself is in development mode behind TLS termination.

### Reliability And Performance

- Validate temporary access from the local SQLite database on each protected request so closure and revocation take effect immediately.
- Grant creation and redemption must be transactional.

### Accessibility And Responsiveness

- Code entry, generation, copying, and revocation must work with keyboard and touch targets on desktop and phone.
- Status and errors use live-region semantics and do not depend on color alone.

## User Stories

- As an owner, I can generate an event code for a worker without creating an external account.
- As an owner, I can issue that event-only code after opening without leaving the active Event Ledger.
- As an Artwork Review worker, I can enter one code on my phone without an Event Ledger event and work until the timer ends or access is revoked.
- As an event worker, I can enter one code on my phone and work until the event or timer ends.
- As an owner, I can revoke a worker immediately.
- As an owner, I can return to Settings in the same browser tab and retrieve the latest unused code, or securely replace an unused code that was lost.

## Acceptance Criteria

- A valid one-time code creates a scoped timed session and cannot be redeemed twice.
- The temporary session authorizes only its assigned operational modules and never Administration. A worker assigned only `ARTWORK_REVIEW:OPERATE` sees only Artwork Review in primary navigation and cannot read or operate other product modules.
- Artwork Review-only access can be issued, redeemed, and authorized when no event exists. It remains valid if unrelated events open or close.
- Any grant containing a transactional module is rejected unless the referenced event is active, and its session is invalidated when that event closes.
- Expired, revoked, or event-closed sessions are rejected immediately.
- Grant management and worker login are usable on mobile.
- Same-tab navigation preserves the latest unused issued code. Active and redeemed history always exposes the stable public login link; active rows without a locally retained code offer an explicit two-step replacement action.
- Replacing an active unused code invalidates the old code, returns the new plaintext once, preserves all grant authorization fields, and cannot run after redemption, expiry, revocation, or event closure.
- Unit/integration tests cover issuance, redemption, permissions, expiry, closure, revocation, and rate limiting.

## Edge Cases

- Creation without an active event succeeds only when Artwork Review is the sole entitlement.
- An event that closes between issuance and redemption makes the code unusable.
- Multiple workers may have independent grants for the same event.
- Existing event-bound grants migrate as `EVENT`; no active or historical grant is broadened into a task grant.
- Browser-session code data is ignored and removed unless a successful owner-only grant listing confirms the same grant remains `ACTIVE` and unexpired.
- Logout revokes only the presented temporary session, not the grant or other workers.

## Dependencies

- `PHR-ARCH-011` internal identity and module authorization.
- `PHR-ARCH-012` employee activation and module access.
- `PHR-WORKFLOW-006` Event Ledger and active-event lifecycle.

## Non-Goals / Future Enhancements

- Permanent password or passkey accounts.
- SMS/email delivery, device management, Binder permissions, or offline credential redemption.
- General-purpose public hosting. The approved Funnel exposes only the dedicated worker gateway for the active event and is expected to be disabled when public worker access is no longer needed.

## Live Public Worker Deployment

- Public login: `https://ramons-mac-studio.tailaa2d39.ts.net:10000/event-access`.
- Tailscale Funnel port `10000` terminates public HTTPS and forwards only to `127.0.0.1:3101`.
- The gateway forwards to Phronesis on `127.0.0.1:3100`; both application processes bind only to loopback.
- The existing owner route `https://ramons-mac-studio.tailaa2d39.ts.net:9443` remains tailnet-only and unchanged.
- While the Mac has no active desktop host, named detached `screen` sessions supervise the two loopback processes. Validated LaunchAgent definitions are installed for the next normal user login.
- Disable public ingress with `tailscale funnel --https=10000 off`; this does not alter private Serve on `9443`.
- The host Mac must remain powered, awake, online, and connected to Tailscale for either route to work.

## Traceability

- Originating direction: CTO request on 2026-07-31.
- Related implementation prompt: `docs/prompts/PHR-ARCH-014-timed-event-worker-access-prompt.md`.
- Related tests: `tests/timed-event-access.test.ts`.
- Last modified: 2026-08-06.
- Modification reason: expose exact Ledger-only temporary issuance inside the ongoing event while retaining all permanent-administrator, one-time-code, event-binding, and close-invalidation rules.
