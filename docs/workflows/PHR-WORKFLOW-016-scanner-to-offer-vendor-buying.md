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

Let a buyer declare one homogeneous English Pokémon batch, press Start, review exceptions, select the exact catalogue printing that agrees with the declared batch material, apply an existing buying preset, and review an evidence-backed offer without managing scan files.

## Requirements

- Reuse current canonical identity, pricing, offer, purchase, and inventory boundaries.
- Persist scan progress and allow safe cancel/resume.
- Expose an operator-confirmed Cancel action inside Phronesis for every non-terminal session. Cancellation is idempotent, retains immutable frames, decisions, material declarations, and offer evidence, cancels pending or leased recognition jobs, and rejects late frame imports. It does not claim to cancel or control PaperStream's native scanner process.
- Show accepted, review, abstained, and failed counts separately.
- Prevent an unresolved card from entering an offer.
- Bind each offer line to recognition evidence, price snapshot, buying preset, and operator decisions.
- Treat `offerCents` as the per-unit proposed purchase price. Consolidate only commercially identical resolved lines: exact canonical printing, condition, finish, price snapshot, buying preset, per-unit offer, and currency must all agree.
- Preserve every contributing region ID inside a consolidated group. Calculate each subtotal as per-unit offer multiplied by quantity, and calculate lot totals independently per currency; never collapse conflicting evidence or silently convert currencies.
- Keep draft offer creation separate from purchase finalization and downstream listing.
- Complete a Designer gate before product UI implementation.
- Import sealed Windows bridge bundles without exposing filesystem management in the operator workflow.
- Treat front/back pairing as acquisition evidence. Only the operator-selected card face enters recognition; the paired reverse remains linked evidence.
- Treat duplex sensor order as an explicit acquisition property, not a universal front-first assumption. The verified `Phronesis Card Duplex` PaperStream profile releases the rear/card-back observation first and the card face second. Future paired bundles must declare either front-first or back-first semantics and the importer must validate the complete reciprocal relation before scheduling only effective fronts.
- Preserve an audited, idempotent session-orientation correction for a sealed duplex batch that was declared with the wrong first side. Correction is allowed only before any operator resolution, must retain original objects, manifests, regions, jobs, and decisions, must reject the previously processed backs through append-only region revisions, and must schedule the newly authoritative card faces for recognition.
- Display the acquisition-proven reverse beside the active front during identity/material review. If the source is a legacy unpaired bundle, show an explicit unavailable state and never infer a reverse from file order.
- Require an explicit batch condition and batch finish before intake or resolution. Supported first-release Pokémon finishes are `Normal`, `Holofoil`, and `Reverse Holofoil`; a mixed-condition or mixed-finish intake must be split into separate sessions.
- Apply the declared condition and finish to every resolution in the batch. Preserve batch-setting revisions append-only, and lock both fields after the first card resolution so one offer cannot silently mix material assumptions.
- Keep exact-condition pricing disabled until the session has declared batch material. Never infer, recommend, or claim a condition grade from the scanner images.
- Treat finish as an operator-declared batch constraint, not as a qualified vision result. A recognition candidate whose exact catalogue variant differs from the batch finish remains unresolved and cannot enter the offer.
- Present every returned Pokémon printing/finish as a labelled candidate with name, set, collector number, variant, and language; never silently bind the first SKU when multiple physical variants exist.
- Keep card backs, non-English Pokémon, Magic cards, and insufficient game/language evidence as explicit abstentions in the first release.
- Reprocess immutable evidence append-only when the active recognition lane or pipeline version changes. Historical decisions remain auditable but cannot inflate current counts or remain in the current offer draft.
- Keep scan session, recognition review, and offer draft recoverable after process restart.
- Order session selection by immutable creation time rather than background-updated time, keep the operator's selected session stable across reloads, and expose prior batches through an explicit session selector.
- Make status refresh observable: show a busy label while loading, announce the completion time and current unresolved count, preserve the selected exception when it still exists, and expose Previous/Next plus `Card N of M` controls for the unresolved queue. Refresh must not masquerade as queue navigation.
- Derive the persisted session stage from durable work: `CAPTURING` with no regions, `PROCESSING` while any current job is pending or leased, `REVIEW` when terminal results still require resolution, and `OFFER_READY` only when every current region has an operator-bound resolution. Reimporting an idempotent bundle must not regress a terminal session to `PROCESSING`.

