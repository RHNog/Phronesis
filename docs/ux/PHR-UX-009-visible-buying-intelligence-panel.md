# PHR-UX-009 — Visible Buying Intelligence Panel

## Feature ID

`PHR-UX-009`

## Title

Visible Buying Intelligence Panel

## Status

Completed

## Priority

High

## Category

Product / UX / UI / Decision Intelligence

## Objective

Make the established Phronesis Intelligence assessment visible inside the Snapshot Vendor Workspace so an operator can understand a BUY, NEGOTIATE, or PASS recommendation at card-show speed.

## Background

The purchase pipeline already creates `CardProfile`, Asset Assessment, Intelligence Models, Strategy output, Offer Ladder, and Decision Resolver output. The Snapshot Vendor Workspace currently exposes the recommendation, ladder, profitability, and decision drivers, but it does not expose the layered intelligence explanation already calculated for the selected asset.

## Problem Statement

An operator can see what Phronesis recommends but cannot quickly inspect the asset read, evidence coverage, confidence reason, material opportunities and risks, or the underlying intelligence models without leaving the current Snapshot workflow. This makes the recommendation less explainable than the existing engine permits.

## Proposed Solution

Add a visible Phronesis Intelligence region to every `READY` Snapshot purchase evaluation. Its first layer presents the existing Asset Assessment in a compact decision-support summary. A progressively disclosed second layer renders the existing Intelligence Console and model evidence. The panel consumes only `evaluation.cardProfile`, `evaluation.decision`, and the already-calculated evaluation outputs.

## Functional Requirements

- Render a clearly labelled `Phronesis Intelligence` region for every ready purchase evaluation.
- Show the existing Asset Assessment grade, assessment label, evidence coverage, and confidence label.
- Present the Asset Assessment business summary as the primary explanation.
- Present a bounded number of existing primary drivers, opportunity factors, and risk factors, with explicit empty-evidence language where needed.
- Connect the explanation visibly to the current BUY, NEGOTIATE, or PASS recommendation without recalculating or overriding it.
- Expose the established Intelligence Console through progressive disclosure so detailed models remain available without dominating the buying station.
- Update automatically when card, finish, condition, asking price, Business Profile, or Strategy changes the current evaluation.
- Do not persist, mutate, or independently score any evaluation data in the panel.

## Non-Functional Requirements

### Performance

The summary is a pure presentation of the evaluation already in memory. It performs no provider request and introduces no new evaluation pass.

### Scalability

New Intelligence Models registered on `cardProfile.intelligenceModels` appear through the existing console without panel-specific model code.

### Maintainability

Summary derivation is implemented as a pure function with unit coverage. Detailed model presentation reuses `IntelligenceConsole`.

### Reliability

The panel renders only for `READY` evaluations and provides explicit fallback language for empty driver, opportunity, or risk lists.

### Accessibility

The region has a programmatic label, semantic headings, keyboard-operable disclosure, visible focus, text labels in addition to color, and no information conveyed by grade alone.

### Offline Support

The panel uses the locally computed evaluation and requires no additional network access.

### Security

No provider payload, source path, credential, or internal trace is exposed.

### Extensibility

The visible summary may later add evidence history or comparison views by consuming existing canonical history records; it must not become another intelligence engine.

### Responsiveness

Desktop presents a compact scanning grid within the existing decision column. Mobile retains one-column reading order and avoids horizontal scrolling at 390px.

## User Stories

- As a card-show buyer, I want a concise explanation beside the recommendation so I can decide confidently without leaving the negotiation.
- As an operator reviewing an unusual card, I want to expand the underlying models so I can inspect confidence and evidence.
- As a phone backup user, I want the same assessment in a readable single-column flow.

## Acceptance Criteria

- A ready Snapshot evaluation visibly includes `Phronesis Intelligence` before the lower-priority decision-driver and trace details.
- The visible values equal the current `evaluation.cardProfile.assetAssessment` and do not introduce a new score.
- The current decision action appears as context and remains owned by Decision Resolver.
- Detailed model evidence is collapsed by default and keyboard expandable.
- Changing evaluation inputs refreshes the panel from the new evaluation.
- Focused tests, supported full suite, lint, production build, diff checks, and desktop/mobile browser review complete with baseline failures distinguished from regressions.
- Desktop and 390px layouts have no horizontal overflow.

## Edge Cases

- No risks or opportunities: render explicit `None identified` language.
- Insufficient model evidence: preserve the existing Intelligence Console insufficient-evidence treatment.
- Unavailable evaluation: do not imply that an intelligence-backed decision exists.
- Long driver text: wrap without forcing horizontal overflow.
- Evaluation replacement: expanded model state may persist only through the existing bounded session-storage behavior.

## Dependencies

- `PHR-WORKFLOW-004` Snapshot-Powered Vendor Workspace.
- Existing `evaluatePurchase` pipeline and `CardProfile` contract.
- Existing Asset Assessment and `IntelligenceConsole` presentation components.
- `PHR-UX-008` unified artwork-first selection workflow.

## Future Enhancements

- Intelligence history comparisons using canonical evaluation snapshots.
- Provider-backed confidence improvements.
- User-configurable summary density after event workflow evidence exists.

## Technical Notes

Introduce a vendor-owned presentation component with an exported pure summary builder. Reuse `IntelligenceConsole` for model detail. Do not modify Asset Assessment, Intelligence Model, Strategy, Offer Ladder, Decision Resolver, or purchase-evaluation formulas.

## UI / UX Notes

Use the existing zinc/cyan system. The intelligence panel is explanatory, so BUY/NEGOTIATE/PASS colors remain reserved for the Decision Resolver action. Keep the business conclusion immediately visible. Use a compact desktop grid for grade, coverage, and confidence; stack it at narrow widths. Progressive detail uses a native or equivalent accessible disclosure with a minimum 44px interactive target.

## Success Metrics

- One ready evaluation exposes assessment, evidence coverage, confidence, and business conclusion without another route or network request.
- Detailed intelligence is reachable in one keyboard- or pointer-operated disclosure.
- No change to evaluation outputs for unchanged inputs.
- No desktop or 390px horizontal overflow.

## Open Questions

- None blocking this increment. Comparative history remains future scope.

## Traceability

- Originating direction: approved July 30 roadmap continuation after `PHR-TECH-008`.
- Related implementation prompt: `docs/prompts/PHR-UX-009-visible-buying-intelligence-panel-prompt.md`.
- Designer direction: `docs/design/PHR-UX-009-visible-buying-intelligence-panel.md`.
- Related tests: `tests/snapshot-vendor-workspace.test.ts`, `tests/buying-intelligence-panel.test.ts`.
- Related release notes: `docs/release-notes/PHR-UX-009.md`.
- Last modified: 2026-07-30.
- Modification reason: initial documentation-first specification.
