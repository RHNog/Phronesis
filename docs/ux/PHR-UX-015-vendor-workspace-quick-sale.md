# PHR-UX-015 Vendor Workspace Quick Sale

## Feature ID

`PHR-UX-015`

## Title

Vendor Workspace Quick Sale

## Status

Implemented — Product Review Pending

## Priority

High

## Category

UX / UI / Workflow / Event Operations / Cash Control

## Objective

Let a buyer working in Vendor Workspace record an occasional event Sale without leaving the buying workflow, while preserving the Event Ledger as the seller’s full control panel and the only event-cash source of truth.

## Background

Vendor Workspace already records evaluated exact and Bulk purchases into the active Event Ledger. At a card show, a buyer may also sell an item while stationed in the buying workflow. The full `/event-ledger` route supports that Sale, but requiring a route or tab change adds avoidable friction during a live transaction.

## Problem Statement

Purchase intake and manual Sale capture currently exist on separate pages even though they operate on the same active event. A buyer who makes an incidental Sale must interrupt catalogue evaluation, navigate to Event Ledger, record the Sale, and return to Vendor Workspace.

## Proposed Solution

Turn the existing Vendor checkout surface into a compact Event station with two modes: `Purchase intake` and `Quick sale`. Purchase intake remains the default and retains all current behavior. Quick Sale displays the active event and current expected drawer cash, then records one Sale through the existing `/api/event-ledger` contract using the same event identifier, authorization boundary, validation, repository, summary, and audit trail as the full Event Ledger. `PHR-WORKFLOW-012` additively supplies the same exact event-stock picker used by the full ledger while retaining explicit manual/untracked lines.

The embedded mode is deliberately Lite. Event creation, full activity, cash adjustments, reversal, receipt correction, close/reconciliation, and historical review remain owned by `/event-ledger`, which stays one action away.

## Functional Requirements

- Rename the Vendor Workspace event surface from a purchase-only checkout presentation to an Event station without changing its purchase workflow.
- Default the station to `Purchase intake` and provide a one-tap `Quick sale` mode.
- Load the current `EventLedgerSnapshot` when Quick Sale opens.
- Show the active event identity, currency, current expected cash, and gross sales before entry.
- Record a Sale with one positive overall amount, payment method, optional note, and one to 25 exact event-stock or manual description/quantity rows.
- Search the active local event-stock manifest through the shared exact-option editor and preserve an explicit untracked-item action.
- Default payment to Cash and quantity to one.
- Submit `record-sale` to `/api/event-ledger` with the active event ID and a retry-stable idempotency key.
- Replace the local snapshot with the API response so expected cash and gross sales update immediately after success.
- Clear transaction fields only after confirmed persistence and return focus to the amount field.
- Preserve entered values after validation, authorization, network, or server failure.
- Link to the full Event Ledger for activity, adjustments, correction, reversal, and close.
- If no active event exists, direct the operator to start one in Event Ledger; do not duplicate event setup in Vendor Workspace.
- If the user lacks `VENDOR_WORKSPACE:OPERATE`, expose the Lite summary without mutation controls and explain the access requirement.

## Non-Functional Requirements

### Performance

Opening Quick Sale performs one event-ledger read. Event-stock search is bounded to the active local manifest. Recording performs one bounded existing ledger transaction and returns its refreshed snapshot; no global catalogue/provider or Inventory scan is introduced.

### Scalability

The Lite surface uses the canonical Sale draft and API contract, so payment methods and ledger persistence evolve in one place.

### Maintainability

Vendor Workspace must not implement a second event repository, cash calculation, validation rule, or endpoint. Lite-specific state is presentation-only.

### Reliability

Failed writes retain the form and idempotency key for safe explicit retry. Duplicate taps cannot create duplicate Sales.

### Accessibility

Mode controls expose pressed state. All inputs have visible labels, status/error output is announced, focus is restored after success, and every interactive target is at least 44px.

### Offline Support

No optimistic Sale is shown as persisted. Network failure keeps the draft available for retry.

### Security

