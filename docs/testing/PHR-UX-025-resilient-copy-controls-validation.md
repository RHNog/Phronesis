# PHR-UX-025 — Resilient Copy Controls Validation

Date: 2026-08-03

Result: Pass — Product Review Ready.

Coverage:

- Clipboard API success.
- Clipboard API rejection with legacy fallback.
- Manual recovery when both automatic methods are unavailable.
- Current copy-control adoption, responsive presentation, TypeScript, lint, build, and full regression.

Evidence:

- Focused copy suite: 4/4 pass.
- Full supported suite: 382/382 pass.
- `npx tsc --noEmit --incremental false`: pass.
- `npm run lint`: pass with no warnings.
- Next.js 16.2.12 production build: pass.
- Static adoption assertion confirms both access workflows import the shared control and contain no direct `navigator.clipboard.writeText` call.
- Rebuilt live runtime exposes the new recovery copy in its production client chunk. Private Settings and public worker login return 200; public Settings remains 404.
- A 390×844 browser check confirms Settings and public worker login have no horizontal overflow and the temporary-worker region remains present.
- Both private app and public gateway remain loopback-only in detached supervisors.
