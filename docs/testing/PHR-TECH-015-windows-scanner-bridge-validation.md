# PHR-TECH-015 — Windows Scanner Bridge Validation

## Status

Verified — Software, Duplex Acquisition, Sealing, And Mac Import Passed

## Software Gate

- [x] PowerShell parser/static validation.
- [x] PowerShell synthetic self-tests: 13/13, including spaced `/DocType`, `/BatchFolder`, and `/Exit` argument preservation.
- [x] Node bridge tests: 10/10.
- [x] Windows VM preflight finds PaperStream Capture; registered job launch was verified physically.
- [x] Dedicated Parallels shared folder is reachable without all-disk host sharing.
- [x] Consent, path, extension, symlink/reparse, count, size, hash, marker, collision, and idempotency failures close safely.
- [x] JSONL events contain no private identifiers or absolute private paths.
- [x] Final `git diff --check` and secret/private-identifier review.

## Physical Gate

- [x] fi-8170 is assigned to Windows and appears through PaperStream.
- [x] Owner-supplied low-value flat unsleeved cards complete the registered duplex job.
- [x] Windows-local originals are preserved.
- [x] Sealed bundle frame count, sizes, hashes, and manifest marker pass.
- [x] macOS import reproduces every frame hash exactly once.
- [x] Observed order is recorded without inferred side pairing.
- [x] Operator reported no damage or feed issues after the completed duplex run.

## Current Evidence

The Windows 11 VM ran Parallels Desktop 26.4 with PaperStream IP, PaperStream Capture 6.1.0, and the fi-8170 assigned over USB 2.0. Preflight reported PaperStream and the dedicated share available.

Session `phr-card-test-20260804-002` acquired 18 single-page JPEG frames (3,053,463 bytes) from nine operator-loaded low-value cards. The count exceeded the planned 2–4-card first batch; the operator explicitly loaded the batch and the bounded bridge/import limit was raised to 32 for this evidence run. PaperStream visibly showed 18/18 alternating card-face/card-back-looking frames, but the manifest preserves `pairingSemantics: unknown`.

PaperStream initially released the 18 originals directly into `C:\PhronesisScannerBridge\capture` because batch-folder output was not enabled. The root was verified empty before the successful run; all 18 files shared the successful-run timestamp. Recovery copied, without deleting or overwriting, those originals into the session directory before sealing. Future runs require batch-folder output and `/Exit`.

The Windows seal produced manifest SHA-256 `723ee7e9be1b91aae5d5e97f3fe55aa8cfe966532ba89b274d27a8647614ad2b`. macOS verified all 18 byte counts and SHA-256 values, imported atomically, and returned `already_imported` on the unchanged repeat. Raw images remain outside Git and no Phronesis product, database, recognition, pricing, inventory, or publication state changed.

The operator reported no damage or feed issues after inspecting the completed batch.

## 2026-08-06 Physical V2 Duplex Gate

- [x] PaperStream acquired 18 full-resolution JPEG originals from nine duplex sheets in strict FRONT/BACK order.
- [x] `BackupData.xml` supplied the authoritative page and side order; no side was inferred from a filename.
- [x] The originals were copied, not moved, from PaperStream's retained batch into `C:\PhronesisScannerBridge\capture\phr-pokemon-duplex-20260806-001`.
- [x] Windows `fc /b` verified every copy against its retained PaperStream original.
- [x] The bridge sealed a valid reciprocal `v2` bundle with manifest SHA-256 `75c0670a8e49d000ea81fb04f63d46b18c9463a276df76538a9361b2e1d50f88`.
- [x] macOS imported nine fronts and nine evidence-only backs; only the nine fronts received recognition jobs.
- [x] Windows local originals, PaperStream retained originals, the sealed shared bundle, and the content-addressed Mac evidence remain preserved.

The PaperStream profile had `UseBatchFolder=1` but `ReleaseAfterScan=0`. The scanner completed, yet PaperStream retained the batch for manual release and therefore created no files in the requested capture folder. Recovery was non-destructive. Before another capture, the operator must enable **Release after scan** in the supported PaperStream profile UI; internal PaperStream configuration files remain outside the bridge contract.
