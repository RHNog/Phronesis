# PHR-WORKFLOW-016 — Scanner-To-Offer Design Gate

## Decision

Approved for bounded implementation on 2026-08-04. The workflow is an operator console inside Phronesis, not a scanner-driver UI or publishing surface.

The 2026-08-05 Product Owner revision makes English Pokémon the first operational product line. The 2026-08-06 review changes the Capture declaration to material defaults: Resolve shows every exact returned variant and requires the operator to confirm condition and finish per card. The duplex reverse is retained but collapsed by default because it is not a recognition or grading input.

## Information Architecture

1. **Capture** declares the homogeneous batch condition and finish, starts or resumes a session, and reports durable frame intake.
2. **Resolve** presents one unresolved region at a time with front evidence, queue position, Previous/Next navigation, an explicit status reload, all ranked exact candidates, per-card material controls, and explicit accept, replace, or abstain controls.
3. **Offer** shows only operator-resolved assets with condition, finish, price snapshot, preset, per-unit draft value, consolidated quantity, subtotal, retained scan count, and four valuation totals with coverage.

A persistent status strip distinguishes received, processing, review, abstained, failed, and offer-ready counts with text and numerals. It never collapses review and failure into a single warning state.

## Interaction Contract

- Start, pause, resume, and cancel operate on a named session and survive page reload.
- The system may recommend identity. The operator owns the batch condition and finish declaration; neither is a vision result in this release.
- A new session requires both values. An imported legacy session must be configured before pricing or resolution. The declaration may be corrected before the first resolution, with every revision retained, and becomes immutable after that point.
- Every Pokémon candidate shows name, set, collector number, catalogue variant, language, rank, and evidence score. Candidates are never filtered by the batch default. Choosing a candidate also chooses its exact finish; condition remains an explicit per-card operator control.
- Batch defaults accelerate homogeneous work but are not allowed to conceal a material exception. Per-card overrides are labelled and auditable; there is no ambiguous `Mixed` value.
- A linked reverse is evidence, not a recognition input or grading result. It is collapsed by default and absent entirely for front-only intake; legacy unpaired frames do not borrow an adjacent image.
- The current PaperStream profile is back-first. An explicit acquisition declaration determines which side is recognition input; the UI never treats the first released image as front merely because it is first.
- Session history is selected explicitly and ordered by creation time. Background processing may update status but may not silently replace the operator's selected batch.
- Status reload and exception navigation are separate controls. Reload announces completion and preserves the current exception; Previous/Next changes the current exception and reports `Card N of M`.
- Accepting a candidate advances focus to the next exception and is reversible until the offer draft is finalized.
- Abstention is a successful safe outcome, not an error.
- No control on this surface purchases, adds inventory, or publishes.
- `20% off TCG Low` is presented as the controlled `tcg-low-80` preset and fills a read-only Suggested Offer from server-verified TCG listing low. TCG Low, TCG Market, and Suggested Offer use USD; Liga low uses BRL. Every total includes an `N of M` coverage indicator.
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
- Incorrect declared duplex orientation before operator resolution: retain every object and historical decision, append an audited correction, reject the previously active regions, schedule the effective fronts, and resume at `PROCESSING`. After a resolution exists, fail closed and require a separately adjudicated recovery.
- Cancel requires confirmation and never deletes immutable evidence.

## Visual Direction

Reuse the current Phronesis dark surface, typography, spacing, controls, status badges, and mobile shell. This feature adds no new brand language. Dense evidence is progressively disclosed; the default view prioritizes the current card, decision, and next action.

## Evidence Required At Product Review

- Desktop and 390px viewport screenshots.
- Keyboard-only exception resolution.
- Reload recovery with the same active exception.
- Explicit session selection, visible refresh completion, and complete Previous/Next traversal of the unresolved queue.
- Separate empty, processing, review, abstained, failed, and offer-ready states.
- Proof that no purchase or publication mutation occurred.
