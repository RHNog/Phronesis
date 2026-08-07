# PHR-ARCH-016 — Trusted Account Registration And Approval

## Feature ID

`PHR-ARCH-016`

## Title

Trusted Account Registration And Owner-Controlled Module Approval

## Status

Implemented — Privately Live; Supervisor Persistence Gated

## Priority

Critical

## Category

Architecture / Security / Authentication / Authorization / Database / UI / UX / Workflow

## Objective

Let a trustworthy person create and authenticate a permanent Phronesis account, give the owner one safe link to invite that person into the registration flow, and ensure that the account receives no product access until an Owner or Administration Admin explicitly approves the request and assigns exact module/access pairs.

## Background

`PHR-ARCH-011` and `PHR-ARCH-012` established Better Auth sessions, GitHub identity, invitations, memberships, explicit module entitlements, and owner-issued activation codes. That flow requires the owner to create an invitation before the person can establish an account. The Product Owner now wants the account to exist first so identity onboarding and module assignment are separate decisions.

## Problem Statement

The current login page exposes only invited GitHub sign-in. It has no email/password registration, no pending-account state, no owner approval queue, and no logout control. A person cannot create an account independently, and the owner cannot review an already-created identity before assigning modules.

## Proposed Solution

Keep Better Auth as the identity/session authority and `AuthorizationRepository` as the Phronesis membership/entitlement authority. Enable email/password accounts and retain optional GitHub sign-in. Every newly created identity follows one of two paths:

1. A previously activated direct invitation provisions its specified membership as today.
2. Otherwise Phronesis creates one auditable `PENDING` access request and no membership.

An authenticated person without an active membership is routed to an explicit waiting-room page. An authorized administrator reviews pending requests in Settings, verifies the person out of band, selects a role and at least one exact module/access pair, and approves or rejects the request. Approval atomically creates the active membership and entitlements; rejection creates no membership. Neither account creation nor authentication grants compatibility access on restricted-public ingress.

## Functional Requirements

- Provide a responsive `Create account` flow with name, email, password, password confirmation, safe validation, and a clear owner-approval explanation.
- Provide email/password sign-in while preserving optional GitHub sign-in and timed event-worker access as separate ceremonies.
- Require passwords of at least 12 characters and use Better Auth's password hashing and database-session implementation.
- Create at most one current access request per Better Auth user.
- Never create a membership or entitlement merely because an account exists or a session is valid.
- Route authenticated accounts without an active membership to `/access-pending` rather than a blank shell or generic module-denial page.
- Show pending, approved, and rejected state without exposing another user's data.
- Add an owner-only pending-account queue to Settings.
- Add a prominent generic Sign Up invite link to People & access with resilient Copy, supported-device Share, and Preview actions.
- Prefer the validated `PHRONESIS_RESTRICTED_PUBLIC_ORIGIN` only when `PHRONESIS_RESTRICTED_PUBLIC_MODE=ENABLED` confirms that DNS, tunnel, gateway, and end-to-end checks are active; otherwise derive the invite from the owner's current private application origin.
- Keep the Sign Up invite generic and non-secret. Possession of the link must create no invitation, membership, entitlement, role, module assignment, or approval shortcut.
- Require the owner to select at least one explicit module before approval.
- Let the owner select `VIEW`, `OPERATE`, or `ADMIN` per assigned module using existing entitlement rules.
- Let an Administration Admin add Event Ledger access to an already-approved account while an event is active; the next authorization decision observes the change without event restart or sign-out, and that permanent module access remains until explicitly changed.
- Approval must be atomic, auditable, workspace-scoped, and idempotently fail closed when a request is no longer pending.
- Rejection must be atomic, auditable, and create no membership.
- Preserve direct invitation/activation-code workflows for owner-initiated onboarding.
- Provide a real account menu with identity context, conditional Settings access, and logout.
- Continue enforcing every protected read and mutation in the server authorization layer.

## Non-Functional Requirements

### Performance

Pending-state and account-menu reads use the existing local SQLite database and bounded indexed queries.

### Scalability

The access-request schema is workspace-aware and can support multiple workspaces even though the current product owns one.

### Maintainability

Identity creation, access request lifecycle, membership approval, and module authorization remain separate operations with separate audit actions.

### Reliability

Existing invitations, active memberships, sessions, event-worker access, and optional compatibility mode remain valid through additive migration.

### Accessibility

Forms use associated labels, native input semantics, visible errors, status regions, visible focus, and 44-pixel minimum actions. Pending-account and approval states do not rely on color alone.

### Offline Support

Account creation and authentication require the private Phronesis origin and local authorization database; no offline login is claimed.

### Security

- Better Auth owns password hashing, cookie sessions, rate limiting, and credential validation.
- Phronesis owns memberships, modules, approval state, and audit history.
- Passwords, password hashes, sessions, secrets, and activation codes are never returned by Phronesis administration APIs or written to logs/documentation.
- New accounts receive zero entitlements until explicit approval.
- Owner approval requires `ADMINISTRATION:ADMIN` and same-workspace ownership.
- Until transactional email verification is installed, the owner UI must require an out-of-band identity check before approval and must not claim that the submitted email is verified.
- Invite-link presentation must explain that registration remains pending with zero access and that the recipient may need private-network access when no restricted-public origin is configured.
- Public-ingress compatibility bypass is prohibited by `PHR-TECH-016`.

