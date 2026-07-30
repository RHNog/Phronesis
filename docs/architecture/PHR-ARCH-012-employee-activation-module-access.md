# PHR-ARCH-012 — Employee Activation And Module Access

## Feature ID

`PHR-ARCH-012`

## Status

Implemented — Activation Gated

## Priority

High

## Category

Architecture / Security / Authentication / Authorization

## Objective

Allow an owner to provision an employee with only the assigned Phronesis modules through a safe, simple activation experience.

## Proposed Solution

Extend `PHR-ARCH-011` with module selection at invitation time and a single-use, short-lived activation code. Store only a cryptographic hash of the code. Redemption identifies the pending invitation and continues through the configured private identity provider; the code is never a durable credential. Preserve GitHub OAuth as the currently installed identity ceremony and keep passkey-first login as the next activation method once its credential lifecycle is installed and verified. Authentication remains disabled until the owner completes the documented activation gate.

## Functional Requirements

- Owner assigns exact module/access pairs before issuing an invitation.
- Generate a high-entropy single-use activation code and private activation URL.
- Store only a keyed or salted hash, expiry, status, and audit metadata.
- Redeeming a valid code establishes only an activation context; normal identity proof is still required.
- An employee assigned only `VENDOR_WORKSPACE:OPERATE` cannot read Market Watch or Administration APIs.
- Owners can revoke pending invitations and active entitlements.
- Compatibility mode remains reversible while authentication is not activated.

## Non-Functional Requirements

- Codes expire within 24 hours by default and cannot be reused.
- Rate-limit redemption attempts and use constant-time hash comparison.
- Never place codes in logs, documentation, audits, or persistent browser storage.
- Authorization remains server-enforced.

## Acceptance Criteria

- An owner can create an employee invitation with Vendor Workspace-only access.
- The response reveals the activation code exactly once.
- Invalid, expired, revoked, and consumed codes fail closed.
- Module access is enforced on server routes.
- Existing GitHub invitation compatibility remains functional.

## Dependencies

- `PHR-ARCH-011`
- Stable private HTTPS origin.

## Future Enhancements

- Passkey-first enrollment after the Better Auth passkey package, schema migration, recovery path, and stable relying-party configuration pass security review.

## Non-Goals

- Public registration.
- Treating an activation code as a permanent password.
- Removing Tailscale.

## Traceability

- Origin: Product Owner employee-access request, 2026-07-30.
- Related implementation prompt: `docs/prompts/PHR-ARCH-012-employee-activation-module-access-prompt.md`.
- Related tests: `docs/testing/PHR-CARD-SHOW-OPERATIONS-20260730-validation.md`.
- Last modified: 2026-07-30.
- Modification reason: Initial approved specification with security-preserving staged passkey boundary.
