# PHR-WORKFLOW-016 — Implementation Work Order

## Feature ID

`PHR-WORKFLOW-016`

## Required Reading

- `docs/workflows/PHR-WORKFLOW-016-scanner-to-offer-vendor-buying.md`
- `docs/design/PHR-WORKFLOW-016-scanner-to-offer-vendor-buying.md`
- `docs/technical/PHR-TECH-014-local-recognition-corpus-engine.md`

## Implementation Requirements

- Add authenticated Node-runtime APIs for session creation, sealed-bundle import, session read, candidate resolution, material confirmation, and draft-offer assembly.
- Add a responsive Phronesis workflow implementing Capture, Resolve, and Offer.
- Reuse canonical pricing and offer policy; persist exact price/preset bindings.
- Keep every unresolved, stale, or failed asset out of the offer.
- Preserve state across reload and process restart.
- Reconcile the displayed session stage from durable current jobs and operator resolutions after import, job completion/failure, and resolution; an idempotent reimport cannot regress a terminal session to processing.

## Constraints

- No scanner-driver logic in the web app and no purchase, inventory, marketplace, or publication mutation.

## Testing Expectations

- Repository/API/workflow tests plus desktop, 390px, keyboard, reload, and fail-closed evidence.
