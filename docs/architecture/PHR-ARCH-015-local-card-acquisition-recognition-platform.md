# PHR-ARCH-015 — Local Card Acquisition And Recognition Platform

## Feature ID

`PHR-ARCH-015`

## Title

Local Card Acquisition And Recognition Platform

## Status

In Progress

## Priority

High

## Category

Architecture / Technical / Workflow / Identity / Local Integration / Security / Offline

## Objective

Turn physical card observations into evidence-backed canonical Phronesis assets that Vendor Buying, inventory, TCGPLAYER Tools, LigaMagic, LigaPokémon, and future capture workflows can consume without repeating recognition.

## Background

The Product Owner supplied and approved a local card-recognition brief on 2026-08-04. Phronesis already owns marketplace-neutral card identity, pricing evidence, Vendor offer policy, purchase receipts, inventory, and regional marketplace mappings. It does not yet own scanner control, durable scan evidence, a catalogue-scale local recognition corpus, or a calibrated recognition engine.

The available physical corpus contains approximately 138 scan images, mostly English Magic with a small Pokémon subset. It is useful for acquisition and benchmark scaffolding but is not statistically or semantically sufficient for production auto-accept calibration.

## Problem Statement

Physical buying presently requires manual identity selection. A scanner-specific shortcut would duplicate identity and commerce logic, lose evidence, couple hardware failures to the web process, and make later marketplace integrations depend on one vendor's identifiers. The platform needs a reusable acquisition boundary, durable evidence, calibrated abstention, and marketplace-neutral output.

## Proposed Solution

Create three isolated runtime boundaries:

1. Phronesis owns authorization, scan-session workflow state, canonical identity, pricing, offer policy, operator decisions, and downstream intents.
2. A signed native scanner agent owns device discovery, configuration, feeding, transfer, cancellation, device errors, and normalized acquisition events.
3. A local recognition worker owns preprocessing, retrieval, OCR, geometric verification, scoring, calibration, and evidence production.

Original frames are stored outside SQLite in an immutable content-addressed spool. SQLite stores metadata, provenance, jobs, candidates, decisions, overrides, price bindings, offer lines, and downstream intents. Recognition never publishes externally.

## Functional Requirements

- Operate offline at runtime without paid or cloud recognition.
- Treat scanner, camera, file import, and future multi-card capture as acquisition adapters over the same frame and region model.
- Persist every original before acknowledging frame completion.
- Hash originals and every derived artifact separately.
- Use canonical Phronesis printing and physical-variant identity as source truth.
- Retain candidate evidence, pipeline version, corpus version, confidence policy, and operator overrides.
- Produce `ACCEPTED`, `REVIEW`, or `ABSTAINED` decisions; never force a match.
- Keep condition and subtle finish resolution separate from identity evidence.
- Bind commercial output to a versioned price snapshot and offer preset.
- Export a versioned marketplace-neutral recognized-asset envelope.
- Require explicit human confirmation at irreversible marketplace publication boundaries.

## Non-Functional Requirements

### Performance

- Acquisition persists frames with bounded backpressure and no unbounded in-memory image queue.
- The recognition benchmark reports p50/p95 latency and sustainable throughput before product targets are fixed.

### Scalability

- Corpus manifests and derived indexes are versioned and replaceable without rewriting historical scan evidence.
- The frame model stores a collection of regions even when the first release has exactly one.

### Maintainability

- Native scanner adapters share a transport-neutral protocol, not platform implementation code.
- Recognition runtime selection remains benchmark-gated.

### Reliability

- Atomic file promotion, idempotency keys, job leases, restart recovery, and last-known-good corpus activation are mandatory.
- No lost or duplicate durable frame may be hidden by retries.

### Accessibility

- Later scan-session UI must expose progress, errors, exceptions, and recovery without color-only meaning.

### Offline Support

- Active corpus, indexes, price snapshots, and buying presets must be locally available before an event session begins.

### Security

