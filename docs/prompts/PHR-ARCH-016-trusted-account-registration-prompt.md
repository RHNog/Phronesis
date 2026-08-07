# PHR-ARCH-016 Engineer Work Order

## Project Context

Phronesis already uses Better Auth database sessions plus application-owned memberships and module entitlements. Documentation is part of implementation.

## Feature ID

`PHR-ARCH-016`

## Objective

Implement account-first registration with zero access until explicit owner approval and exact module assignment.

## Required Reading

- `docs/architecture/PHR-ARCH-016-trusted-account-registration.md`
- `docs/architecture/PHR-ARCH-011-internal-identity-module-authorization.md`
- `docs/architecture/PHR-ARCH-012-employee-activation-module-access.md`
- Current Next.js authentication, data-security, Route Handler, and Proxy guides under `node_modules/next/dist/docs/`
- Current Better Auth email/password, client, session, and database-hook documentation

## Implementation Requirements

- Add an append-only/auditable access-request lifecycle to `AuthorizationRepository`.
- Enable Better Auth email/password with a 12-character minimum while retaining GitHub when configured.
- Create sign-up and email sign-in UI, pending-access UI, owner approval/rejection UI, and account/logout UI.
- Add a prominent People & access invite card that exposes one generic Sign Up URL with the shared resilient Copy control, native Share when supported, and a Preview action.
- Build the link from validated `PHRONESIS_RESTRICTED_PUBLIC_ORIGIN` only when `PHRONESIS_RESTRICTED_PUBLIC_MODE=ENABLED`; otherwise use the hydrated current private origin and never hard-code or advertise an inactive deployment hostname.
- State explicitly that the link grants zero access and that owner identity verification plus module approval remain mandatory.
- Preserve invitation activation and current members.
- Enforce zero modules before approval in DAL, pages, APIs, and navigation.
- Add owner-only access-request administration endpoints with strict validation.

## Constraints

- Do not invent an email verification or password-reset provider.
- Do not expose passwords, hashes, secrets, sessions, or activation codes.
- Do not grant a default module.
- Do not put a credential, token, email, entitlement, role, workspace identity, or preapproval decision in the generic Sign Up URL.
- Do not weaken existing server-side entitlement enforcement.
- Preserve event-worker access as a separate ceremony.

## Expected Architecture

Better Auth owns identity and sessions. `AuthorizationRepository` owns pending access, membership, entitlements, and audit. Client forms call Better Auth only for authentication and owner-authorized Phronesis APIs only for access decisions.

## Testing Expectations

- Repository tests for request, approve, reject, idempotency, existing membership, and audit behavior.
- Auth configuration/hook tests for account-first registration.
- API/UI contract tests for strict administration and pending-state routing.
- UI/origin tests for restricted-public precedence, private-origin fallback, generic-link safety, Copy/Share/Preview controls, and phone-width presentation.
- Full suite, TypeScript, lint, build, diff hygiene, and desktop/phone browser checks.

## Documentation Updates

- Validation and release notes for `PHR-ARCH-016`.
- Feature Registry, Atlas, Decisions, Roadmap, Prompts, Current CTO Structure, and Conversation History.

## Acceptance Criteria

The complete acceptance criteria in the feature specification pass without activating public infrastructure.

## Non-Goals

- Transactional email, password reset, passkeys, MFA, billing, or customer tenancy.

## Notes For AI Coding Agents

- Preserve unrelated user changes.
- Treat same-session review as non-independent.
