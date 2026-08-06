# PHR-UX-028 — Past Event Ledger Reports Conformance Review

Status: Conforming — Privately Live; Product Review Ready.

Review boundary: same-session architecture and implementation conformance; not independent Product Owner approval.

The implementation conforms to the specification. Past reports are discoverable in one interaction from the Event Ledger header, searchable without per-keystroke requests, preview canonical totals, open through an exact durable URL, and return to the current ledger in one action.

Architecture remains single-source: no report table, duplicate ledger, or client-owned financial calculation was introduced. `PurchaseLedgerRepository` owns bounded discovery and exact snapshot assembly; the Route Handler retains `EVENT_LEDGER:VIEW`; exact IDs are workspace-scoped and active/unknown/foreign events share a generic denial.

Historical presentation is read-only even for an operator with write access. Existing summary, reconciliation, Event Stock, report-download, and activity surfaces are reused, while transaction, reversal, close, import, and new-event entry remain unavailable for a selected historical report.

Automated and live private evidence is recorded in `docs/testing/PHR-UX-028-past-event-ledger-reports-validation.md`.
