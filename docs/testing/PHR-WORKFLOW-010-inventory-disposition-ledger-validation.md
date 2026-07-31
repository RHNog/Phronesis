# PHR-WORKFLOW-010 Inventory Disposition Ledger Validation

## Result

PASS — 2026-07-30

## Automated Evidence

- `npm test`: 259/259 passed.
- `npx tsc --noEmit`: passed.
- `npm run lint`: passed without warnings.
- `npm run build`: passed on Next.js 16.2.12; `/inventory` and `/api/inventory` built as dynamic routes.
- `git diff --check`: passed.

## Focused Behavioral Evidence

- Sale atomically decrements on-hand quantity while receipt quantity and acquisition cost remain unchanged.
- All five classifications persist distinctly.
- Creation idempotency prevents duplicate quantity mutation.
- Positive quantity, available quantity, required sale gross, transfer destination, and classification-specific fields fail closed.
- Zero-dollar sale remains explicit gross evidence.
- Reasoned reversal restores quantity and retains the original record.
- A later physical count blocks ambiguous reversal.
- Unknown, voided, and cross-workspace lots fail closed.
- Route mutation requires `INVENTORY:OPERATE`; view-only UI has no mutation controls.

## Private Runtime Evidence

- Persistent private service restarted after the verified build.
- `https://ramons-macbook-pro.tailaa2d39.ts.net:9443/inventory` returned HTTP 200.
- Desktop viewport: 1280×720, document width 1265 within viewport, eight summary cards, zero warning/error console entries.
- Mobile viewport: 390×844, document/main width 375 within viewport, summary width 343, zero warning/error console entries.
- No sample inventory or disposition was created in the live database; dialogs are covered by deterministic UI contract tests.

## Negative-Effect Declaration

- No acquisition evidence, receipt, count, provider data, credentials, external marketplace, payment, schedule, or public deployment was mutated.
- No dependency or destructive migration was introduced.