## Acceptance Criteria

- An offline qualified batch reaches a reviewable offer with full evidence traceability.
- Exception decisions are explicit and auditable.
- No scan failure silently changes another card's result.
- Keyboard and touch workflows expose equivalent actions, focus is preserved after exception resolution, and status never relies on color alone.
- Draft creation invokes no purchase, inventory, listing, or external marketplace mutation.
- Duplicate consolidation is deterministic and retains one-to-many scan evidence; the displayed lot total equals the sum of all grouped subtotals without changing the underlying append-only resolutions.
- A paired-evidence review labels front and reverse independently, remains usable at 390px without horizontal overflow, and keeps condition and finish batch-declared with no automatic grading or reflectivity-classification claim.
- Replaying the accepted 18-frame Pokémon batch yields review candidates for its eight English card faces and safe abstentions for nine card backs plus one Spanish card, with no automatic acceptance.
- A physical `v2` session presents each declared front with its reciprocal evidence-only back, schedules no job for any back, and truthfully supports a fully abstained batch without producing an offer.
- The existing physical session whose first/second observations were mislabeled is repaired without changing either image object or its reciprocal pair: the Drowzee image becomes front evidence, the Pokémon-back image becomes reverse evidence, the nine prior back decisions remain auditable but inactive, and nine actual card faces receive new recognition jobs.
- Manual Refresh produces visible status feedback, session selection does not jump because a worker updated an older batch, and the operator can inspect every unresolved card with keyboard- and touch-operable Previous/Next controls.
- Cancelling an empty or partially imported session leaves a visible `CANCELLED` record, creates no replacement automatically, accepts no late frames, and allows the operator to start a fresh homogeneous batch immediately.

## Dependencies

- `PHR-TECH-013`, `PHR-TECH-014`, and `PHR-ARCH-015`.

## UI / UX Notes

The Designer-approved information architecture uses a three-stage session: Capture, Resolve, Offer. Capture requires a condition and Pokémon finish for the homogeneous batch and exposes an explicit session selector when history exists. A persistent summary shows the locked material declaration plus frame, accepted, review, abstained, and failed counts. The active-session header exposes a destructive-styled Cancel action for non-cancelled work, requires explicit confirmation, explains that retained evidence is not deleted and PaperStream remains independently controlled, and keeps New batch available after cancellation. The exception queue keeps front and acquisition-proven reverse evidence beside only those candidate controls whose exact catalogue variant agrees with the batch; it shows queue position, Previous/Next actions, a distinct status-refresh action, and visible refresh feedback. Destructive session actions require confirmation. When no proven reverse exists, the evidence panel says so instead of guessing. Small screens stack evidence below the active card and keep the primary action reachable without horizontal scrolling.

## Traceability

- Slice plan: `docs/product-development/PHR-LOCAL-CARD-RECOGNITION-20260804-slice-plan.md`.
- Design gate: `docs/design/PHR-WORKFLOW-016-scanner-to-offer-vendor-buying.md`.
- Related prompt: `docs/prompts/PHR-WORKFLOW-016-scanner-to-offer-vendor-buying-prompt.md`.
- Last modified: 2026-08-06.
- Modification reason: correct the physically observed back-first PaperStream order, preserve an audited recovery path for the already imported inverted session, and make session refresh/exception navigation observable.

## Private Operational Activation — 2026-08-05

The Product Owner authorized urgent private operation. Activation uses an isolated loopback service and a separate tailnet-only HTTPS port so the existing private Phronesis runtime and its unrelated dirty canonical checkout remain untouched. The isolated application must bind the canonical authorization store explicitly as well as the canonical pricing and dedicated recognition stores; a worktree-relative authorization database is not an acceptable fallback because authenticated requests require the complete membership, event, and grant schema. The recurring worker reads the Windows bridge READY inbox, canonical pricing snapshot, and dedicated recognition store. It remembers observed bundle directories for the process lifetime, emits no idle heartbeat spam, and retries a bundle only after worker restart or a failed import. Recognition remains review/abstention-only; binder suggestions, auto-accept, purchase, inventory, publication, and public Funnel exposure remain disabled.

Task-scoped temporary authorization must also degrade safely if the optional purchase-event module is absent: task grants remain independently readable and authorizable, while every event-bound operation fails closed. Missing optional schema may never become an uncaught server-render error.
