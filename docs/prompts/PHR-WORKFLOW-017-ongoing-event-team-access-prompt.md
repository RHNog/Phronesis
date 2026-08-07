# Implementation Prompt — PHR-WORKFLOW-017 Ongoing Event Team Access

## Project Context

Phronesis has permanent Better Auth identities with application-owned module entitlements and account-free event-bound worker sessions. Both already authorize the canonical Event Ledger, but their management is hidden in separate Settings panels.

Documentation is part of implementation. Follow the feature specification before changing code.

## Feature ID

`PHR-WORKFLOW-017`

## Objective

Make adding approved accounts or temporary workers to an already-active Event Ledger explicit, safe, and reachable from the ledger itself.

## Required Reading

- `docs/workflows/PHR-WORKFLOW-017-ongoing-event-team-access.md`
- `docs/architecture/PHR-ARCH-011-internal-identity-module-authorization.md`
- `docs/architecture/PHR-ARCH-014-timed-event-worker-access.md`
- `docs/architecture/PHR-ARCH-016-trusted-account-registration.md`
- `docs/workflows/PHR-WORKFLOW-006-event-purchase-ledger.md`
- Relevant Next.js Server/Client Component, navigation, and authentication guides in `node_modules/next/dist/docs/`.

## Implementation Requirements

- Add an active-ledger Event team surface that distinguishes approved-account access from temporary event access.
- Determine management visibility from request-time permanent `ADMINISTRATION:ADMIN` authorization; compatibility and temporary identities cannot manage access.
- Link approved-account management to Settings → People & access.
- Add an Event Ledger-only preset for pending approvals and direct invitations.
- Add a one-action Event Ledger helper for existing memberships that persists `EVENT_LEDGER:OPERATE` without removing other modules.
- Reuse `EventAccessManagement` through an Event Ledger-only variant that always submits exactly `EVENT_LEDGER:OPERATE` for the current active event.
- Keep the embedded management form collapsed until requested and filter its history to the current event's Event Ledger grants.
- Preserve existing one-time-code, hash, expiry, audit, revocation, rotation, throttling, public-login, and event-close behavior.
- Do not render the team workflow inside a closed historical report.

## Constraints

- Do not add a second Event Ledger, duplicate membership store, synthetic account, or new authorization bypass.
- Do not let `EVENT_LEDGER:ADMIN` substitute for `ADMINISTRATION:ADMIN` in this release.
- Do not grant permanent access automatically from a temporary code.
- Do not imply that permanent module access auto-expires when the event closes.
- Do not expose plaintext codes through list APIs, logs, documentation, or durable storage.

## Expected Architecture

Event Ledger Server Component authorization → serializable management state → active-ledger client disclosure → existing permanent People & access or existing identity-required event-access API → existing authorization repositories → canonical Event Ledger page/API checks.

## Testing Expectations

- Repository test proving an active permanent membership's Event Ledger entitlement changes the next authorization decision without event restart.
- Event grant test proving post-opening issuance, single-use redemption, exact Event Ledger Operate scope, and immediate event-close invalidation.
- Static tests proving server-side manager gating, active-only rendering, Settings presets, non-destructive existing-member helper, embedded exact entitlement, and current-event filtering.
- Full tests, TypeScript, lint, production build, diff hygiene, private health, desktop and 390-pixel browser review.

## Documentation Updates

- Feature Registry, Atlas, Decisions, Roadmap, Prompt History, Sprint History, Changelog, Agent Handoff, Current CTO Structure, Product Development Memory, implementation report, validation, conformance review, and release notes.

## Acceptance Criteria

- Every acceptance criterion in `PHR-WORKFLOW-017` passes with no persistent QA account or worker grant left behind.

## Non-Goals

- Event-specific permanent-account grants, messaging delivery, shift scheduling, user activity analytics, or public-domain activation.

## Notes For AI Coding Agents

- Preserve unrelated user changes.
- Use the existing identity-required APIs as the mutation boundary.
- Keep the two access lifecycles explicit in UI copy and tests.
