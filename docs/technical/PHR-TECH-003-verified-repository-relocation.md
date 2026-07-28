# PHR-TECH-003: Verified Repository Relocation To JarvisSSD

## Feature ID

`PHR-TECH-003`

## Title

Verified Repository Relocation To JarvisSSD

## Status

Completed

## Priority

High

## Category

Technical / Infrastructure / Developer Workflow

## Objective

Relocate the complete Phronesis checkout from `/Users/ramonnogueira/Developer/Phronesis` to `/Volumes/JarvisSSD/Projects/Phronesis` through a staged, verified, recoverable process that preserves Git and intentional local state and leaves the source checkout intact as rollback.

## Background

The current checkout is approximately 981 MiB and contains four unpublished commits, repository-local refs, two modified governance files, two intentional untracked pnpm files, ignored local state, and a pnpm-style `node_modules` tree with relative symlinks. The empty final destination is on an APFS external volume with sufficient free space.

The migration is a developer-workspace relocation, not a GitHub rename, product migration, dependency reinstall, or source cleanup operation.

## Problem Statement

A manual drag, rename, or ordinary tracked-file clone could omit untracked or ignored state, damage metadata, lose local refs, break dependency symlinks, or make an incompletely copied directory appear canonical. Cross-volume rename is not atomic, so the checkout must first be copied to a sibling staging directory on JarvisSSD, verified there, and only then renamed atomically into its final name.

## Proposed Solution

Use a staged copy-and-cutover workflow:

1. Quiesce the source and capture immutable preflight evidence.
2. Create a `git bundle --all` backup plus state manifests on JarvisSSD.
3. Copy the source into a fixed temporary sibling directory with macOS `/usr/bin/rsync -aE`, excluding only root `.next/`.
4. Reject unsupported ACL or file-flag conditions before copying.
5. Verify Git objects, refs, status, tracked content, untracked content, ignored local state, metadata-sensitive symlinks, and a checksum dry run.
6. Reconfirm source state did not change during copying.
7. Remove only the confirmed-empty final destination directory and rename the verified sibling staging directory to the final path. Because both are on the same APFS volume and parent, this rename is the atomic cutover.
8. Validate locally from the new path, update current-path documentation in the new copy, and reopen developer tooling against the new workspace.
9. Keep the original checkout unchanged until a later CTO cleanup decision.

The source remains canonical until all staged-copy checks pass and the atomic rename succeeds.

## Functional Requirements

- Preflight must verify exact source and destination paths, APFS mount availability, free capacity, target emptiness, Git health, HEAD, branch/upstream relationship, refs, remotes, index/worktree state, and intentional untracked files.
- Preflight must detect active processes with open files under the source. Any development server, build, test runner, editor writer, or other mutating process blocks execution.
- Preflight must reject unexpected ACL entries, immutable/restricted file flags, broken symlinks, or a pre-existing staging directory.
- A Git bundle created with `--all` must validate successfully before copy begins. It protects committed history and refs; it does not replace the complete filesystem copy for working-tree and ignored state.
- The staged copy must preserve `.git`, tracked files, untracked files, ignored local files, `.env.local`, `.market-intelligence-repository.json`, `node_modules`, permissions, timestamps, symlinks, resource forks, and extended attributes.
- Root `.next/` is the sole copy exclusion because it is generated build/dev output. No dependency, environment, repository, fixture, local-data, or package-manager file may be excluded.
- `pnpm-lock.yaml` and `pnpm-workspace.yaml` must remain untracked and byte-identical.
- Verification must compare the source and staging Git HEAD, complete refs, remotes, porcelain-v2 status, tracked-file checksums, untracked-file checksums, ignored-path inventory excluding `.next`, and symlink targets.
- `/usr/bin/rsync -aEcni --delete --exclude='/.next/'` must report no material difference after the copy. Any reported content difference blocks cutover.
- Source Git status and manifests must be captured again after copy and match preflight, proving source quiescence during transfer.
- Cutover must use only `rmdir` on the reverified empty final directory followed by same-parent `mv` of the verified staging directory.
- A failed verification leaves source canonical and staging noncanonical. A failed cutover leaves source canonical; no fallback may overwrite or delete source content.
- Local validation at the new path must be offline-capable. Network-dependent build acquisition is not required unless separately authorized.
- Current-root references in the new copy must be updated to `/Volumes/JarvisSSD/Projects/Phronesis`. Historical source-path statements remain as migration history.
- The old checkout must remain untouched and must not be deleted, renamed, converted into a symlink, or used concurrently after cutover.

