# PHR-UX-006 Application Structure Validation

## Scope

Validation of the lifecycle-based primary navigation, contextual route ownership, preserved routes, and production build for `PHR-UX-006`.

## Automated Evidence

- `node --test --experimental-strip-types tests/application-navigation.test.ts`: passed 3 of 3 tests.
- `npm run lint`: passed.
- `npm run build`: passed with Next.js 16.2.10, including TypeScript validation and generation of all existing application routes.
- `git diff --check`: passed.

The first sandboxed build attempt could not reach Google Fonts. The identical build was rerun with network access and completed successfully; this was an environment acquisition failure, not an application defect.

## Checkpoint Revalidation

Revalidated on 2026-07-22 under `PHR-STRUCT-20260722-003`:

- `node --import ./tests/register-test-hooks.mjs --test tests/application-navigation.test.ts`: passed 3 of 3 tests.
- `npm test`: executed the complete TypeScript corpus with TypeScript syntax, TSX, and `@/` aliases supported; 142 of 159 tests passed and 17 existing behavioral assertions failed. None of the 17 failures concern `PHR-UX-006` navigation.
- `npm run lint`: passed.
- `npx tsc --noEmit`: failed only with the existing `TS5097` import-extension configuration errors in tests. The prior `TS2367` navigation assertion error is eliminated.
- `npm run build`: could not complete in the restricted environment because `next/font` could not fetch Geist and Geist Mono from Google Fonts. This run did not reach application/build type checking and therefore does not supersede the earlier successful production build.
- `git diff --check`: passed.

The full-suite failures are now reproducible product-test evidence rather than runner or module-resolution failures. They remain outside the bounded navigation and test-infrastructure remediation scope and must not be represented as a passing full suite.

## Verified Behavior

- Primary navigation contains Opportunities, Vendor Workspace, Market Watch, and Settings only.
- No primary destination uses a placeholder anchor.
- Opportunity detail resolves to Discover.
- Vendor Workspace and Purchase Evaluation resolve to Decide.
- Market Watch resolves to Monitor.
- Settings resolves to Administer.
- Developer and unknown routes do not select a production destination.
- Existing `/evaluate`, `/opportunities/[id]`, `/dev/identity`, and `/dev/justtcg` routes remain in the production route manifest.

## Conformance Result

Conforms to the `PHR-UX-006` specification. No product-scope or architecture deviations were found. Review was performed sequentially in the same session and is not represented as independent approval.

## Date

2026-07-22
