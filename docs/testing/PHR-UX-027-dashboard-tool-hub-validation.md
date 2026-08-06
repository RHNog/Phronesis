# PHR-UX-027 — Dashboard Tool Hub Validation

Date: 2026-08-06

Result: Pass — Product Review Ready.

## Automated Evidence

- Focused application-navigation suite: 8/8 pass.
- Full supported suite: 425/425 pass.
- TypeScript (`npx tsc --noEmit`): pass.
- Full lint (`npm run lint`): pass.
- Next.js 16.2.12 production build: pass, including dynamic `/`, dynamic `/opportunities`, static `/manifest.webmanifest`, `/icon.png`, `/apple-icon.png`, and application favicon metadata.
- Navigation tests prove Dashboard is always present after identity admission while non-Dashboard tools remain module-filtered.
- Authorization tests prove limited module sets receive Dashboard plus only their authorized tools.
- Brand-integrity tests bind favicon, Apple icon, and application mark to the approved SHA-256 values from canonical commit `8d655f5`.
- Manifest tests prove `id`, `start_url`, and `scope` are relative `/`, display mode is `standalone`, no hostname or port is embedded, and the published 192/512-pixel assets have their declared dimensions.
- Vendor structure tests prove the outer Event Operations wrapper is static and contains no sticky positioning.
- Shell structure tests prove the dynamic-viewport sidebar, independently scrolling navigation, reciprocal expand/collapse controls, standalone shortcut gate, editable-target protection, functional Settings link, dark scrollbar canvas, safe-area viewport metadata, and shortcut dialog.

## Live Installed-WebApp Evidence

- The private production bundle returns HTTP 200 on loopback port 3200 and the current installed Safari application loads from `https://ramons-mac-studio.tailaa2d39.ts.net:9444/`.
- Expanded desktop shell shows the approved 36-pixel mark, full navigation labels, selected Dashboard state, and a visible Collapse control.
- Collapsing the shell immediately exposes a labelled `Expand` control below the brand header without document scrolling. The navigation list remains inside the fixed dynamic viewport.
- `Cmd+B` toggles the sidebar in the installed application. `G` then `D` navigates from Vendor Workspace to `/`; the final URL and Dashboard heading were verified. Shortcut interception remains disabled for editable controls.
- The top-bar `?` button opens an accessible dialog listing search, sidebar, Dashboard, and all nine authorized tool chords. `Escape` closes the dialog, and the avatar is exposed as an `Open Settings` link.
- Dashboard and Scanner-to-Offer screenshots show a dark document edge and dark scrollbar track/thumb at the far right; the reported white strip is absent.
- A 390 by 844 phone viewport renders the approved mark in the Dashboard hero without horizontal overflow.
- Browser console error count: zero.
- Prior mobile-drawer interaction validation remains applicable; the brand revision changes only drawer identity content and retains the same dialog, focus, dismissal, and navigation implementation.
- The live tailnet node serves the isolated worktree at `https://ramons-mac-studio.tailaa2d39.ts.net:9444/`; root and manifest return 200, and the manifest returns `application/manifest+json`.
- Live head inspection exposes `/manifest.webmanifest`, the approved 32-pixel favicon, 512-pixel application icon, 180-pixel Apple touch icon, `#09090b` theme color, and `Phronesis` Apple web-app title.
- At 1280 by 720, the Event Operations wrapper computes to `position: static`. Before scrolling its bottom is 953 and Buying Decision begins at 1169; after scrolling to Buying Decision, Event Operations ends at -22 while Buying Decision begins at 194. Both checks report no intersection.
- The current Safari installation is bound to the live Mac Studio origin and consumed the rebuilt production bundle after refresh. No repository code embeds a tailnet hostname.

## Boundary

This evidence verifies implementation conformance in the same session and is not independent approval. Product Owner visual acceptance remains separate.

## iPhone Safe-Area Remediation

- Product Owner photo evidence showed the installed iPhone WebApp's status bar overlapping the menu, search, shortcut-help, and profile controls.
- The shared top bar now computes to `4rem + env(safe-area-inset-top)` and applies the inset as top padding, preserving a complete 64-pixel toolbar below the status/Dynamic Island area. Browsers that report a zero inset retain the existing 64-pixel geometry.
- Mobile navigation is portalled to `document.body`, eliminating the fixed-position containing block created by the sticky header's backdrop filter. The drawer and backdrop therefore cover the complete device viewport.
- Mobile navigation, shortcut help, and command search consume the relevant top and bottom safe-area insets.
- Focused application-navigation suite: 8/8 pass.
- Current full supported suite: 438/438 pass.
- TypeScript, warning-free lint, and Next.js 16.2.12 production build: pass.
- Live 390×844 review: 64-pixel zero-inset header, 44-pixel controls, safe-area CSS support, 844-pixel body-portalled drawer, document width 375 within the 390-pixel viewport, no horizontal overflow, and zero console errors.
- The private production runtime was rebuilt and returned HTTP 200 after restart. Final physical-owner iPhone confirmation requires refreshing or fully relaunching the installed WebApp so Safari discards its cached CSS.
