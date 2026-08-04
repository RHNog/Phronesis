# PHR-TECH-013 — fi-8170 Local Acquisition Agent

## Feature ID

`PHR-TECH-013`

## Status

In Progress — Software Checkpoint Verified; Physical Gate Pending

## Priority

High

## Category

Technical / Native macOS / Hardware Integration / Reliability / Security / Testing

## Objective

Prove and then implement local, evidence-safe fi-8170 acquisition behind a versioned platform-neutral scanner protocol, beginning with a bounded macOS ImageCaptureCore capability probe.

## Background

The target Mac has a signed universal Ricoh/Fujitsu Image Capture device module installed. Discovery did not find the fi-8170 connected. The installed macOS/Xcode SDK exposes `ICDeviceBrowser`, exclusive scanner sessions, ADF functional-unit capabilities, file and memory transfers, per-page callbacks, completion, and cancellation. The current Mac OS is newer than Ricoh's published support matrix, so runtime compatibility must be proven.

## Problem Statement

Phronesis cannot safely depend on manual vendor capture files or assume that ICA preserves duplex ordering, side identity, feeder completion, error semantics, or settings in the form required by the product brief.

## Proposed Solution

### Slice A — Capability Probe

Create a standalone Swift package and CLI that:

- discovers local scanner devices;
- matches a requested device name without persisting serial numbers;
- opens and closes an exclusive session;
- selects and reports a document-feeder functional unit;
- reports supported resolutions, pixel/bit-depth capabilities, dimensions, document types, duplex support, and feeder-order behavior;
- optionally performs file-based scan transfer into an owner-supplied output directory;
- atomically promotes each transferred file, computes SHA-256, and emits JSON Lines events;
- supports timeout, cancellation, signal-driven shutdown, and disconnected operation;
- writes no image into the repository;
- exits with documented machine-readable status.

### Slice B — Production Agent

After physical acceptance, extract the proven protocol and behavior into a signed local agent with authenticated local transport, session recovery, durable spool integration, and a Windows adapter contract. Slice B is not part of the current work order.

## Functional Requirements

- `list` mode must terminate after local enumeration and emit a deterministic completion event.
- `probe` mode must fail closed when no matching scanner exists.
- `scan` mode must require explicit `--output-directory` and `--allow-physical-scan` flags.
- The default device query is `fi-8170` but is overrideable.
- Device identifiers and serials are represented only by a session-scoped redacted fingerprint when required for event correlation.
- Events include schema version, event ID, session ID, monotonic sequence, timestamp, event type, and typed payload.
- File events include source URL basename, committed path basename, SHA-256, byte count, and observed sequence.
- A frame is reported persisted only after atomic promotion and hashing.
- Session completion is emitted only after ImageCaptureCore completes and all received files are committed.
- Cancellation is idempotent.
- The probe never starts scanning from `list` or `probe` mode.

## Non-Functional Requirements

### Performance

- Process transferred files one at a time in Slice A; report elapsed time without setting an unvalidated throughput target.

### Reliability

- Use a session-specific staging directory beneath the explicit output directory.
- Preserve successfully committed files after later session failure and describe the partial state.
- Clean temporary files on normal completion; quarantine or report incomplete artifacts on failure.

### Security

- No network listener, credentials, browser automation, analytics, telemetry, or cloud call.
- Default logs are JSONL on stdout and avoid absolute paths, serial numbers, and usernames.
- Physical scanning requires an explicit dangerous-operation flag and printed low-value-card warning.

### Maintainability

- Keep protocol/event/domain code independent of ImageCaptureCore classes.
- Inject clock, ID generation, hashing, and file commit behavior where tests need determinism.

### Offline Support

- Build and execute with installed macOS SDK only.

## User Stories

- As an architect, I want actual capabilities from the connected scanner so the production contract is evidence-based.
- As an engineer, I want deterministic JSONL events and tests so driver behavior can be compared across OS versions.
- As an owner, I want scanning impossible without explicit consent so valuable cards are not exposed during development.

## Acceptance Criteria

- `swift build` and `swift test` pass on the target Apple-silicon Mac.
- Disconnected `list` mode terminates cleanly with valid events and no scan request.
- Unit tests prove deterministic event sequencing, redaction, SHA-256, atomic promotion, duplicate destination handling, and cancellation state.
- A connected fi-8170 can be discovered, opened, and capability-reported without the vendor capture UI.
- A supervised 2–4 low-value-card duplex test persists and hashes every received side exactly once.
- The evidence report states whether ICA proves document/side pairing; uncertainty remains explicit.
- No output image or private hardware identifier enters Git.

## Edge Cases

- No devices or only non-scanner devices.
- Scanner is available but held by another process.
- Device disappears before or after session open.
- Functional-unit selection fails or reports no ADF.
- Driver returns a scan URL outside the requested directory.
- A destination basename collides.
- Completion arrives after cancellation or before all asynchronous file work completes.
- SIGINT arrives before device discovery, during session open, or during scanning.

## Dependencies

- `PHR-ARCH-015`.
- macOS ImageCaptureCore and CryptoKit from the installed SDK.
- Physical fi-8170 and owner-supplied low-value test cards for final Slice A acceptance.

## Future Enhancements

- Authenticated Unix-domain-socket agent.
- Windows PaperStream/TWAIN adapter.
- Durable Phronesis session repository and spool.

## Technical Notes

The current SDK confirms that file-based ADF scans emit one `didScanToURL` callback per page, followed by `didCompleteScanWithError`. Exclusive session callbacks and `cancelScan` are delegate-driven. The probe must verify what the actual device module supplies for duplex ordering instead of inventing side metadata.

## UI / UX Notes

No product UI is authorized in Slice A.

## Success Metrics

- Deterministic event log in disconnected and simulated transfer tests.
- No committed duplicate frame under repeated callback simulation.
- Physical capability matrix and go/no-go recommendation produced.

## Open Questions

- Actual ICA duplex event ordering and driver-specific metadata remain a physical-test question.

## Traceability

- Architecture: `docs/architecture/PHR-ARCH-015-local-card-acquisition-recognition-platform.md`.
- Prompt: `docs/prompts/PHR-TECH-013-fi8170-local-acquisition-agent-prompt.md`.
- Validation: `docs/testing/PHR-TECH-013-fi8170-capability-probe-validation.md`.
- Last modified: 2026-08-04.
- Modification reason: Slice A authorization.
