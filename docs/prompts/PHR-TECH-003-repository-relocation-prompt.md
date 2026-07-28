# PHR-TECH-003 Repository Relocation Engineer Prompt

## Project Context

Project Phronesis is the internal engineering initiative responsible for developing an evidence-driven decision intelligence platform for collectible markets.

Documentation is part of implementation. Follow the originating specification and the then-current CTO Structure before taking any migration action.

## Feature ID

`PHR-TECH-003`

## Authority Gate

This prompt is an approval-ready work order, not current execution authorization. `PHR-STRUCT-20260726-001` authorizes Chief Architect design only. Before executing, require a later repository-owned Structure that identifies `PHR-TECH-003`, status `READY`, accountable role `Engineer`, and the specific authorized phases.

## Objective

Copy, verify, and atomically cut over the complete Phronesis checkout from `/Users/ramonnogueira/Developer/Phronesis` to `/Volumes/JarvisSSD/Projects/Phronesis`, retaining the source unchanged as rollback.

## Required Reading

- `AGENTS.md`
- `.agents/README.md`
- `.agents/roles/engineer.md`
- `docs/technical/PHR-TECH-003-verified-repository-relocation.md`
- `docs/product-development/CURRENT_CTO_STRUCTURE.md`
- `docs/product-development/CONVERSATION_HISTORY.md`
- `docs/DOCUMENTATION_FIRST_DEVELOPMENT.md`

## Fixed Paths

```sh
PHR_SOURCE=/Users/ramonnogueira/Developer/Phronesis
PHR_PROJECTS=/Volumes/JarvisSSD/Projects
PHR_FINAL=/Volumes/JarvisSSD/Projects/Phronesis
PHR_STAGE=/Volumes/JarvisSSD/Projects/.Phronesis.staging-PHR-TECH-003
PHR_BACKUP=/Volumes/JarvisSSD/Backups/Phronesis/PHR-TECH-003-20260726
PHR_EVIDENCE=/Volumes/JarvisSSD/Backups/Phronesis/PHR-TECH-003-20260726/evidence
```

Do not substitute unresolved environment variables into destructive commands. Before every phase, print and compare these exact values to the active Structure.

## Authorization Matrix

| Phase | Current Structure 001 | Required later authority |
|---|---|---|
| Read-only preflight | Allowed for architecture evidence only | Engineer execution authority recommended |
| Create backup directory and Git bundle | Not authorized | Explicit backup/write authority |
| Create and populate staging copy | Not authorized | Explicit staged-copy authority |
| Remove empty final placeholder and rename staging | Not authorized | Explicit atomic-cutover authority |
| Update current-path documentation in new copy | Not authorized | Explicit repository-edit authority |
| Offline local validation at new path | Not authorized | Explicit local-validation authority |
| Delete/rename/alter source checkout | Prohibited | Separate future cleanup Structure only |
| Commit documentation changes | Not authorized | Separate local-commit authority |
| Push, publish, deploy, or change remote | Prohibited | Separate explicit authority |

## Phase 1: Read-Only Preflight

Run from the source checkout and stop on any mismatch.

```sh
pwd
git rev-parse --show-toplevel
git branch --show-current
git rev-parse HEAD
git rev-parse origin/main
git status --porcelain=v2 --branch --untracked-files=all
git remote -v
git show-ref
git fsck --full
du -sh "$PHR_SOURCE"
df -h /Volumes/JarvisSSD
mount | rg '/Volumes/JarvisSSD'
stat -f '%N type=%HT mode=%Sp owner=%Su group=%Sg' "$PHR_SOURCE" "$PHR_PROJECTS" "$PHR_FINAL"
find "$PHR_FINAL" -mindepth 1 -maxdepth 1 -print
test ! -e "$PHR_STAGE"
```

Expected facts:

- source and Git top-level are `/Users/ramonnogueira/Developer/Phronesis`;
- branch is `main`;
- HEAD and upstream relationship match the current Structure;
- final target exists and has no children;
- stage and backup paths do not already exist;
- JarvisSSD is mounted locally as APFS with sufficient free space.

