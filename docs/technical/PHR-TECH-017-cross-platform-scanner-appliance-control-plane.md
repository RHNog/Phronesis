# PHR-TECH-017 — Cross-Platform Scanner Appliance Control Plane

## Feature ID

`PHR-TECH-017`

## Title

Cross-Platform Scanner Appliance Control Plane

## Status

Implemented — Control Plane Foundation; Signed Distribution And Physical Qualification Gated

## Priority

Critical

## Category

Technical / Native Agent / macOS / Windows / Hardware / API / Security / Reliability / UX

## Objective

Make a scanner attached to a supported Mac or Windows computer behave as a Phronesis-controlled appliance: pair once, report readiness, start and cancel exact scan batches from Phronesis, and deliver front-only evidence directly into the local recognition pipeline.

## Background

`PHR-TECH-013` proved the macOS ImageCaptureCore boundary and `PHR-TECH-015` qualified a temporary Windows PaperStream bridge. Both preserve acquisition evidence, but neither gives the operator one Phronesis-owned setup and control ceremony. The current Windows bridge also depends on a shared-folder import watcher and PaperStream is cancelled separately.

## Problem Statement

A booth laptop currently needs project-specific scripts and machine-specific knowledge. Phronesis cannot discover whether that acquisition endpoint is ready, bind a hardware capture to one recognition session, stop an active capture, or receive the resulting frames without a separate import path. Scanner drivers also differ by operating system, so a truthful portable design must separate Phronesis control from vendor-driver execution.

## Proposed Solution

Introduce a small Phronesis Scanner Agent installed on the computer physically connected to the scanner. The agent makes outbound HTTPS requests only, pairs through a short-lived one-time code, stores a revocable device credential locally, reports driver and capture readiness, polls for bounded commands, and uploads only front images to the exact Phronesis recognition session named by the command.

Phronesis owns the appliance registry, pairing, health, command lifecycle, session binding, cancellation, durable object ingestion, recognition scheduling, and operator UI. The agent owns only local scanner-driver invocation, a bounded spool, byte hashing, upload retries, and process termination. Adapter configuration remains local and cannot be changed by a remote command.

The first reference agent supports a managed capture-command adapter that can wrap a supported macOS ICA acquisition executable or Windows PaperStream/TWAIN capture executable. Single-executable packaging removes the Node.js runtime requirement. Native signed installers and model/OS qualification remain explicit release gates rather than assumed compatibility.

## Functional Requirements

- An Administration administrator can generate a one-time pairing code with a ten-minute expiry.
- A code can be redeemed once by a macOS or Windows agent and yields one revocable bearer credential that is never returned again.
- Phronesis stores only hashes of pairing codes and agent credentials.
- The agent reports platform, adapter, version, capabilities, capture-command readiness, last error, and heartbeat time.
- Vendor Workspace viewers can see appliance readiness; operators can queue Start and Cancel for an exact active recognition session.
- Start commands contain no arbitrary executable or shell input. Capture executable and argument templates are configured locally on the appliance.
- The agent uses outbound polling; Phronesis does not open an inbound listener on the booth computer.
- Each accepted upload is authenticated, command-bound, session-bound, front-only, checksum-verified, media-type allow-listed, size-bounded, sequence-bounded, idempotent, content-addressed, and scheduled for recognition.
- Cancel stops the Phronesis recognition session and queues an appliance cancellation so a running local capture process can be terminated.
- The Scanner-to-Offer UI provides pairing, appliance selection, readiness, setup guidance, start, cancel, refresh, and recoverable feedback.
- The reference agent provides `pair`, `doctor`, `run`, and `help` commands and uses a private OS-appropriate configuration path.
- A build command produces a native single executable on the host platform; macOS and Windows release builds are generated independently on their target operating systems.

## Non-Functional Requirements

### Performance

- Agent polling defaults to two seconds and uses a bounded retry backoff.
- Frames are uploaded one at a time and capped at 25 MiB each and 500 frames per command.
- Phronesis does not process card backs in the appliance lane.

### Scalability

- Appliance, command, and frame identity are explicit so multiple registered devices can coexist without sharing credentials or work.
- One appliance executes at most one Start command at a time.

### Maintainability

- The control plane is adapter-neutral and extends `PHR-ARCH-015` rather than embedding PaperStream behavior in the web application.
- The reference agent uses only Node built-ins so it can be packaged as one executable.

### Reliability

- Commands and state are durable in SQLite and survive Phronesis or agent restarts.
- Upload identity is deterministic per command and sequence, making retries idempotent.
- Failed or offline agents retain explicit error and last-seen evidence; no silent success is allowed.
- A cancelled recognition session rejects late frames.

### Accessibility

- Setup and control actions use labelled controls, live status text, and at least 44-pixel touch targets.

### Offline Support

- A transient network outage pauses command delivery or upload and is retried with bounded backoff. It does not grant offline authority to create Phronesis sessions or identities.

### Security

- Pairing creation requires a permanent authenticated `ADMINISTRATION:ADMIN` membership; compatibility authorization is insufficient.
- Start and Cancel require `VENDOR_WORKSPACE:OPERATE` on every request.
- Agent endpoints accept only a hashed bearer credential and never fall back to browser, compatibility, or event-worker authorization.
- Pairing is single-use, expiring, rate-bounded, and returns generic rejection errors.
- Server commands never carry shell text, executable paths, or remote configuration.
- Tokens are redacted from logs and written with owner-only file permissions where supported.
- Uploads are verified before entering durable recognition state.

