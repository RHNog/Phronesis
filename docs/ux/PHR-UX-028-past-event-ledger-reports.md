# PHR-UX-028 — Past Event Ledger Reports

## Feature ID

`PHR-UX-028`

## Title

Past Event Ledger Reports

## Status

Implemented — Privately Live; Product Review Ready

## Priority

High

## Category

UX / UI / Workflow / Event Operations / Reporting

## Objective

Make every closed Event Ledger report easy to find and reopen from the Event Ledger itself, without creating a second ledger or requiring operators to know a hidden URL.

## Background

Phronesis already preserves closed-event reconciliation, immutable activity, and event-stock reports. The Event Ledger currently loads the active event or only the latest closed event, so earlier events remain durable but have no visible archive navigation.

## Problem Statement

Operators cannot discover or select older Event Ledger reports from the product interface. Once a newer event exists, an older event's close totals and activity are effectively hidden.

## Proposed Solution

- Add a prominent `Past event reports` control to the Event Ledger header.
- Present a searchable archive of closed events, newest first, including event identity, date, location, gross sales, purchase spend, closing cash, and variance.
- Open a selected report read-only inside the canonical Event Ledger workspace.
- Preserve a shareable same-origin `eventId` query parameter for direct report access and browser history.
- Provide a one-click return to the current Event Ledger.
- Retain existing sold and leftover CSV report controls for the selected event when Event Stock evidence exists.

## Functional Requirements

- Event Ledger `VIEW` access can list closed reports only for the authorized workspace.
- The archive control remains visible whether an event is active, closed, or not yet created.
- Archive search matches event name, date, and location locally over the bounded result set.
- Selecting a closed event loads its immutable summary and activity by exact event ID.
- Selecting a report never enables transaction, adjustment, reversal, import, or close controls.
- `Back to current event` restores the default active event, or the latest closed event when no event is active.
- A direct `/event-ledger?eventId=<id>` load opens the authorized report.
- Unknown or cross-workspace event IDs fail without exposing event data.

## Non-Functional Requirements

### Performance

Return at most 100 closed-event report summaries per workspace, newest first. Local archive filtering must not trigger a request per keystroke.

### Scalability

The archive contract must allow later pagination without changing report identity or the exact-event snapshot boundary.

### Maintainability

Reuse `PurchaseLedgerRepository`, `EventLedgerSnapshot`, and the existing Event Ledger presentation. Do not introduce duplicate event-report persistence.

### Reliability

Closed summaries must derive from canonical ledger evidence and preserved close fields. A failed report request leaves the current report usable and shows an actionable error.

### Accessibility

Archive controls require explicit accessible names, keyboard operation, visible focus treatment, status text, and at least 44-pixel touch targets.

### Offline Support

No new offline guarantee is introduced. Reports remain available whenever the private Phronesis runtime and local database are reachable.

### Security

Page and API authorization remain `EVENT_LEDGER:VIEW`; every exact-event lookup is workspace-scoped. Query parameters are untrusted input and cannot broaden access.

### Extensibility

The report-index DTO may later add pagination, accounting export, event tags, or aggregate comparisons without altering immutable ledger entries.

### Responsiveness

The archive and report must have no horizontal overflow at 390-pixel phone width and must remain quickly scannable on desktop.

## User Stories

- As an event operator, I want a visible archive inside Event Ledger, so I can reopen any prior event without remembering a URL.
- As an owner, I want to compare preserved closing totals and activity, so I can review past events confidently.
- As a phone user, I want to select and read a prior report with touch-friendly controls, so I can answer event questions away from my desk.

## Acceptance Criteria

- A labelled `Past event reports` control is visible in the Event Ledger header.
- Opening it lists every returned closed event newest first and shows the total report count.
- Search filters by name, location, or event date without another network request.
- Choosing a report renders its preserved cash summary, close reconciliation, Event Stock report access, and immutable activity.
- The selected report has a durable `eventId` URL and browser Back/Forward restores report selection.
- A clear `Back to current event` action is present while a past report is selected.
- No write control is available in a past report.
- Repository, authorization, API, TypeScript, lint, build, desktop, and 390-pixel browser checks pass.

## Edge Cases

- No closed events: show a useful empty archive while leaving event-start controls available.
- An active event exists while a report is open: keep the report read-only and return to the active event on request.
- The selected event is deleted or belongs to another workspace: return a generic not-found error and expose no metadata.
- More than 100 closed events: expose that the current bounded archive is showing the latest 100 until pagination is added.
- Legacy event has no currency or opening cash: retain `Unknown` rather than inventing financial values.
- Browser history changes during a pending fetch: the last selected URL wins.

## Dependencies

- `PHR-WORKFLOW-006` Event Cash Ledger.
- `PHR-WORKFLOW-012` Event Stock Control.
- `PHR-ARCH-012` Employee Activation And Module Access.
- Existing Next.js Event Ledger page and authorized Route Handler.

## Future Enhancements

- Pagination beyond the latest 100 reports.
- Printable/PDF closeout packets and accounting exports.
- Cross-event comparison and aggregate event performance.

## Technical Notes

Add a bounded repository report-index query and an exact workspace-scoped snapshot method. Extend the existing GET Route Handler with optional `eventId`; the client retains one canonical renderer and updates the URL through Next navigation. Summary values remain derived from ledger evidence, while preserved closing fields remain immutable closeout truth.

## UI / UX Notes

Place the archive action beside the event identity in the page header, not at the bottom of the live transaction controls. Use a compact archive panel with a search field and semantic buttons. A selected historical report must be visually labelled `Past event report`, and returning to the current event must require one obvious action.

## Success Metrics

- Any returned prior event report is reachable in two interactions from Event Ledger.
- Zero hidden or cross-workspace event disclosures.
- Zero horizontal overflow at phone and desktop review widths.

## Open Questions

- None blocking this increment.

## Traceability

- Originating prompt: Product Owner request on 2026-08-06 to make past Event Ledger Reports easily accessible from Event Ledger.
- Related implementation prompt: `docs/prompts/PHR-UX-028-past-event-ledger-reports-prompt.md`.
- Related tests: `tests/event-cash-ledger.test.ts`.
- Related release notes: `docs/release-notes/PHR-UX-028.md`.
- Last modified: 2026-08-06.
- Modification reason: Implemented and validated against the private production Event Ledger.
