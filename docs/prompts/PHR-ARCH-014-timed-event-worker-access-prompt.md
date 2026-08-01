# PHR-ARCH-014 Engineer Work Order

## Project Context

Phronesis uses Better Auth for permanent GitHub identities and SQLite-backed module authorization. Event workers need a separate, temporary access path.

## Feature ID

`PHR-ARCH-014`

## Objective

Implement secure, event-bound, code-generated worker sessions without external identity accounts.

## Required Reading

- `docs/architecture/PHR-ARCH-014-timed-event-worker-access.md`
- `docs/architecture/PHR-ARCH-011-internal-identity-module-authorization.md`
- `docs/architecture/PHR-ARCH-012-employee-activation-module-access.md`
- `docs/workflows/PHR-WORKFLOW-006-event-purchase-ledger.md`

## Implementation Requirements

- Add hashed event grants, hashed sessions, redemption throttling, audit entries, and repository APIs.
- Extend normal module authorization to accept a valid temporary cookie after checking permanent identity.
- Keep identity-required administration APIs permanent-identity-only.
- Add administration APIs/UI for generation, listing, copying, and revocation.
- Add mobile-ready `/event-access` redemption and temporary logout.
- Reject grants when the event is absent/closed and reject disallowed modules or `ADMIN` access.

## Constraints

- Never store or log plaintext codes or session tokens.
- Never insert synthetic workers into Better Auth or permanent membership tables.
- Never grant `ADMINISTRATION` through event access.
- Preserve OPTIONAL-mode compatibility behavior while making temporary access testable; production enforcement still requires REQUIRED mode.

## Expected Architecture

`EventAccessRepository` owns grant/session persistence and authorization. Route handlers own cookie issuance/deletion. `requestAuthorization` checks permanent Better Auth identity first, then temporary event access, while `authorizeIdentityRequired` remains unchanged.

## Testing Expectations

- Repository lifecycle and authorization tests.
- Route/request authorization integration tests where practical.
- TypeScript, lint, full supported suite, production build, and responsive visual verification.

## Documentation Updates

- Feature Registry, Atlas, Decisions, Roadmap, prompt history, changelog, release notes, validation, implementation report, conformance review, Structure, handoff, and Product Development Memory.

## Acceptance Criteria

- All acceptance criteria in `PHR-ARCH-014` pass with evidence.

## Non-Goals

- Password accounts, social-provider replacement, public registration, or offline redemption.