### Extensibility

- Adapter identifiers reserve clear lanes for macOS ICA, Windows PaperStream/TWAIN, and other qualified scanners.
- The command protocol can later add controlled feeder settings without allowing arbitrary remote code execution.

### Responsiveness

- The appliance panel works in the existing desktop-first Scanner-to-Offer surface and stacks without horizontal overflow on phone widths.

## User Stories

- As a booth operator, I want to pair a scanner laptop once and start a batch from Phronesis, so I do not manage bridge folders and watchers.
- As an administrator, I want device readiness and revocation, so only approved acquisition endpoints can upload scan evidence.
- As an operator, I want Cancel in Phronesis to stop both the session and the local capture, so one control owns the workflow.
- As a traveling operator, I want the same agent ceremony on macOS and Windows, so switching laptops changes only the locally supported driver adapter.

## Acceptance Criteria

- Repository tests prove one-time pairing, hashed secrets, revocation, heartbeat status, durable command claim/completion, one-active-start enforcement, and cancel priority.
- Ingest tests prove bearer, checksum, media type, size, command/session binding, front-only scheduling, and idempotency boundaries.
- Agent tests prove safe configuration, token redaction, readiness diagnosis, bounded file discovery, argument placeholder expansion without a shell, and cancellation.
- UI validation proves administrators can create pairing instructions, operators can start/cancel an active batch, status can refresh, and phone layout does not overflow.
- A current-host single executable builds and runs `help` and `doctor` without a separate Node invocation.
- macOS and Windows physical-driver support is reported as qualified, unavailable, or unverified; it is never inferred from operating-system name alone.

## Edge Cases

- An expired, reused, malformed, or brute-forced pairing code fails generically.
- A revoked or malformed agent token cannot heartbeat, poll, report, or upload.
- An offline appliance may retain one queued Start; Phronesis shows that it is waiting rather than claiming capture began.
- A duplicate frame retry with the same command/sequence/checksum is acknowledged; conflicting bytes fail.
- A Cancel that arrives during capture terminates the exact child process and retains spool evidence for diagnosis.
- A driver-ready heartbeat can become not-ready and retains the last error.
- A scanner computer can be Windows on x64 or macOS on supported hardware, but vendor driver support remains a prerequisite.

## Dependencies

- `PHR-ARCH-015` Local Card Acquisition And Recognition Platform.
- `PHR-TECH-013` fi-8170 Local Acquisition Agent.
- `PHR-TECH-015` Temporary Windows Scanner Bridge.
- `PHR-TECH-014` Local Recognition Corpus And Engine.
- `PHR-WORKFLOW-016` Scanner-To-Offer Vendor Buying.
- A vendor-supported scanner driver and locally qualified capture command on the appliance computer.

## Future Enhancements

- Signed and notarized macOS package plus signed Windows installer and supervised background-service registration.
- Auto-update with signed release manifests and staged rollback.
- Native ICA and TWAIN/WIA adapters embedded directly in the agent.
- LAN discovery after a separately reviewed trust model.
- Multiple scanner profiles and feeder settings exposed as bounded declared capabilities.

## Technical Notes

Control flow is Phronesis UI -> authenticated controller API -> durable command queue <- outbound agent poll -> locally configured driver adapter -> bounded front-image spool -> authenticated frame ingest -> content-addressed object store -> recognition job. Browser code never receives the agent credential. The agent token is a device credential, not a user membership.

Node's single-executable application facility can package the dependency-free reference agent on each target OS. Executable signing and physical device qualification are separate release evidence gates.

## UI / UX Notes

Place appliance state before batch controls. Use four plain states: Ready, Waiting for agent, Setup required, and Revoked. Pairing instructions must distinguish one-time Phronesis pairing from the vendor-driver installation. Start is disabled until a batch and a non-revoked appliance exist. The UI must not say scanning has started until the agent claims the command.

## Success Metrics

- A qualified booth laptop reaches Ready after one pairing ceremony and no repository checkout.
- Start/Cancel are controlled from Phronesis with exact session evidence.
- Zero back images are uploaded or recognized in this lane.
- Zero agent credentials are stored in plaintext server-side or exposed to browser viewers.

## Open Questions

- Which Ricoh macOS releases and Mac hardware combinations will pass the physical `PHR-TECH-013` qualification gate?
- Which code-signing identities and distribution channel will be used for general tester installation?

## Traceability

- Originating prompt or work order: Product Owner request, 2026-08-06.
- Related implementation prompt: `docs/prompts/PHR-TECH-017-cross-platform-scanner-appliance-control-plane-prompt.md`.
- Related tests: `docs/testing/PHR-TECH-017-cross-platform-scanner-appliance-control-plane-validation.md`.
- Related release notes: `docs/release-notes/PHR-TECH-017.md`.
- Last modified: 2026-08-06.
- Modification reason: define a Phronesis-owned, driver-adapter-neutral scanner appliance workflow for macOS and Windows.
