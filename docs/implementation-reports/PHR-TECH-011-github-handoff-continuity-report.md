# PHR-TECH-011 Implementation Report

The GitHub workflow now separates product validation from Handoff continuity. `project-validation` checks out the event revision, installs the locked dependency graph under Node 24, and runs tests, lint, production build, and diff hygiene. `continuity` checks out the exact pull-request head (or push SHA) with full history, restores the event's branch identity locally without changing that SHA, and runs only read-only continuity validation.

Feature branches are validated through pull requests, while direct push execution is restricted to `main`. This removes duplicate feature-branch runs and keeps CI from regenerating or committing continuity state.

The first hosted repair run proved dependency-backed `project-validation` green and exposed the exact remaining mismatch: Actions leaves exact-SHA checkouts detached, while Handoff verifies the recorded branch as well as the commit. The workflow now creates only a runner-local branch at the already checked-out SHA before continuity validation and uses Node 24-compatible checkout v5.

The existing Artwork Review and isolated public event-worker gateway changes were preserved rather than discarded. They pass 376/376 tests, standalone TypeScript, warning-free lint, Next.js 16.2.12 production build, launch-definition validation, secret-pattern review, and diff hygiene.

Hosted replacement run `30844716647` passed both jobs: continuity in 5 seconds and clean-runner project validation in 1 minute 19 seconds. The remote seal SHA matched local Git, and only one pull-request workflow execution was created.

After that hosted success, a separate process activated the already implemented public worker gateway and updated its canonical records. The live state was independently verified read-only and those user-owned edits were preserved in a subsequent clean commit and Handoff seal rather than discarded or left as a new stale worktree.

On August 6, six intentional Mac Studio hostname edits again caused Handoff to reject the older clean-tree fingerprint. Reconciliation implementation `66f9e6a` and seal `30605a3` restored local/remote continuity, and hosted run `31108532122` passed both jobs. That run's sole annotation came from the obsolete Node 20 runtime embedded in `actions/setup-node@v4`. The workflow now uses official checkout v7 and setup-node v7, preserving explicit Node 24 validation and the exact-SHA continuity behavior while removing the deprecated action runtime.

Verification: `docs/testing/PHR-TECH-011-github-handoff-continuity-validation.md`.
