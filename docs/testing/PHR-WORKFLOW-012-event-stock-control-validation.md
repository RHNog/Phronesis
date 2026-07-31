# PHR-WORKFLOW-012 Event Stock Control Validation

Date: 2026-07-31

Feature: `PHR-WORKFLOW-012`

Verdict: **PASS — PRODUCT REVIEW PENDING**

## Contract Verification

- Native Google Sheet title, Instructions tab, Event Inventory tab, exact ordered headers, frozen headers, filter, price formatting, whole-number Quantity validation, and owner-scoped sharing state were inspected through the Google Sheets API and rendered UI.
- CSV parsing proves BOM support, quoted comma/newline handling, US/Brazilian price presentation, exact cents, five exact headers, positive whole quantities, 10,000-row/2 MiB limits, and duplicate option rejection.
- Import persists source filename, SHA-256, contract version, row count, total units, actor, and timestamp. Same bytes are idempotent; a different snapshot is allowed only before the first tracked Sale.
- Both Sale surfaces import the same `EventSaleItemsEditor`; only the authorized event-inventory API searches stock, and both submit the selected `inventoryItemId` to canonical `record-sale`.
- The server replaces client text with imported name/variation/color/list price and rejects duplicate selection or oversell inside the ledger transaction.

## Transaction And Report Verification

- Disposable SQLite/API workflow: created one event, imported three options and seven opening units, found the exact option, and recorded one mixed Sale with two tracked option rows plus one untracked row.
- After Sale: three tracked units sold, four expected remaining, one untracked unit, and three item rows in the sold report.
- Physical count evidence recorded variance `-1` without changing expected quantity.
- Reasoned reversal restored seven expected units and removed the reversed manual Sale from the active untracked-unit summary while retaining report/audit history.
- Leftover report contains opening, sold, expected, counted, and variance evidence; sold report labels the transaction amount `Whole Sale Total` and preserves imported unit list price separately.

## Performance And Deterministic Gates

- Synthetic 10,000-option manifest size: 370,040 bytes.
- Local import: 98.86 ms.
- Five exact searches: 28.12–33.99 ms; median 29.93 ms, below the 100 ms requirement on the review machine.
- Full behavioral suite: 284/284 passed.
- Standalone TypeScript: zero diagnostics.
- Repository-wide ESLint: zero warnings or errors.
- Next.js 16.2.12 production build: passed with `/api/event-inventory` and `/event-ledger` registered.
- `git diff --check`: passed.
- Private service: launch agent running, loopback status returned five current catalogues after the final rebuild.

## Responsive And Safety Review

- Private Event Ledger at 390 × 844 exposed the native Sheet link, CSV template, exact columns, import control, truthful no-manifest/manual fallback, and immediately reachable Sale form.
- Document width and body width both measured 375px; horizontal overflow was zero.
- Browser logs contained development information only and no warning/error entry.
- Physical count rows are behind a labelled, keyboard-operable `Physical verification` disclosure, preventing a large manifest from obstructing live Sale entry.
- No persistent user event, external transaction, public Sheet, credential, dependency, commit, or push was created.
