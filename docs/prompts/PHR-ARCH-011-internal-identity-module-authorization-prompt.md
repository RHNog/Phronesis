# PHR-ARCH-011 Engineer Work Order

## Feature ID

`PHR-ARCH-011`

## Objective

Implement invite-only application identity and server-enforced module authorization after `PHR-TECH-009` is accepted.

## Required Reading

- `docs/architecture/PHR-ARCH-011-internal-identity-module-authorization.md`
- Current Next.js authentication, data-security, route-handler, proxy, and mutation guides under `node_modules/next/dist/docs/`
- Existing database and deployment architecture

## Implementation Requirements

- Evaluate the approved self-hosted authentication package against the installed Next.js version before installation.
- Add users, sessions, workspaces, memberships, entitlements, invitations, and authorization audit records.
- Add an invite-only GitHub sign-in experience and a one-time initial-owner bootstrap.
- Enforce entitlements on server routes and mutations.
- Preserve a reversible rollout and existing data ownership.

## Constraints

- No public registration.
- No credentials in Git or logs.
- No hosted identity subscription.
- Any external account or credential creation is a Critical Escalation Condition.

## Acceptance Criteria

- Identity, session, membership, entitlement, denial, and audit tests pass.
- Desktop and phone login flows are accessible and return users to their intended destination.