## Non-Functional Requirements

### Performance

The copy may include `node_modules` to preserve the runnable local dependency state. `.next` is excluded to reduce avoidable transfer and verification cost.

### Scalability

The procedure uses path variables and deterministic evidence artifacts so it can be adapted to a later relocation without weakening path validation.

### Maintainability

The work order separates preflight, backup, copy, verification, cutover, documentation update, validation, handoff, and later cleanup into explicit gates.

### Reliability

No destructive source operation is part of migration. Every phase fails closed, and the destination becomes canonical only after staged verification and atomic rename.

### Accessibility

Not applicable to user-facing UI. Command output and evidence must be plain text and reviewable without specialized tooling.

### Offline Support

Git verification, checksum comparison, lint, focused tests, and the supported test suite run locally. A production build that fetches Google Fonts remains a separately controlled check.

### Security

Environment files and ignored local data are copied only between user-controlled local volumes. Evidence must record paths and hashes, not secret contents. No archive or manifest may print `.env.local` values.

### Extensibility

The backup/evidence layout supports later cleanup approval, source retirement, or disaster recovery without changing the preserved source checkout.

### Responsiveness

Not applicable.

## User Stories

- As the CTO, I want a verified relocation so the workspace can use JarvisSSD without risking history or local work.
- As an Engineer, I want exact commands and stop conditions so I do not invent migration behavior.
- As a future maintainer, I want a retained source and Git bundle so failed cutover or SSD loss remains recoverable.

## Architecture Decisions

### Copy Tool

The planned Apple `/usr/bin/rsync -aE` copy failed safely on healthy `com.apple.provenance`-tagged Git objects. The accepted fallback used macOS `bsdtar` in pax mode, excluded only root `.next/`, preserved required metadata and symlinks, and passed exact content and Git verification.

- `-a` preserves directory structure, permissions, timestamps, and symlinks without dereferencing them.
- Apple `-E` preserves extended attributes and resource forks.
- The installed Apple rsync is 2.6.9 and does not expose a trustworthy ACL-preservation option. Preflight therefore rejects nontrivial ACLs instead of silently dropping them.
- Ownership is not used as an integrity signal because JarvisSSD is mounted with `noowners`; files remain under the same macOS user.
- `ditto` is not selected because it lacks a precise root `.next` exclusion, and copying then deleting generated output adds unnecessary mutation and cost.

### Git Backup

Create `Phronesis-all-refs.bundle` with `git bundle create ... --all`, then run `git bundle verify`. Store it in a timestamped backup directory on JarvisSSD outside both staging and final checkouts. Also store non-secret text evidence for HEAD, refs, remotes, status, manifests, and tool versions.

### Copy Treatment

| Content | Treatment | Rationale |
|---|---|---|
| `.git/` | Copy and verify | Preserves unpublished commits, refs, config, index, reflogs, and repository state. |
| Tracked files | Copy and checksum | Required project content. |
| Untracked files | Copy and checksum | Includes intentional pnpm artifacts and current governance work. |
| Ignored `.env.local` | Copy without printing contents | Required local configuration; remains local. |
| Ignored market repository | Copy and checksum | Intentional local application state. |
| `node_modules/` | Copy symlinks as symlinks and validate | Avoids an unauthorized reinstall and preserves offline operation. |
| `.next/` | Exclude | Disposable generated output; regenerate locally. |
| Other ignored files | Copy and inventory | No evidence authorizes omission. |
| pnpm lock/workspace files | Copy byte-for-byte, remain untracked | Explicit CTO preservation requirement. |

### Source Quiescence

Record open files/processes under the source using `lsof`, require known mutating processes to stop, and compare pre-copy and post-copy Git status and manifests. Any drift blocks cutover and requires a fresh staging copy; do not synchronize into a possibly inconsistent staged copy without reauthorization.

### Verification

Verification has four layers:

1. Git semantics: HEAD, refs, remotes, branch/upstream, status, and `git fsck --full`.
2. Repository content: tracked and untracked SHA-256 manifests.
3. Local/ignored state: sorted inventory and checksum manifest excluding only `.next` and Git internals where Git owns verification.
4. Filesystem behavior: rsync checksum dry run, symlink inventory, zero broken symlinks, metadata spot checks, and APFS same-volume cutover validation.

