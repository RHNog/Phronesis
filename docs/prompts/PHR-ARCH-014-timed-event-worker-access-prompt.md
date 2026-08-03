# PHR-ARCH-014 Engineer Work Order

## Project Context

Phronesis uses Better Auth for permanent GitHub identities and SQLite-backed module authorization. Event workers need a separate, temporary access path.

## Feature ID

`PHR-ARCH-014`

## Objective

Implement secure, event-bound, code-generated worker sessions without external identity accounts.

Amendment (2026-08-03): add `ARTWORK_REVIEW` as an independently assignable module for permanent employees and timed workers. Manual review requires `OPERATE`; source refresh and assisted recovery require `ADMIN`, which timed grants cannot receive.

Public-ingress amendment (2026-08-03): implement and activate a separate loopback gateway for browser-only event workers, exposed through an unused Tailscale Funnel port. Preserve the existing 9443 tailnet-only owner path and make public requests fail closed independently of `PHRONESIS_AUTH_MODE=OPTIONAL`.

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
- Add `ARTWORK_REVIEW` to the typed module domain, persistent entitlement schema/migration, employee Settings selectors, timed-worker Settings selector, navigation, page boundary, and review API.
- Preserve least privilege: `ARTWORK_REVIEW:VIEW` reads the queue/images, `OPERATE` records manual decisions and gallery mutations, and `ADMIN` alone runs refresh or assisted recovery.
- Backfill `ARTWORK_REVIEW:ADMIN` only for existing active Owner/Admin memberships; do not silently grant it to operators, viewers, or existing timed sessions.
- Add a loopback-only Node gateway that overwrites a public-ingress marker, blocks owner-only paths, proxies only to the existing local Phronesis service, and supports ordinary HTTP plus connection upgrades.
- At the authorization boundary, detect the gateway marker before compatibility-mode logic and accept only a valid event-access session. Apply the same rule to visible navigation modules.
- Make the event cookie Secure when TLS was terminated upstream and return a module-derived landing destination from code redemption.
- Install the gateway as an independent LaunchAgent, configure its public origin for Settings link generation, and expose only the unused Funnel port `10000`; never alter the existing 9443 Serve mapping.
- Verify public unauthenticated denial, public login availability, owner-only path denial, private owner-path continuity, gateway loopback binding, and Funnel status. Do not create a live test code unless necessary; if created, revoke it after verification.

## Constraints

- Never store or log plaintext codes or session tokens.
- Never insert synthetic workers into Better Auth or permanent membership tables.
- Never grant `ADMINISTRATION` or any `ADMIN` level through event access.
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
