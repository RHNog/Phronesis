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

Let a buyer load qualified English Pokémon cards, press Start, review exceptions, select the exact catalogue printing/variant, confirm condition, apply an existing buying preset, and review an evidence-backed offer without managing scan files.

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
- Present every returned Pokémon printing/finish as a labelled candidate with name, set, collector number, variant, and language; never silently bind the first SKU when multiple physical variants exist.
- Keep card backs, non-English Pokémon, Magic cards, and insufficient game/language evidence as explicit abstentions in the first release.
- Reprocess immutable evidence append-only when the active recognition lane or pipeline version changes. Historical decisions remain auditable but cannot inflate current counts or remain in the current offer draft.
- Keep scan session, recognition review, and offer draft recoverable after process restart.
- Derive the persisted session stage from durable work: `CAPTURING` with no regions, `PROCESSING` while any current job is pending or leased, `REVIEW` when terminal results still require resolution, and `OFFER_READY` only when every current region has an operator-bound resolution. Reimporting an idempotent bundle must not regress a terminal session to `PROCESSING`.

## Acceptance Criteria

- An offline qualified batch reaches a reviewable offer with full evidence traceability.
- Exception decisions are explicit and auditable.
- No scan failure silently changes another card's result.
- Keyboard and touch workflows expose equivalent actions, focus is preserved after exception resolution, and status never relies on color alone.
- Draft creation invokes no purchase, inventory, listing, or external marketplace mutation.
- Replaying the accepted 18-frame Pokémon batch yields review candidates for its eight English card faces and safe abstentions for nine card backs plus one Spanish card, with no automatic acceptance.

## Dependencies

- `PHR-TECH-013`, `PHR-TECH-014`, and `PHR-ARCH-015`.

## UI / UX Notes

The Designer-approved information architecture uses a three-stage session: Capture, Resolve, Offer. A persistent summary shows frame, accepted, review, abstained, and failed counts. The exception queue keeps the scan image and evidence beside candidate controls; destructive session actions require confirmation. Small screens stack evidence below the active card and keep the primary action reachable without horizontal scrolling.

## Traceability

- Slice plan: `docs/product-development/PHR-LOCAL-CARD-RECOGNITION-20260804-slice-plan.md`.
- Design gate: `docs/design/PHR-WORKFLOW-016-scanner-to-offer-vendor-buying.md`.
- Related prompt: `docs/prompts/PHR-WORKFLOW-016-scanner-to-offer-vendor-buying-prompt.md`.
- Last modified: 2026-08-05.
- Modification reason: change the first product line to English Pokémon and require explicit exact-variant selection plus append-only replay semantics.

## Private Operational Activation — 2026-08-05

The Product Owner authorized urgent private operation. Activation uses an isolated loopback service and a separate tailnet-only HTTPS port so the existing private Phronesis runtime and its unrelated dirty canonical checkout remain untouched. The recurring worker reads the Windows bridge READY inbox, canonical pricing snapshot, and dedicated recognition store. It remembers observed bundle directories for the process lifetime, emits no idle heartbeat spam, and retries a bundle only after worker restart or a failed import. Recognition remains review/abstention-only; binder suggestions, auto-accept, purchase, inventory, publication, and public Funnel exposure remain disabled.
