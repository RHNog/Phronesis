# PHR-TECH-015 — Temporary Windows Scanner Bridge

## Feature ID

`PHR-TECH-015`

## Title

Temporary Windows/Parallels fi-8170 Acquisition Bridge

## Status

Implemented — S1W Conformance Verified; Duplex Evidence Physical Gate Passed; PaperStream Release Configuration Required Before Next Capture

## Priority

High

## Category

Technical / Windows / Hardware Integration / Local IPC / Reliability / Security / Testing

## Objective

Qualify the fi-8170 and acquire evidence-safe card frames through the working Windows 11 PaperStream stack while the host macOS 27 release remains outside Ricoh's current ICA support contract.

## Background

`PHR-TECH-013-A` proved that the fi-8170 enumerates over USB 2.0 on macOS and corrected the local ImageCaptureCore browser mask. Both Image Capture and the standalone probe still fail to open a session because the host runs macOS 27.0 while Ricoh currently supports Image Scanner Driver for macOS 2.4.1 only through macOS Tahoe 26.

The same scanner previously worked in the local Parallels Windows 11 VM. The VM currently has PaperStream IP and PaperStream Capture 6.1.0. Ricoh documents starting a registered PaperStream Capture job from the command line with `/DocType` and creating a deterministic batch folder with `/BatchFolder`.

## Problem Statement

The approved physical gate cannot proceed through macOS ICA. Returning to unmanaged manual files would lose session boundaries, completion evidence, hash verification, and replay safety. A temporary bridge must use the supported Windows scanner stack without granting Windows direct authority over Phronesis identity, databases, recognition, or publication.

## Proposed Solution

Create a local, file-based bridge with three boundaries:

1. PaperStream Capture owns the Windows scanner session through one operator-reviewed job named `Phronesis Card Duplex`.
2. A PowerShell bridge command owns session IDs, invokes the documented job, validates allowed output files, hashes Windows-local originals, copies them into a dedicated Parallels shared-folder staging directory, rehashes the copies, writes a versioned manifest, and atomically publishes a ready bundle.
3. A dependency-free macOS Node CLI validates the ready marker, schema, path containment, file count, byte counts, hashes, duplicate entries, and stable bundle state before atomically importing evidence into an explicit output root.

The bridge is temporary. It implements the acquisition evidence boundary required to qualify hardware and frames, but it does not replace the future signed, transport-neutral production agent.

## Functional Requirements

- Use the existing Windows 11 VM, PaperStream Capture, PaperStream IP, and fi-8170 over USB.
- Use a dedicated PaperStream job with 300 dpi, 24-bit color, duplex, one image per side, and no OCR-derived naming.
- Invoke only Ricoh's documented PaperStream Capture `/DocType`, `/BatchFolder`, and `/Exit` parameters.
- Launch PaperStream only inside the logged-in operator's interactive Windows session; reject Parallels session-0 execution as an acquisition path.
- Require an explicit session ID matching a bounded safe character grammar.
- Require an explicit physical-scan consent flag before launching PaperStream.
- Capture first to a Windows-local session folder; never treat an actively written capture folder as ready evidence.
- Accept only supported single-frame image extensions and regular files.
- Hash every source and copied frame with SHA-256 and require exact byte/hash equality.
- Publish the bundle only after every file and the manifest are durable; publish by atomic directory rename followed by a ready marker bound to the manifest hash.
- Import only ready bundles into an explicit macOS evidence root.
- Revalidate path containment, manifest hash, frame hashes, sizes, uniqueness, and count before import.
- Preserve Windows-local originals and the sealed shared bundle after import during Slice S1W.
- Emit secret-free JSON Lines events with schema, session, monotonic sequence, event type, and typed evidence.
- Make repeated seal and import operations idempotent for an unchanged session and fail closed on conflicting content.
- Preserve legacy `v1` bundles as unpaired evidence. Do not infer side or pairing from filenames, profile names, or alternating sequence.
- Add an opt-in `v2` manifest for an operator-declared adjacent duplex, front-first PaperStream release. The bridge must reject an odd frame count or any non-reciprocal side/pair declaration before publishing READY.
- Persist each verified `v2` front/back relation as acquisition evidence. Only the front schedules recognition; the back remains immutable linked evidence for operator review.

## Non-Functional Requirements

### Performance

- Bound the first gate to 2–4 low-value cards and at most 16 image files.
- Stream hashes and copies; do not buffer whole images in memory.

### Scalability

- Legacy manifests support ordered frames without assuming front/back pairing. The `v2` contract adds pairing only when the operator explicitly selects the adjacent-duplex-front-first mode and the complete batch satisfies that grammar.
- Production batching, recognition queues, and unbounded sessions remain deferred.

### Maintainability

- Keep the manifest and event contracts platform-neutral.
- Keep PowerShell capture/sealing separate from macOS verification/import.
- Use only operating-system runtimes for the bridge (`PowerShell` and Node built-ins).

### Reliability

- Fail closed on scanner command failure, empty output, unstable files, hash mismatch, unexpected extension, duplicate path, traversal, symlink, existing conflicting bundle, or incomplete marker.
- Never delete the last verified copy.
- A retry either proves the same bundle or creates a new session ID.

### Accessibility

- No new product UI is authorized. CLI failures use explicit text plus machine-readable events.

### Offline Support