Reads and writes continue through the existing independently authorized Event Ledger Route Handler. The Lite UI receives the page’s effective Operate capability but never replaces server authorization.

### Extensibility

The Event station can host future separately approved operator shortcuts, but the full ledger remains owner of event control and audit recovery.

### Responsiveness

At 390px, the mode switch, event summary, amount, item rows, payment methods, note, Record action, and full-ledger link must remain usable without horizontal overflow.

## User Stories

- As a buyer, I can record an incidental Sale without losing my Vendor Workspace context.
- As a seller, I see that buyer-recorded Sale in the same Event Ledger and drawer totals as every other event transaction.
- As an event manager, I retain one place for adjustments, reversals, close, and full audit history.

## Acceptance Criteria

- Vendor Workspace exposes Purchase intake and Quick sale modes, with Purchase intake selected initially.
- Quick Sale posts to the canonical Event Ledger API and active event ID; no separate ledger persistence exists.
- A successful Cash Sale immediately increases expected cash and gross sales in the returned Lite summary and is visible after loading `/event-ledger`.
- A non-cash Sale increases gross sales but not expected cash.
- One Sale accepts multiple exact event-stock or manual rows; only explicit event-stock links move the local manifest, and no global Inventory mutation occurs.
- Failures preserve the complete draft and retries remain idempotent.
- No active event, closed event, and view-only states are explicit and safe.
- Existing Vendor purchase intake remains behaviorally unchanged.
- Deterministic tests, TypeScript, lint, build, diff hygiene, private runtime, desktop, and 390px browser review pass.

## Edge Cases

- The active purchase event and event-ledger snapshot disagree: fail closed and direct the operator to the full Event Ledger.
- Event currency is unknown on a legacy event: present `Unknown` rather than inventing a currency.
- Quantity is blank, fractional, below one, or above 1,000: reject without clearing the form.
- A 25-item Sale cannot add a 26th row.
- A write races with event close: preserve the draft and show the API error.
- Switching between Purchase intake and Quick sale does not discard an unsaved Sale draft during the mounted Vendor Workspace session.

## Dependencies

- `PHR-WORKFLOW-006` Event Cash Ledger.
- `PHR-WORKFLOW-012` Event Stock Control.
- Existing `/api/event-ledger` GET and `record-sale` POST contract.
- Existing `/api/purchases` and Vendor checkout behavior.
- `PHR-ARCH-011` module authorization.

## Future Enhancements

- Event-specific quick-item presets under a separate workflow decision.
- Cross-device live event updates under a separate synchronization design.

## Technical Notes

Implement a focused client component under `features/events/` and mount it inside Vendor checkout. The component may own its form and current returned snapshot but must not access the purchase repository directly. Vendor page composition should pass effective Operate capability down for presentation; the API remains authoritative.

## UI / UX Notes

Use a two-button station switch. Quick Sale should be visibly lighter than the full ledger: two compact summary values, direct entry, and a secondary `Open full Event Ledger` link. Use emerald treatment for Sale while retaining cyan as the shared shell/action accent.

## Success Metrics

- An active-event one-item Cash Sale requires one mode tap, amount, exact option selection or manual description, and Record action.
- Zero route changes are required for buyer-side Sale capture.
- Zero duplicate or divergent event records between Vendor Workspace and Event Ledger.

## Open Questions

- None blocking. Full event control remains intentionally outside the Lite surface.

## Traceability

- Originating direction: Product Owner request on 2026-07-31 to add a Lite Event Ledger inside Vendor Workspace, assigned as `PHR-STRUCT-20260731-004`.
- Related implementation prompt: `docs/prompts/PHR-UX-015-vendor-workspace-quick-sale-prompt.md`.
- Related workflow: `docs/workflows/PHR-WORKFLOW-006-event-purchase-ledger.md`.
- Related tests: `tests/event-cash-ledger.test.ts` and `tests/event-stock-control.test.ts`.
- Related release notes: `docs/release-notes/PHR-UX-015.md`.
- Last modified: 2026-07-31.
- Modification reason: implementation, deterministic verification, isolated cross-surface browser validation, and additive shared event-stock selection completed.
