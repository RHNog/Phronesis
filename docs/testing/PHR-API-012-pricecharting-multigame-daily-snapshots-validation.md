# PHR-API-012 — PriceCharting Multi-Game Daily Snapshots Validation

## Status

Passed — Product Review Ready

## Identity Fixtures

### Magic

- Exact set/name/collector/Normal and Foil resolve distinct targets.
- Collector-less set/name/finish resolves only a unique target.
- Borderless, extended-art, showcase, retro-frame, etched, surge, serialized, prerelease, art-card, and token treatments do not collapse onto base printings.
- Explicit set aliases cover provider naming differences without token-overlap or edit-distance matching.
- Basic-land artwork and legacy-art duplicates remain ambiguous without collector/treatment proof.
- Bare or semantically conflicting `tcg-id` cannot resolve a target.

### One Piece

- `OP07-002`, `22`-style padded numerators within supported prefixed collectors, repeated trailing collector text, and punctuation-normalized names resolve deterministically.
- Base, alternate-art/parallel, manga, SP, pre-release, winner, promotional, anniversary, reprint/PRB, and other supported treatments remain distinct.
- Cross-set promotion routing requires an explicit source qualifier and one unique target.
- An unqualified source selects only an unannotated base printing.
- Japanese rows remain unsupported in `onepiece-en`.
- Future sets absent from Phronesis remain unmatched.

## Receipt And Collision Fixtures

- Magic and One Piece receipts use independent profile-specific resolver versions and active pointers.
- Same source/profile is idempotent.
- Two provider products targeting one SKU become `TARGET_COLLISION` and create no active mapping.
- Apply rolls back completely on forced mapping/observation/pointer failure.
- Category-aware evidence returns only the active receipt for that category.
- Pokémon v9 fixture behavior remains unchanged.

## Daily Acquisition Fixtures

- Reject non-HTTPS, non-PriceCharting, credential-component, fragment-bearing, and malformed URLs.
- Accept only the exact 27-column CSV schema.
- Reject a Magic file supplied to the One Piece job and vice versa.
- Reject empty, partial, HTML, or malformed responses before import.
- Redact URL/token values from all errors and state.
- Skip a game after a successful same-day run.
- Permit retry after same-day failure.
- Enforce at least ten minutes between provider CSV calls.
- Promote each valid game atomically; a second-game failure preserves both its prior pointer and the first game’s successful promotion.
- Watch scheduling computes a future delay and relies on persistent daily state after restart.

## Owner-File Gate

Record for each supplied file:

- absolute source filename, byte count, SHA-256 hash, and row count;
- language/product-type totals;
- local single denominator and catalogue-state hash;
- accepted, graded, ambiguous, collision, unmatched, sealed-review, quarantined, and unsupported counts;
- method and reason-code counts;
- active pointer before and after the dry run.

No coverage percentage is an acceptance substitute. Every increase must come from an explicit tested identity rule, and every collision remains inactive.

## Regression Gate

Prove no unintended mutation of TCG Direct Low, TCG Low, TCG Market, delivered low, artwork, recommended offers, watchlists, Inventory, Display Case, Event Ledger, purchase receipts, or cash totals.

## Required Commands

- Focused importer and daily-sync tests.
- Full `npm test`.
- `npx tsc --noEmit --incremental false`.
- `npm run lint`.
- `npm run build`.
- `git diff --check`.

## Owner-File Results

### Magic (`price-guide.csv`)

- Bytes: 15,690,511.
- SHA-256: `f5e1a057fe0408cdcd6de3aacf7508af43ec4bd62370df284a63ce561259ac97`.
- Rows: 130,186 total; 129,485 eligible singles; 694 sealed review; 6 unsupported; 1 quarantined unknown genre.
- Local denominator: 158,857 Magic singles.
- Dry-run receipt: 4; active pointer before/after: `null` / `null`.
- Accepted: 109,841 (84.83% of eligible source singles; 69.14% of the local single catalogue).
- Graded accepted: 16,432.
- Ambiguous: 523; target collisions: 3,712 rows / 1,856 targets; unmatched: 15,409.
- Methods: 109,479 documented set aliases; 230 documented cross-set variants; 132 exact physical identities.
- Crosswalk fingerprint: `98f6ad5c514869fee830a6cef5b5b45f6f240c460afd7c5de0cdf4caf3b1d50b`.

### English One Piece (`price-guide-2.csv`)

- Bytes: 1,790,260.
- SHA-256: `16b38848294a348dbbe11664c39e57e4089fe87fc94e47292a52617696a18752`.
- Rows: 11,854 total; 6,122 eligible English singles; 89 English sealed review; 5,643 non-English unsupported rows (5,534 singles and 109 sealed).
- Local denominator: 6,894 English One Piece singles.
- Dry-run receipt: 5; active pointer before/after: `null` / `null`.
- Accepted: 4,731 (77.28% of eligible English source singles; 68.62% of the local single catalogue).
- Graded accepted: 2,299.
- Ambiguous: 331; target collisions: 108 rows / 54 targets; unmatched: 952.
- Methods: 3,297 documented set aliases; 1,434 documented cross-set variants.
- Crosswalk fingerprint: `553084c90aefd8de732af6c59b8c97acdbb6c628b84adc83eb3eb94735b7ea0e`.

The residuals remain inactive. Large unmatched groups include catalogues not yet present locally, sealed products, and promotional/parallel identities that cannot be uniquely proven. PriceCharting `tcg-id` was verified as semantically incompatible with the current local source SKU namespace and was never used as a join.

## Automated Evidence

- Focused PriceCharting tests: 30/30 passed, including all 21 Pokémon v9 regression fixtures.
- Full suite: 347/347 passed.
- TypeScript: passed.
- Full ESLint: passed without warnings.
- Next.js 16.2.12 production build: passed (47 routes/pages generated).
- Diff hygiene: passed.
