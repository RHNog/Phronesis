# PHR-ARCH-010 Dedicated Application Icon Implementation Report

## Scope

Adopt the Product Owner-supplied compact Phronesis artwork for browser favicon and iOS application metadata without changing the full navigation logo.

## Implementation

- Added canonical `public/brand/phronesis-app-icon.png` from the supplied 1254×1254 JPEG through deterministic PNG conversion.
- Added static Next.js metadata files: 512×512 `app/icon.png`, 180×180 `app/apple-icon.png`, and 32×32 `app/favicon.ico`.
- Removed the prior generated icon routes and their now-unused full-logo response helper.
- Updated regression coverage to verify shell-logo separation plus every icon hash, format, and dimension.

## Evidence

- Focused tests: 6/6 passed.
- Full tests: 404/404 passed.
- `npx tsc --noEmit`: passed.
- `npm run lint`: passed.
- `npm run build`: passed under Next.js 16.2.12.
- Fresh local production metadata and all three icon routes: passed.
- Visual inspection and diff hygiene: passed.

## Deployment

The launch-managed private runtime was restarted from the validated production build. Fresh local and tailnet responses expose all three new metadata links and exact repository asset hashes. Repository publication is authorized in the same delivery.
