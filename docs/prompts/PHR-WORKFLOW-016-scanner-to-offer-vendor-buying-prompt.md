# PHR-WORKFLOW-016 — Implementation Work Order

## Feature ID

`PHR-WORKFLOW-016`

## Required Reading

- `docs/workflows/PHR-WORKFLOW-016-scanner-to-offer-vendor-buying.md`
- `docs/design/PHR-WORKFLOW-016-scanner-to-offer-vendor-buying.md`
- `docs/technical/PHR-TECH-014-local-recognition-corpus-engine.md`

## Implementation Requirements

- Activate English Pokémon as the first scanner-to-offer product line and surface labelled exact printing/variant choices instead of silently selecting the first candidate.
- Require explicit default condition and finish values per session, then pre-fill but permit explicit per-card condition and exact candidate-finish confirmation.
- Persist batch-setting revisions append-only, permit correction only before the first card resolution, and lock the batch material thereafter.
- Show all machine candidates regardless of the batch default. Enforce server-side that the submitted finish equals the selected exact catalogue variant and persist per-card material append-only.
- Preserve observed name, collector number, game, and language when market retrieval abstains; do not map a non-English observation to an English SKU.
- Add a server-authoritative `tcg-low-80` preset equal to 80% of TCGplayer listing low, plus TCG Low, TCG Market, LigaPokemon/LigaMagic Low, and Suggested Offer totals with USD/BRL separation and coverage.
- Collapse retained duplex reverse evidence by default and render no reverse placeholder for front-only sessions.
- Replay existing immutable session evidence append-only after the pipeline switch; current UI counts and offer lines must exclude superseded region decisions.
- Add authenticated Node-runtime APIs for session creation, sealed-bundle import, session read, candidate resolution, material confirmation, and draft-offer assembly.
- For an isolated worktree runtime, bind the canonical authorization database explicitly; test an authenticated request so an incomplete worktree-relative auth store cannot pass anonymous-only health checks.
- Add a responsive Phronesis workflow implementing Capture, Resolve, and Offer.
- Reuse canonical pricing and offer policy; persist exact price/preset bindings.
- Define the persisted offer amount as a per-unit value and add a server-authoritative offer summary that consolidates only exact canonical/material/snapshot/preset/unit-value/currency matches.
- Retain every contributing region ID, compute group subtotals as unit value times quantity, and return totals independently per currency without rewriting append-only resolutions.
- Keep every unresolved, stale, or failed asset out of the offer.
- Preserve state across reload and process restart.
- Add an authenticated, idempotent session-cancellation mutation and a confirmed Phronesis Cancel control. Cancellation must retain evidence, cancel pending or leased recognition jobs, reject late imports, expose `CANCELLED` durably, and never claim to stop PaperStream itself.
- Reconcile the displayed session stage from durable current jobs and operator resolutions after import, job completion/failure, and resolution; an idempotent reimport cannot regress a terminal session to processing.
- Return frame side and paired-frame identity in authenticated session detail. Resolve must render front and acquisition-proven reverse evidence with explicit labels, and a fail-closed unavailable state for legacy unpaired bundles.
- Add an audited, idempotent duplex-orientation repair that may run only before operator resolution. Retain immutable image objects, manifest evidence, prior decisions, and jobs; append rejected region revisions for formerly active backs, schedule effective fronts, and expose the corrected orientation in session state.
- Sort sessions by immutable creation time, add explicit session selection, and retain the selected session across refreshes while it exists. Background reconciliation of an older session must not make it active.
- Replace the visually inert refresh behavior with an observable status reload that announces success/time/unresolved count and preserves the current exception. Add Previous/Next and queue-position controls rather than making Refresh implicitly rotate cards.
- Keep condition manual at batch scope and do not derive, recommend, or claim a grade from either image.
- Treat finish as a batch constraint rather than a qualified reflectivity classifier. Do not infer or claim `Normal`, `Holofoil`, or `Reverse Holofoil` from the current fixed-light scanner capture.
- Require batch material during session creation, allow explicit configuration for legacy imported sessions, and block exact-condition pricing and submission until it exists.

## Constraints

- No scanner-driver logic in the web app, no undeclared pairing from sequence or filenames, no deletion or rewriting of immutable scan objects/manifest evidence, no non-English or non-Pokémon recognition activation, and no purchase, inventory, marketplace, or publication mutation.

## Testing Expectations

- Repository/API/workflow tests covering append-only batch settings, lock-after-first-resolution, server-owned condition/finish, candidate mismatch rejection, idempotent evidence-preserving cancellation, late-import rejection, explicit back-first import, idempotent pre-resolution orientation repair, rejection after operator resolution, creation-time session ordering, observable refresh, queue navigation, deterministic duplicate consolidation, conflicting-binding separation, overflow-safe subtotal calculation, plus replay of the 18-frame Pokémon batch, desktop, 390px, keyboard, reload, and fail-closed evidence.
