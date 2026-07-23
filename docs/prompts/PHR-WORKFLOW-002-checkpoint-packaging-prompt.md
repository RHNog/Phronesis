# PHR-WORKFLOW-002 Checkpoint Packaging Engineer Prompt

## Authority

- Role: Phronesis Engineer
- Feature: `PHR-WORKFLOW-002`
- Source: `PHR-STRUCT-20260722-005`
- Scope: controlled staging and local commit creation only

## Objective

Package the CTO-accepted July 22 checkpoint into exactly four reviewable local commits without pushing, publishing, or changing file content.

## Authorized Sequence

1. `PHR-ARCH-010` identity migration.
2. `PHR-WORKFLOW-002` and `PHR-TECH-002` governance, memory, and Structure isolation.
3. `PHR-UX-006` lifecycle application navigation.
4. Reproducible TypeScript test infrastructure and truthful validation evidence.

Use the suggested commit messages and detailed boundaries in `PHR-STRUCT-20260722-005`.

## Required Procedure

- Inspect every candidate diff before staging.
- Use explicit file staging and hunk-level staging for shared files.
- Never use `git add .` or `git add -A`.
- Before every commit, run `git diff --cached --check` and inspect the complete cached diff.
- Run relevant local validation before or after each logical commit without external access.
- After the fourth commit, report the four hashes, complete file sets, checks, exclusions, and exact remaining working tree.

## Exclusions

- `pnpm-lock.yaml`
- `pnpm-workspace.yaml`
- secrets and environment files
- generated caches
- unrelated working-tree content
- any content change discovered to be necessary during packaging

`package-lock.json` may be included only in the identity commit if inspection confirms its diff is limited to the approved npm package-name migration.

## Constraints

- No file-content edits.
- No push, publication, deployment, branch creation, pull request, tag, or external mutation.
- No dependency installation or external access.
- No destructive Git operation.
- Do not conceal the 17 behavioral failures, 27 `TS5097` errors, controlled-build requirement, or excluded pnpm artifacts.
- Stop after local commits and return to the CTO verification gate.
