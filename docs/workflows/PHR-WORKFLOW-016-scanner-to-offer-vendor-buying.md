# PHR-WORKFLOW-016 — Scanner-To-Offer Vendor Buying

## Feature ID

`PHR-WORKFLOW-016`

## Status

Implemented — Product Review Ready

## Priority

High

## Category

Workflow / Vendor Buying / UX / Identity / Pricing / Audit

## Objective

Let a buyer load qualified English Magic cards, press Start, review exceptions, confirm price-material finish/condition, apply an existing buying preset, and review an evidence-backed offer without managing scan files.

## Requirements

- Reuse current canonical identity, pricing, offer, purchase, and inventory boundaries.
- Persist scan progress and allow safe cancel/resume.
- Show accepted, review, abstained, and failed counts separately.
- Prevent an unresolved card from entering an offer.
- Bind each offer line to recognition evidence, price snapshot, buying preset, and operator decisions.
- Keep draft offer creation separate from purchase finalization and downstream listing.
- Complete a Designer gate before product UI implementation.
- Import sealed Windows bridge bundles without exposing filesystem management in the operator workflow.
- Treat front/back pairing as acquisition evidence. Only the operator-selected card face enters recognition; the paired reverse remains linked evidence.
- Require explicit condition and price-material finish confirmation before a line becomes offer-ready.
- Keep scan session, recognition review, and offer draft recoverable after process restart.

## Acceptance Criteria

- An offline qualified batch reaches a reviewable offer with full evidence traceability.
- Exception decisions are explicit and auditable.
- No scan failure silently changes another card's result.
- Keyboard and touch workflows expose equivalent actions, focus is preserved after exception resolution, and status never relies on color alone.
- Draft creation invokes no purchase, inventory, listing, or external marketplace mutation.

## Dependencies

- `PHR-TECH-013`, `PHR-TECH-014`, and `PHR-ARCH-015`.

## UI / UX Notes

The Designer-approved information architecture uses a three-stage session: Capture, Resolve, Offer. A persistent summary shows frame, accepted, review, abstained, and failed counts. The exception queue keeps the scan image and evidence beside candidate controls; destructive session actions require confirmation. Small screens stack evidence below the active card and keep the primary action reachable without horizontal scrolling.

## Traceability

- Slice plan: `docs/product-development/PHR-LOCAL-CARD-RECOGNITION-20260804-slice-plan.md`.
- Design gate: `docs/design/PHR-WORKFLOW-016-scanner-to-offer-vendor-buying.md`.
- Related prompt: `docs/prompts/PHR-WORKFLOW-016-scanner-to-offer-vendor-buying-prompt.md`.
- Last modified: 2026-08-04.
- Modification reason: advance the authorized scanner-to-offer slice with a bounded recoverable UX and explicit mutation boundaries.

## Private Operational Activation — 2026-08-05

The Product Owner authorized urgent private operation. Activation uses an isolated loopback service and a separate tailnet-only HTTPS port so the existing private Phronesis runtime and its unrelated dirty canonical checkout remain untouched. The recurring worker reads the Windows bridge READY inbox, canonical pricing snapshot, and dedicated recognition store. It remembers observed bundle directories for the process lifetime, emits no idle heartbeat spam, and retries a bundle only after worker restart or a failed import. Recognition remains review/abstention-only; binder suggestions, auto-accept, purchase, inventory, publication, and public Funnel exposure remain disabled.
