# PHR-WORKFLOW-004 Implementation Prompt

## Objective

Implement the approved Snapshot-Powered Vendor Workspace as four ordered Standard-lane slices. Follow completed Pricing Update Tool catalogue checkpoints, import strict snapshots transactionally, and combine catalogue evidence with the existing Vendor Workspace Business Profile, offer ladder, and BUY / NEGOTIATE / PASS pipeline in a desktop-first `/vendor` experience with mobile adaptation.

## Required Reading

- `docs/workflows/PHR-WORKFLOW-004-snapshot-powered-vendor-workspace.md`
- `docs/design/PHR-WORKFLOW-004-snapshot-powered-vendor-workspace.md`
- `docs/ux/PHR-UX-007-mobile-pricing-lookup.md`
- `.agents/roles/engineer.md`
- Relevant Next.js 16.2.10 guides under `node_modules/next/dist/docs/`
- Read-only integration evidence in `/Volumes/JarvisSSD/Projects/TCGPlayer Tools/Price Updating/state/run_state.py`, `pipeline/orchestrator.py`, and the verified sample catalogue header.

## Required Implementation

1. Add a strict streaming TCGplayer catalogue adapter and deterministic product grouping for condition-specific source SKUs.
2. Add a read-only observer for verified `export_catalog::<game>` checkpoints, idempotent local imports, and durable operational status.
3. Support active Magic, Pokémon, and One Piece categories through one pricing repository and API.
4. Build the desktop-first Vendor Workspace from snapshot search/evidence plus existing business and evaluation engines.
5. Preserve `/price-lookup` as a shared-data compatibility utility and preserve last-good offline behavior.
6. Add deterministic tests and update traceability, validation, release, implementation-report, roadmap, decisions, Atlas, and product memory artifacts.

## Constraints

- Do not modify Pricing Update Tool files, schedules, database, credentials, browser automation, or external services.
- Do not infer unsupported games or unverified headers.
- Do not add a second pricing, offer, profit, or decision engine.
- Do not deploy, purchase, publish customer-visible behavior, delete data, rewrite Git history, or expose secrets.
- Preserve unrelated repository behavior and documented baseline debt.

## Verification

- Focused adapter/observer/repository tests with fixture checkpoints and catalogues.
- Focused Vendor Workspace integration and navigation tests.
- Supported full suite, lint, standalone TypeScript classification, production build, and `git diff --check`.
- Runtime desktop and 320px mobile inspection, keyboard operation, focus, stale/failure states, and zoom checks when local tooling permits.

## Engineer Return

Return exact files, commands, results, deviations, remaining failures, rollback notes, and negative-effect declarations to Chief Architect conformance. Do not claim independent acceptance.
