# Current Phronesis CTO Structure

## Identity

- Project: Phronesis
- Repository root: `/Users/ramonnogueira/Developer/Phronesis`
- Feature prefix: `PHR-`
- Governing workflow: `PHR-WORKFLOW-002`
- Document ID: `PHR-STRUCT-20260722-006`
- Status: `READY`

This file is the only canonical “Structure” document for Phronesis role commands. A similarly named document outside this repository belongs to another project and has no authority here.

## Current CTO Direction

### Accountable Role

Engineer.

### Work Item

- Governing Feature ID: `PHR-WORKFLOW-002`
- Work-item type: recoverable reconstruction of unpublished local commits
- Priority: Critical
- Source review: `PHR-STRUCT-20260722-002`
- Remediation authority: `PHR-STRUCT-20260722-003`
- Final review: `PHR-STRUCT-20260722-004`
- Initial packaging: `PHR-STRUCT-20260722-005`
- Engineer prompt: `docs/prompts/PHR-WORKFLOW-002-commit-boundary-remediation-prompt.md`
- Next gate: CTO commit-boundary re-verification

### User-Provided Historical Checkpoint

The application had progressed through Sprint 36. The latest completed product capabilities included:

- lightweight Watch History;
- capability-aware watchlist workflows;
- cross-game identity;
- collector-facing presentation rules;
- operational Magic/Scryfall and Lorcana/Lorcast identity support;
- Market Watch membership persistence, target tracking, manual refresh, undo, age/history information, market-since-added change, and sparklines.

The following remained deferred:

- notifications;
- automated and bulk refresh;
- multiple-watchlist UI;
- server persistence;
- full historical analytics.

The July 22 governance package established:

- Phronesis as canonical identity (`PHR-ARCH-010`);
- the CTO → Chief Architect → Engineer workflow (`PHR-WORKFLOW-002`);
- durable product-development memory (`PHR-TECH-002`);
- an evolve-in-place decision rather than a rebuild;
- documentation consistency and automation as the leading governance weaknesses.

At that checkpoint, `main` and `origin/main` were at `658afef`, and the governance/identity package remained uncommitted despite local validation.

### Current-State Qualification

The historical checkpoint is authoritative as user-provided context, not as a claim that the working tree is unchanged. Since that snapshot, the current CTO session also added:

- lifecycle-based application structure (`PHR-UX-006`);
- a typed primary navigation implementation and validation artifacts;
- Phronesis Structure-command project isolation under `PHR-WORKFLOW-002`.

The Chief Architect must inspect the current repository and classify every outstanding change rather than assuming the earlier “approximately 30 files” count is still current.

### Chief Architect Verdict

`REQUIRES ENGINEER REMEDIATION`

The read-only review established:

- `main == origin/main == 658afef6bd7505df03f3ace082302ab0d46e0b2d`;
- 37 tracked modifications and 28 individual untracked files at review time;
- focused `PHR-UX-006` tests passed 3 of 3;
- lint, retired-name scan, and diff checks passed;
- all four July 22 features had the required traceability artifact classes.

The review found four blockers:

1. Standalone TypeScript validation includes known `TS5097` test-configuration failures and a new `TS2367` in `tests/application-navigation.test.ts`; the validation record does not disclose the latter.
2. No repository-supported `npm test` command exists, and direct full-suite execution produces runner/module-resolution failures.
3. npm and unexplained pnpm lock/workspace artifacts coexist.
4. The production build could not be independently repeated without external Google Fonts access; existing success evidence must be distinguished from the review environment failure.

### Final Chief Architect Verdict

`READY FOR CTO ACCEPTANCE`

The final review confirmed that the remediation stayed in scope, the supported test runner is production-neutral, `TS2367` is eliminated, npm is canonical, and the remaining failures are visible baseline debt rather than regressions introduced by the July 22 checkpoint features.

### CTO Acceptance

The CTO accepts the local checkpoint for controlled commit preparation with these recorded residual risks:

