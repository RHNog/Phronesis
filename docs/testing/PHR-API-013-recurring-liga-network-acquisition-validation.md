# PHR-API-013 — Recurring Liga Network Acquisition Validation

## Status

Passed with an upstream data-integrity gate. The 03:00 schedule is loaded, the LigaPokemon pilot is verified, and the exact Lote 10 authority passes. Full snapshot creation now fails closed on a separate stable two-card Lote 4 mismatch.

## Automated Evidence

- Focused continuity/provider/private-service tests: 11/11 passed.
- Full supported test suite: 392/392 passed.
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
- The next full run passed Lote 10 and reached Lote 4. Lote 4 advertised 9,870 but exported 9,868; an independent repeat produced the identical 1,110,600-byte file and SHA-256 `c9317ffa241641dc6b5d8c3936f09f457892b03a4d8b3665cf278ebd0bc50e94`. No authority exists for this second mismatch.
- The recurring runner uses an exclusive owner-readable lock, rejects live overlap, preserves stale-lock evidence, atomically updates status, and records provider outcomes independently.
- A same-day successful provider outcome is not reacquired unless `--force` is explicit.
- Only a `DRY_RUN_COMPLETE` receipt can proceed; conflicting duplicate evidence fails closed.
- Complete LigaMagic acquisition triggers the operational Magic regional crosswalk rebuild. LigaPokemon remains unpromoted.
- `com.phronesis.regional-acquisition.plist` schedules 03:00 America/New_York through the canonical JarvisSSD checkout.

## Research Boundary

The Product Owner authenticated in the isolated ordinary-Chrome profile. Phronesis attached only after login, inspected visible export controls, and downloaded owner-authorized CSV files. It did not enter or read credentials, cookies, browser storage, CAPTCHA answers, request bodies, or query values, and it performed no public-page scraping or provider mutation.

## Remaining Operational Checks

- Reauthenticate the saved LigaMagic profile, then rerun the once-only acquisition. The first scheduled-equivalent run reached the authenticated page safely but returned `REAUTHENTICATION_REQUIRED`; no snapshot or last-good crosswalk was replaced.
- Decide whether the repeat-identical 9,868-card Lote 4 CSV is authoritative over its 9,870 source label. Until explicitly authorized, recurrence records `SOURCE_COUNT_MISMATCH` and preserves partial raw evidence without snapshot promotion.

## Activation Evidence

- The installed `com.phronesis.regional-acquisition` LaunchAgent is loaded in `gui/501`, has an active 03:00 calendar trigger, and has not fired early.
- `npm run regional:acquisition:status` records independent LigaMagic and LigaPokemon outcomes atomically.
- Ordinary Chrome is required for the provider's trusted-session boundary. The scheduled worker launches the executable directly, waits a bounded interval for its loopback CDP endpoint, attaches, exports, and closes it without using LaunchServices.
