<!-- handoff: {"branch":"codex/phr-local-card-recognition-20260804","config_digest":"24af9188f29175240948655dcb0825cf42575569652aa5b2f688a4110d8542af","document":"BOOTSTRAP","generated":true,"generated_at":"2026-08-05T02:19:51Z","generation_id":"44847155edb90e5d0edf","head":"1fed5f940b0c5cdd493d31c123d22b935ef306c6","schema_version":"1","worktree_fingerprint":"e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"} -->
# Bootstrap Package

Use this instruction in a new AI session:

> Acquire Handoff

## Deterministic resume data

- **Repository:** `Phronesis`
- **Branch:** `codex/phr-local-card-recognition-20260804`
- **Commit:** `1fed5f940b0c5cdd493d31c123d22b935ef306c6`
- **Generation ID:** `44847155edb90e5d0edf`
- **Worktree fingerprint:** `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`

## Objective

Implement and verify `PHR-TECH-013 / Slice A`, the standalone macOS fi-8170 capability probe for the approved `PHR-ARCH-015` local card-acquisition and recognition program.

## Completed work

- Read the approved product brief and inspected Phronesis, TCGPLAYER Tools, the sample scan corpus, installed SDK/driver, and target hardware state.
- Preserved the dirty canonical Phronesis worktree by creating an isolated assignment worktree and branch from its current HEAD.
- Selected Controlled Lane and created six ordered slices with permanent `PHR-*` Feature IDs.
- Verified the installed macOS SDK's ImageCaptureCore scanner discovery, exclusive session, feeder capability, file transfer, completion, and cancellation interfaces.
- Implemented the standalone Swift probe with no Phronesis runtime or external-system mutation.
- Passed Swift build, formatter lint, 18/18 tests, disconnected enumeration and not-found checks, explicit scan denial, no-device no-write behavior, SIGINT cancellation, diff hygiene, and private-identifier review.
- Recorded the Engineer report and same-session Chief Architect software conformance.

## Remaining work

- Connect the fi-8170 and run the supervised low-value physical gate.
- Return the physical evidence through final Chief Architect review and Product Review.

## Blockers

- Software implementation is complete and verified.
- Final physical acceptance is blocked until the fi-8170 is connected and the Product Owner supplies 2–4 low-value test cards.

## Validation

- **Status:** PASSED
- **Report:** [validation-latest.json](reports/validation-latest.json)

## Important decisions

Read [DECISIONS.md](../DECISIONS.md) before implementation.

## Exact next action

Connect the fi-8170, supply 2–4 low-value test cards, and run the documented supervised `scan` gate. Do not begin corpus, recognition, Vendor UI, or marketplace work before physical Slice A acceptance.

## Resume protocol

1. Confirm this file's branch, commit, configuration digest, and worktree
   fingerprint with `validate-continuity`.
2. Read [PROJECT_STATE.md](../PROJECT_STATE.md),
   [ARCHITECTURE.md](../ARCHITECTURE.md), and
   [DECISIONS.md](../DECISIONS.md).
3. Read [ACTIVE_TASK.md](ACTIVE_TASK.md) and [HANDOFF.md](HANDOFF.md).
4. Execute the exact next action.
5. Commit verified project state and close with **Handoff** (`handoff`).

The machine-readable equivalent is
[`bootstrap-latest.json`](reports/bootstrap-latest.json).
