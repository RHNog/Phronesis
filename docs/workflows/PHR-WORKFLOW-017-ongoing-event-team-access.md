# PHR-WORKFLOW-017 Ongoing Event Team Access

## Feature ID

`PHR-WORKFLOW-017`

## Title

Ongoing Event Team Access

## Status

Implemented — Privately Live; Product Review Ready

## Priority

High

## Category

Workflow / Authentication / Authorization / Event Operations / UX

## Objective

Let an authorized administrator add people to an already-active Event Ledger without recreating the event, weakening module authorization, or changing historical ledger evidence.

## Background

Phronesis already supports two valid access mechanisms. Permanent trusted accounts receive workspace module entitlements through People & access, and account-free temporary workers receive hashed event-bound codes through Temporary access. Both mechanisms can be changed while an event is active, but the Event Ledger does not explain or expose either workflow. The capability is therefore technically present but operationally hidden.

## Problem Statement

An event owner working inside Event Ledger cannot readily tell whether a person may be added after opening, which access type to choose, where to perform the action, or when that access ends. The absence of an in-context workflow encourages over-broad permanent access or confusion with the immutable pre-opening product-owner roster.

## Proposed Solution

Add an `Event team` control to the active Event Ledger. It presents two explicit paths:

1. **Approved account** — open People & access, approve or select a permanent account, and grant `EVENT_LEDGER:VIEW` or `EVENT_LEDGER:OPERATE`. The next authorization decision reads the updated entitlement immediately. This access is workspace-module access and remains until an administrator changes or disables it.
2. **Temporary event worker** — generate an account-free, single-use code preconfigured to `EVENT_LEDGER:OPERATE` for the current active event. The resulting session ends at the earliest of configured expiry, explicit revocation, or Event Ledger close.

Reuse `AuthorizationRepository`, `EventAccessRepository`, the existing administration APIs, and the existing worker login. Do not create a second event ledger, event copy, synthetic permanent account, or parallel authorization table.

## Functional Requirements

- Render Event team only for the current active Event Ledger, never inside a closed historical report.
- Explain that the immutable product-owner/consignor roster and the mutable user-access team are different concerns.
- A permanent identity with `ADMINISTRATION:ADMIN` may manage both account and temporary access.
- Compatibility-mode access is not sufficient for access administration; show a direct permanent-owner sign-in action instead of a broken management control.
- A non-administrator may see a concise ownership message but cannot receive management controls or grant data.
- The approved-account action opens Settings → People & access.
- People & access provides an `Event Ledger only` preset for pending approval and direct invitation.
- Existing member entitlement editing provides a one-action `Add Event Ledger` helper that immediately saves `EVENT_LEDGER:OPERATE` while preserving every other assigned module.
- Assigning `EVENT_LEDGER:VIEW`, `OPERATE`, or `ADMIN` to an active permanent membership takes effect on the next page/API authorization check without event restart or sign-out.
- The temporary-worker form embedded in Event Ledger is restricted to `EVENT_LEDGER:OPERATE`; broader temporary module combinations remain in Settings → Temporary access.
- Temporary access is bound to the exact current active event and inherits existing single-use code, hashed storage, expiry, revocation, throttling, audit, and event-close invalidation rules.
- The embedded form lists only Event Ledger grants for the current active event and never exposes an existing plaintext code from server storage.
- The public worker login link remains copyable when configured; otherwise the current private login route remains available.
- Closing the event invalidates temporary sessions immediately and removes the active-ledger management surface on reload.

## Non-Functional Requirements

### Performance

The collapsed Event team surface performs no administration fetch. Opening temporary management performs one bounded existing grant-list request.

### Scalability

Permanent membership and temporary grant repositories remain authoritative. No event-team projection or duplicate user table is added.

### Maintainability

The Event Ledger embeds a variant of the existing `EventAccessManagement` component. Shared issuance, rotation, copy, revocation, and error behavior stay in one implementation.

### Reliability

Authorization is evaluated from SQLite on every protected request. No event restart, client cache invalidation, or sign-out is required after a permanent entitlement update.

### Accessibility

All actions have explicit names, status output, keyboard operation, and at least 44-pixel touch height. The expandable team control communicates its state with `aria-expanded` and `aria-controls`.

### Offline Support

Access administration requires the local Phronesis server but no third-party service. Existing signed-in/event-code sessions continue against the local authorization database.

### Security