- Prefer Unix domain sockets on macOS and named pipes on Windows.
- Any loopback transport binds only to `127.0.0.1` and requires a short-lived authenticated challenge.
- Ordinary logs redact serials, usernames, machine names, credentials, and raw OCR beyond bounded card evidence.

### Extensibility

- Windows, multi-card regions, cameras, and downstream marketplaces extend adapters and contracts without redefining canonical identity.

### Responsiveness

- Product UI work is deferred until `PHR-WORKFLOW-016` and follows a separate Designer gate.

## User Stories

- As a buyer, I want to load cards and press Start so that Phronesis prepares reviewable offers without manual image management.
- As an operator, I want uncertain cards to stop in an exception queue so that confidence never becomes false identity.
- As an auditor, I want every commercial decision linked to immutable scan and recognition evidence.
- As an integration owner, I want one recognized-asset contract so each marketplace adapter maps identity once.

## Acceptance Criteria

- The Controlled Lane slice plan is recorded and every source-changing slice has an approved specification and work order.
- The native acquisition protocol proves real fi-8170 behavior before production integration.
- Recognition auto-accept remains disabled until a powered unseen holdout supports the accepted-precision target.
- Vendor Buying reuses current identity, pricing, and offer boundaries.
- No downstream publisher can be called as a recognition side effect.

## Edge Cases

- Scanner absent, busy, disconnected, jammed, or removed during a session.
- Duplex ordering or side information cannot be proven.
- A file is written but metadata commit fails, or metadata commits before a worker receives the job.
- Multiple candidates share art, name, collector number, or marketplace mapping.
- Corpus activation is interrupted or a checksum fails.
- Price evidence is stale or absent after identity succeeds.
- Finish or condition uncertainty is price-material.

## Dependencies

- `PHR-ARCH-010` Phronesis Product Identity.
- `PHR-ARCH-013` Cross-Market Identity Bridge.
- `PHR-WORKFLOW-004` Snapshot-Powered Vendor Workspace.
- `PHR-WORKFLOW-011` Marketplace-Neutral Listing Readiness.
- `PHR-TECH-013` fi-8170 Local Acquisition Agent.
- `PHR-TECH-014` Local Recognition Corpus And Engine.
- `PHR-WORKFLOW-016` Scanner-To-Offer Vendor Buying.
- `PHR-API-015` Recognized Asset Interchange.

## Future Enhancements

- Multi-card and binder capture under `PHR-UX-026`.
- Additional scanner vendors and camera adapters.
- Condition assistance only after a separate evidence and grading specification.

## Technical Notes

Proposed runtime storage:

~~~text
.data/card-recognition/
  objects/sha256/
  derived/sha256/
  indexes/<corpus-version>/
  bundles/<bundle-version>/
  quarantine/
~~~

Originals are immutable. Derived artifacts are separately hashed and linked to parent evidence and pipeline version. Runtime data remains ignored and is never source-controlled corpus authority.

## UI / UX Notes

The first source-changing slice is a native capability probe with no product UI. A Designer gate is required before `PHR-WORKFLOW-016` changes Vendor Workspace.

## Success Metrics

- Zero lost or duplicate committed frames in restart and duplicate-delivery tests.
- Every accepted identity is reproducible from recorded corpus, pipeline, and policy versions.
- Accepted precision, review rate, and latency meet the Product Owner-approved benchmark by game and risk stratum.

## Open Questions

- Windows deployment topology is deferred to the Windows slice.
- Raw scan retention defaults require Product Owner approval before production evidence storage.
- Corpus licensing and redistribution terms must be accepted before catalogue-scale ingestion.

## Traceability

- Originating brief: Product Owner-supplied `Phronesis Local Card Recognition Product Brief`.
- Slice plan: `docs/product-development/PHR-LOCAL-CARD-RECOGNITION-20260804-slice-plan.md`.
- First implementation prompt: `docs/prompts/PHR-TECH-013-fi8170-local-acquisition-agent-prompt.md`.
- Last modified: 2026-08-04.
- Modification reason: approved program initialization.
