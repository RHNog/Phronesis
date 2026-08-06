# PHR-UX-028 — Past Event Ledger Reports

- Added a prominent `Past event reports` archive directly to Event Ledger.
- Added newest-first closed-event cards with date, location, gross sales, purchase spend, and closing variance previews.
- Added local archive search by event name, location, or date.
- Added exact read-only report reopening with preserved cash summary, close reconciliation, Event Stock evidence, report downloads, and immutable activity.
- Added durable `eventId` report URLs, browser Back/Forward restoration, and one-click return to the current event.
- Kept every report lookup workspace-scoped behind `EVENT_LEDGER:VIEW`; active, unknown, and cross-workspace report IDs fail closed.
- Kept historical reports read-only even for operators with Event Ledger write access.
- Limited the initial archive to the latest 100 closed events and labelled that boundary when reached; pagination remains future work.
