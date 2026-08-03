# PHR-TECH-011 — GitHub Handoff Continuity Validation

## Status

Local application gate passed; seal and hosted verification pending.

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
- Local seal, remote SHA equality, and hosted job results: pending publication closeout.
- Hosted run `30844457778`: `project-validation` passed; `continuity` correctly rejected the detached runner branch with seven branch-identity errors. The workflow now restores the runner-local event branch at the unchanged exact head SHA and uses `actions/checkout@v5` to remove the Node 20 action warning. Final hosted verification is pending the replacement seal.
