# PHR-TECH-015 Release Notes

## 2026-08-04 — Temporary Windows Scanner Bridge

Phronesis can now use the fi-8170 through the existing Windows 11 PaperStream stack while macOS 27 remains outside Ricoh's current ICA support contract.

The temporary bridge captures through an operator-reviewed duplex job, preserves Windows-local originals, seals frames into a hash-bound bundle over a dedicated Parallels share, and independently verifies and atomically imports the evidence on macOS. It does not perform recognition, update Phronesis state, or publish marketplace data.

## Physical Checkpoint

A supervised run acquired 18 JPEG frames from nine low-value cards. All Windows seal and macOS import hashes matched, and repeat import was idempotent. Observed order is retained without asserting front/back pairing.

The operator reported no damage or feed issues after the completed duplex batch.

PaperStream must run in the logged-in Windows session, use batch-folder output, and close through the documented `/Exit` switch. Raw images remain outside Git.

## 2026-08-05 — Explicit Duplex Evidence Contract

Added an opt-in `phronesis.windows-scan-bundle/v2` mode for a physically verified adjacent PaperStream release with explicit front-first or back-first order. The bridge seals each side and reciprocal pair, rejects odd or contradictory batches before READY, and leaves the default `v1` mode unpaired.

On import, declared fronts enter the recognition queue while backs remain content-addressed linked evidence. Existing `v1` bundles are not migrated or guessed. The profile order is never inferred from its name.

## 2026-08-06 — Physical V2 Acquisition

The first physical `v2` session completed with 18 images across nine reciprocal pairs. Direct image inspection established that `Phronesis Card Duplex` releases the Pokémon back from its rear sensor first and the card face second. The first manifest was incorrectly declared front-first; Phronesis repaired the imported session append-only without changing that sealed acquisition record or any image object. Future bridge seals use `AdjacentDuplexBackFirst`, so odd observations are BACK and even observations are FRONT.

PaperStream initially held the completed batch for manual release, so the requested capture folder remained empty. Phronesis recovered and byte-verified the retained originals without deleting any copy, then sealed manifest `75c0670a8e49d000ea81fb04f63d46b18c9463a276df76538a9361b2e1d50f88`. Future routine captures require **Release after scan** enabled in the PaperStream UI.

The expanded contract passes 13/13 Node importer tests and 16/16 PowerShell bridge self-tests in the running Windows VM, including reciprocal back-first sealing and fail-closed contradictory-pair handling.

## 2026-08-06 — Front-Only Routine Intake Contract

Added `phronesis.windows-scan-bundle/v3` and `SingleSidedFront`. Every bounded frame is explicitly `FRONT`, has no pair, and schedules recognition exactly once; contradictory back/pair declarations fail before import. Existing `v1` and `v2` evidence remains unchanged. A separately operator-reviewed `Phronesis Card Front` PaperStream simplex job is required before physical use; creating and physically validating that job remains a supervised supported-UI step.
