# PHR-WORKFLOW-002 Checkpoint Stabilization Engineer Prompt

## Authority

- Role: Phronesis Engineer
- Feature: `PHR-WORKFLOW-002`
- Source: `PHR-STRUCT-20260722-003`
- Scope: local verification and documentation remediation only

## Objective

Make the current July 22 working tree reproducibly verifiable without changing product behavior or expanding product scope.

## Required Work

1. Correct the `TS2367` assertion in `tests/application-navigation.test.ts` without weakening the requirement that primary navigation contains no placeholder `href`.
2. Establish a repository-supported test command for the existing TypeScript tests, including path-alias and TypeScript-syntax support. Do not rewrite application architecture to accommodate the runner.
3. Re-run the focused navigation suite, supported full suite, lint, standalone TypeScript validation, diff checks, and a safe production build.
4. Update validation records to distinguish application/build type checking, standalone test-configuration `TS5097` defects, actual feature regressions, and environment-only build failures.
5. Determine from repository evidence whether npm or pnpm is canonical. Do not delete, regenerate, stage, or commit either lock system without explicit ownership evidence or CTO direction.
6. Return an exact changed-file list, commands, results, remaining failures, and negative-effect declarations.

## Constraints

- Preserve every unrelated working-tree change.
- No new product feature or product-behavior change.
- No commit, staging, push, deployment, publication, dependency installation, external access, branch creation, or destructive Git operation.
- Do not use Muamba Arte or `MA-*` artifacts.
- Stop after local remediation evidence and return to Chief Architect review.

## Required Evidence

- Focused navigation test result.
- Full supported test-suite result.
- Lint result.
- Standalone TypeScript result with error classes explained.
- Production-build result with environment limitations disclosed.
- `git diff --check` result.
- Package-manager ownership evidence and unchanged-artifact declaration.
- Exact file list and negative-effect declaration.
