# PHR-ARCH-011 Engineer Report

Date: 2026-07-30
Feature: `PHR-ARCH-011`

## Outcome

Phronesis now contains a self-hosted, invite-only identity and module-authorization foundation. It is fully reversible and disabled by default until credentials, owner bootstrap, advisory disposition, and live callback verification are authorized.

## Implementation

- Added Better Auth with built-in Node SQLite support, database sessions, GitHub-only social configuration, rate limiting, and an invite-only user-creation hook.
- Added Phronesis-owned workspace, membership, role, entitlement, invitation, and append-only authorization-audit tables.
- Added Owner, Admin, Operator, and Viewer defaults plus independent View, Operate, and Admin access for six modules.
- Added secure Data Access Layer checks for pages, Route Handlers, and administration mutations.
- Added optimistic Next.js 16 Proxy redirects while keeping secure checks close to data and mutation boundaries.
- Added Settings controls for local invitations and per-member module assignment.
- Added one-command schema migration and initial-owner invitation scripts.
- Added `DISABLED`, `OPTIONAL`, and `REQUIRED` rollout modes; only a fully configured required mode enforces login.

## Verification

210/210 tests, standalone TypeScript, warning-free lint, production build, migration, diff, and responsive sign-in/compatibility-state review pass.

## Remaining external activation

No GitHub OAuth application or secret was created. Live authentication and user mutation remain gated by Product Owner credentials/authority and the documented dependency-advisory decision.

## Negative-effect declaration

Existing tailnet access, pricing, watchlists, catalogue data, provider behavior, decision logic, and deployment state are unchanged.