- Capture, sealing, transfer, and import work without internet access.

### Security

- No TCP listener, loopback server, credentials, clipboard transfer, browser automation, or Phronesis database access.
- Use one dedicated Parallels host shared folder rather than all-disk sharing.
- Logs omit Windows usernames, Mac usernames, machine names, serials, absolute private paths, and raw image content.
- Reject reparse points, symbolic links, alternate data streams, and paths outside the declared session roots.

### Extensibility

- The bundle schema may later be produced by a native Windows TWAIN agent without changing the importer.

### Responsiveness

- Not applicable; no UI is included.

## User Stories

- As an operator, I want Phronesis to trigger the existing Windows scanner stack so I can continue hardware qualification while macOS 27 is unsupported.
- As an auditor, I want Windows originals and Mac imports bound by the same hashes so the bridge cannot silently change evidence.
- As an architect, I want the temporary bridge to preserve the future platform-neutral acquisition contract.

## Acceptance Criteria

- Static and automated tests cover safe session IDs, manifests, traversal, duplicate files, hash mismatch, ready-marker mismatch, idempotency, and conflicting imports.
- The Windows VM can execute the bridge preflight and find PaperStream Capture 6.1.0.
- The scanner is explicitly reassigned to Windows only for the supervised test.
- A 2–4 low-value-card duplex run produces a sealed bundle and a Mac import with matching per-frame hashes and no private identifiers in events.
- The evidence report states the observed file count and order without inferring front/back pairing.
- A synthetic `v2` duplex bundle proves reciprocal front/back pairing, rejects odd and contradictory declarations, imports only fronts into the recognition queue, and exposes each paired reverse as linked evidence.
- A physical `v2` adjacent-duplex-front-first batch preserves every Windows original, seals an even reciprocal relation, imports only fronts into recognition, and exposes the paired backs as evidence.
- Existing `v1` bundles remain byte-for-byte valid and are displayed as unpaired rather than retroactively upgraded.
- No source image enters Git and no Windows original is deleted. The bridge itself performs no commercial or network mutation; an explicitly authorized downstream recognition import may create only immutable evidence/session/job state under `PHR-TECH-014` and `PHR-WORKFLOW-016`.

## Edge Cases

- VM stopped, Parallels Tools unavailable, scanner assigned to macOS, PaperStream busy, profile missing, jam, multifeed, partial batch, or GUI prompt.
- PaperStream exits before release completes or leaves recovery files.
- Shared folder disconnects during copy.
- Destination already contains the same session with identical or conflicting bytes.
- A malicious manifest supplies absolute, parent-relative, Unicode-confusable, duplicate, or case-colliding paths.

## Dependencies

- `PHR-ARCH-015`.
- `PHR-TECH-013` event, safety, and physical-gate evidence requirements.
- Parallels Desktop 26.4, Windows 11, current Parallels Tools, PaperStream Capture 6.1.0, PaperStream IP, and the fi-8170.
- Product Owner-supplied low-value, flat, unsleeved cards and direct supervision.

## Future Enhancements

- Replace PaperStream Capture with a signed Windows TWAIN/TWAIN x64 agent.
- Replace shared-folder handoff with the authenticated platform-neutral production transport in `PHR-TECH-013-B`.

## Technical Notes

Schema names: `phronesis.windows-scan-bundle/v1` and `phronesis.windows-scan-bundle/v2`. Event schema: `phronesis.windows-bridge-event/v1`. Version 1 records observed sequence only. Version 2 is emitted only for the explicit `adjacent-duplex-front-first` mode and seals each frame's side plus reciprocal paired sequence. The importer validates the full relation before any repository mutation.

The dedicated shared root is runtime evidence and remains ignored. The repository stores tools and synthetic fixtures only.

## UI / UX Notes

The PaperStream job is a one-time operator-reviewed setup. Routine bridge execution uses the registered job name and batch folder from the command line. A future product UI remains governed by `PHR-WORKFLOW-016` and requires a Designer gate.

## Success Metrics

- Zero hash or byte divergence between Windows originals, sealed bundle frames, and Mac imports.
- Zero unconsented scanner starts.
- Zero private identifiers or image bytes committed to Git.

## Open Questions

- The accepted 2026-08-04 batch remains a legacy `v1` bundle. PaperStream emitted alternating front/back-looking frames, but its immutable manifest intentionally records only observed order; the application must not relabel it without a separate operator attestation or a new `v2` capture.
- The temporary PaperStream job must keep batch-folder output enabled and enable **Release after scan** through the supported PaperStream UI. A scan that remains in manual-release state is not a bridge failure and must not be represented as a completed acquisition until its retained originals are recovered and sealed. A future native Windows agent should own session directories directly.

## Traceability

- Product Owner authorization: temporary Windows bridge, 2026-08-04.
- Architecture: `docs/architecture/PHR-ARCH-015-local-card-acquisition-recognition-platform.md`.
- Related implementation prompt: `docs/prompts/PHR-TECH-015-windows-scanner-bridge-prompt.md`.
- Related tests: `docs/testing/PHR-TECH-015-windows-scanner-bridge-validation.md`.
- Related release notes: `docs/release-notes/PHR-TECH-015.md`.
- Last modified: 2026-08-06.
- Modification reason: record the successful physical `v2` acquisition, the manual-release recovery boundary, and the supported-UI configuration gate for subsequent runs.
