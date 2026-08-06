# PHR-API-005 Engineer Work Order — LigaMagic Authenticated Export Snapshots

## Project Context

Project Phronesis is an evidence-driven decision intelligence platform for collectible markets. Documentation is part of implementation. Follow the originating feature specification before changing code.

## Feature ID

`PHR-API-005`

## Objective

Build a dedicated authenticated LigaMagic browser-export profile, capture one supervised collection export safely, and produce a complete non-scheduled dry-run snapshot across every discovered collection.

## Required Reading

- `docs/api/PHR-API-005-ligamagic-authenticated-export-snapshots.md`
- `docs/api/PHR-API-003-low-cost-market-evidence-sources.md`
- `docs/technical/PHR-WORKFLOW-004-pricing-observer-runbook.md`
- `lib/providers/LigaMagicProvider.ts`

## Implementation Requirements

- Add `playwright-core` only; use installed Chrome and do not download a browser binary.
- Add dedicated profile, pilot, and full dry-run commands. Authentication setup must launch ordinary Chrome without Playwright attached; pilot/dry-run may relaunch that saved profile and attach over CDP only after the session exists.
- Keep profile, downloads, manifests, and snapshots under ignored `.data/ligamagic/`.
- Discover collections and validate semantic ordering/format controls.
- Capture sanitized request/response/download metadata without headers, cookies, storage, query values, or request bodies.
- Reconcile each collection label's advertised card count against the sum of CSV `Quantidade`; preserve row count separately because a unique collection entry may have quantity greater than one.
- Implement hybrid UTF-8/Windows-1252 decoding, exact 19-column validation, BRL centavo normalization, identity keys, hashes, quantity reconciliation, duplicate/conflict accounting, and SQLite snapshot creation.
- Require every discovered collection and advertised row count before declaring completeness.
- Preserve raw evidence and fail closed for reauthentication, CAPTCHA, throttling, incomplete downloads, schema drift, or identity conflicts.
- Run one supervised pilot, then the complete dry run only after pilot validation.

## Constraints

- No LigaMagic password handling, CAPTCHA bypass, Safari/default-profile cookie copying, anonymous scraping, marketplace-page scraping, schedule installation, public deployment, provider mutation, marketplace transaction, or arbitrage recommendation.
- Do not record request headers, cookies, tokens, storage, CSRF values, raw POST bodies, or query values.
- Do not activate or overwrite the canonical TCGplayer pricing database.
- Preserve unrelated work and the open PR branch.

## Expected Architecture

- `lib/providers/ligamagic/`: schema, normalization, identity, receipt, and snapshot assembly.
- `scripts/ligamagic-export.ts`: persistent Chrome profile, export discovery/acquisition, sanitized capture, and CLI modes.
- Package scripts for profile, pilot, and dry run.
- Deterministic tests independent of live LigaMagic access.

## Testing Expectations

- Unit tests for hybrid decoding, exact headers, price semantics, identity keys, duplicates/conflicts, and row-count validation.
- Integration test for transactional snapshot assembly from multiple fixture collections.
- Live pilot evidence with one collection and sanitized trace.
- Complete dry-run evidence for all discovered collections.
- Full suite, standalone TypeScript, lint, production build, and diff checks.

## Documentation Updates

- Feature Registry, Prompt History, Roadmap, Atlas, Structure, validation record, implementation report, release note, and conversation history.

## Acceptance Criteria

- All acceptance criteria in `PHR-API-005` pass with exact commands, hashes/counts, remaining risks, and negative-effect declarations.

## Non-Goals

- Daily scheduling, LigaPokémon, currency conversion, arbitrage scoring/UI, direct API reverse engineering, or canonical market activation.

## Notes For AI Coding Agents

- Preserve unrelated user changes.
- Keep edits scoped to the specification.
- Stop only at the user-controlled authentication/CAPTCHA boundary; resume automatically afterward.
