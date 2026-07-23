# PHR-WORKFLOW-002 Commit-Boundary Remediation Prompt

## Authority

- Role: Phronesis Engineer
- Feature: `PHR-WORKFLOW-002`
- Source: `PHR-STRUCT-20260722-006`
- Scope: recoverable local reconstruction of four unpublished commits

## Objective

Reconstruct the accepted July 22 checkpoint so shared documentation hunks live in their owning identity, governance, navigation, or test-infrastructure commit without changing accepted content.

## Required Procedure

1. Verify the baseline and all four old commit hashes exactly as recorded in the Structure.
2. Create `codex/checkpoint-pre-boundary-rewrite` at old head `0184391` without switching branches.
3. Verify the safety branch target.
4. Run only the specifically authorized mixed reset to baseline `658afef6bd7505df03f3ace082302ab0d46e0b2d`.
5. Reconstruct exactly four commits in the approved order using explicit and hunk-level staging.
6. Apply every Required Hunk Correction in `PHR-STRUCT-20260722-006`.
7. Inspect the complete cached diff and run `git diff --cached --check` before every commit.
8. Compare the final reconstructed tree with safety commit `0184391`, allowing differences only for the post-packaging Structure, prompt, and memory authorization records.
9. Stop without push and report all evidence.

## Constraints

- Preserve accepted file content and all untracked pnpm artifacts.
- Never use `git add .` or `git add -A`.
- No hard reset, file checkout, restore, clean, deletion, or content-discarding operation.
- No push, publication, deployment, pull request, tag, external access, or dependency installation.
- Do not delete the safety branch.
- Do not create or switch to any other branch.
- Return any content defect to the CTO instead of editing it.

## Required Report

- Baseline verification.
- Safety-branch hash.
- Old-to-new commit mapping.
- Complete file list per new commit.
- Cached-diff checks and validation results.
- Final tree comparison.
- Excluded pnpm artifacts.
- Exact remaining working tree.
- Confirmation that no push or publication occurred.
