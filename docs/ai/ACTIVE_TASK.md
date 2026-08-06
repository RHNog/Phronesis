<!-- handoff: {"document":"ACTIVE_TASK","owner":"human-and-agent","schema_version":"1"} -->

# Active Task

## Objective

Finish and preserve the isolated public event-worker gateway implementation, repair GitHub Handoff validation, and publish a fresh committed continuity seal that records the separately authorized live public ingress without conflating it with the CI repair.

## Acceptance criteria

- [x] Diagnose the hosted GitHub failure from Actions logs and reproduce the missing-dependency boundary in a clean checkout.
- [x] Preserve the existing Artwork Review authorization and public event-gateway implementation in the canonical worktree.
- [x] Make project validation install locked dependencies before test, lint, build, and diff gates.
- [x] Make continuity validation read-only against the exact committed PR head with full Git history.
- [x] Avoid duplicate feature-branch runs by reserving push validation for `main` and pull-request validation for feature work.
- [x] Pass the full local test, TypeScript, lint, build, and diff-hygiene gate.
- [x] Commit the implementation and canonical documentation with no secret-bearing runtime data.
- [x] Run bare `./handoff` from a clean implementation commit and pass `./handoff validate-continuity --json`.
- [x] Push the branch and confirm both GitHub pull-request jobs pass on the seal commit.

## Completed this session

- Confirmed the canonical repository, branch, pull request, hosted failure, and stale seal from Git and GitHub evidence.
- Replaced CI-side Handoff preparation with separate dependency-backed project validation and committed-state continuity verification.
- Added the governed specification, work order, release notes, architecture decision, roadmap, atlas, and continuity records for `PHR-TECH-011`.
- Passed 376/376 tests, standalone TypeScript, warning-free lint, Next.js 16.2.12 production build, launch-definition validation, secret-pattern review, and diff hygiene.
- Created implementation commit `7474790` and Handoff seal `27af62a`; local continuity passed with zero errors/warnings and remote SHA equality passed.
- Hosted run `30844457778` created only one pull-request execution and passed dependency-backed project validation. Continuity exposed the exact-SHA checkout's detached branch identity, so the workflow now restores the event branch locally at the unchanged SHA.
- Hosted replacement run `30844716647` passed continuity and project validation. The local and remote seal SHA matched, and no duplicate feature-branch push run was created.
- Diagnosed the August 6 continuity failure as one expected stale-worktree condition: six intentional Mac Studio hostname edits changed the implementation fingerprint after generation `5c12817f1ef90b71f483`; no Handoff runtime or manifest algorithm defect was found.
- Reconciled the Mac Studio hostname across the employee-login checklist, repository launch definition, project state, current structure, architecture, and agent handoff while preserving historical MacBook-era evidence.
- Verified the host and operational boundary: Tailscale identifies `ramons-mac-studio.tailaa2d39.ts.net`; the installed private-review LaunchAgent matches the repository definition; loopback ports 3100/3101 are bound locally; private 9443 Vendor/Settings return 200; public 10000 login returns 200 and Settings returns 404.
- Re-ran the configured project gate over the reconciled tree: 404/404 tests, warning-free lint, Next.js 16.2.12 production build with TypeScript, and diff hygiene pass.
- Published implementation `66f9e6a` and seal `30605a3`; local acquire/continuity returned zero findings and hosted run `31108532122` passed continuity in 8 seconds and project validation in 1 minute 22 seconds.
- Removed the hosted run's remaining Node 20 action-runtime deprecation by upgrading the two official checkout steps and the setup-node step to their current Node 24-compatible v7 majors without changing the exact-SHA or validation contract.
- Aligned the portable runtime to Handoff 0.5.1, adopted shared workflow 2.20.0,
  and made hosted permissions explicitly read-only without changing the public
  ingress or product runtime.

## Remaining work

- Monitor the separately activated public event-worker window and disable Funnel port 10000 when that approved window ends.

## Blockers

- No implementation blocker is currently known.
- No repair blocker remains. Public Funnel is active under a separately authorized window and must be shut down explicitly when that window ends.

## Exact next action

Operate only with owner-issued timed event codes, then run `tailscale funnel --https=10000 off` when the approved public worker window ends; private port 9443 must remain unchanged.
