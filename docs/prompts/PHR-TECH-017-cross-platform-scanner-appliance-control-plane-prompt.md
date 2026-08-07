# PHR-TECH-017 Engineer Work Order

## Project Context

Phronesis already owns durable card recognition sessions and has qualified a temporary Windows PaperStream bridge plus a macOS capability probe. This work replaces machine-specific operator choreography with a Phronesis-owned scanner appliance control plane while preserving vendor-driver boundaries.

## Feature ID

`PHR-TECH-017`

## Objective

Implement and validate secure appliance pairing, health, Start/Cancel command control, front-only frame ingestion, a portable reference agent, native single-executable packaging, and Scanner-to-Offer setup/control UX for supported macOS and Windows hosts.

## Required Reading

- `docs/technical/PHR-TECH-017-cross-platform-scanner-appliance-control-plane.md`
- `docs/architecture/PHR-ARCH-015-local-card-acquisition-recognition-platform.md`
- `docs/technical/PHR-TECH-013-fi8170-local-acquisition-agent.md`
- `docs/technical/PHR-TECH-015-windows-scanner-bridge.md`
- `docs/workflows/PHR-WORKFLOW-016-scanner-to-offer-vendor-buying.md`
- Relevant Next.js 16.2.12 route-handler, Server/Client Component, and authentication guides in `node_modules/next/dist/docs/`.

## Implementation Requirements

- Add a SQLite-backed appliance repository using the existing recognition database.
- Hash pairing codes and device credentials; create single-use expiring pairings and revocable appliances.
- Add operator APIs for list, pairing, Start, Cancel, and revoke with permanent-admin and Vendor Workspace authorization as specified.
- Add agent-only pair, poll/heartbeat, report, and raw front-frame upload APIs with no browser-auth fallback.
- Bind uploads to claimed Start commands and exact recognition sessions; enforce checksum, type, byte, sequence, and count limits and schedule only front recognition.
- Add a dependency-free reference agent with pair, doctor, run, safe local command invocation, spool preservation, upload retries, and active cancellation.
- Add host-native Node SEA build configuration and a target-OS build command.
- Add appliance setup, status, pairing, Start, Cancel, refresh, and revocation controls to Scanner-to-Offer.
- Preserve existing session review, pricing, offer, manual bundle import, and content-addressed evidence behavior.

## Constraints

- Do not claim universal hardware support; vendor driver support and physical qualification remain explicit gates.
- Do not add an inbound listener to the scanner computer.
- Do not send executable paths, arguments, or shell commands from Phronesis.
- Do not persist plaintext pairing codes or device credentials server-side.
- Do not upload or recognize card backs in the appliance lane.
- Do not activate public infrastructure, mutate DNS/Tailscale, or expose the private recognition service.
- Do not install or invoke physical scanner drivers during automated validation.

## Expected Architecture

The web application and APIs own operator authorization, appliance identity, durable command state, recognition-session binding, and frame ingestion. The outbound-polling agent owns local readiness, vendor adapter execution, cancellation of its exact child process, local evidence staging, hashing, and upload. Device credentials are independent of user sessions.

## Testing Expectations

- Deterministic repository and ingest tests with isolated SQLite/object roots.
- Agent CLI and safe-adapter unit/integration tests without physical hardware.
- Existing and full Node test suites.
- Standalone TypeScript, warning-free lint, and production Next.js build.
- Current-host SEA build plus executable help/doctor smoke tests.
- Browser validation on desktop and phone width with console and horizontal-overflow checks.

## Documentation Updates

- Validation, implementation report, conformance review, release notes, Feature Registry, Architecture, Decisions, Roadmap, Product Roadmap, Prompt History, Current CTO Structure, Agent Handoff, Project State, and Conversation History as relevant.

## Acceptance Criteria

All acceptance criteria in `PHR-TECH-017` pass for the control-plane foundation. Any unsigned distribution or unqualified physical driver state remains visibly gated and is not described as complete universal support.

## Non-Goals

- Remote arbitrary command execution.
- Automatic driver installation.
- Silent macOS security bypass or Windows driver bundling.
- General public scanner exposure.
- Automatic recognition acceptance or purchasing.

## Notes For AI Coding Agents

- Preserve unrelated user changes and active private services.
- Keep all agent secrets out of fixtures, logs, screenshots, and documentation.
- Validate the controller with synthetic capture commands only; physical scanner activation requires a separate supervised gate.
