# PHR-TECH-015 Engineer Report — Windows Scanner Bridge

## Scope

Implemented the temporary Windows/Parallels acquisition adapter only. No Phronesis application, database, recognition, corpus, pricing, offer, inventory, marketplace, deployment, or publication state changed.

## Implementation

- Added a fail-closed PowerShell preflight, PaperStream capture, hash/copy/seal, and atomic ready-bundle command.
- Added a dependency-free Node inspector/importer with strict manifest, marker, containment, extension, count, size, SHA-256, collision, symlink, conflict, and idempotency checks.
- Added synthetic Windows and macOS tests plus operator documentation.
- Required explicit physical consent and safe session/job grammar.
- Preserved Windows originals, sealed frames, and Mac-imported evidence.
- Used a dedicated Parallels share; no listener, credentials, clipboard transfer, all-disk grant, or product authority was added.
- Corrected native argument construction for profile names containing spaces and added PaperStream's documented `/Exit` lifecycle switch.
- Established that PaperStream must launch in the logged-in Windows console session; Parallels remote execution runs as `SYSTEM` in session 0 and is limited to preflight/sealing or interactive dispatch.

## Verification

- PowerShell bridge self-tests: PASS, 13/13, including native argument preservation.
- Node bridge tests: PASS, 10/10.
- Windows preflight: PASS; PaperStream and dedicated share available.
- fi-8170 Windows USB assignment: PASS.
- Physical duplex acquisition: PASS, 18 single-page JPEG frames from nine owner-loaded low-value cards.
- Windows sealed manifest: PASS, 18 frames, 3,053,463 bytes, manifest SHA-256 `723ee7e9be1b91aae5d5e97f3fe55aa8cfe966532ba89b274d27a8647614ad2b`.
- macOS distrustful inspection: PASS, all 18 sizes and hashes matched.
- Atomic macOS import: PASS.
- Unchanged repeat import: PASS, `already_imported`.
- Pairing claim: none; manifest records `pairingSemantics: unknown`.

## Deviations And Recovery

The operator loaded nine cards instead of the planned 2–4-card first batch. The bridge and importer remained bounded by an explicit 32-frame limit for this 18-frame run.

The initial successful release wrote files directly into the verified-empty capture root because the PaperStream job did not have batch-folder output enabled. No original was deleted or overwritten. All 18 successful-run files were copied into the explicit session directory and then sealed normally. The production instructions now require batch-folder output and `/Exit` before future acquisition.

Several pre-acquisition attempts exited before scanner activity because PaperStream was open, the profile name was flattened by Windows PowerShell, or the process ran in Parallels session 0. Each failed closed without a sealed bundle. The final run used the active Windows operator session.

## Operator Observation

The operator reported no damage or feed issues after the completed duplex batch.

## Remaining Gate

Commit the verified implementation and generate the repository Handoff seal. Push and deployment remain unauthorized.

## 2026-08-05 Duplex Evidence Increment

The Scanner-to-Offer review exposed that the original repository model had `side` and `paired_frame_id`, but the accepted Windows bundle intentionally sealed every frame as unknown. The increment adds an explicit `v2` manifest rather than inferring from alternating filenames. Its operator-selected adjacent-duplex-front-first mode requires an even count, seals each side and reciprocal pair, and is rejected before import when the relation is incomplete or contradictory.

The Mac importer validates the complete manifest before repository mutation. It schedules recognition only for fronts and stores backs as immutable linked evidence. Legacy `v1` behavior remains byte-compatible and unpaired. Node validation passes 12/12, and the updated Windows PowerShell self-test passes 15/15 through the VM current-user context. One new physical pair remains pending in the interactive Windows scanner session.

## 2026-08-06 Physical V2 Completion And Manual-Release Recovery

The supervised physical gate completed as session `phr-pokemon-duplex-20260806-001`: PaperStream retained 18 full-resolution JPEG originals representing nine strict FRONT/BACK pairs. Its own `BackupData.xml` supplied the authoritative alternating page declarations. The bridge did not guess from filenames.

No requested batch-folder files appeared because the registered profile was configured with batch folders enabled but automatic release disabled (`ReleaseAfterScan=0`). Recovery copied—not moved—the 18 retained originals into the Windows session folder and byte-compared every copy before sealing. The resulting reciprocal `v2` manifest has SHA-256 `75c0670a8e49d000ea81fb04f63d46b18c9463a276df76538a9361b2e1d50f88`. macOS imported nine recognition fronts and nine evidence-only backs. All retained, local, sealed, and imported evidence copies remain preserved.

The physical `v2` acquisition gate is passed. The supported PaperStream UI must enable **Release after scan** before the next routine capture. Direct edits to PaperStream internal configuration remain prohibited.