Capture but do not expose secret contents:

```sh
test -f "$PHR_SOURCE/.env.local"
git -C "$PHR_SOURCE" check-ignore -q .env.local
git -C "$PHR_SOURCE" check-ignore -q .market-intelligence-repository.json
git -C "$PHR_SOURCE" ls-files --others --exclude-standard
git -C "$PHR_SOURCE" ls-files --others --ignored --exclude-standard
```

Quiescence and filesystem checks:

```sh
lsof -nP +D "$PHR_SOURCE"
find "$PHR_SOURCE" -path "$PHR_SOURCE/.next" -prune -o -type l ! -exec test -e {} \; -print
ls -ledO@ "$PHR_SOURCE" "$PHR_SOURCE/.git" "$PHR_SOURCE/node_modules"
find "$PHR_SOURCE" -path "$PHR_SOURCE/.next" -prune -o -exec ls -ledO {} + | rg '^[[:space:]]+[0-9]+:'
find "$PHR_SOURCE" -path "$PHR_SOURCE/.next" -prune -o \( -flags +uchg -o -flags +schg -o -flags +uappnd -o -flags +sappnd \) -print
```

The ACL and file-flag queries must produce no matches. Stop if a mutating process is active, any symlink is broken, nontrivial ACL entries or immutable/append-only flags are present, or the source changes during preflight. Read-only shells may appear in `lsof`; development servers, builds, tests, file writers, and editor write handles must be stopped.

## Phase 2: Evidence And Git-Native Backup

Only after later write authorization:

```sh
mkdir -p "$PHR_EVIDENCE"
git -C "$PHR_SOURCE" bundle create "$PHR_BACKUP/Phronesis-all-refs.bundle" --all
git -C "$PHR_SOURCE" bundle verify "$PHR_BACKUP/Phronesis-all-refs.bundle"
git -C "$PHR_SOURCE" rev-parse HEAD > "$PHR_EVIDENCE/source-head.txt"
git -C "$PHR_SOURCE" show-ref > "$PHR_EVIDENCE/source-refs.txt"
git -C "$PHR_SOURCE" remote -v > "$PHR_EVIDENCE/source-remotes.txt"
git -C "$PHR_SOURCE" status --porcelain=v2 --branch --untracked-files=all > "$PHR_EVIDENCE/source-status-before.txt"
(cd "$PHR_SOURCE" && git ls-files -z | LC_ALL=C sort -z | xargs -0 shasum -a 256) > "$PHR_EVIDENCE/source-tracked.sha256"
(cd "$PHR_SOURCE" && git ls-files --others --exclude-standard -z | LC_ALL=C sort -z | xargs -0 shasum -a 256) > "$PHR_EVIDENCE/source-untracked.sha256"
```

Create an ignored-state inventory excluding `.next` and Git-owned internals without printing file contents:

```sh
git -C "$PHR_SOURCE" ls-files --others --ignored --exclude-standard -z \
  | tr '\0' '\n' \
  | rg -v '^\.next(/|$)' \
  | LC_ALL=C sort > "$PHR_EVIDENCE/source-ignored-paths.txt"
```

## Phase 3: Staged Copy

Create the fixed staging directory only after verifying it is absent:

```sh
test ! -e "$PHR_STAGE"
mkdir "$PHR_STAGE"
/usr/bin/rsync -aE --exclude='/.next/' "$PHR_SOURCE/" "$PHR_STAGE/"
```

Do not use `--delete`, `--remove-source-files`, dereferenced-link options, or a direct final-directory target during the copy.

## Phase 4: Staged Verification

Run every check before cutover:

