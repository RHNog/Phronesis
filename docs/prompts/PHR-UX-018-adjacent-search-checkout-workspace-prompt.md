# Implementation Prompt — PHR-UX-018 Adjacent Search And Checkout Workspace

## Project Context

Project Phronesis is a private evidence-driven collectible-market and event-operations platform. Documentation is implementation. Vendor checkout and Event Ledger behavior are already canonical and must not be duplicated.

## Feature ID

`PHR-UX-018`

## Objective

Recompose Vendor Workspace so Catalogue results and Event station are adjacent on desktop, with evidence and buying analysis preserved in a second band and a safe linear phone order.

## Required Reading

- `docs/ux/PHR-UX-018-adjacent-search-checkout-workspace.md`
- `docs/ux/PHR-UX-008-unified-artwork-first-catalogue-search.md`
- `docs/ux/PHR-UX-015-vendor-workspace-quick-sale.md`
- `features/vendor/components/SnapshotVendorWorkspace.tsx`
- `features/vendor/components/VendorCheckout.tsx`
- `node_modules/next/dist/docs/01-app/01-getting-started/11-css.md`

## Implementation Requirements

- Move the single `VendorCheckout` into the same responsive desktop grid as Catalogue results.
- Place Snapshot evidence and Buying decision in a second responsive grid.
- Preserve one DOM order matching the required phone flow.
- Give checkout sufficient width and prevent its internal purchase grid from forcing nested overflow.
- Preserve every existing prop, state path, handler, accessibility name, API call, and event workflow.
- Extend structural regression coverage for adjacency, component singularity, and phone order.

## Constraints

- No business-logic, database, API, authorization, transaction, or calculation change.
- No duplicate checkout component or cart state.
- No hiding/collapsing evidence or decision panels.
- No dependency, public deployment, commit, or push.

## Expected Architecture

`SnapshotVendorWorkspace` remains composition owner. Primary grid: results + one `VendorCheckout`. Secondary grid: evidence + buying decision. `VendorCheckout` remains event workflow owner and only adjusts presentation breakpoints/class composition.

## Testing Expectations

- Add static structure assertions for primary/secondary grids, one checkout instance, and source order.
- Run focused Vendor/Event tests, full suite, TypeScript, warning-free lint, production build, and diff hygiene.
- Verify standard desktop simultaneous visibility and 390px reading order/overflow/console behavior in the private runtime.

## Documentation Updates

- Validation, implementation report, conformance review, release note.
- Feature Registry, Atlas, Roadmap, Prompt History, CTO Structure, Agent Handoff, Project State, and Conversation History.

## Acceptance Criteria

- Every criterion in `docs/ux/PHR-UX-018-adjacent-search-checkout-workspace.md` passes with reproducible evidence.

## Non-Goals

- Cart density redesign, scanner workflow, analytical drawers, or checkout business-rule changes.

## Notes For AI Coding Agents

- Preserve unrelated dirty-worktree changes.
- Maintain semantic source order instead of visual reordering utilities.
- Same-session conformance is not independent Product Owner approval.
