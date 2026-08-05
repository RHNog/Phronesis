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
