# PHR-API-010 — PriceCharting Graded Evidence

## Status
Implemented — Credential Activation Pending

## Objective
Add separately attributed graded-market evidence to Vendor Workspace without contaminating exact TCGplayer identity or artwork.

## Official Contract Findings
PriceCharting requires a paid subscription and a private 40-character token transmitted as the `t` query parameter. The API is limited to one call per second; bulk CSV is limited to one call per ten minutes and generated daily. Prices are integer cents and current-only. Card keys represent Ungraded, grades 7/7.5, 8/8.5, 9, 9.5, PSA 10, BGS 10, CGC 10, and SGC 10. The documented Prices API exposes no artwork URL and therefore cannot close image gaps.

## Implemented Boundary
Settings can securely register `PRICECHARTING_API_TOKEN`, provider health reports activation, and a selected single loads separately attributed Graded Area candidates. The owner explicitly authorized transmission through the vendor-required HTTPS `t` query parameter on 2026-08-01. A global request barrier enforces at least 1.05 seconds between calls, exact queries are cached for six hours, and collector/name screening occurs before detail calls.

`PHR-API-011` separately specifies immutable bulk CSV receipts, collision-free local identity reconciliation, and active imported evidence. The live adapter remains a manual verification path and does not own bulk ingestion, scheduling, or canonical identity.

## Required Live-Adapter Rules
- Rate-limit globally to at most one request per second and cache exact resolutions.
- Never expose the token to the browser, response body, UI state, or application logs.
- Keep candidates untrusted until name, set, collector number, language, and variation are corroborated.
- Never overwrite TCGplayer values or artwork; store PriceCharting as independent evidence.

## Traceability
- Official source: `https://www.pricecharting.com/api-documentation`
- UI: `features/vendor/components/PriceChartingGradedArea.tsx`
- Last modified: 2026-08-01
