# PHR-ARCH-012 Engineer Work Order

## Feature ID

`PHR-ARCH-012`

## Objective

Add module selection at invitation time and a safe single-use employee activation-code ceremony.

Enhancement (2026-07-31): make `EVENT_LEDGER` and `EVENT_FLIP` independently selectable and server-enforced permissions. Migrate existing `VENDOR_WORKSPACE` and `INVENTORY` entitlements respectively so no active employee loses established access.

## Required Reading

- `docs/architecture/PHR-ARCH-012-employee-activation-module-access.md`
- `docs/architecture/PHR-ARCH-011-internal-identity-module-authorization.md`
- Local Next.js authentication, route-handler, server/client, forms, and environment guides.

## Implementation Requirements

- Generate and hash high-entropy codes; reveal a code only in the creation response.
- Add redemption status and activation-context flow without making codes permanent credentials.
- Assign exact module/access pairs before invitation creation.
- Preserve server authorization, auditability, revocation, compatibility mode, and GitHub identity proof.

## Constraints

- No public signup, secret logging, reduced authorization, external OAuth mutation, or mandatory auth activation.
- Passkey installation remains gated until its schema, recovery, and relying-party lifecycle are verified.

## Testing Expectations

- Code lifecycle, expiry, replay, module authorization, route validation, and full repository gates.

## Documentation Updates

- Shared validation, release note, report, conformance, activation runbook, registry, roadmap, and memory.

## Acceptance Criteria

- The specification acceptance criteria pass with authentication still safely activation-gated.
