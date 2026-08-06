# PHR-TECH-012 — Arbitrage Data-Plane Continuity Validation

## Status

Passed, including private-runtime activation, capture-first catalogue recovery, freshness correction, and post-restart API verification.

## Failure Baseline

- `127.0.0.1:3100/api/regional/arbitrage` returned zero candidates.
- The detached private service started raw Next.js without `PHRONESIS_PRICING_DB_PATH` and selected `.data/pricing-lookup.sqlite`.
- That database contained 329,301 Liga evidence rows but zero matched crosswalk rows; `.data/mobile-review.sqlite` contained 131,869 matched identities and 130,183 matches with consumer price evidence.
- The raw-Next recovery path did not supervise the catalogue observer.
- On August 5, the observer began a synchronous 798,798-row Magic import at 12:21:09 local. The upstream tool completed Pokémon and the remaining catalogues, then deleted every transient CSV at 12:23:50 before the blocked observer could poll again. Only Magic advanced; four categories remained on August 4.

## Automated Evidence

- Focused pricing, regional-provider, Pokémon, and Vendor Workspace tests: 54/54 passed.
- Full supported test suite: 402/402 passed.
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
- The observer parent performs only completed-file discovery, hashing, atomic archival, and receipt persistence. A separately supervised one-shot child drains verified archives into SQLite and performs watchlist, regional, and enrichment follow-up.
- Capture receipts persist `CAPTURED`, recoverable `IMPORTING`, terminal `IMPORTED`, or terminal `FAILED` state and bind category, checkpoint, SHA-256, archive path, and timestamps.
- Imports read only the durable archive. A deliberately deleted completed Magic file did not prevent a later Pokémon file from being captured, and an archive hash mismatch failed closed without import.
- Catalogue freshness now reflects the six-hour acquisition schedule with an eight-hour grace window; the Vendor Workspace visibly reports overdue categories and selected snapshots.

## Live Operational Evidence

- The private loopback process was restarted with `scripts/start-phronesis.mjs` and the canonical database override; its child observer and Next.js server are both present.
- `/api/regional/arbitrage` changed from zero to 50 ranked rows: 25 US-to-Brazil and 25 Brazil-to-US, all `IDENTITY_VERIFIED`.
- The first row truthfully reports `US-to-Brazil costs are incomplete.` No row is represented as actionable, and availability remains unverified.
- The public event gateway was not restarted or reconfigured.
- The deleted August 5 12:21 Pokémon, One Piece, Riftbound, and Lorcana CSVs were recovered read-only from the Pricing Update Tool's latest PostgreSQL staging tables. Exported line counts exactly matched the four table counts plus headers, and log-derived completion timestamps matched the same run.
- Four recovery files were hash-bound, archived, imported, and left with terminal `IMPORTED` receipts. The operational checkpoints are now Magic `16:21:09.316Z`, Pokémon `16:21:32.529Z`, One Piece `16:21:41.206Z`, Riftbound `16:21:47.647Z`, and Lorcana `16:21:55.921Z` on 2026-08-05.
- Live `/api/pricing/search` reports all five categories loaded, `CURRENT`, and `stale: false`. The private runtime, capture observer, and Next.js server are launch-managed and tailnet `/vendor` returns HTTP 200.