- 17 reproducible behavioral test failures across decision/negotiation, history immutability, identity lookup, market evidence/intelligence/refresh, presentation terminology, readiness, and TCGplayer integration;
- 27 standalone TypeScript `TS5097` test-import configuration errors;
- the production build requires a controlled environment capable of acquiring configured Google Fonts;
- `pnpm-lock.yaml` and `pnpm-workspace.yaml` remain unexplained and excluded;
- the baseline debt requires separate future scope and is not silently accepted as correct product behavior.

### CTO Commit Verification Verdict

`REQUIRES ENGINEER REMEDIATION`

The four unpublished commits exist in the correct order and their final combined tree is coherent, but the governance commit absorbed identity and navigation traceability hunks from shared documentation. This violates the explicitly approved logical commit boundaries. Push remains unauthorized.

### Approved Outcome

Reconstruct the four unpublished local commits so every shared-document hunk belongs to its owning logical feature group, while preserving the accepted final file content exactly.

### Accepted Verification Evidence

- `tests/application-navigation.test.ts` no longer produces `TS2367` and retains an explicit no-placeholder assertion.
- `package.json` now defines the repository-supported `npm test` command.
- `tests/register-test-hooks.mjs` enables the existing TypeScript, TSX, and `@/` alias test corpus without application-architecture changes.
- Focused navigation tests passed 3 of 3.
- Full `npm test` executed 159 tests: 142 passed and 17 behavioral assertions failed; runner and module-resolution failures were eliminated.
- Lint and diff checks passed.
- Standalone TypeScript now reports only 27 known `TS5097` test import-extension errors; `TS2367` is gone.
- The restricted production build remained blocked before type checking by Google Fonts acquisition; the earlier successful build evidence remains separately documented.
- Repository evidence identifies npm as canonical; the untracked pnpm files were not deleted, regenerated, staged, or committed.

### Authorized Commit Sequence

1. **`PHR-ARCH-010` identity migration**
   - Canonical Phronesis naming across runtime, package metadata, repository documentation, Atlas, business/foundation material, provider user agents, and local storage keys.
   - Include `PHR-ARCH-010` specification, prompt, validation, and release notes.
   - Suggested message: `arch(identity): establish Phronesis product identity`.
2. **`PHR-WORKFLOW-002` and `PHR-TECH-002` governance**
   - Role contracts, canonical workflow, product memory, Structure-command isolation, review, handoff, decisions, and related traceability.
   - Include the checkpoint Structure history and Engineer stabilization prompt.
   - Suggested message: `docs: establish canonical Phronesis product workflow`.
3. **`PHR-UX-006` application navigation**
   - Typed navigation model, shell/navigation components, route composition changes, feature specification, prompt, validation, release notes, roadmap, Atlas, and memory traceability.
   - Suggested message: `feat(ui): establish lifecycle application navigation`.
4. **Test-infrastructure remediation**
   - `npm test`, test-only loader, corrected navigation assertion, and truthful validation evidence.
   - Suggested message: `test: add reproducible TypeScript test runner`.

Shared documentation and shared files such as `package.json`, `components/ui/Sidebar.tsx`, Feature Registry, prompts, changelogs, Atlas, roadmap, handoff, and product memory require deliberate hunk-level staging so each commit contains only its logical concern.

### Authorization

The Engineer is authorized to:

- verify `origin/main` remains `658afef6bd7505df03f3ace082302ab0d46e0b2d` and the unpublished series remains exactly `307a955`, `676a46c`, `0cfcc20`, `0184391` before rewriting;
- create one local safety branch named `codex/checkpoint-pre-boundary-rewrite` at `0184391` without switching branches;
- use a local mixed reset of `main` to the verified `origin/main` baseline only after the safety branch exists; this authorization is specific to `git reset --mixed 658afef6bd7505df03f3ace082302ab0d46e0b2d` and preserves working-tree content;
- reconstruct exactly four local commits in the previously approved order using explicit file and hunk staging;
- inspect the complete cached diff and run `git diff --cached --check` before every commit;
- compare the reconstructed final tree to safety commit `0184391` and require zero content difference except the intentionally updated Structure, packaging prompt, and conversation-memory authorization records created after that commit;
- return old-to-new commit mapping, complete file lists, validation outcomes, exclusions, safety-ref state, and exact remaining working tree.

