# PHR-ARCH-017 — Personal Market Settings Implementation Prompt

## Project Context

Project Phronesis uses Better Auth identity plus Phronesis-owned workspace memberships and module entitlements. Documentation is part of implementation.

## Feature ID

`PHR-ARCH-017`

## Objective

Create an active-member-only My settings surface for provider choices and personal regional cost overrides, and apply the effective preferences to Vendor Workspace and regional arbitrage.

## Required Reading

- `docs/architecture/PHR-ARCH-017-personal-market-settings.md`
- `docs/architecture/PHR-ARCH-011-internal-identity-module-authorization.md`
- `docs/architecture/PHR-ARCH-016-trusted-account-registration.md`
- `docs/design/PHR-MARKET-PERSONALIZATION-20260807.md`

## Implementation Requirements

- Add secure active-member page/API authorization independent of Administration.
- Add additive workspace/user provider and cost-override persistence with audit.
- Default every currently included provider to enabled and require at least one.
- Merge personal non-null values over workspace regional policy.
- Add My settings to the account menu and keep Administration settings distinct.
- Apply preferences to evidence visibility and signed-in regional economics.

## Constraints

- Do not expose credentials, broaden modules, admit timed workers, or permit cross-user reads/writes.
- Do not make null synonymous with zero.

## Expected Architecture

The authorization database owns personal settings; an active-member DAL resolves workspace/user; one repository returns stored and effective DTOs; the UI mutates through an authenticated route.

## Testing Expectations

- Migration, defaults, persistence, cross-user denial, pending/disabled/timed denial, effective merge, provider visibility, restricted-public compatibility, full suite, type, lint, build, and responsive review.

## Documentation Updates

- Specification, validation, report, review, release notes, registry, state/roadmap, prompts, changelog, and product memory.

## Acceptance Criteria

- An active non-admin member can safely configure and consume only their own provider and cost preferences.

## Non-Goals

- Provider billing, credentials, subscriptions, personal module assignment, or MFA.

## Notes For AI Coding Agents

- Keep secure authorization in the DAL/route, not only in navigation.
