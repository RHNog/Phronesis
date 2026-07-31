# Designer Direction — PHR-WORKFLOW-006 Event Cash Ledger

## Interaction Hierarchy

The operator's first question is “What should be in the drawer?” The next action is “Record this Sale or Purchase.” Audit detail follows after those two needs.

## Start State

- Show event name, date, location, currency, and opening cash in one compact form.
- Opening cash is required but zero is valid.
- Do not show transaction controls until the event starts.

## Active Event

- Lead with one dominant Expected Cash value.
- Keep Gross Sales, Purchase Spend, and Net Cash Movement visible but secondary.
- Use a two-option Sale/Purchase segmented control; default to Sale.
- Default payment method to Cash with Card, Transfer, and Other as one-tap alternatives.
- A Sale always starts with one `Item sold` description and quantity `1`.
- `Add another item` appends another description/quantity row inside the same Sale.
- Use one overall Sale amount; do not require price allocation per sold item.
- Notes are optional and secondary.
- Record directly without a confirmation modal. On success, clear the entry and return focus to fast entry.

## Vendor Workspace Lite Event Ledger

- Present one compact Event station with `Purchase intake` selected initially and `Quick sale` one tap away.
- Keep the Quick Sale draft mounted when the operator changes station modes so unfinished work is not discarded.
- Lead the Lite surface with current Expected Cash and Gross Sales from the canonical Event Ledger snapshot.
- Reuse the same overall Sale amount, one-to-25 described-item rows, payment methods, optional note, and direct Record action as the full ledger.
- Do not duplicate event start, activity, cash adjustment, reversal, close, or reconciliation. Provide a clear `Open full Event Ledger` link for those controls.
- A successful Sale updates the Lite summary immediately and clears only the confirmed draft.
- Use `Lite Event Ledger` and `Quick sale` language so the buyer understands this is a constrained window into the shared seller control, not another ledger.

## Activity And Recovery

- Newest entries appear first and identify Sale, Purchase, Adjustment, or Reversal in words and sign.
- Show every sold-item line under its Sale.
- Offer a visible Undo/Reverse action only for eligible manual entries and require a reason before committing the reversal.
- Linked Vendor purchase entries route correction through receipt administration.

## Closing

- Show expected cash before asking for actual counted cash.
- Calculate and label the result as Over, Short, or Balanced.
- Keep gross sales, purchase spend, cash/non-cash split, and transaction count in the closed summary.
- Never label net cash movement as profit.

## Responsive Behavior

- Desktop: summary and quick entry may sit beside activity.
- Mobile: expected cash, entry type, amount, sold items, payment method, and Record action precede activity.
- Vendor Workspace mobile: the Event station switch, Lite summary, Quick Sale fields, and Record action remain single-column and at least 44px.
- No modal-only core workflow, horizontal table, hover dependency, or control smaller than 44px.

## Visual Language

- Sale uses positive cyan/emerald accents; Purchase uses amber; reversals use muted warning treatment.
- Sign, label, and explanatory copy must carry meaning independently of colour.
