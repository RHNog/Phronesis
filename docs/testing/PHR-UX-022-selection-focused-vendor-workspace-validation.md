# PHR-UX-022 Selection-Focused Vendor Workspace Validation

## Scope

Validate the combined TCGplayer/Liga pricing hierarchy and single collapsed grading disclosure without changing price, identity, evaluation, watchlist, or transaction behavior.

## Required Checks

- Structural test proves one combined pricing heading, one `RegionalMarketPanel`, one `PriceChartingGradedArea`, and no regional or certificate component inside Buying decision.
- Regional provider provenance remains visible and fail-closed unmatched copy remains present.
- Grading uses native collapsed `details`/`summary`, contains PriceCharting and embedded certificate lookup, and reloads for an exact selection change.
- Existing Vendor Workspace keyboard, mobile, TCG Direct Low, Track price, checkout, and selection-focus assertions pass.
- Full tests, TypeScript, lint, production build, and diff hygiene pass.
- Private desktop and 390px mobile review show no horizontal overflow, duplicated evidence, or console failure.

## Result

Validated on 2026-08-05.

- Focused Vendor/regional/grading suite: 27/27 passed.
- Full repository suite: 403/403 passed.
- `npx tsc --noEmit`: passed.
- `npm run lint`: passed with no warnings.
- `npm run build`: passed on Next.js 16.2.12; `/icon` and `/apple-icon` compiled as static metadata routes.
- `git diff --check`: passed.
- Live exact Pikachu structure: one `TCGplayer + Liga pricing` region contains TCGplayer $2.09, delivered $2.92, source SKU 4633186, and exact LigaPokemon R$38.99 low / R$42.07 market / R$49.99 patient evidence.
- Grading review: closed by default; expansion contains live PriceCharting candidates and the existing certificate lookup, while Buying decision contains neither regional nor certificate duplication.
- Responsive review: 390px viewport reports 390px inner width, 375px document width, one combined card, one regional panel, and no horizontal overflow.
- Brand review: desktop and mobile logo images load successfully; head metadata exposes PNG icon and apple-touch-icon routes; browser console has zero warnings/errors.
