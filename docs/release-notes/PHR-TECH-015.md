# PHR-TECH-015 Release Notes

## 2026-08-04 — Temporary Windows Scanner Bridge

Phronesis can now use the fi-8170 through the existing Windows 11 PaperStream stack while macOS 27 remains outside Ricoh's current ICA support contract.

The temporary bridge captures through an operator-reviewed duplex job, preserves Windows-local originals, seals frames into a hash-bound bundle over a dedicated Parallels share, and independently verifies and atomically imports the evidence on macOS. It does not perform recognition, update Phronesis state, or publish marketplace data.

## Physical Checkpoint

A supervised run acquired 18 JPEG frames from nine low-value cards. All Windows seal and macOS import hashes matched, and repeat import was idempotent. Observed order is retained without asserting front/back pairing.

The operator reported no damage or feed issues after the completed duplex batch.

PaperStream must run in the logged-in Windows session, use batch-folder output, and close through the documented `/Exit` switch. Raw images remain outside Git.
