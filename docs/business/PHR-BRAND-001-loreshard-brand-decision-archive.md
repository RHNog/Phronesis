---
title: LoreShard Brand Decision Archive Specification
document_id: PHR-BRAND-001
status: INTERNAL — CONFIDENTIAL — PRE-LAUNCH BRAND STRATEGY
last_updated: 2026-08-07
project_codename: Phronesis
future_public_brand: LoreShard
legal_notice: PRELIMINARY BRAND STRATEGY / NOT LEGAL ADVICE
---

> **INTERNAL — CONFIDENTIAL — PRE-LAUNCH BRAND STRATEGY**
> **PRELIMINARY LEGAL / BRAND CLEARANCE — NOT LEGAL ADVICE**
> **HUMAN / COUNSEL VERIFICATION REQUIRED**

# PHR-BRAND-001 — LoreShard brand decision archive

## Status

Completed (documentation package); brand launch remains gated.

## Priority

High.

## Category

Business Rule / Brand Strategy / Decision Record / Documentation.

## Objective

Create the authoritative private record of the naming effort that selected LoreShard as the intended future public brand while preserving Phronesis as the internal codename and active build identity.

## Background and problem statement

The naming search accumulated strategy, candidate history, preliminary clearance observations, terminology rules, and launch conditions. Without a controlled repository record, future agents and specialists could revive rejected names, overstate legal conclusions, expose the brand prematurely, or rename the active system before approval.

## Proposed solution

Maintain a confidential archive under [`docs/brand/loreshard/`](../brand/loreshard/README.md), an ADR, machine-readable registries, a risk register, counsel brief, and launch gates.

## Functional requirements

- Record the Phronesis/LoreShard operating distinction.
- Preserve the full supplied naming history and rejection rationale.
- Separate founder facts, decisions, preliminary research, inferences, and counsel conclusions.
- Encode candidates, decision state, and risks in valid JSON.
- Define brand positioning, architecture, usage doctrine, visual direction, voice, and launch gates.
- Give future agents and counsel concise, purpose-built entry points.

## Non-functional requirements

- **Maintainability:** stable IDs, dated documents, cross-links, and machine-readable companions.
- **Reliability:** JSON parses; required files, labels, candidates, and risks are validated.
- **Security:** confidential, pre-launch handling; no credentials or nonpublic registrar details.
- **Extensibility:** append counsel findings and gate evidence without erasing history.
- **Accessibility:** clear headings, tables, plain-language summaries, and text-first content.
- **Performance/offline/responsiveness:** not applicable to this documentation-only change.

## User stories

- As the founder, I want one decision record so future teams preserve brand intent.
- As counsel, I want a concise brief and risk context so I can perform independent clearance.
- As an agent, I want explicit prohibited actions and rejected names so I do not leak or regress the strategy.
- As a designer or product lead, I want positioning and architecture constraints so concepts remain coherent.

## Acceptance criteria

- All requested archive files and three JSON datasets exist.
- Every Markdown file carries the required confidentiality metadata and warnings.
- Candidate JSON includes every requested candidate, allowed statuses, required fields, the ArgoWise do-not-suggest flag, and explicit Meti Portuguese risk.
- Risk records cover every requested risk with valid severity and ownership fields.
- Local links resolve and JSON parses.
- No source code, public page, deployment configuration, or current product name changes.
- No publication, push, deployment, registration, or legal-clearance claim.

## Edge cases

- Counsel rejects LoreShard: preserve this record and add a superseding decision rather than rewriting history.
- Domain control differs from founder report: correct the evidence state without implying bad faith.
- A candidate is reconsidered: perform a fresh search and record the new decision date.
- Public launch becomes authorized: execute a separate migration specification after all gates.

## Dependencies

- Founder approval and facts.
- Independent U.S. and Brazilian trademark counsel.
- Future namespace, identity, and migration work orders.

## Future enhancements

Attach counsel memoranda, dated namespace evidence, user-testing results, identity-board decisions, filing records, and gate approvals as separately controlled artifacts.

## Technical and UI/UX notes

No implementation or UI work is authorized. Phronesis remains unchanged. Proposed LoreShard modules are conceptual naming architecture only.

## Success metrics

- Zero ambiguous current-brand instructions.
- Zero generic “shards” terminology in approved product vocabulary.
- All public-launch gates evidenced before public use.
- Counsel and future agents can locate controlling context from one README.

## Open questions

See [`15_OPEN_QUESTIONS.md`](../brand/loreshard/15_OPEN_QUESTIONS.md).

## Traceability

- Originating work order: founder’s 2026-08-07 “Structure and Document the LoreShard Brand Decision Record” task.
- Related implementation prompt: none; documentation-only task, no product implementation authorized.
- Related validation: [`PHR-BRAND-001-documentation-validation.md`](../testing/PHR-BRAND-001-documentation-validation.md).
- Related release notes: [`PHR-BRAND-001.md`](../release-notes/PHR-BRAND-001.md).
- Related ADR: [`ADR-0001`](../adr/ADR-0001-loreshard-future-public-brand.md).
- Last modified: 2026-08-07.
- Modification reason: establish the authoritative confidential brand archive.
