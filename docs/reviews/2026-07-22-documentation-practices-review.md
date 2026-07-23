# Documentation Practices Review — 2026-07-22

## Review Scope

Repository documentation, traceability, AI handoff, product memory, role governance, and restart readiness were reviewed as part of the development resumption session.

## Executive Finding

Phronesis has unusually strong architecture and domain documentation and already uses permanent Feature IDs, specifications, implementation prompts, validation notes, release notes, Atlas, decisions, and handoffs. The application should be evolved from the current baseline, not rebuilt from scratch. The largest risks are governance and freshness, not foundational code cleanliness.

## What Is Working

- Documentation-first behavior is a repository-level contract.
- Permanent `PHR-*` IDs link meaningful recent work.
- Category-specific specifications, prompts, tests, and release notes exist.
- Atlas and Decisions preserve extensive domain and architecture knowledge.
- Git history provides a recoverable implementation baseline.
- Architecture boundaries around identity, providers, market evidence, assessment, strategy, negotiation, and decisions are explicit.

## Gaps Found

### Critical

- No explicit CTO, Chief Architect, or Engineer role contracts existed.
- No durable conversation-to-decision ledger existed.
- The primary handoff declared Sprint 32 as current while later work was already present.
- Two product identities coexisted across runtime and documentation.

### High

- Older sprint-based changes are not uniformly represented in the modern Feature Registry.
- Large append-only documents duplicate facts and can drift independently.
- Documentation validation is mostly narrative; automated link, ID, freshness, and legacy-name checks are absent.
- “Completed” may mean documented, implemented, or validated depending on the record; lifecycle semantics need one definition.
- Standalone TypeScript validation is not currently clean because multiple existing tests use explicit `.ts` import extensions without matching compiler configuration.

### Medium

- Top-level and `docs/` changelogs overlap.
- `ROADMAP.md` and `PRODUCT_ROADMAP.md` have adjacent ownership that should be stated more sharply.
- Generated business artifacts can drift from Markdown sources without a manifest tying source hashes to exports.
- External checkout/repository naming is outside repository-content governance.

## Applied During This Review

- Established `PHR-ARCH-010`, `PHR-WORKFLOW-002`, and `PHR-TECH-002`.
- Added three role contracts and explicit gates.
- Added the CTO Product Development Conversation History.
- Made Phronesis the repository identity.
- Updated feature registry, decisions, release notes, testing records, prompt records, and handoff entry points.

## Recommended Next Documentation Sprint

1. Add a documentation validator for unique Feature IDs, required traceability links, valid lifecycle states, broken local links, and retired terminology.
2. Reconcile every completed sprint to a permanent Feature ID or explicitly mark it as historical pre-registry work.
3. Define canonical ownership and archival rules for Atlas, handoff, roadmap, sprint history, and both changelogs.
4. Add a generated “current state” index so handoff freshness can be checked against Git and Feature Registry state.
5. Define transcript import, redaction, correction, and retention rules before importing historical chats.

## Rebuild Assessment

### Decision

Continue from the current codebase.

### Rationale

- The repository has coherent domain boundaries and substantial regression coverage.
- Current weaknesses are fixable governance and documentation consistency issues.
- A rewrite would discard verified behavior, introduce migration risk, and recreate already-solved architecture.
- No evidence currently shows systemic implementation failure that a clean-room rebuild would solve.

### Reconsider A Rebuild Only If

- A measured architecture conformance audit finds pervasive boundary violations.
- Core tests cannot establish a trustworthy baseline.
- Required product direction is incompatible with the present domain model.
- The costed migration plan is demonstrably lower risk than incremental correction.
