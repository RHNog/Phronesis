# PHR-TECH-012 — Arbitrage Data-Plane Continuity

## Summary

Phronesis now selects one operational pricing database across runtime and maintenance entry points. The private launcher supervises both Next.js and catalogue observation, and a newly imported Magic checkpoint rebuilds regional reconciliation instead of leaving identity evidence stranded in another SQLite file.

## Operational Impact

- Runtime recovery can no longer silently fall back to `.data/pricing-lookup.sqlite`.
- Existing verified `.data/mobile-review.sqlite` data remains in place; no 1.2 GB rename or destructive migration is required.
- Catalogue health and regional reconciliation remain separately observable when either stage fails.
- The private runtime is restored through the repository supervisor and now returns 50 ranked identity-verified rows instead of zero.

## Boundary

Identity-verified candidates are not executable opportunities. Direction-specific costs and a real availability verification remain required for `ACTIONABLE` status.
