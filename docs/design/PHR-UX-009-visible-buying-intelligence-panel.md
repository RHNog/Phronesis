# PHR-UX-009 Designer Direction — Visible Buying Intelligence Panel

## Experience Intent

Help the operator answer two questions without leaving the negotiation: **why is Phronesis recommending this action?** and **how strong is the evidence?** The first glance must take seconds; detailed model inspection remains available but visually subordinate.

## Information Hierarchy

1. `Phronesis Intelligence` identity and current Decision Resolver action.
2. Asset Assessment grade and plain-language assessment.
3. Evidence coverage and confidence as separate concepts.
4. One visible business conclusion.
5. Bounded primary signals, opportunities, and risks.
6. Collapsed detailed Intelligence Models.

## Layout Direction

- Place the panel inside the current ready evaluation, after the headline recommendation and commercial metrics but before generic Decision Drivers and diagnostic trace.
- Desktop: use a three-cell scan row for Assessment, Evidence, and Confidence; use two balanced columns for Opportunity and Risk when space permits.
- Mobile: stack every block in document order. Do not create horizontally scrolling chips or fixed-width score tables.
- Keep the panel contained inside the existing decision column; it must not widen the three-column workspace.

## Visual Language

- Retain zinc surfaces, cyan focus/source emphasis, and current typography.
- Use BUY/NEGOTIATE/PASS semantic color only for the current action label.
- Assessment grade is neutral/cyan presentation, not an action color.
- Pair every score, grade, and status with text. Do not rely on color or a letter grade alone.
- Use quiet borders and one nested surface level so the intelligence panel reads as evidence supporting the decision, not a competing dashboard.

## Interaction Direction

- The business conclusion and summary evidence are always visible.
- `Explore intelligence models` is collapsed by default and uses a native disclosure or an equivalent control with `aria-expanded`.
- Opening the disclosure reveals the established Intelligence Console; its one-model-at-a-time behavior remains intact.
- A change to the selected evaluation updates the visible content without a submit action.
- The disclosure target is at least 44 CSS pixels high and has a visible cyan focus ring.

## Content Rules

- Use the existing business summary verbatim as generated product data.
- Show no more than three items in each visible evidence list.
- Empty opportunities or risks use `None identified in current evidence.`
- Label confidence and evidence coverage independently.
- Do not expose engine traces, provider paths, or internal object names in the summary.

## Accessibility And Responsive Requirements

- A labelled section and hierarchical headings.
- Keyboard-operable disclosure and inherited Intelligence Console controls.
- Logical DOM order at desktop and mobile.
- Text wraps safely at 320px; browser review is required at 390px and desktop.
- No horizontal overflow, clipped values, or hover-only information.

## Designer Conformance Gate

Review the actual `/vendor` rendering at desktop and 390px. Confirm first-glance hierarchy, action/assessment distinction, evidence readability, disclosure focus/keyboard behavior, model expansion, input-driven refresh, and no horizontal overflow. Same-session review must be labelled as such.
