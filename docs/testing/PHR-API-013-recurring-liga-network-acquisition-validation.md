# PHR-API-013 — Recurring Liga Network Acquisition Validation

## Status

Passed. The 03:00 schedule is loaded, LigaPokemon authentication and pilot are verified, all four exact Product Owner quantity authorities pass, and a complete conflict-free 18-collection snapshot is recorded successfully.

## Automated Evidence

- Focused continuity/provider/private-service tests: 11/11 passed.
- Full supported test suite: 393/393 passed.
- TypeScript, lint, production build, diff hygiene, and launchd plist validation passed.

## Verified Behaviors

- LigaMagic and LigaPokemon have separate allowlisted hosts, profile roots, debug ports, configuration, raw-run roots, table prefixes, feature metadata, and receipts.
- Owner authentication and the pilot share one visible dedicated Chrome session; the pilot attaches to that already-authenticated session without inspecting credentials or storage.
- Scheduled export relaunches the isolated profile in ordinary Chrome and attaches through a loopback-only CDP endpoint after startup. Authenticated inspection proved LigaPokemon's controls exist on that path but disappear in both headless and Playwright-launched headed contexts because of the provider's browser challenge.
- LigaPokemon rejects schema drift with its own provider label and writes only `ligapokemon_*` snapshot tables.
- A full LigaPokemon run refuses to start until a successful owner-authenticated pilot records `pilotVerifiedAt`.
- Reopening an unchanged dedicated profile preserves `pilotVerifiedAt`; explicitly reconfiguring the export URL clears it and requires a fresh pilot.
- The authenticated pilot completed Lote 1 with 9,772 advertised cards, 9,772 rows, and a matching quantity sum.
- Full acquisition reached Lote 10 and stopped because the page advertised 9,704 cards while the CSV contained 9,700 rows/cards. An independent repeat produced the identical 1,081,895-byte file and SHA-256 `060ccf4bf2ce66fee1957495bb4eb46434455aea99b4de828dfe5d4e44f14e6d`.
- After Product Owner authorization, Lote 10 records source-advertised 9,704, authoritative 9,700, and `PRODUCT_OWNER_EXPORT` provenance; changed labels, counts, providers, or quantities remain strict.
- The next full run passed Lote 10 and reached Lote 4. Lote 4 advertised 9,870 but exported 9,868; an independent repeat produced the identical 1,110,600-byte file and SHA-256 `c9317ffa241641dc6b5d8c3936f09f457892b03a4d8b3665cf278ebd0bc50e94`.
- After Product Owner authorization, Lote 4 records source-advertised 9,870, authoritative 9,868, and `PRODUCT_OWNER_EXPORT` provenance; changed labels, counts, providers, or quantities remain strict.
- Two subsequent full runs passed Lote 4 and reached Lote RF 3. It advertised 9,983 but exported 9,982 rows/cards in both runs; the two 1,256,589-byte files are byte-identical with SHA-256 `4c7328dc25b05856966500bbd22a0607f6aa462c6d36e02e476357bf2f6a0dec`.
- After Product Owner authorization, Lote RF 3 records source-advertised 9,983, authoritative 9,982, and `PRODUCT_OWNER_EXPORT` provenance; changed labels, counts, providers, or quantities remain strict.
- The next full run passed all three then-approved authorities and reached collection 18 of 18, Lote RF 6. It advertised 7,681 but exported 7,679 rows/cards. An independent collection-only pilot produced a second byte-identical 1,007,852-byte file with SHA-256 `c0866cb2963289cbe5fc2a8478ab779ac1f4f5406299b3cde21df504bab628f8`.
- After Product Owner authorization, Lote RF 6 records source-advertised 7,681, authoritative 7,679, and `PRODUCT_OWNER_EXPORT` provenance; changed labels, counts, providers, or quantities remain strict.
- Full snapshot `dry-run-20260804T041632935Z` completed all 18 collections with 167,921 source-advertised cards, 167,912 authoritative rows/cards, 167,912 unique identities, zero identical duplicates, and zero conflicting duplicates.
- The scheduled-equivalent orchestrator independently created and verified snapshot `dry-run-20260804T041909649Z`, recording LigaPokemon `SUCCESS`. Overall orchestration remained `PARTIAL_FAILURE` only because LigaMagic independently returned `REAUTHENTICATION_REQUIRED`.
- The recurring runner uses an exclusive owner-readable lock, rejects live overlap, preserves stale-lock evidence, atomically updates status, and records provider outcomes independently.
- A same-day successful provider outcome is not reacquired unless `--force` is explicit.
- Only a `DRY_RUN_COMPLETE` receipt can proceed; conflicting duplicate evidence fails closed.
- Complete acquisition triggers the provider-specific operational crosswalk rebuild: Magic through its existing reconciler and LigaPokemon through `PHR-API-014`. Pokémon candidate exposure remains unpromoted.
- `com.phronesis.regional-acquisition.plist` schedules 03:00 America/New_York through the canonical JarvisSSD checkout.

## Research Boundary

The Product Owner authenticated in the isolated ordinary-Chrome profile. Phronesis attached only after login, inspected visible export controls, and downloaded owner-authorized CSV files. It did not enter or read credentials, cookies, browser storage, CAPTCHA answers, request bodies, or query values, and it performed no public-page scraping or provider mutation.

## Remaining Operational Checks

- Reauthenticate the saved LigaMagic profile, then rerun the once-only acquisition. LigaPokemon now completes independently and is protected by same-day success idempotency; no failed Magic run replaces its last-good snapshot or crosswalk.

## Activation Evidence

- The installed `com.phronesis.regional-acquisition` LaunchAgent is loaded in `gui/501`, has an active 03:00 calendar trigger, and has not fired early.
- `npm run regional:acquisition:status` records independent LigaMagic and LigaPokemon outcomes atomically.
- Ordinary Chrome is required for the provider's trusted-session boundary. The scheduled worker launches the executable directly, waits a bounded interval for its loopback CDP endpoint, attaches, exports, and closes it without using LaunchServices.
