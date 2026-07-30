# PHR-UX-009 Engineer Work Order — Visible Buying Intelligence Panel

## Project Context

Project Phronesis already calculates layered Card Intelligence, Asset Assessment, Strategy, Offer Ladder, and Decision Resolver output inside the canonical purchase pipeline. The Snapshot Vendor Workspace needs a visible explanation layer, not another scoring system.

## Feature ID

`PHR-UX-009`

## Objective

Expose the existing Phronesis Intelligence outputs in a desktop-first, mobile-adaptive decision panel inside each ready Snapshot Vendor Workspace evaluation.

## Required Reading

- `docs/ux/PHR-UX-009-visible-buying-intelligence-panel.md`
- `docs/design/PHR-UX-009-visible-buying-intelligence-panel.md`
- `docs/workflows/PHR-WORKFLOW-004-snapshot-powered-vendor-workspace.md`
- `lib/engines/evaluation/evaluatePurchase.ts`
- `components/intelligence/IntelligenceConsole.tsx`
- `features/vendor/components/EvaluationSummary.tsx`

## Implementation Requirements

### Slice `PHR-UX-009-S1` — Visible summary

- Add a vendor presentation component that receives the current `ReadyPurchaseEvaluation`.
- Export and test a pure summary builder derived from the existing Asset Assessment and decision.
- Show assessment grade/label, evidence coverage, confidence, business conclusion, current recommendation context, and bounded opportunity/risk/driver summaries.
- Integrate it into `EvaluationSummary` without modifying evaluation formulas.

### Slice `PHR-UX-009-S2` — Model disclosure and responsive conformance

- Provide a collapsed-by-default, keyboard-operable disclosure for the existing `IntelligenceConsole`.
- Preserve the existing one-expanded-model behavior and evidence insufficiency presentation.
- Verify desktop and 390px layout, focus behavior, automatic refresh, and absence of horizontal overflow.
- Complete Engineer, same-session Designer, and same-session Chief Architect evidence records.

## Constraints

- Do not create a second intelligence score, engine, recommendation, or decision path.
- Do not change Business Profiles, Strategy, Offer Ladder, Decision Resolver, or provider behavior.
- Do not introduce provider requests, persistent data, dependencies, credentials, public deployment, or destructive operations.
- Preserve unrelated repository and ignored local event data.
- Riftbound remains deferred.

## Expected Architecture

`SnapshotVendorWorkspace` continues to create one canonical `PurchaseEvaluation`. `EvaluationSummary` passes a `READY` evaluation to the new panel. The panel derives presentation-only summary data from `evaluation.cardProfile.assetAssessment` and `evaluation.decision`, then delegates detailed model evidence to the existing `IntelligenceConsole`.

## Testing Expectations

- Unit coverage for pure summary derivation and bounded fallback behavior.
- Source/integration contract showing one canonical evaluation and Intelligence Console reuse.
- Supported full suite, lint, production build, standalone TypeScript, and `git diff --check` with baseline failures classified.
- Browser review at 1440px desktop and 390px mobile, including expansion and overflow checks.

## Documentation Updates

- `docs/testing/PHR-UX-009-visible-buying-intelligence-panel-validation.md`
- `docs/implementation-reports/PHR-UX-009-visible-buying-intelligence-panel-report.md`
- `docs/reviews/PHR-UX-009-visible-buying-intelligence-panel-conformance-review.md`
- `docs/release-notes/PHR-UX-009.md`
- Current Structure, Feature Registry, Roadmap, Atlas, Sprint History, Prompt History, and Product Development Memory where relevant.

## Acceptance Criteria

- The established intelligence explanation is visible and accurate for ready evaluations.
- Detailed models are progressively disclosed and accessible.
- No evaluation or recommendation behavior changes for unchanged inputs.
- Verification finds no new regression or responsive overflow.

## Non-Goals

- Intelligence history comparison.
- New intelligence providers or model maturity work.
- New buying formulas.
- Riftbound activation.
- Public release or provider/account mutation.

## Notes For AI Coding Agents

- Preserve unrelated user changes.
- Keep edits scoped to this feature.
- This session may perform role stages sequentially, but same-session review is not independent approval.
