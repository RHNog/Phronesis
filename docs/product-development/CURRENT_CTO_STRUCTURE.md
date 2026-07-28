# Current Phronesis CTO Structure

## Identity

- Project: Phronesis
- Canonical repository root: `/Volumes/JarvisSSD/Projects/Phronesis`
- Rollback checkout: `/Users/ramonnogueira/Developer/Phronesis`
- Feature ID: `PHR-TECH-004`
- Governing workflow: shared `MASTER-CANONICAL-WORKFLOW` revision 1.2.0 via `.agents/WORKFLOW.md`
- Document ID: `PHR-STRUCT-20260728-001`
- Status: `READY`

## Approved Outcome

`RECONCILE AND PUBLISH`

Reconcile the JarvisSSD checkout, migration and workflow records, npm ownership, local-only artifacts, intentional commit boundaries, and ordinary GitHub publication. Preserve the rollback checkout and migration evidence.

## Boundaries

- New development occurs only at the canonical JarvisSSD root.
- Rollback deletion, compatibility symlinks, force push, history rewriting, dependency installation, deployment, and production mutation remain unauthorized.
- Known behavioral and standalone TypeScript baseline debt remains visible.

## Acceptance Criteria

- Documentation and Feature IDs agree with completed state.
- npm is canonical; pnpm artifacts remain local and excluded.
- `.DS_Store` noise is absent from the checkpoint.
- Verification results disclose known baseline debt.
- Ordinary commits are pushed without history rewriting and local `main` equals `origin/main`.

## Revision History

- 2026-07-28: `PHR-STRUCT-20260728-001` reconciled the canonical repository and GitHub checkpoint.