### Extensibility

Email verification, password reset, passkeys, and MFA may be added through Better Auth after an email/recovery provider and credential lifecycle are approved.

### Responsiveness

Sign-in, sign-up, pending access, account menu, and owner approval must work at 390-pixel phone width and desktop width without horizontal overflow.

## User Stories

- As a trusted collaborator, I want to create my own Phronesis account so I do not need the owner to create my identity.
- As the owner, I want new accounts to wait for my approval so account creation never implies product access.
- As the owner, I want one Sign Up link that I can copy or share so trusted people can request access without me creating their identity first.
- As the owner, I want to assign exact modules and access levels during approval so each person receives only the work they need.
- As an approved person, I want a clear account menu and logout so I understand which identity is active.

## Acceptance Criteria

- A new email/password account creates one pending access request and zero memberships/entitlements.
- The pending account can authenticate but cannot read any protected Phronesis module.
- An owner can approve the request with exact modules, after which the next authorization decision and navigation reflect those modules.
- An owner can reject the request without creating a membership.
- The owner can copy, share on supported devices, preview, and visibly inspect the exact Sign Up link from People & access.
- An explicitly enabled restricted-public origin wins over the current private origin, while an inactive or absent public route produces a usable current-origin `/sign-up` link without inventing a reachable address.
- Existing invitation and active-member behavior remains green.
- Logout invalidates the browser session and returns to sign-in.
- Focused repository/API/UI tests, the full suite, TypeScript, lint, build, diff hygiene, and responsive browser validation pass.

## Edge Cases

- Duplicate email registration returns a safe existing-account error and creates no duplicate request.
- A pending request approved or rejected concurrently changes once; later writes fail closed.
- A user with an existing membership does not receive another pending request.
- A disabled member remains denied and is not silently reactivated by sign-in.
- A direct invitation activated after account creation can provision the existing identity without creating a second account.
- A request whose account was removed remains non-actionable and cannot be approved.
- An owner cannot approve an account with zero modules.
- Native Web Share is unavailable or the user cancels it: Copy and Preview remain available and no false success is shown.
- The custom domain is configured as a future trusted origin but DNS/tunnel activation is not complete: without the separate enabled mode, the invite remains a private-origin link and is labelled accordingly.

## Dependencies

- `PHR-ARCH-011` internal identity and module authorization.
- `PHR-ARCH-012` direct employee activation.
- Better Auth 1.6.25 or a compatible verified release.
- `PHR-TECH-016` for restricted-public custom-domain ingress.

## Future Enhancements

- Verified-email delivery and password reset.
- Passkey enrollment and recovery.
- MFA for Owner/Admin roles.
- Owner-controlled resend/reopen lifecycle for rejected requests.

## Technical Notes

Use an additive `phronesis_access_request` table. Better Auth core tables remain unmodified. User-create hooks either consume a valid activated invitation or append a pending request. Approval creates `phronesis_membership` and `phronesis_entitlement` rows inside one immediate SQLite transaction and records `ACCESS_REQUEST_APPROVED`; rejection records `ACCESS_REQUEST_REJECTED`.

## UI / UX Notes

The sign-in page leads with email/password and offers GitHub only when configured. `Create account` explains that registration does not grant access. The waiting room identifies the signed-in account and tells the user to ask the owner to approve modules. People & access leads with a visually distinct `Invite people` card containing the exact Sign Up URL, Copy, supported-device Share, and Preview actions, followed by pending requests, the existing direct-invitation flow, and active members. Administration copy explicitly says to verify identity out of band.

## Success Metrics

- Zero newly registered accounts receive a module before approval.
- One owner action can approve a verified person and assign all intended modules.
- One owner action can add `EVENT_LEDGER:OPERATE` to an existing approved member without removing that member's other modules.
- Denied/pending users receive a clear recovery path instead of an empty application.

## Open Questions

- Transactional email provider, email verification, password reset, passkeys, and MFA remain separate security decisions.

## Traceability

- Originating prompt: Product Owner request, 2026-08-06.
- Related implementation prompt: `docs/prompts/PHR-ARCH-016-trusted-account-registration-prompt.md`.
- Related technical ingress: `docs/technical/PHR-TECH-016-restricted-public-custom-domain-ingress.md`.
- Related tests: `docs/testing/PHR-ARCH-016-trusted-account-registration-validation.md`.
- Related implementation report: `docs/implementation-reports/PHR-ARCH-016-trusted-account-registration-report.md`.
- Related conformance review: `docs/reviews/PHR-ARCH-016-trusted-account-registration-conformance-review.md`.
- Related release notes: `docs/release-notes/PHR-ARCH-016.md`.
- Last modified: 2026-08-06.
- Modification reason: add discoverable ongoing-event assignment while preserving permanent-account lifecycle, explicit entitlements, and Administration-only mutation.