### Atomic Cutover

Use a sibling staging directory such as `/Volumes/JarvisSSD/Projects/.Phronesis.staging-PHR-TECH-003`. Immediately before cutover, reverify that `/Volumes/JarvisSSD/Projects/Phronesis` exists and is empty, then remove only that empty directory with `rmdir`. Rename staging to final with `mv`. Never copy directly into the final directory and never use a cross-volume `mv` for the source.

### Recovery

- Interrupted copy: leave source canonical; remove or quarantine staging only under the execution work order, then restart from an empty staging path.
- Failed bundle verification: stop before copying.
- Failed content/Git verification: leave source canonical and preserve evidence; do not cut over.
- Source drift during copy: invalidate staging and repeat after quiescence.
- Failed `rmdir`: final target was not empty or changed; stop.
- Failed rename after `rmdir`: source remains canonical; staging remains recoverable; recreate the empty final placeholder only if explicitly required by the Engineer work order.
- SSD unavailable after cutover: reopen the retained source checkout; it remains the rollback copy.
- Broken dependency symlinks: stop before cutover. After cutover, if validation exposes a path-dependent defect, use the retained source while a separate dependency-repair decision is made.
- Dual-workspace editing: stop work, designate one canonical path, and compare Git/status evidence before resuming.

## Acceptance Criteria

- The Git bundle exists on JarvisSSD, verifies, and contains all source refs.
- The staged copy matches source Git semantics and content, with only `.next` absent.
- All intentional untracked and ignored state is accounted for without secret disclosure.
- Dependency symlinks are preserved and none are broken.
- Source state remains unchanged across copy and verification.
- The final target is created only by same-volume atomic rename of verified staging.
- Offline local validation runs from the new path with results reported truthfully.
- Current canonical-root documentation in the new copy uses the JarvisSSD path.
- The source checkout remains intact and usable as rollback.
- No push, publication, deployment, GitHub rename, dependency installation, or source cleanup occurs.

## Edge Cases

- The SSD is not mounted at the expected path.
- The final target is no longer empty.
- A staging or backup path already exists.
- Source files change during the copy.
- The volume reports insufficient free space after preflight.
- APFS `noowners` changes observed owner presentation.
- Files contain ACLs or flags unsupported by the chosen copy path.
- A relative symlink resolves at source but not at staging.
- `.env.local` exists but must never appear in command output.
- Git contains dangling objects; `git fsck` may report them as notices, but corruption, missing objects, or invalid refs block migration.

## Dependencies

- `PHR-WORKFLOW-002` Canonical Product Development Workflow.
- Mounted JarvisSSD APFS volume.
- macOS `/usr/bin/rsync`, Git, `shasum`, `find`, `lsof`, and standard filesystem tools.
- A later CTO Structure authorizing selected execution phases.

## Future Enhancements

- Remove the retained source checkout after a separate retention period and explicit CTO approval.
- Reinstall dependencies at the new path under a future package-manager decision instead of retaining copied dependencies indefinitely.
- Replace external Google Fonts acquisition with a local-font strategy under separate product scope.

## Technical Notes

The exact executable commands, path guards, evidence filenames, stop conditions, and authorization matrix are defined in `docs/prompts/PHR-TECH-003-repository-relocation-prompt.md`.

## UI / UX Notes

After cutover, close the old Codex workspace and open `/Volumes/JarvisSSD/Projects/Phronesis`. Do not continue editing both copies. The original path remains rollback-only until cleanup approval.

## Success Metrics

- Zero missing or changed repository/local-state files beyond excluded `.next`.
- Zero broken dependency symlinks.
- Identical source and destination Git HEAD, refs, remotes, and status at cutover.
- One verified Git bundle and one untouched source rollback checkout.

## Open Questions

- Retention period and cleanup criteria for the source checkout.

## Traceability

- Originating work order: `PHR-STRUCT-20260726-001`.
- Related implementation prompt: `docs/prompts/PHR-TECH-003-repository-relocation-prompt.md`.
- Related tests: `docs/testing/PHR-TECH-003-repository-relocation-validation.md`.
- Related release notes: `docs/release-notes/PHR-TECH-003.md`.
- Last modified: 2026-07-28.
- Modification reason: Record completed pax fallback, verified cutover, canonical JarvisSSD root, and retained rollback.
