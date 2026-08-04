# PHR-TECH-013 Release Notes

## 2026-08-04 — Implementation Started

The Product Owner approved the local card-recognition program. Slice A begins with a standalone macOS fi-8170 capability probe. It does not alter the Phronesis application, scan cards automatically, perform recognition, or publish marketplace data. Physical acceptance remains gated on a connected scanner and owner-approved low-value cards.

## Software Checkpoint

The standalone probe now builds and supports safe `list`, `probe`, and explicitly consented `scan` modes. It emits versioned JSONL, redacts private device/path evidence, hashes and atomically promotes transferred files, suppresses duplicate callbacks, avoids output creation when no device exists, and exits deterministically on cancellation and timeouts. Eighteen unit tests, formatter lint, disconnected execution, scan-gate checks, diff hygiene, and private-identifier review pass. No physical scan has occurred.