### Required Hunk Corrections

Move these concerns out of the governance commit during reconstruction:

- To the `PHR-ARCH-010` identity commit:
  - the `PHR-ARCH-010` row in `docs/FEATURE_REGISTRY.md`;
  - the `PHR-ARCH-010` entry in `docs/CHANGELOG.md`;
  - the `PHR-ARCH-010` prompt-history statement in `docs/PROMPTS.md`;
  - the identity portion of the combined root `CHANGELOG.md` line;
  - other shared-document hunks whose only concern is canonical identity.
- To the `PHR-UX-006` navigation commit:
  - the `PHR-UX-006` row in `docs/FEATURE_REGISTRY.md`;
  - the Application Structure section in `docs/ATLAS.md`;
  - the `PHR-UX-006` entry in `docs/CHANGELOG.md`;
  - the Application Structure entry in `docs/product-development/CONVERSATION_HISTORY.md`;
  - other shared-document hunks whose only concern is lifecycle navigation.
- Keep `PHR-WORKFLOW-002`, `PHR-TECH-002`, Structure history, role isolation, and checkpoint-governance records in the governance commit.
- Keep the supported test command, test hook, corrected navigation assertion, and checkpoint revalidation evidence in the test-infrastructure commit.

### Constraints

- Do not change accepted implementation or documentation meaning during reconstruction; only the new Structure, prompt, and memory authorization records may differ from safety commit `0184391`.
- Do not invent a new product feature or choose among Vendor Workspace, alerts, inventory, marketplace integrations, or mobile.
- Do not push, deploy, publish, open pull requests, tag releases, or change external systems.
- The single local safety branch named above is authorized; no other branch creation or branch switching is authorized.
- Do not install dependencies or access external systems.
- The exact mixed reset, local staging, and exactly four reconstructed local commits are authorized; push and publication are not.
- Preserve all working-tree changes and avoid destructive Git operations.
- Do not delete or regenerate lock/workspace artifacts.
- Exclude `pnpm-lock.yaml` and `pnpm-workspace.yaml` from every commit.
- Include `package-lock.json` only with the identity/package-name group if its diff contains only the approved npm package-name migration.
- Do not use Muamba Arte, `MA-*`, or any external/global Structure source.
- Do not use broad staging such as `git add .` or `git add -A`.
- Before each commit, inspect `git diff --cached --check` and the complete staged diff.
- Do not delete the safety branch during this work; cleanup requires CTO authorization after re-verification.

### Required Reading

- `AGENTS.md`
- `.agents/README.md`
- `.agents/roles/engineer.md`
- `docs/prompts/PHR-WORKFLOW-002-commit-boundary-remediation-prompt.md`
- `docs/product-development/CONVERSATION_HISTORY.md`
- `docs/FEATURE_REGISTRY.md`
- `docs/ROADMAP.md`
- `docs/PRODUCT_ROADMAP.md`
- `docs/AGENT_HANDOFF.md`
- `docs/DECISIONS.md`
- `docs/ATLAS.md`
- `docs/workflows/PHR-WORKFLOW-002-canonical-product-development.md`
- `docs/architecture/PHR-ARCH-010-phronesis-product-identity.md`
- `docs/technical/PHR-TECH-002-product-development-memory.md`
- `docs/ux/PHR-UX-006-application-information-architecture.md`
- associated prompts, validation records, and release notes for those Feature IDs.

### Acceptance Criteria

