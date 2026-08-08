---
title: PHR-BRAND-001 Documentation Validation
document_id: PHR-BRAND-001-TESTING
status: INTERNAL — CONFIDENTIAL — PRE-LAUNCH BRAND STRATEGY
last_updated: 2026-08-07
project_codename: Phronesis
future_public_brand: LoreShard
legal_notice: PRELIMINARY BRAND STRATEGY / NOT LEGAL ADVICE
---

> **INTERNAL — CONFIDENTIAL — PRE-LAUNCH BRAND STRATEGY**
> **PRELIMINARY LEGAL / BRAND CLEARANCE — NOT LEGAL ADVICE**
> **HUMAN / COUNSEL VERIFICATION REQUIRED**

# Documentation validation

## Scope

Validate structure, metadata, cross-links, JSON syntax and schemas, required candidate/risk coverage, vocabulary doctrine, and the absence of implementation changes.

## Checks

- Required archive files exist.
- Markdown frontmatter contains all required metadata fields.
- Confidentiality and legal-warning labels appear in every Markdown artifact.
- All local relative Markdown links resolve.
- All JSON files parse.
- Candidate statuses are limited to the approved values.
- Every candidate object contains all required fields.
- ArgoWise has `do_not_suggest: true`.
- Meti constructions explicitly record Portuguese-language risk.
- Risk severity is limited to LOW, MODERATE, HIGH, or CRITICAL.
- All requested risk names are represented.
- `git diff --check` passes.
- Task changes are documentation-only and contain no public launch artifact.

## Evidence

Validated locally on 2026-08-07:

- 20 required archive files present.
- 21 Markdown artifacts passed metadata, warning-label, and local-link checks.
- 46 candidate objects passed required-field and allowed-status checks.
- 25 risk objects passed severity and coverage checks.
- All three JSON files parsed successfully.
- `git diff --check` passed.
- The staged task scope contains documentation files only.

This record does not validate historical legal research or domain control; those remain human/counsel tasks.
