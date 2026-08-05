# PHR-TECH-012 — Arbitrage Data-Plane Continuity

## Summary

Phronesis now selects one operational pricing database across runtime and maintenance entry points. The private launcher supervises Next.js and a capture-first catalogue observer. Completed upstream CSVs are hash-bound and archived immediately, while a separate child process performs imports and regional reconciliation without blocking later capture.

## Operational Impact

- Runtime recovery can no longer silently fall back to `.data/pricing-lookup.sqlite`.
- Existing verified `.data/mobile-review.sqlite` data remains in place; no 1.2 GB rename or destructive migration is required.
- Catalogue health and regional reconciliation remain separately observable when either stage fails.
- The private runtime is restored through the repository supervisor and now returns 50 ranked identity-verified rows instead of zero.
- Persistent atomic receipts recover interrupted imports and retain failed archives for review; import always reads the durable copy rather than the upstream transient file.
- Vendor Workspace freshness follows the six-hour schedule and marks a catalogue overdue after eight hours instead of calling week-old evidence current.
- A read-only bounded recovery advanced all five live catalogue checkpoints to the August 5 12:21 run.

## Boundary

Identity-verified candidates are not executable opportunities. Direction-specific costs and a real availability verification remain required for `ACTIONABLE` status.