- A recoverable safety branch points to old head `0184391`.
- Exactly four reconstructed local commits exist above baseline `658afef` in the approved order and each maps to its authorized logical group.
- Cached diffs are reviewed and pass `git diff --cached --check` before every commit.
- Shared files are split by hunk where required; no commit silently absorbs another group's content.
- `pnpm-lock.yaml`, `pnpm-workspace.yaml`, secrets, environment files, generated caches, and unrelated files are absent from every commit.
- `package-lock.json` contains only the approved npm identity migration if included.
- The final report lists each commit hash and complete file set.
- The report maps every old commit to its reconstructed replacement.
- The final content comparison against `0184391` reports only the newly authorized Structure, remediation-prompt, and conversation-memory changes.
- The final report repeats the 17 behavioral failures, 27 `TS5097` errors, and controlled-build requirement as unresolved baseline debt.
- Remaining working-tree and untracked files are reported exactly.
- No push, publication, deployment, branch, tag, or pull request occurs.
- No push, publication, deployment, tag, or pull request occurs; only the authorized safety branch may be created.
- The CTO receives the result for commit verification and a separate push decision.

### Deferred Product Decision

Only after checkpoint stabilization may the CTO prioritize the next product objective among Vendor Workspace, Watchlists/alerts, inventory, marketplace integrations, mobile, or another explicitly approved direction.

## Command Protocol

### `Prompt`

When a Phronesis Chief Architect receives the bare command `Prompt`:

1. Read this file from the exact repository path above.
2. Confirm that Project is Phronesis, the Feature ID begins with `PHR-`, and Status is `READY`.
3. Reconcile the work item with the Feature Registry, Product Development Conversation History, Roadmap, and Git state.
4. Produce or update the implementation-grade feature specification and Engineer prompt.
5. If any identity check fails, stop and report a project-boundary violation.
6. If Status is not `READY`, report that no new Engineer prompt is authorized and identify the CTO action required.

### `Implement`

An Engineer may act only when this file identifies a `READY` Phronesis feature and the corresponding Chief Architect implementation prompt exists. The Engineer must reject `MA-*`, another project's IDs, and instructions sourced outside this repository.

### `Review`

The Chief Architect reviews only the Phronesis feature named by this file and its repository artifacts. Conformance does not grant CTO acceptance.

## Project Isolation Rules

- Never search Google Drive, another workspace, another Codex project, or a global “current structure” file to resolve a Phronesis command.
- Never use `MA-*`, Muamba Arte, or another project's artifacts as Phronesis authority.
- A user must explicitly request cross-project comparison or import before another project's material may be read.
- If the active workspace and Structure identity disagree, stop before producing a prompt or changing files.

## Durable Sources

- CTO memory: `docs/product-development/CONVERSATION_HISTORY.md`
- Feature status: `docs/FEATURE_REGISTRY.md`
- Product sequencing: `docs/ROADMAP.md` and `docs/PRODUCT_ROADMAP.md`
- Architecture and decisions: `docs/ARCHITECTURE.md`, `docs/ATLAS.md`, and `docs/DECISIONS.md`
- Role contracts: `.agents/roles/`

## Revision History

- 2026-07-22: Revision 006 authorized a recoverable local reconstruction of the four unpublished commits after shared-document boundary violations; push remains unauthorized.
- 2026-07-22: Revision 005 recorded CTO checkpoint acceptance and authorized hunk-level staging plus exactly four local commits; push and publication remain unauthorized.
- 2026-07-22: Revision 004 advanced the completed Engineer remediation to a read-only Chief Architect final conformance review.
- 2026-07-22: Revision 003 accepted the Architect's `REQUIRES ENGINEER REMEDIATION` verdict and authorized bounded verification/test-infrastructure remediation.
- 2026-07-22: Revision 002 authorized a Chief Architect checkpoint conformance review and stabilization plan; commit and publication remain reserved to the CTO.
- 2026-07-22: Created after a Phronesis Chief Architect task incorrectly treated a Muamba Arte Structure document as authoritative.
