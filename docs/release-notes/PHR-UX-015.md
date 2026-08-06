# PHR-UX-015 — Vendor Workspace Quick Sale

## 2026-07-31 — Product Review Ready

- Vendor Workspace now includes an Event station with Purchase intake and Quick Sale, so a buyer can record an incidental Sale without leaving the workspace.
- Quick Sale accepts one overall amount, one to 25 sold-item descriptions and quantities, Cash/Card/Transfer/Other payment, and an optional note.
- Both Vendor Workspace and the full Event Ledger use the same active event, authorized API, repository, drawer calculation, idempotency rule, summary, and audit history.
- The full Event Ledger remains the owner of event start, activity, cash adjustments, reversals, correction, close, and reconciliation.
- An isolated live review proved a two-item $25.50 Cash Sale across both surfaces, including the same $125.50 expected drawer; 279/279 tests, TypeScript, lint, build, private health, phone/desktop responsiveness, and clean-console gates pass.
- `PHR-WORKFLOW-012` subsequently adds the same exact event-stock picker to both Sale surfaces while retaining manual/untracked entry and the single Event Ledger boundary.
