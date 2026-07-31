<!-- BEGIN:documentation-first-development -->
# Documentation-First Development

Documentation is part of implementation for Project Phronesis.

Before or alongside any meaningful feature, enhancement, architecture decision, workflow improvement, optimization, refactor, technical-debt item, business rule, API change, database change, UI/UX change, infrastructure change, or architecturally relevant bug fix:

1. Identify the change category.
2. Create or update a feature specification using `docs/templates/FeatureSpecificationTemplate.md`.
3. Assign or preserve a permanent Feature ID such as `PHR-TECH-001`.
4. Classify the documentation destination under `docs/`.
5. Generate or update an AI-ready implementation prompt using `docs/templates/ImplementationPromptTemplate.md` when implementation work is required.
6. Update dependent documentation such as Atlas, Decisions, Roadmap, Release Notes, Testing, or Prompt History when relevant.

The system contract lives in `docs/DOCUMENTATION_FIRST_DEVELOPMENT.md`.

Implementation follows documentation. Do not let documentation become stale.
<!-- END:documentation-first-development -->

<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:canonical-product-development-workflow -->
# Canonical Product Development Workflow

The primary user-facing chat operates as the Phronesis CTO interface. Read `.agents/roles/cto.md`, `.agents/README.md`, `docs/product-development/CURRENT_CTO_STRUCTURE.md`, and `docs/product-development/CONVERSATION_HISTORY.md` when recovering or directing product work.

The repository-owned `docs/product-development/CURRENT_CTO_STRUCTURE.md` is the only Phronesis authority for bare `Prompt`, `Implement`, or `Review` commands. Do not resolve those commands through another project, workspace, Google Drive document, or global “current structure” file. Phronesis work uses `PHR-*` Feature IDs; a different project identity or prefix is a blocking boundary violation.

Meaningful implementation follows the shared master workflow referenced by `.agents/WORKFLOW.md`; `PHR-WORKFLOW-002` is preserved only as historical Phronesis evidence:

1. CTO owns product intent, priority, scope, and acceptance.
2. Chief Architect owns specifications, architecture, implementation work orders, and conformance review.
3. Engineer owns scoped implementation, tests, documentation updates, and evidence.

Once the user approves an objective, handoffs between these roles are autonomous. Do not wait for separate `Prompt`, `Implement`, `Review`, or `Final Review` commands. Preserve all evidence gates and interrupt the user only for the Critical Escalation Conditions defined in the shared master workflow referenced by `.agents/WORKFLOW.md`.

Read the active role contract in `.agents/roles/`. One session may perform roles sequentially for explicit low-risk work, but must retain the gates and must not claim its own output is independent approval.

At CTO acceptance, update `docs/product-development/CONVERSATION_HISTORY.md` with the material intent, decisions, Feature IDs, artifacts, unresolved questions, and acceptance state. Never invent unavailable historical conversations or store secrets in product memory.
<!-- END:canonical-product-development-workflow -->

<!-- BEGIN:master-canonical-workflow -->
## Master Canonical Product Development Workflow

Before product-development work:

1. Read `/Volumes/JarvisSSD/Projects/_shared/governance/MASTER_CANONICAL_PRODUCT_DEVELOPMENT_WORKFLOW.md`.
2. Read `.agents/WORKFLOW.md` and verify this project's identity and root.
3. Read the current CTO Structure, product memory, active role supplement, and design context when applicable.
4. Apply the master workflow. Local guidance may add project-specific facts or stricter controls but may not silently weaken or override it.

Canonical workflow revision adopted: `2.18.0`.
<!-- END:master-canonical-workflow -->

<!-- handoff:contract:start -->
## Canonical Handoff continuity

The repository is authoritative; conversation history is disposable.

- **Acquire Handoff**: read `handoff.toml`, the configured canonical documents,
  and generated operational context; run `./handoff validate-continuity`; then
  execute the exact next action.
- **Handoff**: update canonical truth and `ACTIVE_TASK`, commit verified project
  state, then run bare `./handoff`. Do not claim transfer readiness on failure.
- Architectural decisions must never remain only in a conversation.
- Repository evidence supersedes conversational state whenever they conflict.
<!-- handoff:contract:end -->
