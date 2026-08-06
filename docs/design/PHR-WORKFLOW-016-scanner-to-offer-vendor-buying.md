# PHR-WORKFLOW-016 — Scanner-To-Offer Design Gate

## Decision

Approved for bounded implementation on 2026-08-04. The workflow is an operator console inside Phronesis, not a scanner-driver UI or publishing surface.

The 2026-08-05 Product Owner revision makes English Pokémon the first operational product line. The visual system remains unchanged; Capture declares one condition and one exact Pokémon finish (`Normal`, `Holofoil`, or `Reverse Holofoil`) for a homogeneous batch. Resolve offers only exact SKUs compatible with that declaration. The duplex evidence increment presents labelled front and acquisition-proven reverse images without claiming condition grading or finish recognition.

## Information Architecture

1. **Capture** declares the homogeneous batch condition and finish, starts or resumes a session, and reports durable frame intake.
2. **Resolve** presents one unresolved region at a time with image evidence, ranked batch-compatible candidates, and explicit accept, replace, or abstain controls.
3. **Offer** shows only operator-resolved assets with condition, finish, price snapshot, preset, per-unit draft value, consolidated quantity, subtotal, retained scan count, and lot total.

A persistent status strip distinguishes received, processing, review, abstained, failed, and offer-ready counts with text and numerals. It never collapses review and failure into a single warning state.

## Interaction Contract

- Start, pause, resume, and cancel operate on a named session and survive page reload.
- The system may recommend identity. The operator owns the batch condition and finish declaration; neither is a vision result in this release.
- A new session requires both values. An imported legacy session must be configured before pricing or resolution. The declaration may be corrected before the first resolution, with every revision retained, and becomes immutable after that point.
- Every Pokémon candidate shows name, set, collector number, catalogue variant, language, rank, and evidence score. Only candidates whose catalogue variant agrees with the declared batch finish are actionable. A mismatch fails closed with instructions to move the card to a matching batch or use a later canonical exception flow.
- Mixed conditions or finishes require separate sessions. The UI does not offer a `Mixed` escape hatch that would weaken exact-condition pricing or exact-SKU identity.
- A linked reverse is evidence, not a recognition input or grading result. Legacy unpaired frames render a text-labelled unavailable state and never borrow an adjacent image.
- Accepting a candidate advances focus to the next exception and is reversible until the offer draft is finalized.
- Abstention is a successful safe outcome, not an error.
- No control on this surface purchases, adds inventory, or publishes.
- Offer consolidation groups only exact commercial bindings. A different snapshot, preset, unit value, currency, condition, finish, or canonical printing remains a separate row even when the visible card name is the same.
- Each grouped row exposes how many scan regions support it, and the lot summary totals each currency independently. Consolidation is a projection; it never rewrites or deletes source resolutions.

## Accessibility And Responsive Behavior

- All actions are keyboard reachable, have visible focus, and use at least 44px touch targets.
- Status includes text or icons with accessible labels; color is supplemental.
- Desktop uses a front/reverse evidence grid beside resolution controls. Narrow screens stack both evidence images and the controls, and pin only the current primary action.
- Long card names, set names, collector numbers, and evidence values wrap without horizontal overflow.

## Failure And Recovery

- Scanner/bridge unavailable: preserve session and show a retry action.
- Worker unavailable: preserve frames and expose pending recognition count.
- Stale price: keep identity resolved but block offer readiness.
- Missing batch material or a candidate/batch finish mismatch: keep the card in Resolve and block price evidence and offer submission.
- Cancel requires confirmation and never deletes immutable evidence.

## Visual Direction

Reuse the current Phronesis dark surface, typography, spacing, controls, status badges, and mobile shell. This feature adds no new brand language. Dense evidence is progressively disclosed; the default view prioritizes the current card, decision, and next action.

## Evidence Required At Product Review

- Desktop and 390px viewport screenshots.
- Keyboard-only exception resolution.
- Reload recovery with the same active exception.
- Separate empty, processing, review, abstained, failed, and offer-ready states.
- Proof that no purchase or publication mutation occurred.
