# PHR-TECH-012 — Arbitrage Data-Plane Continuity Validation

## Status

Passed, including private-runtime activation and post-restart API verification.

## Failure Baseline

- `127.0.0.1:3100/api/regional/arbitrage` returned zero candidates.
- The detached private service started raw Next.js without `PHRONESIS_PRICING_DB_PATH` and selected `.data/pricing-lookup.sqlite`.
- That database contained 329,301 Liga evidence rows but zero matched crosswalk rows; `.data/mobile-review.sqlite` contained 131,869 matched identities and 130,183 matches with consumer price evidence.
- The raw-Next recovery path did not supervise the catalogue observer.

## Automated Evidence

- Focused continuity/provider/private-service tests: 11/11 passed.
- Full supported test suite: 392/392 passed.
- `npx tsc --noEmit`: passed.
- `npm run lint`: passed after removing the introduced unused import.
- `npm run build`: passed on Next.js 16.2.12.
- `git diff --check`: passed.
- Both affected launchd property lists pass `plutil -lint`.

## Behavioral Evidence

- The shared resolver defaults to `.data/mobile-review.sqlite`, ignores blank overrides, and preserves explicit relative or absolute test/operator paths.
- Server, observer, import, PriceCharting, and artwork maintenance entry points use the same resolver.
- A newly verified `magic-en` import invokes regional reconciliation once; an unchanged checkpoint does not populate the new-import set and therefore does not invoke it.
- Private review now starts through `scripts/start-phronesis.mjs`, which supervises the observer and Next.js together.
- Supervisor signal handling now exits after child termination; final deployment contains exactly one named private screen, one wrapper, one observer, and one Next.js listener on loopback port 3100.

## Live Operational Evidence

- The private loopback process was restarted with `scripts/start-phronesis.mjs` and the canonical database override; its child observer and Next.js server are both present.
- `/api/regional/arbitrage` changed from zero to 50 ranked rows: 25 US-to-Brazil and 25 Brazil-to-US, all `IDENTITY_VERIFIED`.
- The first row truthfully reports `US-to-Brazil costs are incomplete.` No row is represented as actionable, and availability remains unverified.
- The public event gateway was not restarted or reconfigured.
