# PHR-WORKFLOW-016 — Implementation Work Order

## Feature ID

`PHR-WORKFLOW-016`

## Required Reading

- `docs/workflows/PHR-WORKFLOW-016-scanner-to-offer-vendor-buying.md`
- `docs/design/PHR-WORKFLOW-016-scanner-to-offer-vendor-buying.md`
- `docs/technical/PHR-TECH-014-local-recognition-corpus-engine.md`

## Implementation Requirements

- Activate English Pokémon as the first scanner-to-offer product line and surface labelled exact printing/variant choices instead of silently selecting the first candidate.
- Require one explicit condition and one exact Pokémon finish (`Normal`, `Holofoil`, or `Reverse Holofoil`) per homogeneous session; mixed material requires separate sessions.
- Persist batch-setting revisions append-only, permit correction only before the first card resolution, and lock the batch material thereafter.
- Filter actionable candidates by the declared batch finish and enforce the same comparison server-side. A mismatch must fail closed rather than override the batch or silently select another SKU.
- Replay existing immutable session evidence append-only after the pipeline switch; current UI counts and offer lines must exclude superseded region decisions.
- Add authenticated Node-runtime APIs for session creation, sealed-bundle import, session read, candidate resolution, material confirmation, and draft-offer assembly.
- For an isolated worktree runtime, bind the canonical authorization database explicitly; test an authenticated request so an incomplete worktree-relative auth store cannot pass anonymous-only health checks.
- Add a responsive Phronesis workflow implementing Capture, Resolve, and Offer.
- Reuse canonical pricing and offer policy; persist exact price/preset bindings.
- Define the persisted offer amount as a per-unit value and add a server-authoritative offer summary that consolidates only exact canonical/material/snapshot/preset/unit-value/currency matches.
- Retain every contributing region ID, compute group subtotals as unit value times quantity, and return totals independently per currency without rewriting append-only resolutions.
- Keep every unresolved, stale, or failed asset out of the offer.
- Preserve state across reload and process restart.
- Reconcile the displayed session stage from durable current jobs and operator resolutions after import, job completion/failure, and resolution; an idempotent reimport cannot regress a terminal session to processing.
- Return frame side and paired-frame identity in authenticated session detail. Resolve must render front and acquisition-proven reverse evidence with explicit labels, and a fail-closed unavailable state for legacy unpaired bundles.
- Keep condition manual at batch scope and do not derive, recommend, or claim a grade from either image.
- Treat finish as a batch constraint rather than a qualified reflectivity classifier. Do not infer or claim `Normal`, `Holofoil`, or `Reverse Holofoil` from the current fixed-light scanner capture.
- Require batch material during session creation, allow explicit configuration for legacy imported sessions, and block exact-condition pricing and submission until it exists.

## Constraints

- No scanner-driver logic in the web app, no inferred pairing from sequence or filenames, no non-English or non-Pokémon recognition activation, and no purchase, inventory, marketplace, or publication mutation.

## Testing Expectations

- Repository/API/workflow tests covering append-only batch settings, lock-after-first-resolution, server-owned condition/finish, candidate mismatch rejection, deterministic duplicate consolidation, conflicting-binding separation, overflow-safe subtotal calculation, plus replay of the 18-frame Pokémon batch, desktop, 390px, keyboard, reload, and fail-closed evidence.