UI visibility is not the security boundary. Existing administration routes continue to require permanent `ADMINISTRATION:ADMIN`; temporary sessions and compatibility principals cannot call them. Event Ledger embedding does not broaden the API. Plaintext worker codes remain one-time response data with the existing same-tab session-storage exception only.

### Extensibility

A future event-specific permanent-account assignment may be added only through a separately specified identity-bound grant model. This release intentionally distinguishes persistent module access from event-bound account-free access.

### Responsiveness

The Event team card and expanded temporary form must reflow without horizontal overflow at 390 pixels and keep primary ledger entry reachable.

## User Stories

- As an owner, I can add an approved account to the ledger after the event has started.
- As an owner, I can give a walk-up worker event-only access that ends automatically.
- As an operator, I can understand who controls team access without seeing administration controls.
- As an auditor, I can distinguish permanent module assignment from an event-bound temporary grant.

## Acceptance Criteria

- An active Event Ledger visibly exposes the two access paths to a permanently authenticated administrator.
- A compatibility-mode owner is directed to permanent sign-in before management.
- An existing trusted account can receive Event Ledger access during an active event and pass the very next authorization decision.
- A temporary Event Ledger code can be created after event opening, redeemed once, and used for `EVENT_LEDGER:OPERATE` only.
- The temporary session fails immediately after the same event closes, expires, or is revoked.
- Closed reports expose no team-management controls.
- Static and behavioral tests prove the preset, non-destructive helper, exact embedded entitlement, active-event binding, and server authorization boundaries.
- TypeScript, lint, full tests, production build, diff hygiene, private runtime, desktop, and 390-pixel browser review pass.

## Edge Cases

- No active event: no Event team surface and event-bound code creation remains rejected.
- Event closes while the form is open: creation fails against current server truth; existing sessions fail on their next request.
- Permanent account already has Event Ledger access: `Add Event Ledger` is an idempotent write that preserves one canonical entitlement.
- Permanent account has other modules: the helper changes only Event Ledger and preserves the rest.
- Temporary grant belongs to another event: it is omitted from the embedded current-team view.
- Lost unused code: the existing two-step audited replacement flow remains available.
- Past report selected while another event is active: the historical report remains read-only and does not render management for the unrelated current event.

## Dependencies

- `PHR-ARCH-011` Internal Identity And Module Authorization.
- `PHR-ARCH-014` Timed Event Worker Access.
- `PHR-ARCH-016` Trusted Account Registration.
- `PHR-WORKFLOW-006` Event Cash Ledger.
- `PHR-UX-029` Settings Control Center.

## Future Enhancements

- Identity-bound event-specific assignments that auto-expire at event close.
- Named stations, shift schedules, and per-worker activity summaries.
- Owner-approved delivery of worker links/codes through a messaging connector.

## Technical Notes

`app/event-ledger/page.tsx` performs a request-time permanent-membership administration check and passes only booleans plus the configured worker-login URL into the client workspace. `OngoingEventTeamAccess` owns disclosure state and renders `EventAccessManagement` in an Event Ledger-only variant. Existing administration APIs remain the only mutation boundary.

## UI / UX Notes

Place Event team after Sale ownership and before Event Inventory so access setup is visible but does not displace the main cash summary. Lead with the distinction between approved accounts and temporary workers. Keep the full temporary form collapsed until explicitly requested.

## Success Metrics

- A permanently authenticated owner can reach either add-person path from the active ledger in one action.
- Zero worker grants survive event close.
- Zero unrelated membership entitlements are removed by the Add Event Ledger helper.

## Open Questions

- None blocking. Event-specific permanent accounts remain explicitly future work; current permanent module access persists until revoked.

## Traceability

- Originating direction: Product Owner request on 2026-08-06 to support users joining an ongoing Event Ledger.
- Related implementation prompt: `docs/prompts/PHR-WORKFLOW-017-ongoing-event-team-access-prompt.md`.
- Related tests: `tests/ongoing-event-team-access.test.ts` and `tests/timed-event-access.test.ts`.
- Related implementation report: `docs/implementation-reports/PHR-WORKFLOW-017-ongoing-event-team-access-report.md`.
- Related validation: `docs/testing/PHR-WORKFLOW-017-ongoing-event-team-access-validation.md`.
- Related conformance review: `docs/reviews/PHR-WORKFLOW-017-ongoing-event-team-access-conformance-review.md`.
- Related release notes: `docs/release-notes/PHR-WORKFLOW-017.md`.
- Last modified: 2026-08-06.
- Modification reason: completed implementation, validation, private deployment, and same-session conformance evidence.
