# PHR-TECH-017 — Cross-Platform Scanner Appliance Control Plane Validation

Date: 2026-08-06

Result: Pass — control-plane foundation implemented; signed distribution and physical driver qualification remain gated.

## Automated Verification

- Focused scanner-appliance tests: 8/8 pass.
- Full repository suite: 457/457 pass.
- TypeScript: `npx tsc --noEmit` passes.
- Lint: `npm run lint` passes without warnings.
- Production build: `npm run build` passes on Next.js 16.2.12.
- Diff hygiene: `git diff --check` passes.

The focused tests cover single-use hashed pairing, token revocation, readiness/offline state, Start claim/report, front-frame ingest, idempotent retries, cancel priority, agent configuration/diagnosis, secret redaction, synthetic full capture/upload, and exact child-process cancellation. No physical scanner or vendor driver is invoked by automated tests.

## Native Agent Packaging

- The dependency-free agent runs `help`, `configure`, `doctor`, and synthetic `run` workflows directly under Node.
- The current macOS arm64 host built a Node single executable using an official Node v26.6.0 archive verified against the official `SHASUMS256.txt`.
- The resulting `phronesis-scanner-agent` passes `help`, ad-hoc `codesign --verify`, and emitted SHA-256 verification (`654594dc75fe3f85a2a92d27286966999bf9254622130090e0716b3ead99b950`).
- GitHub Actions defines independent unsigned macOS arm64 and Windows x64 builds. The Windows artifact was not executed in this session and is not physically qualified by workflow definition alone.

## Live Migration And Runtime

- Backed up the live recognition database before first route access to `/private/tmp/phronesis-card-recognition-before-phr-tech-017-20260806.sqlite`.
- SQLite integrity returned `ok` before and after the additive migration.
- Confirmed creation of `recognition_appliance_pairing`, `recognition_appliance_pair_attempt`, `recognition_appliance`, and `recognition_appliance_command`.
- Rebuilt and restarted only the private scanner-review service; loopback `:3200` and tailnet-only `:9444` returned HTTP 200.
- Authenticated appliance list returned HTTP 200 and an empty registry. No fake appliance, pairing, command, or physical frame was inserted into live state.

## Browser Acceptance

- Scanner-to-Offer renders appliance readiness, Refresh, portable-agent setup/download, local configuration steps, and authorization-appropriate Pair/Start/Cancel/Revoke controls.
- Desktop and 390-pixel phone viewports have no horizontal overflow.
- Touch actions meet the 44-pixel target requirement.
- The compatibility review identity receives a permanent-owner Sign In action for appliance management instead of an unauthorized pairing control.
- Refresh provides visible current status feedback without navigation or data mutation.
- Browser warnings/errors are empty after final reload and interaction.

## Security And Failure Gates

- Pairing creation and revocation require a permanent `ADMINISTRATION:ADMIN` membership.
- Start and Cancel require `VENDOR_WORKSPACE:OPERATE` on each request.
- Agent bearer routes have no browser, compatibility, or event-worker fallback.
- Pairing codes and agent tokens are hashed at rest; the browser never receives a device token.
- Server commands contain no executable path, argument template, shell text, or remote adapter configuration.
- Revocation fails closed while a Start or Cancel command is active, so device access cannot be removed before Phronesis has stopped the exact local capture.
- Upload validation enforces command/session/token/checksum/media/size/sequence/front-only boundaries before durable scheduling.
- A cancelled recognition session rejects late frames.

## Explicitly Unpassed Gates

- No signed/notarized macOS installer or signed Windows installer exists yet.
- Background-service installation, auto-start, update, and rollback remain release work.
- The Windows CI artifact still needs target-host execution and signing verification.
- Every claimed scanner model, vendor driver, OS release, architecture, capture profile, cancellation path, and restart path needs a supervised physical qualification record.

These gates do not invalidate the control-plane foundation, but they prohibit a claim of universal plug-and-play hardware support.
