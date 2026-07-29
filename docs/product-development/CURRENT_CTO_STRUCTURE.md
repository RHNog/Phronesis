# Current Phronesis CTO Structure

## Identity

- Project: Phronesis
- Canonical repository root: `/Volumes/JarvisSSD/Projects/Phronesis`
- Rollback checkout: `/Users/ramonnogueira/Developer/Phronesis`
- Assignment ID: `019fa79e-34a1-75e9-9516-99399a01cbcf`
- Feature ID: `PHR-UX-007`
- Governing workflow: shared `MASTER-CANONICAL-WORKFLOW` revision 2.8.0 via `.agents/WORKFLOW.md`
- Document ID: `PHR-STRUCT-20260729-001`
- Status: `CANONICAL ADOPTION COMPLETE`

This repository-owned file is the only canonical Structure authority for Phronesis role commands.

## Accepted Outcome — Mobile Pricing Lookup

The approved Mobile Pricing Lookup gives Ramon a phone-first, one-lookup delivered-price reference for English Pokémon singles and sealed products, including condition-aware results, movement history, freshness, shipping treatment, and explicit uncertainty.

The exact Product Review-approved implementation from assignment `019fa79e-34a1-75e9-9516-99399a01cbcf` has been reconciled onto the maintained JarvisSSD repository without replaying product planning, architecture, engineering, visual verification, or Product Review. The product implementation is unchanged from the reviewed patch; only the three concurrently advanced documentation ledgers were merged with the later repository-reconciliation record.

Canonical implementation commit: `8de8670e67c5df2a8dd1c8da93d218610ac40210`.

## Canonical Artifacts

- Specification: `docs/ux/PHR-UX-007-mobile-pricing-lookup.md`
- Designer direction: `docs/design/PHR-UX-007-mobile-pricing-lookup.md`
- Implementation prompt: `docs/prompts/PHR-UX-007-implementation-prompt.md`
- Engineer report: `docs/implementation-reports/PHR-UX-007-engineer-report.md`
- Debugger recovery record: `docs/implementation-reports/PHR-UX-007-debugger-recovery.md`
- Validation record: `docs/testing/PHR-UX-007-mobile-pricing-lookup-validation.md`
- Release note: `docs/release-notes/PHR-UX-007.md`

## Preserved Boundaries

- Production import certification still requires a representative sanitized Pricing Tool export and its authoritative schema/version; columns are not guessed.
- Deployment, credentials, purchases, external mutation, destructive operations, rollback deletion, force push, and history rewriting remain outside this adoption.
- Known repository baseline debt remains visible and is not represented as a PHR-UX-007 regression.

## Next Gate

The adopted result may proceed to a separately authorized testable release or deployment. New product scope requires a new approved objective; it must not be folded into this completed assignment.

## Revision History

- 2026-07-29: `PHR-STRUCT-20260729-001` reconciled and adopted the Product Review-approved `PHR-UX-007` implementation into the canonical JarvisSSD repository while preserving later repository-governance history.
- 2026-07-28: `PHR-STRUCT-20260728-001` reconciled the canonical repository and GitHub checkpoint under `PHR-TECH-004`.
