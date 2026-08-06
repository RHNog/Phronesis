# PHR-TECH-015 Release Notes

## 2026-08-04 — Temporary Windows Scanner Bridge

Phronesis can now use the fi-8170 through the existing Windows 11 PaperStream stack while macOS 27 remains outside Ricoh's current ICA support contract.

The temporary bridge captures through an operator-reviewed duplex job, preserves Windows-local originals, seals frames into a hash-bound bundle over a dedicated Parallels share, and independently verifies and atomically imports the evidence on macOS. It does not perform recognition, update Phronesis state, or publish marketplace data.

## Physical Checkpoint

A supervised run acquired 18 JPEG frames from nine low-value cards. All Windows seal and macOS import hashes matched, and repeat import was idempotent. Observed order is retained without asserting front/back pairing.

The operator reported no damage or feed issues after the completed duplex batch.

PaperStream must run in the logged-in Windows session, use batch-folder output, and close through the documented `/Exit` switch. Raw images remain outside Git.

## 2026-08-05 — Explicit Duplex Evidence Contract

Added an opt-in `phronesis.windows-scan-bundle/v2` mode for a physically verified adjacent, front-first PaperStream release. The bridge seals each side and reciprocal pair, rejects odd or contradictory batches before READY, and leaves the default `v1` mode unpaired.

On import, declared fronts enter the recognition queue while backs remain content-addressed linked evidence. Existing `v1` bundles are not migrated or guessed. The new Node contract passes 12/12 tests and the extended Windows PowerShell bridge passes 15/15; one supervised physical `v2` pair remains pending.

## 2026-08-06 — Physical V2 Acquisition

The first physical `v2` session completed with 18 images across nine reciprocal FRONT/BACK pairs. Phronesis imported only the nine fronts into recognition and retained every back as linked immutable evidence.

PaperStream initially held the completed batch for manual release, so the requested capture folder remained empty. Phronesis recovered and byte-verified the retained originals without deleting any copy, then sealed manifest `75c0670a8e49d000ea81fb04f63d46b18c9463a276df76538a9361b2e1d50f88`. Future routine captures require **Release after scan** enabled in the PaperStream UI.
