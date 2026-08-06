# PHR-UX-025 — Resilient Copy Controls

## Feature ID

`PHR-UX-025`

## Title

Resilient Copy Controls

## Status

Implemented — Product Review Ready

## Priority

High

## Category

UX / UI / Accessibility / Mobile Reliability

## Objective

Make every Phronesis copy action reliable and understandable on iPhone Safari, embedded browsers, desktop browsers, and restricted clipboard environments.

## Background

Worker codes and public/private access links must be transferred quickly during event operations. Direct fire-and-forget calls to the Clipboard API can be rejected by Safari or embedded browsers and previously produced no success or failure feedback.

## Problem Statement

The copy controls in temporary worker access and employee activation called `navigator.clipboard.writeText` without awaiting or handling the result. A rejected or unavailable API looked like a dead button and left no recovery path.

## Proposed Solution

Centralize clipboard behavior behind one client utility and one reusable accessible control. Try the modern asynchronous Clipboard API first, fall back to a direct-tap legacy copy operation, then expose a focused selectable text field when browser policy blocks both. Always announce success or recovery status visibly and through an ARIA live region.

## Functional Requirements

- Copy worker codes, public worker links, and private activation links through the shared control.
- Await the browser operation and display explicit copied feedback.
- Retry through a compatibility copy path when the modern API rejects or is unavailable.
- Reveal the exact source text for press-and-hold manual copying if automatic copy remains unavailable.
- Reset feedback when the copied value changes.

## Non-Functional Requirements

### Maintainability

New copy actions must reuse `CopyTextButton` and `copyText` instead of calling browser clipboard APIs directly.

### Reliability

Clipboard rejection, missing APIs, legacy-copy failure, and synchronous exceptions must never become unhandled failures.

### Accessibility

Controls retain 44px minimum targets, expose visible status, use a polite live region, and provide a labelled read-only manual field.

### Security

Copying remains a direct user gesture. Values are not logged, persisted, transmitted, or written anywhere except the user clipboard.

### Responsiveness

The manual field wraps within its container and remains selectable on phone viewports without horizontal overflow.

## User Stories

- As an owner on an iPhone, I want immediate confirmation that a worker link copied so I can send it confidently.
- As a user in a clipboard-restricted browser, I want the exact value selected for manual copying instead of a silent failure.
- As an engineer, I want one reusable control so future copy features inherit the same recovery behavior.

## Acceptance Criteria

- Modern Clipboard API success avoids the fallback.
- Modern rejection invokes the compatibility fallback.
- Failure of both methods reveals the manual-copy field and an actionable message.
- All current direct clipboard calls are replaced.
- Tests, TypeScript, lint, build, and phone-width verification pass.

## Edge Cases

- Clipboard API is absent.
- Clipboard permission is denied after a direct tap.
- Legacy `execCommand` is absent, throws, or returns false.
- The source value changes after a successful or failed copy.

## Dependencies

- Browser DOM clipboard and selection primitives.
- Existing client-rendered access-management panels.

## Future Enhancements

- Optional Web Share integration for event links where supported.

## Technical Notes

`lib/browser/copyText.ts` owns ordered adapter selection. `components/ui/CopyTextButton.tsx` owns interaction state and manual recovery presentation. Domain panels supply only the source value and labels.

## UI / UX Notes

Keep feedback adjacent to the initiating button. Do not use toast-only feedback because it may disappear offscreen or be missed by assistive technology.

## Success Metrics

- Zero silent copy failures in supported Phronesis controls.

## Open Questions

- None.

## Traceability

- Originating request: Product Owner report that Copy public link did not work on iPhone, followed by authorization to implement a reusable fix.
- Related implementation prompt: `docs/prompts/PHR-UX-025-resilient-copy-controls-prompt.md`.
- Related tests: `tests/copy-text.test.ts`.
- Related release notes: `docs/release-notes/PHR-UX-025.md`.
- Last modified: 2026-08-03.
- Modification reason: Initial implementation.
