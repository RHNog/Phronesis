# Event Cash Ledger

## Added

- Event start with USD or BRL currency and explicit opening cash, including valid zero cash.
- Fast manual Sale and Purchase entry with Cash, Card, Transfer, or Other payment method.
- One to 25 required item descriptions and quantities inside one Sale and one overall sale amount.
- Expected drawer cash, gross sales, purchase spend, non-cash totals, net cash movement, and recent immutable activity.
- Reasoned Cash In/Out adjustments, non-destructive manual reversal, physical closing count, and over/short variance.
- Dedicated Event Ledger navigation and a canonical path from Vendor Checkout.
- Vendor Workspace Event station with a Lite Quick Sale mode that records into the same active Event Ledger and returns its updated cash summary.
- `PHR-UX-028` closed-event archive inside Event Ledger with search, summary previews, exact read-only report URLs, and current-event return.

## Reliability And Evidence

- Mutations are workspace-owned, transactional, and retry-safe where duplicate submission can occur.
- Manual Sales do not require or mutate catalogue or Inventory records.
- Evaluated purchase receipt, Inventory intake, and linked ledger Purchase commit together.
- Receipt void preserves the original evidence and appends the matching ledger reversal.
- Close-time expected cash and variance remain preserved after later administrative correction.

## Follow-Up

Product Review is pending. Payment capture, tax, settlement, accounting export, customer CRM, multi-currency drawers, and automatic manual-sale Inventory reconciliation remain separate future decisions.
