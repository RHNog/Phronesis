# PHR-WORKFLOW-004 Designer Direction

## Experience Intent

Vendor Workspace is a calm, dense buying console for a real negotiation. Desktop is the design authority. The operator must see identity, evidence, buying inputs, and the current decision together without bouncing between routes or opening diagnostic panels.

## Desktop Composition

- Use a full-width workspace within the existing Phronesis shell.
- Place a compact search/category bar above three columns.
- Left column: scrollable catalogue results with name, set, number, finish, and best available reference.
- Center column: selected identity, condition control, market and delivered-low evidence, movement, source, and freshness.
- Right column: asking price, Business Profile, Strategy, recommendation, offer ladder, expected profit, and ROI.
- Keep the right decision column sticky only when it cannot obscure content at browser zoom.
- Prefer compact labels and strong numeric hierarchy over decorative cards.

## Interaction

- Search input receives the initial workflow focus.
- Up/down changes result highlight; Enter selects; Escape clears the current selection/query in bounded order.
- Category, condition, Business Profile, and Strategy are explicit labelled controls.
- Selection and input changes update evidence and decision without a submit step.
- Stale or failed data is visible but does not erase last-good results.

## Responsive Adaptation

- At tablet widths use two columns, with decision following evidence.
- At phone widths use one document-flow column: search -> results -> evidence -> buying inputs -> decision.
- Touch targets are at least 44 CSS pixels where controls are not native selects/inputs.
- No horizontal scrolling at 320px, 200% zoom, or 400% zoom.

## Visual Language

- Retain the existing zinc/cyan Phronesis system.
- Cyan identifies active selection and authoritative source context.
- Emerald, amber, and red identify BUY, NEGOTIATE, and PASS only where action semantics apply.
- Freshness and fallback warnings use text plus icons/labels; color alone is insufficient.
- Use tabular numerals for prices and offer ladder values.

## Accessibility

- One `h1`, labelled regions for catalogue, snapshot evidence, and decision.
- Complete accessible names include product, printing, finish, and condition.
- Status updates use a polite live region; urgent import failures do not steal focus.
- Visible focus is required on every interactive element.
- DOM order follows the mobile reading order even when desktop grid placement changes visually.

## Required States

- No catalogue loaded.
- Ready/fresh.
- Stale but usable.
- Import in progress.
- Import failed with last-good data.
- No search results.
- Selected condition unavailable with nearest grade clearly separated.
- Missing market price with delivered-low fallback.
- Missing all usable price evidence.
- Decision waiting for asking price.

## Designer Conformance Gate

Review the actual `/vendor` desktop and mobile render, not source code alone. Confirm information density, sticky behavior, keyboard flow, focus, stale/failure presentation, 320px adaptation, and browser zoom before Product Review.