```sh
git -C "$PHR_STAGE" rev-parse HEAD
git -C "$PHR_STAGE" show-ref
git -C "$PHR_STAGE" remote -v
git -C "$PHR_STAGE" status --porcelain=v2 --branch --untracked-files=all
git -C "$PHR_STAGE" fsck --full
test ! -e "$PHR_STAGE/.next"
test -f "$PHR_STAGE/.env.local"
test -f "$PHR_STAGE/pnpm-lock.yaml"
test -f "$PHR_STAGE/pnpm-workspace.yaml"
find "$PHR_STAGE/node_modules" -type l ! -exec test -e {} \; -print
/usr/bin/rsync -aEcni --delete --exclude='/.next/' "$PHR_SOURCE/" "$PHR_STAGE/"
```

The checksum dry run must produce no itemized content change and must exit successfully. Compare exact evidence:

```sh
git -C "$PHR_STAGE" rev-parse HEAD > "$PHR_EVIDENCE/stage-head.txt"
git -C "$PHR_STAGE" show-ref > "$PHR_EVIDENCE/stage-refs.txt"
git -C "$PHR_STAGE" remote -v > "$PHR_EVIDENCE/stage-remotes.txt"
git -C "$PHR_STAGE" status --porcelain=v2 --branch --untracked-files=all > "$PHR_EVIDENCE/stage-status.txt"
cmp "$PHR_EVIDENCE/source-head.txt" "$PHR_EVIDENCE/stage-head.txt"
cmp "$PHR_EVIDENCE/source-refs.txt" "$PHR_EVIDENCE/stage-refs.txt"
cmp "$PHR_EVIDENCE/source-remotes.txt" "$PHR_EVIDENCE/stage-remotes.txt"
cmp "$PHR_EVIDENCE/source-status-before.txt" "$PHR_EVIDENCE/stage-status.txt"
```

Regenerate tracked and untracked manifests from within `$PHR_STAGE` and compare them:

```sh
(cd "$PHR_STAGE" && git ls-files -z | LC_ALL=C sort -z | xargs -0 shasum -a 256) > "$PHR_EVIDENCE/stage-tracked.sha256"
(cd "$PHR_STAGE" && git ls-files --others --exclude-standard -z | LC_ALL=C sort -z | xargs -0 shasum -a 256) > "$PHR_EVIDENCE/stage-untracked.sha256"
cmp "$PHR_EVIDENCE/source-tracked.sha256" "$PHR_EVIDENCE/stage-tracked.sha256"
cmp "$PHR_EVIDENCE/source-untracked.sha256" "$PHR_EVIDENCE/stage-untracked.sha256"

git -C "$PHR_STAGE" ls-files --others --ignored --exclude-standard -z \
  | tr '\0' '\n' \
  | rg -v '^\.next(/|$)' \
  | LC_ALL=C sort > "$PHR_EVIDENCE/stage-ignored-paths.txt"
cmp "$PHR_EVIDENCE/source-ignored-paths.txt" "$PHR_EVIDENCE/stage-ignored-paths.txt"

(cd "$PHR_SOURCE" && find . -path './.next' -prune -o -type l -exec /bin/sh -c 'for path do printf "%s -> %s\n" "$path" "$(readlink "$path")"; done' sh {} + | LC_ALL=C sort) > "$PHR_EVIDENCE/source-symlinks.txt"
(cd "$PHR_STAGE" && find . -path './.next' -prune -o -type l -exec /bin/sh -c 'for path do printf "%s -> %s\n" "$path" "$(readlink "$path")"; done' sh {} + | LC_ALL=C sort) > "$PHR_EVIDENCE/stage-symlinks.txt"
cmp "$PHR_EVIDENCE/source-symlinks.txt" "$PHR_EVIDENCE/stage-symlinks.txt"
```

Recheck source quiescence:

```sh
git -C "$PHR_SOURCE" status --porcelain=v2 --branch --untracked-files=all > "$PHR_EVIDENCE/source-status-after.txt"
cmp "$PHR_EVIDENCE/source-status-before.txt" "$PHR_EVIDENCE/source-status-after.txt"
```

Any mismatch blocks cutover. Do not patch staging in place when source drift is detected.

## Phase 5: Atomic Cutover

Requires separate explicit cutover authorization. Immediately reverify paths and emptiness:

