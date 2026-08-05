# PHR-WORKFLOW-016 — Scanner-To-Offer Design Gate

## Decision

Approved for bounded implementation on 2026-08-04. The workflow is an operator console inside Phronesis, not a scanner-driver UI or publishing surface.

## Information Architecture

1. **Capture** starts or resumes a session and reports durable frame intake.
2. **Resolve** presents one unresolved region at a time with image evidence, ranked candidates, and explicit accept, replace, or abstain controls.
3. **Offer** shows only operator-resolved assets with condition, finish, price snapshot, preset, quantity, and draft value.

A persistent status strip distinguishes received, processing, review, abstained, failed, and offer-ready counts with text and numerals. It never collapses review and failure into a single warning state.

## Interaction Contract

- Start, pause, resume, and cancel operate on a named session and survive page reload.
- The system may recommend identity; the operator owns condition and any price-material finish ambiguity.
- Accepting a candidate advances focus to the next exception and is reversible until the offer draft is finalized.
- Abstention is a successful safe outcome, not an error.
- No control on this surface purchases, adds inventory, or publishes.

## Accessibility And Responsive Behavior

- All actions are keyboard reachable, have visible focus, and use at least 44px touch targets.
- Status includes text or icons with accessible labels; color is supplemental.
- Desktop uses image/evidence and resolution controls side by side. Narrow screens stack them and pin only the current primary action.
- Long card names, set names, collector numbers, and evidence values wrap without horizontal overflow.

## Failure And Recovery

- Scanner/bridge unavailable: preserve session and show a retry action.
- Worker unavailable: preserve frames and expose pending recognition count.
- Stale price: keep identity resolved but block offer readiness.
- Unresolved material fields: keep the card in Resolve.
- Cancel requires confirmation and never deletes immutable evidence.

## Visual Direction

Reuse the current Phronesis dark surface, typography, spacing, controls, status badges, and mobile shell. This feature adds no new brand language. Dense evidence is progressively disclosed; the default view prioritizes the current card, decision, and next action.

## Evidence Required At Product Review

- Desktop and 390px viewport screenshots.
- Keyboard-only exception resolution.
- Reload recovery with the same active exception.
- Separate empty, processing, review, abstained, failed, and offer-ready states.
- Proof that no purchase or publication mutation occurred.
