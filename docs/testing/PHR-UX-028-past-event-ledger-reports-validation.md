# PHR-UX-028 — Past Event Ledger Reports Validation

Date: 2026-08-06

Result: Pass — Privately Live; Product Review Ready.

## Automated Evidence

- Event Cash Ledger focused suite: pass, including closed-report ordering, derived summaries, active-event exclusion, exact reopening, and foreign-workspace denial.
- Full supported repository suite: 438/438 pass.
- TypeScript (`npx tsc --noEmit`): pass.
- Full lint (`npm run lint`): pass with no warnings.
- Next.js 16.2.12 production build: pass; `/event-ledger` and `/api/event-ledger` remain dynamic.
- Static surface assertions prove the authorized Route Handler reads `eventId`, uses the bounded report index and exact closed-event method, and the Event Ledger exposes archive/current-event navigation while suppressing new-event controls for selected reports.
- Repository tests prove an active event and a foreign closed event do not enter the archive, exact foreign/active selection returns the same not-found boundary, and summaries remain canonical.

## Live Private Browser Evidence

- Rebuilt production runtime is healthy on loopback `127.0.0.1:3200` and private HTTPS `/event-ledger` returns 200.
- The active Battlezone Card Show displayed `Past event reports · 1` in the Event Ledger header.
- Archive search for `Sanford` retained the one matching historical report without another request.
- Opening the report produced `/event-ledger?eventId=d10c7915-8461-48f3-8322-dc442c0b0c73`, rendered the preserved $9,000 expected/count closeout and balanced $0 variance, and exposed no Record Sale, Close Event, or Start Event control.
- `Back to current event` restored the active event and browser Back restored the same historical report URL and read-only label.
- Desktop 1440×900: document width 1,425 within 1,440; horizontal overflow false.
- Phone 390×844: document width 375 within 390; horizontal overflow false. Close Archive measured 44 pixels high; the report card measured 142 pixels high and 309 pixels wide.
- Browser console error count: zero.
- Validation was read-only; no event, entry, closeout, or stock evidence was changed.

## Boundary

This is same-session implementation conformance evidence, not independent Product Owner approval. The private detached runtime remains subject to the previously documented macOS external-volume reboot-persistence gate.
