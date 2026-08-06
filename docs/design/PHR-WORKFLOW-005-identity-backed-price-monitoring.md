# PHR-WORKFLOW-005 Designer Direction

Date: 2026-07-30
Verdict: **DIRECTION APPROVED FOR IMPLEMENTATION**

This is a same-session Designer gate and is not represented as independent approval.

## Primary journey

1. The operator searches every loaded catalogue in Vendor Workspace.
2. The operator selects the exact artwork, finish, condition, and language.
3. One primary `Track price` action creates membership in the user's default Market Watch list.
4. The action confirms inline. It does not open a setup dialog or require a target price.
5. A short-lived `Undo` action removes only the new membership.
6. Target price, notes, and later alert preferences remain optional follow-up controls in Market Watch.

## Persistence and migration experience

- The server is authoritative after the first successful synchronization.
- Existing browser-local entries are merged idempotently and retained locally as a recoverable cache; they are never deleted during migration.
- While authentication is disabled, persistence uses one explicit legacy-local owner. Activation must claim that owner through a reviewed migration rather than silently guessing a user.
- Loading, synchronization, mutation failure, and access denial have distinct text states. Failure never clears the last rendered entries.

## Responsive behavior

- Desktop keeps the tracking action beside snapshot evidence so the operator does not leave the buying workflow.
- Mobile keeps the same action immediately after exact variant and condition selection with a minimum 44px target.
- Confirmation and undo use an `aria-live` status and never rely on color alone.

## Accessibility

- The action has a stable accessible name and exposes progress with disabled/busy state.
- Duplicate tracking reports `Already tracking`; it does not create a second membership or misleading undo.
- Authentication interruption preserves the pending action in session storage and returns to Vendor Workspace after sign-in.
- Module denial explains that Market Watch access is required.
