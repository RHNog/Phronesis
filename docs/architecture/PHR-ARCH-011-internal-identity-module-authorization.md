# PHR-ARCH-011 — Internal Identity And Module Authorization

## Feature ID

`PHR-ARCH-011`

## Status

Implemented — Activation Pending

## Priority

High

## Category

Architecture / Security / Authentication / Authorization

## Objective

Give Phronesis durable app-level user identity, invite-only access, workspace membership, and server-enforced module entitlements while retaining Tailscale as the private network perimeter.

## Proposed Solution

Introduce self-hosted authentication backed by the existing local database, a single initial Phronesis workspace, memberships with coarse roles, and explicit per-module entitlements. GitHub OAuth is the initial sign-in path; public registration remains disabled. Authorization is enforced in server routes and mutations as well as reflected in navigation.

Rollout is explicit: `DISABLED` preserves the existing tailnet-only review service, `OPTIONAL` supports a reversible compatibility period, and `REQUIRED` enforces authenticated membership. Required mode fails closed unless the base URL, session secret, GitHub credentials, database migration, and initial owner invitation are present.

## Functional Requirements

- Invite-only user activation and persistent desktop/mobile sessions.
- Owner, Admin, Operator, and Viewer roles.
- Independent entitlements for Vendor Workspace, Market Watch, Inventory, Pricing Operations, Intelligence, and Administration.
- Server-side authorization on protected reads and writes.
- Audit records for membership and entitlement changes.
- One documented bootstrap path for the initial owner.

## Non-Functional Requirements

### Security

Session secrets and OAuth credentials remain server-only. Navigation visibility is not an authorization boundary. Every mutation verifies both identity and permission.

### Reliability

Existing private review access remains usable during rollout, with a reversible compatibility period before mandatory login.

### Extensibility

Authentication-provider identity is separate from Phronesis membership and module authorization.

## Acceptance Criteria

- An invited user can authenticate on desktop and phone.
- An uninvited or disabled identity cannot access protected modules.
- Module assignments change both navigation and server behavior.
- Existing local data is not orphaned during owner bootstrap.

## Dependencies

- `PHR-TECH-009` green baseline.
- A documented local database migration and secret-bootstrap procedure.

## Non-Goals

- Public signup.
- Billing, subscriptions, enterprise SSO, or customer tenancy.
- Replacing Tailscale.

## Traceability

- Origin: Product Owner approval on 2026-07-30.
- Implementation prompt: `docs/prompts/PHR-ARCH-011-internal-identity-module-authorization-prompt.md`.
- Designer direction: `docs/design/PHR-ARCH-011-internal-identity-module-authorization.md`.
- Validation: `docs/testing/PHR-ARCH-011-internal-identity-module-authorization-validation.md`.
- Engineer report: `docs/implementation-reports/PHR-ARCH-011-internal-identity-module-authorization-report.md`.
- Conformance review: `docs/reviews/PHR-ARCH-011-internal-identity-module-authorization-conformance-review.md`.
- Release notes: `docs/release-notes/PHR-ARCH-011.md`.
- Last modified: 2026-07-30.
