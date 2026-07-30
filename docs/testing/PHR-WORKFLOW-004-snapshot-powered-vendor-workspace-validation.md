# PHR-WORKFLOW-004 Validation Record

Date: 2026-07-29
Verdict: **READY FOR PRODUCT REVIEW**

## Deterministic verification

- Focused importer, observer, pricing, navigation, Vendor Workspace, and workflow tests: **34/34 passed**.
- `npm run lint`: passed after the generated `.next-evidence` cache was moved out of the repository worktree.
- `npm run build`: passed compilation, application type checking, static generation, `/vendor`, `/api/pricing/search`, and `/api/pricing/status`.
- `git diff --check`: passed.
- Supported full suite: **163 passed / 17 failed**. The 17 failures exactly reproduce the documented pre-feature behavioral baseline; six new PHR-WORKFLOW-004 tests account for the pass-count increase from 157.
- Standalone `npx tsc --noEmit`: reports exactly the documented 27 `TS5097` test-import configuration errors. No PHR-WORKFLOW-004 implementation error appears. Application/build type checking passes.

## Import and reliability evidence

- Representative Magic catalogue: 792,927 rows, 161,475 grouped products, 105 MB source file.
- Initial optimized import: 13.373 seconds; 792,927 history observations.
- Same content at a later completion checkpoint: 14.43 seconds; zero duplicate history observations; category freshness advanced.
- Exact same content and checkpoint: 0.29 seconds; `ALREADY_IMPORTED` with zero row processing.
- Incomplete run-state JSON, schema drift, and repeated checkpoints have fail-closed coverage.
- A one-shot observer run against the live sibling tool root completed safely with no completed catalogue currently present; no upstream state changed.

## Runtime review

The in-app browser exercised `/vendor` against the representative local Magic database.

- Search returned real catalogue matches from the 792,927-row import.
- Arrow-key navigation plus Enter selected an exact Black Lotus printing.
- Condition-level market/delivered-low evidence and source SKU rendered.
- Entering an asking price produced the existing engine's decision, profit, ROI, and negotiation ladder.
- At 1280px, the final desktop three-column layout had no document-level horizontal overflow.
- At 390x844, the workspace rendered as one column with no horizontal overflow.
- Browser console errors: zero.

The representative database and checkpoint were local validation fixtures, not a live-current production claim, and were not written into the repository.

## Known baseline debt

The 17 existing behavioral test failures and 27 `TS5097` errors remain visible and are not attributed to this feature. Deployment, live production data activation, and public release were not performed.
