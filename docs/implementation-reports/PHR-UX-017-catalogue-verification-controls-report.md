# PHR-UX-017 Engineer Report — Catalogue Verification Controls

Date: 2026-08-01

Status: **IMPLEMENTED — PRODUCT REVIEW PENDING**

## Delivered

- Added a pure TCGplayer verification URL builder using selected visible name, collector number, and set.
- Added `CardThumbnailPreview`, a reusable canonical-candidate preview for precise-pointer hover and selected-image keyboard/touch access.
- Used a fixed portal and viewport clamping so catalogue scroll containers cannot clip the 5:7 preview.
- Added Escape/blur/scroll/resize/hover-exit dismissal and pointer-transparent presentation.
- Added a 44px selected-evidence external link with explicit manual-cross-check messaging and safe new-tab attributes.
- Extended `CardImage` with an optional loading mode so only the mounted large preview loads eagerly; normal thumbnails remain lazy.

## Evidence

Focused checks pass 10/10 and the supported full suite passes 305/305. Standalone TypeScript, warning-free lint, production build, and diff hygiene pass. The rebuilt private Vendor Workspace returned the expected two `OP16-022` identities, exact encoded TCGplayer URL, 252×348 contained preview, Escape dismissal, 44px phone link, zero horizontal overflow, and no new browser warning/error after remediation.

## Boundaries

The feature performs no provider discovery, external API request, scraping, external write, identity reconciliation, persistence, or automatic selection. The ordinary external link is not opened during automated/live verification. No dependency, database, authentication, public deployment, commit, or push is included.
