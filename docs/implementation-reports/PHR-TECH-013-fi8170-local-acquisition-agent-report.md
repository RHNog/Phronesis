# PHR-TECH-013 Engineer Report — fi-8170 Capability Probe

## Scope

Implemented only `PHR-TECH-013 / Slice A` in the isolated assignment worktree. No Phronesis application, database, runtime, UI, recognition, corpus, pricing, marketplace, deployment, or physical-card state changed.

## Implementation

- Added a standalone Swift package at `native/scanner-agent/macos/Fi8170Probe`.
- Added `list`, `probe`, and explicitly gated `scan` commands.
- Integrated scanner-only `ICDeviceBrowser` discovery, exclusive sessions, document-feeder selection, capability reporting, file-based transfer callbacks, scan completion, cancellation, and device removal.
- Combined the scanner type and local-device location bits required by ImageCaptureCore for USB discovery; added a platform regression test for the browser mask.
- Added `phronesis.scanner-probe-event/v1` deterministic JSONL events.
- Added session-scoped staging, streamed SHA-256, atomic promotion, collision-safe names, duplicate callback suppression, and incomplete-artifact preservation.
- Deferred all output-directory creation until an explicitly authorized scan reaches the configured hardware stage.
- Added serial, long identifier, absolute-path, and filename redaction; the adapter never reads or emits ImageCaptureCore serial, UUID, location, or module-path properties.
- Added bounded discovery, session, scan, cancellation, and recovery deadlines.

## Verification

- `swift build`: PASS.
- `swift test`: PASS, 19/19.
- `swift-format lint --recursive Sources Tests Package.swift`: PASS.
- Disconnected `list --discovery-timeout 2`: PASS, exit 0, zero-device enumeration event.
- Disconnected `probe --device-query fi-8170 --discovery-timeout 2`: PASS, exit 3, typed `device.not_found`.
- `scan` without `--allow-physical-scan`: PASS, exit 2, typed usage rejection, no scan request.
- Explicitly consented disconnected `scan`: PASS, exit 3, typed not-found result, and no output/staging directory created.
- SIGINT during discovery: PASS, exit 130 and typed cancellation event.
- `git diff --check`: PASS.
- Private-identifier/secret pattern review: PASS; only synthetic redaction test fixtures contain sample private-path/serial text.

The SwiftPM process reported sandbox-only warnings that user cache directories were read-only. Build products and module caches were intentionally redirected to `/private/tmp`; compilation and tests passed.

## Deviations

No approved software-scope deviation.

The full physical hardware criteria are intentionally not claimed. Live USB 2.0 discovery now passes without private identifier exposure. Session opening remains blocked after restart because the host is macOS 27.0 and Ricoh's current fi-8170 ICA driver support ends at macOS Tahoe 26; no card was scanned.

## Remaining Gate

Product Owner direction is required: run the existing Slice A gate on a Ricoh-supported macOS Tahoe 26 host, wait for Ricoh macOS 27 driver support, or authorize a separately specified acquisition-adapter architecture. Do not load or scan cards until a session opens successfully.
