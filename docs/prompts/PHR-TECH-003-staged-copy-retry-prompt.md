# PHR-TECH-003 Staged-Copy Retry Prompt

## Authority

- Role: Phronesis Engineer
- Feature: `PHR-TECH-003`
- Source: `PHR-STRUCT-20260726-003`
- Scope: preserve attempt one, create and fully verify one fresh staging copy

## Objective

Quarantine the incomplete attempt-one staging directory without deleting it, regenerate current source evidence, complete one fresh `rsync` copy in a persistent execution session, and return full staged-verification evidence. Do not cut over.

## Mandatory Procedure

1. Read the current Structure and main relocation prompt completely.
2. Revalidate every fixed path, source state, bundle, and stop condition.
3. Confirm the quarantine and attempt-two evidence paths are absent.
4. Rename failed staging to the exact quarantine path.
5. Create attempt-two evidence without overwriting attempt-one files.
6. Recreate the fixed staging directory.
7. Run the exact authorized `rsync` command and wait for process completion.
8. Require exit code zero before verification.
9. Run every Git, checksum, ignored-state, count, symlink, metadata, dry-run, and source-quiescence comparison.
10. Stop without cutover and return the required evidence and verdict.

## Constraints

- No deletion or in-place repair.
- No final-destination mutation or cutover.
- No source edit or mutation.
- No network, dependency installation, build, process termination, Git mutation, commit, or publication.
- Do not expose secret values.
- Any uncertainty or mismatch fails closed.

## Required Verdict

Return exactly one:

- `STAGING VERIFIED`
- `RETRY FAILED SAFELY`
- `BLOCKED`