```sh
test "$PHR_FINAL" = /Volumes/JarvisSSD/Projects/Phronesis
test "$PHR_STAGE" = /Volumes/JarvisSSD/Projects/.Phronesis.staging-PHR-TECH-003
test -d "$PHR_FINAL"
test -z "$(find "$PHR_FINAL" -mindepth 1 -maxdepth 1 -print -quit)"
test -d "$PHR_STAGE/.git"
```

Then perform only:

```sh
rmdir /Volumes/JarvisSSD/Projects/Phronesis
mv /Volumes/JarvisSSD/Projects/.Phronesis.staging-PHR-TECH-003 /Volumes/JarvisSSD/Projects/Phronesis
```

If `rmdir` fails, stop. If `mv` fails, source remains canonical and staging remains the candidate; do not copy over the final path or alter source.

## Phase 6: New-Path Validation

From `/Volumes/JarvisSSD/Projects/Phronesis`:

```sh
pwd
git rev-parse --show-toplevel
git rev-parse HEAD
git status --porcelain=v2 --branch --untracked-files=all
git fsck --full
find node_modules -type l ! -exec test -e {} \; -print
npm run lint
npm test
npx tsc --noEmit
git diff --check
```

Expected baseline debt remains explicit: 17 behavioral test failures and 27 `TS5097` errors unless separately changed by authorized work. Do not classify those as migration regressions unless their fingerprint differs from the accepted baseline.

`npm run build` is not an offline acceptance requirement because configured Google Fonts may require network. Run it only under separately authorized network access or an already proven offline cache condition, and report whether application type checking was reached.

## Phase 7: Documentation And Workspace Cutover

Only under explicit repository-edit authority, update current-root declarations in the new copy to `/Volumes/JarvisSSD/Projects/Phronesis`. Preserve historical statements that identify the old path as the migration source. Search for path drift:

```sh
rg -n --hidden --glob '!.git/**' --glob '!node_modules/**' --glob '!.next/**' \
  '/Users/ramonnogueira/Developer/Phronesis|/Volumes/JarvisSSD/Projects/Phronesis' .
```

Close the old Codex workspace and reopen `/Volumes/JarvisSSD/Projects/Phronesis`. Treat `/Users/ramonnogueira/Developer/Phronesis` as rollback-only. Do not create a compatibility symlink or delete the source.

## Expected Architecture

```text
Retained source checkout (rollback; unchanged)
          |
          +--> Git bundle + evidence on JarvisSSD
          |
          +--> rsync -aE, excluding only .next
                         |
                         v
              sibling staging checkout
                         |
                 verified and quiescent
                         |
                 same-volume atomic rename
                         v
              canonical JarvisSSD checkout
```

## Testing Expectations

- Verify Git, content, metadata-sensitive state, symlinks, and source quiescence before cutover.
- Run offline local validation after cutover.
- Report accepted baseline failures separately from migration regressions.
- Do not access network services or reinstall dependencies without separate approval.

## Documentation Updates

- Update only current-root declarations after cutover authority is granted.
- Record execution evidence and acceptance state in Product Development Conversation History.
- Add validation and release notes only after successful execution and conformance review.
- Do not commit or push without separate authorization.

## Acceptance Criteria

- All criteria in `docs/technical/PHR-TECH-003-verified-repository-relocation.md` pass.
- Source remains intact as rollback.
- Destination becomes canonical only after verified atomic cutover.
- Evidence identifies every copied, excluded, and unresolved state class.
- Engineer returns exact commands, results, paths, hashes, deviations, and negative-effect declarations.

## Non-Goals

- GitHub repository rename or remote change.
- Push/publication.
- Dependency reinstall.
- Baseline test-debt remediation.
- Package-manager decision.
- Source deletion or compatibility symlink.

## Notes For AI Coding Agents

- Preserve unrelated user changes.
- Do not print secret contents.
- Treat every path mismatch or state drift as a stop condition.
- Do not infer execution authority from this prompt; require the later CTO Structure.
