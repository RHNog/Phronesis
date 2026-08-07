# PHR-WORKFLOW-017 Validation

Date: 2026-08-06

Result: Pass — implemented, privately live, and Product Review ready.

## Automated evidence

- `tests/ongoing-event-team-access.test.ts` proves an approved account denied Event Ledger before assignment is authorized on the very next repository decision after the owner adds `EVENT_LEDGER:OPERATE`; its prior Artwork Review entitlement remains intact.
- The same test file proves a temporary code can be created after event opening with exactly `EVENT_LEDGER:OPERATE`, redeems once, denies Inventory, and fails immediately after that event closes.
- Static contracts prove permanent Administration Admin gating, permanent-membership presence, active-only/current-report rendering, account/sign-in routes, accessible disclosure state, exact embedded entitlement, current-event grant filtering, Event Ledger presets, and non-destructive immediate membership persistence.
- Focused ongoing/timed access coverage: 13/13 pass.
- Full supported suite: 449/449 pass.
- `npx tsc --noEmit`: pass.
- `npm run lint`: pass with no warnings.
- `npm run build`: pass on Next.js 16.2.12, including the dynamic Event Ledger and existing administration/event-access routes.
- `git diff --check`: pass.

## Live private evidence

- Rebuilt runtime is active in detached session `phronesis-scanner-review`; loopback port `3200` is owned by the new process and `https://ramons-mac-studio.tailaa2d39.ts.net:9444/event-ledger` returns HTTP 200.
- Active `Battlezone Card Show` renders `Event team` between Sale ownership and Opening Display Stock.
- The current compatibility principal receives the truthful `Sign in to manage event team` action rather than an administration form that would fail server authorization.
- Desktop 1280×720 review has no horizontal overflow: document width 1,265 equals client width 1,265 inside the 1,280 viewport.
- Phone 390×844 review starts at scroll position zero, retains the reachable safe-area toolbar, and has no horizontal overflow: document/client width 375 inside the 390 viewport.
- The phone sign-in action is 44 pixels high; the Event team card remains inside 16-pixel page insets.
- Opening the existing closed report by its `eventId` produces a read-only historical report with no Event team region.
- Browser warning/error count: zero.

## Data and security evidence

- No live account, access request, membership, entitlement, temporary grant, session, sale, purchase, product owner, or event state was created or changed during validation.
- Existing administration APIs remain identity-required and no compatibility or temporary-session bypass was introduced.
- Plaintext worker codes remain creation/rotation response data only, with the existing same-tab session-storage recovery boundary.

## Residual boundaries

- Permanent Event Ledger module access does not auto-expire at event close; the administrator must change or disable it.
- Account-bound access that expires with one event requires a separately specified identity-bound event-grant model.
- The current live compatibility session must transition through permanent owner sign-in before real access administration can be exercised.
- Messaging delivery, shift schedules, activity summaries, verified email, recovery, passkeys, and MFA remain separate work.
