# PHR-TECH-004 Implementation Prompt

## Objective

Reconcile and publish the canonical JarvisSSD repository without rewriting history or deleting rollback evidence.

## Requirements

- Reconcile migration and shared-workflow documentation.
- Preserve pnpm files locally but exclude them from Git status; npm remains canonical.
- Restore tracked `.DS_Store` noise rather than committing it.
- Run diff checks, lint, supported tests, standalone TypeScript validation, and Git integrity.
- Create intentional traceable commits and push ordinary `main`.

## Constraints

- No force push, reset, history rewrite, deployment, dependency installation, or rollback cleanup.
- Do not conceal known baseline failures or overwrite unrelated JarvisSSD work.

## Acceptance Criteria

- All criteria in `PHR-TECH-004` pass.
