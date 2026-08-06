# PHR-TECH-015 — Engineer Work Order

## Project Context

Project Phronesis is implementing `PHR-ARCH-015` through a Controlled Lane. Documentation is part of implementation. The Product Owner authorized a temporary Windows/Parallels bridge because Ricoh's current fi-8170 macOS ICA driver does not support the host macOS 27 release.

## Feature ID

`PHR-TECH-015`

## Objective

Implement and physically qualify a fail-closed Windows-local PaperStream capture and sealed Parallels shared-folder transfer into a hash-verifying macOS evidence importer.

## Required Reading

- `docs/technical/PHR-TECH-015-windows-scanner-bridge.md`
- `docs/architecture/PHR-ARCH-015-local-card-acquisition-recognition-platform.md`
- `docs/technical/PHR-TECH-013-fi8170-local-acquisition-agent.md`
- `docs/testing/PHR-TECH-013-fi8170-capability-probe-validation.md`
- `docs/product-development/PHR-LOCAL-CARD-RECOGNITION-20260804-slice-plan.md`

## Implementation Requirements

- Add a self-contained bridge under `native/scanner-agent/windows/PhronesisScannerBridge`.
- Implement a PowerShell preflight/capture/seal command using only documented PaperStream Capture `/DocType`, `/BatchFolder`, and `/Exit` parameters.
- Require PaperStream acquisition to run in the logged-in operator's interactive Windows session; Parallels session-0 commands may preflight or seal but must not launch scanner UI.
- Require explicit physical consent, a safe session ID, a known job name, a Windows-local capture root, and a dedicated shared root.
- Seal regular single-frame images only; stream SHA-256, copy through staging, verify destination bytes/hashes, write a versioned manifest, and publish atomically.
- Implement a dependency-free Node macOS CLI to inspect and import ready bundles with strict schema/path/hash/size/count/uniqueness verification and atomic destination promotion.
- Emit redacted deterministic JSONL events from both sides.
- Preserve Windows originals and sealed bundles; never delete or overwrite conflicting evidence.
- Preserve `v1` as unpaired legacy evidence and support explicit `v2` adjacent-duplex-front-first and adjacent-duplex-back-first modes with reciprocal side/pair fields, even-count validation, and no filename/profile-name inference. Use back-first for the physically verified `Phronesis Card Duplex` profile.
- Import `v2` backs as linked immutable evidence without scheduling them for recognition; schedule only declared fronts.
- Require batch folders and **Release after scan** in the operator-reviewed PaperStream profile. If scanning completes without output files, inspect PaperStream's supported retained-batch evidence, preserve every original, and do not trigger a rescan until manual-release state is excluded.
- Provide synthetic cross-platform tests and a Windows VM preflight test before physical execution.

## Constraints

- Do not modify Phronesis application code, databases, runtime, recognition, corpus, pricing, offers, inventory, UI, or marketplace adapters.
- Do not add a network listener or Windows database access.
- Do not reverse-engineer or edit PaperStream internal configuration files.
- Do not repair release behavior by modifying PaperStream internal XML. Profile correction belongs in the supported PaperStream UI.
- Do not automate credentials, logins, or Windows desktop interaction.
- Do not assume alternating files prove front/back pairing. Pair only a `v2` bundle whose operator-selected mode, frame count, side values, and reciprocal pair references all validate.
- Do not scan valuable, irreplaceable, damaged, curled, sleeved, or rigid cards.
- Do not commit runtime images, VM files, manifests containing private paths, or hardware identifiers.

## Expected Architecture

~~~text
Interactive Windows operator command
  -> Windows PowerShell bridge
  -> PaperStream Capture registered job (/DocType, /BatchFolder)
  -> Windows-local capture session
  -> PowerShell hash/copy/seal
  -> dedicated Parallels shared ready bundle
  -> macOS strict verify/import
  -> explicit evidence output only
~~~

The Windows side owns acquisition and sealing. The macOS side owns distrustful verification and evidence import. A Mac-side controller may dispatch through an interactive Windows task, but must not launch PaperStream as `SYSTEM`. Neither side owns recognition or product state.

## Testing Expectations

- Node tests for valid import, traversal, symlink, duplicate/case collision, missing marker, marker mismatch, source hash mismatch, destination conflict, and idempotent repeat.
- PowerShell self-tests for session grammar, allowed extensions, empty source, source mutation, copy/hash mismatch, conflicting bundle, and idempotent repeat.
- Windows VM preflight proves supported tools and the dedicated share without scanning.
- Physical gate uses only 2–4 owner-approved low-value cards under direct supervision.
- Prove the physical profile actually releases files into the requested session folder; a scanner-complete signal alone is insufficient.
- Record exact observed frame count/order and matching hashes. For `v1`, do not infer side semantics. For `v2`, test the declared pairing grammar and reject partial or contradictory pairs before import.
- Run repository diff hygiene and secret/private-identifier review.

## Documentation Updates

- `docs/testing/PHR-TECH-015-windows-scanner-bridge-validation.md`
- `docs/implementation-reports/PHR-TECH-015-windows-scanner-bridge-report.md`
- `docs/reviews/PHR-TECH-015-windows-scanner-bridge-conformance.md`
- `docs/release-notes/PHR-TECH-015.md`
- Feature Registry, Atlas, Decisions, Roadmap, Prompt History, Structure, slice plan, handoff, and Product Development Memory.

## Acceptance Criteria

- Software tests and Windows preflight pass.
- A supervised duplex capture produces a sealed bundle and verified Mac import with identical hashes.
- No image/private identifier enters Git and no Phronesis product state changes.
- Chief Architect conformance finds no unresolved critical deviation.

## Non-Goals

- Recognition, offer workflow, application UI, durable production agent, native TWAIN SDK integration, LAN exposure, automatic publication, or cleanup/retention policy.

## Notes For AI Coding Agents

- Preserve unrelated user changes.
- Keep edits scoped to this work order.
- Treat scanner reassignment and physical feeding as explicit supervised gates.
- Present future native Windows-agent improvements separately.
