# Designer Direction — PHR-UX-013

## Product Hierarchy

The operator's first question is “What should I offer?” The second is “Why?” The third is “Can I resell it here or across markets?” Preserve this order.

## Vendor Workspace

- Keep the existing three-column desktop workspace.
- Add a compact `Brazil market` evidence band inside Buying Decision below the recommended offer.
- Use two plainly named anchors: `Retail evidence (Compra)` and `Dealer-buy benchmark (Venda)`.
- Put age, match state, and data-source timestamp beside the section title.
- Use segmented pricing intent: `Quick sale`, `Market`, `Patient`.
- Do not use green/red alone; every state needs a label and explanation.

## Arbitrage Workspace

- Add an Opportunities mode for `Regional arbitrage` rather than a detached admin screen.
- Each row shows artwork, exact printing, direction, net spread, ROI, confidence, and current gate.
- The primary action is `Verify availability`, opening a focused drawer/form for executable price, quantity, counterparty label, observed time, and notes.
- Keep gross spread behind progressive disclosure; lead with net outcome and missing inputs.
- Lead with a compact queue summary: total exact candidates, direction mix, costed/actionable count, and blocked count.
- Use explicit direction filters (`All`, `US → Brazil`, `Brazil → US`) without hiding the truth gates.
- Candidate cards use a strong identity column, a directional route, paired market anchors, and a net/gate decision area. Missing net values render as `Pending costs`, never as a zero return.
- Provide a direct Settings route when the current gate is incomplete costs.
- Keep the verification form adjacent to the selected candidate on desktop and in normal document flow on mobile; do not use a horizontally dependent table or modal-only interaction.

## Responsive Behavior

- Desktop: candidates left, selected economics centre, verification right.
- Mobile: recommendation/economic state first, evidence second, verification action sticky near the bottom.
- Minimum 44px touch targets and no horizontal dependency.

## Empty And Risk States

- Missing crosswalk: `Exact identity not yet reconciled`.
- Missing FX/costs: `Indicative only — configure costs`.
- Stale data: show source and age; disable actionable status.
- Benchmark only: `Dealer benchmark — verify a real offer`.
