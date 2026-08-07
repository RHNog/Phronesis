# PHR-TECH-017 Engineer Report — Cross-Platform Scanner Appliance Control Plane

## Scope

Implemented the secure, adapter-neutral scanner appliance control-plane foundation and reference agent. The change does not enable recognition auto-accept, infer card condition/finish, purchase inventory, publish to a marketplace, expose the private service publicly, install a vendor driver, or claim unqualified hardware support.

## Implementation

- Added SQLite-backed one-time pairings, global attempt throttling, revocable appliances, readiness heartbeats, and durable Start/Cancel commands.
- Added permanently authorized controller APIs and device-bearer-only agent APIs with separate identity boundaries.
- Bound each frame to a claimed Start command and exact active recognition session, verified bytes and SHA-256, admitted only allow-listed front images, promoted them to the existing content-addressed store, and scheduled normal recognition jobs idempotently.
- Added a dependency-free agent with private OS-appropriate configuration, local-only adapter paths/arguments, readiness diagnosis, outbound polling, bounded capture/spool discovery, upload retry, report recovery, and exact process cancellation.
- Persisted command recovery before capture preflight and made revocation wait for active-command completion, preventing a failed local setup or premature credential removal from stranding a claimed command.
- Added Node single-executable packaging, a documented current-host build command, and independent macOS arm64/Windows x64 GitHub artifact builds.
- Added a responsive Scanner appliance panel before batch controls with readiness, refresh, setup/download, pairing, selection, Start, coordinated Cancel, and revoke.
- Preserved the existing manual sealed-bundle import path as a recovery/qualification lane.

## Security Boundaries

- Device pairing/revocation requires permanent Administration Admin authority; compatibility mode cannot mint appliances.
- Start/Cancel requires Vendor Workspace Operate authority.
- Agent endpoints never accept browser identity and the device token is never exposed to UI state.
- The agent exposes no inbound listener and receives no remote executable, arguments, or shell commands.
- Local capture uses `shell: false`, a bounded output root, regular files only, no symlinks, byte/count limits, and exact child termination.
- Server admission verifies credential, appliance, command, session, front side, sequence, content length, media type, and checksum before scheduling.

## Verification

- Focused tests: 8/8.
- Full suite: 457/457.
- TypeScript, warning-free lint, Next.js production build, and diff hygiene pass.
- Current-host native executable help, signature, and checksum checks pass.
- Live database backup, additive migration, integrity, API, loopback, tailnet, and responsive browser gates pass.

## Deviations And Gates

The installed Homebrew Node v26.6.0 reported SEA disabled. The build was therefore repeated with an official checksum-verified Node v26.6.0 macOS arm64 distribution through the documented `PHRONESIS_SEA_NODE` override; the resulting executable passed all smoke checks.

The repository now automates unsigned target-OS artifacts rather than pretending one cross-compiled binary covers both systems. Signing identities, installers, service registration, auto-update, Windows execution, and real scanner/driver qualification remain explicit next gates.

No physical capture was run because this feature's automated gate does not authorize or require unsupervised hardware movement.
