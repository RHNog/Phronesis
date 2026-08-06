# PHR-UX-027 — Dashboard Tool Hub And Collapsible Navigation

- Added an authenticated Dashboard at `/` with one card per authorized Phronesis tool.
- Moved Opportunities to `/opportunities` without changing its `INTELLIGENCE` authorization boundary.
- Added an accessible desktop sidebar that collapses to an icon rail and preserves the local preference across reloads.
- Preserved the existing accessible mobile navigation drawer and added Dashboard as its first destination.
- Made successful temporary-worker login land on the entitlement-aware Dashboard.
- Recovered the approved Phronesis favicon, Apple home-screen icon, and application mark from canonical commit `8d655f5`; the Dashboard hero and desktop/mobile shell now reuse that exact artwork.
- Added an origin-relative standalone web-app manifest, approved 192/512 install-icon derivatives, explicit Apple web-app metadata, and a separate current application-icon route.
- Corrected the tailnet-only scanner-review URL after the host rename; the current address is `https://ramons-macbook-pro.tailaa2d39.ts.net:9444/`.

On 2026-08-06 the tailnet node again reported `ramons-mac-studio` as its live DNS identity. The application remains origin-relative; current access is `https://ramons-mac-studio.tailaa2d39.ts.net:9444/`. The retained MacBook-name Serve alias does not currently resolve and is not an application-code dependency.
- Returned Vendor Workspace Event Operations to normal document flow so it no longer covers Buying Decision or certificate controls while scrolling or zooming.
- Existing Safari installations created under the retired hostname require one removal and reinstall from the current URL.
