# PHR-TECH-011 — GitHub Handoff Continuity Validation

## Status

Passed.

## Required checks

- Full supported behavioral suite.
- Standalone TypeScript validation.
- Warning-free ESLint.
- Next.js production build.
- Git diff hygiene.
- Clean implementation commit before sealing.
- Valid sealed continuity package.
- Remote SHA equality after ordinary push.
- Successful PR #5 project-validation and continuity checks.

## Failure baseline

- GitHub runner omitted `npm ci`; `jiti`, `eslint`, and `next` were unavailable.
- The last validation described `33bac5b617fab21c714f0071517e193f90aedc14` and had exceeded the configured 24-hour age.
- Local acquisition reported 15 errors because both the branch head and dirty worktree fingerprint differed from the last seal.
- Feature-branch commits produced duplicate push and pull-request workflow runs.
- The first repaired hosted run proved project validation green but exposed a second CI-only boundary: exact-SHA checkout reports branch `DETACHED`, while sealed Handoff correctly records the feature branch.

## Result

- `npm run test`: pass, 376/376.
- `npx tsc --noEmit --incremental false`: pass.
- `npm run lint`: pass with no warnings.
- `npm run build`: pass on Next.js 16.2.12.
- `git diff --check`: pass.
- Secret-pattern scan over the workflow, gateway, authorization boundary, launch definition, and `PHR-TECH-011` artifacts: no credential material found.
- `plutil -lint ops/launchd/com.phronesis.public-event-gateway.plist`: pass; the configured `/usr/local/bin/node` resolves to Node 24.18.0 on the target host.
- Local Handoff seal and validation: pass with zero errors and zero warnings.
- Remote branch SHA equality: pass.
- Hosted run `30844457778`: `project-validation` passed; `continuity` correctly rejected the detached runner branch with seven branch-identity errors. The workflow now restores the runner-local event branch at the unchanged exact head SHA and uses `actions/checkout@v5` to remove the Node 20 action warning.
- Detached-runner emulation: the exact seal correctly fails as `DETACHED`, then passes with zero errors/warnings after the event branch is restored at the unchanged SHA.
- Hosted replacement run `30844716647`: `continuity` passed in 5 seconds and `project-validation` passed in 1 minute 19 seconds. Only one pull-request run was created and no feature-branch push run was created.
- Concurrent-state reconciliation: after hosted success, a separate process activated the public gateway and updated seven `PHR-ARCH-014` records. Read-only Funnel, Serve, loopback listener, detached runtime, public denial, and private continuity checks substantiated those edits before they were incorporated into a new implementation/seal pair.

## 2026-08-06 Mac Studio continuity revalidation

- Initial `./handoff validate-continuity --json`: seven errors, all derived from the same post-seal worktree fingerprint mismatch; branch, remote tracking, configuration digest, and vendored Handoff 0.5.0 runtime were otherwise coherent.
- Intended source delta: six narrow hostname migrations from `ramons-macbook-pro` to `ramons-mac-studio`; historical evidence that actually ran on the MacBook remains unchanged.
- Host identity: `uname`, macOS LocalHostName, and Tailscale self identity resolve to the Mac Studio; the tailnet DNS name is `ramons-mac-studio.tailaa2d39.ts.net`.
- Launch definition: repository and installed `com.phronesis.private-review.plist` files are byte-identical, pass `plutil -lint`, and the loaded job reports the Mac Studio origin.
- Runtime boundary: Node listens only on `127.0.0.1:3100` and `127.0.0.1:3101`; private 9443 Vendor/Settings return 200; public 10000 event login returns 200 and Settings returns 404.
- Configured repository gate: 404/404 tests, warning-free lint, Next.js 16.2.12 production build with TypeScript, and `git diff --check` pass.
- Closure contract: commit the verified human-owned reconciliation first, run bare `./handoff` from the clean implementation commit, require zero JSON continuity findings, and verify ordinary remote SHA equality.
- First closure: implementation `66f9e6a`, generation `572dc82bcf061ac36ec2`, and seal `30605a3` published with local acquire/continuity at zero findings and exact remote SHA equality.
- Hosted run `31108532122`: continuity passed in 8 seconds and project validation passed in 1 minute 22 seconds; the only annotation was the deprecated Node 20 runtime inside `actions/setup-node@v4`.
- Action-runtime remediation: official checkout and setup-node releases identify v7 as current; the workflow advances both official actions to v7, retains explicit `node-version: 24` and `cache: npm`, and must repeat the clean seal plus both hosted jobs without the Node 20 annotation.
