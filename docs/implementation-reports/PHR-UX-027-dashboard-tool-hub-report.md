# PHR-UX-027 — Dashboard Tool Hub Implementation Report

Implemented a canonical authenticated home at `/`, rehomed Opportunities to `/opportunities`, and centralized tool label, description, area, route, module, and icon identity in `ProductNavigation`. Dashboard cards consume the same server-filtered navigation set as the shared shell, so client presentation never broadens authorization.

The desktop sidebar now collapses to an accessible icon rail and stores only its presentation preference. The existing mobile drawer remains the phone navigation surface. Permanent login already defaults to `/`; temporary worker redemption now also returns `/`, where assigned entitlements determine the visible cards.

The first shell implementation incorrectly used a CSS lettermark because the feature worktree predated the approved branding commit. That was corrected by recovering the exact assets from canonical commit `8d655f5`, binding their hashes in tests, and reusing one `PhronesisMark` component across Dashboard, desktop sidebar, and mobile drawer.

Product Owner review then exposed two operational gaps. The Safari-installed copy retained an obsolete machine-specific `:9444` start URL because the application had no manifest when it was installed, and Vendor Workspace kept the entire Event Operations card sticky above later full-width content. The remediation adds a same-origin standalone manifest, approved 192/512 install-icon derivatives, Apple web-app metadata, and a separate 512-pixel icon route. It also returns the outer Event Operations wrapper to normal flow while preserving the internal cart rail boundary.

The backend on port 3200 was healthy, but the Tailscale node had been renamed from `ramons-mac-studio` to `ramons-macbook-pro` while its `:9444` Serve rule retained the old host. A new host-correct `:9444` mapping was added without changing the port-3100 canonical runtime or public worker gateway. The old local Safari application still requires removal and reinstallation because its captured start URL is local application state, not server metadata.

Validation passed: focused 8/8, full 423/423, TypeScript, full lint, production build, desktop expanded/collapsed live review, phone-width review, live manifest/head inspection, 1280-pixel scroll geometry with zero Event Operations overlap, and zero browser console errors.

Later Product Owner phone review exposed that the translucent installed-WebApp status bar could cover the first 64 pixels of the application header. The shell now consumes `safe-area-inset-top` while preserving a full 64-pixel toolbar below it, applies bottom/top insets to full-screen overlays, and portals the mobile navigation dialog to `document.body` so the sticky header's backdrop filter cannot constrain its fixed viewport geometry. Command search and shortcut help use the same safe-area contract.

The remediation passes the focused 8/8 navigation suite, the current full 438/438 suite, TypeScript, warning-free lint, the Next.js 16.2.12 production build, and a live 390×844 geometry review. The drawer spans the full 844-pixel viewport, controls retain at least 44-pixel targets, the document has no horizontal overflow, and the browser console remains clean.
