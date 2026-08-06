# Engineer Report — Event Cash Ledger

Date: 2026-07-31
Feature: `PHR-WORKFLOW-006`

## Outcome

Phronesis now operates one live event drawer from declared opening cash through sale/purchase entry and physical close. A Sale records what was actually sold through one to 25 manual description/quantity rows while retaining one overall customer-payment amount.

## Delivered

- Additive event close fields plus normalized ledger-entry and sold-item tables.
- Workspace-owned, retry-safe Sale, Purchase, Cash Adjustment, reversal, and close operations.
- Separate business totals and signed drawer effects for Cash, Card, Transfer, and Other payments.
- Immutable close-time expected, counted, and variance values.
- Atomic receipt, Inventory intake, and linked ledger Purchase creation; receipt void adds the linked reversal in the same correction transaction.
- Authorized `/api/event-ledger`, dedicated `/event-ledger` navigation, and a responsive fast-entry workspace.
- Canonical Event Ledger setup from Vendor Checkout plus payment method on evaluated receipt checkout.

## Data Semantics

Manual Sale items are human-entered event evidence, not catalogue identities or Inventory dispositions. Card, Transfer, and Other entries change gross Sale/Purchase totals but not drawer cash. Net event cash movement is Sales less Purchases and is never represented as profit. Reversal preserves the original row, and closing freezes the reconciliation evidence at that boundary.

## Verification

Behavioral, authorization, TypeScript, lint, production-build, diff, private-runtime, desktop, and 390px gates pass as recorded in `docs/testing/PHR-WORKFLOW-006-event-cash-ledger-validation.md`. Product Review subsequently identified a missing global phone-navigation path outside the ledger workspace; `PHR-UX-014` remediates that shared-shell defect and raises the clean full-suite evidence to 278/278.
