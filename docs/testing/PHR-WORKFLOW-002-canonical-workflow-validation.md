# PHR-WORKFLOW-002 Canonical Workflow Validation

## Required Checks

- CTO, Chief Architect, and Engineer contracts exist.
- Ownership, prohibitions, handoffs, escalation, conformance review, and acceptance are explicit.
- `AGENTS.md` routes primary sessions through the CTO contract.
- Sequential-role execution cannot be represented as independent approval.
- `docs/product-development/CURRENT_CTO_STRUCTURE.md` identifies Phronesis, the repository root, `PHR-` Feature IDs, and a governed readiness state.
- CTO, Chief Architect, Engineer, `.agents/README.md`, and `AGENTS.md` prohibit cross-project Structure authority.
- CTO, Chief Architect, Engineer, `.agents/README.md`, and `AGENTS.md` require autonomous handoffs after objective approval.
- Non-critical verification failures enter a bounded Architect/Engineer remediation loop without repeated user authorization.
- Critical-risk escalation categories are explicit and preserve user control over destructive, production, security, financial, legal, and materially outcome-changing decisions.
- Bare `Prompt`, `Implement`, and `Review` commands resolve only through the repository-owned Phronesis Structure.

## Result

Validated on 2026-07-22. All three role contracts, authority boundaries, handoff fields, conformance and acceptance gates, sequential-role disclosure, `AGENTS.md` routing, product-memory links, Structure command routing, identity checks, and cross-project rejection rules are present.

## Checkpoint Stabilization Evidence

Engineer remediation under `PHR-STRUCT-20260722-003` added a repository-supported `npm test` command. The command uses the already lock-pinned Jiti transformer with TypeScript-path and JSX support, so the Node test runner can execute the existing `.ts` and `.tsx` corpus and resolve `@/` aliases without application-architecture changes.

Verification on 2026-07-22:

- Focused `PHR-UX-006` navigation: 3 of 3 passed.
- Full `npm test`: 159 tests executed, 142 passed, and 17 behavioral assertions failed. Runner, TypeScript-syntax, TSX, and module-resolution failures were eliminated.
- `npm run lint`: passed.
- `npx tsc --noEmit`: failed with 27 known `TS5097` test import-extension errors only; no `TS2367` remains.
- `npm run build`: blocked before application type checking because the restricted environment could not fetch Geist and Geist Mono from Google Fonts.
- `git diff --check`: passed.

The 17 full-suite failures span card-intelligence expectations (4), evaluation-history immutability (1), Scryfall-backed identity search (1), market evidence/intelligence/repository expectations (6), platform capability wording (1), system readiness (2), and TCGplayer-derived intelligence/negotiation expectations (2). They are actual test outcomes and are not waived by this infrastructure remediation.

## Package-Manager Evidence

npm is the repository-supported package manager: `package.json` and `package-lock.json` are tracked, the npm lock has repository history, and repository instructions consistently use `npm install` and `npm run`. `pnpm-lock.yaml` and `pnpm-workspace.yaml` are untracked and have no Git history or governing documentation. Neither lockfile nor the pnpm workspace file was deleted, regenerated, staged, or intentionally changed during this remediation.
