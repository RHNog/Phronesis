# PHR-WORKFLOW-004 Pricing Observer Runbook

## Purpose

Phronesis follows verified catalogue completions from the sibling Pricing Update Tool and imports them into its local last-known-good SQLite repository. It does not schedule downloads, access the Pricing Update Tool database, or modify upstream files.

## Normal operation

- `npm run dev` starts Next.js and the catalogue observer together.
- `npm start` starts the production server and observer together after a build.
- The observer checks every ten seconds and follows `state/run_state.json` completion checkpoints.
- The default local database is `.data/pricing-lookup.sqlite`.
- From the canonical repository, the default upstream root is `/Volumes/JarvisSSD/Projects/TCGPlayer Tools/Price Updating`.

Optional overrides:

```text
PHRONESIS_PRICING_DB_PATH=/absolute/path/pricing.sqlite
PHRONESIS_PRICING_TOOL_ROOT=/absolute/path/to/Price Updating
```

## Verification commands

```text
npm run pricing:sync
npm run pricing:catalog-import -- <catalog.csv> <magic-en|pokemon-en|onepiece-en> <checkpoint-iso-time>
npm run pricing:watch
```

## Expected states

- `CURRENT`: the latest observed completion is active, including a repeated catalogue whose prices did not change.
- `IMPORTING`: a verified completed file is being normalized transactionally.
- `FAILED`: the last import failed; the previous active snapshot remains searchable.
- No catalogue loaded: the observer has not yet seen a completed supported catalogue.

The browser status API intentionally excludes local source paths and source hashes.

## Recovery

1. Stop Phronesis to stop observation.
2. Preserve `.data/pricing-lookup.sqlite` while diagnosing.
3. Correct upstream availability or schema issues without editing upstream run state or catalogues.
4. Run `npm run pricing:sync` or restart Phronesis.
5. If the local database is unrecoverable, move it aside and bootstrap a verified completed catalogue into a new database. Retain the prior database until the new snapshot is validated.

Do not copy Pricing Update Tool credentials into Phronesis or alter its schedules, Postgres data, browser automation, export code, or cleanup behavior from this workflow.
