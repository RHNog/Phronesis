# PHR-TECH-013 — Engineer Work Order

## Project Context

Project Phronesis is implementing `PHR-ARCH-015` through a Controlled Lane. Documentation is part of implementation. This work order covers only `PHR-TECH-013 / Slice A`.

## Feature ID

`PHR-TECH-013`

## Objective

Implement a standalone macOS Swift capability probe that verifies the installed ImageCaptureCore path for a connected fi-8170 and produces evidence-safe normalized acquisition events.

## Required Reading

- `AGENTS.md`
- `.agents/WORKFLOW.md`
- `.agents/roles/engineer.md`
- `docs/architecture/PHR-ARCH-015-local-card-acquisition-recognition-platform.md`
- `docs/technical/PHR-TECH-013-fi8170-local-acquisition-agent.md`
- `docs/product-development/PHR-LOCAL-CARD-RECOGNITION-20260804-slice-plan.md`
- Installed SDK headers for `ICDeviceBrowser`, `ICDevice`, `ICScannerDevice`, and `ICScannerFunctionalUnitDocumentFeeder`.

## Implementation Requirements

- Create `native/scanner-agent/macos/Fi8170Probe` as a Swift package.
- Separate protocol/domain, file commit/hash, CLI parsing, and ImageCaptureCore adapter code.
- Support `list`, `probe`, and `scan` commands.
- Default match query to `fi-8170`.
- Use ImageCaptureCore scanner-only discovery and main-thread delegate callbacks.
- End local enumeration deterministically.
- Open sessions only in `probe` and `scan`.
- Select the document feeder when available and emit a capability report.
- Start `requestScan` only in `scan` after both `--allow-physical-scan` and an explicit output directory.
- Use file-based transfers, session staging, atomic promotion, SHA-256, collision-safe naming, and per-frame persisted events.
- Support configurable discovery/session/scan timeouts and SIGINT cancellation.
- Emit only JSONL on stdout; diagnostics belong in typed events.
- Redact serials, paths, usernames, and machine identity.
- Write no image or runtime event file into the repository.
- Document exactly what real hardware validation remains blocked.

## Constraints

- No Next.js changes.
- No product UI.
- No network listener.
- No recognition, OCR, corpus download, database migration, or pricing integration.
- No TCGPLAYER/Liga integration.
- No physical scan unless the owner supplies low-value cards and the scanner is connected.
- No valuable, irreplaceable, damaged, curled, sleeved, or rigid card.
- Preserve unrelated owner work by remaining in the isolated assignment worktree.

## Expected Architecture

~~~text
Fi8170Probe CLI
  -> command/options
  -> probe coordinator
     -> platform-neutral event emitter
     -> atomic frame store + SHA-256
     -> ImageCaptureCore adapter
        -> browser
        -> exclusive session
        -> ADF functional unit
        -> file transfer callbacks
~~~

The ImageCaptureCore adapter may expose device-specific limitations but must not leak framework objects into event/domain types.

## Testing Expectations

- Swift unit tests for CLI validation, event encoding/sequence, redaction, hashing, atomic promotion, collision behavior, state transitions, timeout/cancellation decisions, and deterministic capability serialization.
- `swift build` and `swift test`.
- Run disconnected `list` and `probe` commands and record exit status/events.
- Run `git diff --check` and a secret/private-identifier review.
- Physical scan validation is a separate final checkpoint when hardware is present.

## Documentation Updates

- `docs/testing/PHR-TECH-013-fi8170-capability-probe-validation.md`
- `docs/implementation-reports/PHR-TECH-013-fi8170-local-acquisition-agent-report.md`
- `docs/reviews/PHR-TECH-013-fi8170-local-acquisition-agent-conformance.md`
- `docs/release-notes/PHR-TECH-013.md`
- Feature Registry, Atlas, Decisions, Roadmap, Prompt History, Structure, Active Task, and conversation history as state changes.

## Acceptance Criteria

- Every software-only criterion in the feature specification passes.
- The implementation fails safely when hardware is absent.
- The Chief Architect can determine exactly which criteria await a connected scanner.

## Non-Goals

- Production agent, app integration, recognition, corpus construction, offer calculation, marketplace export, or deployment.

## Notes For AI Coding Agents

- Preserve unrelated user changes.
- Keep edits scoped to Slice A.
- Do not represent disconnected tests as physical scanner acceptance.
