# PHR-UX-027 — Dashboard Tool Hub Validation

Date: 2026-08-06

Result: Pass — Product Review Ready.

## Automated Evidence

- Focused application-navigation suite: 8/8 pass.
- Full supported suite: 423/423 pass.
- TypeScript (`npx tsc --noEmit`): pass.
- Full lint (`npm run lint`): pass.
- Next.js 16.2.12 production build: pass, including dynamic `/`, dynamic `/opportunities`, static `/manifest.webmanifest`, `/icon.png`, `/apple-icon.png`, and application favicon metadata.
- Navigation tests prove Dashboard is always present after identity admission while non-Dashboard tools remain module-filtered.
- Authorization tests prove limited module sets receive Dashboard plus only their authorized tools.
- Brand-integrity tests bind favicon, Apple icon, and application mark to the approved SHA-256 values from canonical commit `8d655f5`.
- Manifest tests prove `id`, `start_url`, and `scope` are relative `/`, display mode is `standalone`, no hostname or port is embedded, and the published 192/512-pixel assets have their declared dimensions.
- Vendor structure tests prove the outer Event Operations wrapper is static and contains no sticky positioning.

## Live Browser Evidence

- Loopback preview on port 3200 renders nine authorized tool cards at `/`.
- Expanded desktop shell shows the approved 36-pixel mark and selected Dashboard navigation.
- Collapsed desktop shell retains the approved mark at 36 by 36 pixels.
- A 390 by 844 phone viewport renders the approved mark in the Dashboard hero without horizontal overflow.
- Browser console error count: zero.
- Prior mobile-drawer interaction validation remains applicable; the brand revision changes only drawer identity content and retains the same dialog, focus, dismissal, and navigation implementation.
- The renamed tailnet node now serves the isolated worktree at `https://ramons-macbook-pro.tailaa2d39.ts.net:9444/`; root and manifest return 200, and the manifest returns `application/manifest+json`.
- Live head inspection exposes `/manifest.webmanifest`, the approved 32-pixel favicon, 512-pixel application icon, 180-pixel Apple touch icon, `#09090b` theme color, and `Phronesis` Apple web-app title.
- At 1280 by 720, the Event Operations wrapper computes to `position: static`. Before scrolling its bottom is 953 and Buying Decision begins at 1169; after scrolling to Buying Decision, Event Operations ends at -22 while Buying Decision begins at 194. Both checks report no intersection.
- The previously installed Safari application remains locally bound to the retired `ramons-mac-studio…:9444` origin. It cannot consume new metadata from an origin it cannot reach and requires one removal/reinstallation from the current URL; no repository code embeds either tailnet hostname.

## Boundary

This evidence verifies implementation conformance. Product Owner visual acceptance and the one-time Safari reinstall remain separate.
