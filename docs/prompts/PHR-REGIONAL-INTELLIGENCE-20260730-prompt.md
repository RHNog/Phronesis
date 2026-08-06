# Engineer Work Order — Regional Vending And Arbitrage Intelligence

## Feature IDs

`PHR-ARCH-013`, `PHR-API-006`, `PHR-UX-013`, `PHR-WORKFLOW-007`

## Objective

Implement a fail-closed exact LigaMagic/TCGplayer identity bridge, regional evidence and explicit cost truth, offer-first Brazilian vending guidance, and two-way arbitrage candidate verification.

## Required Reading

- `docs/architecture/PHR-ARCH-013-cross-market-identity-bridge.md`
- `docs/api/PHR-API-006-regional-market-evidence.md`
- `docs/ux/PHR-UX-013-regional-vending-intelligence.md`
- `docs/workflows/PHR-WORKFLOW-007-arbitrage-verification.md`
- `docs/design/PHR-UX-013-regional-vending-intelligence.md`
- `docs/api/PHR-API-005-ligamagic-authenticated-export-snapshots.md`

## Ordered Slices

1. Crosswalk domain, server-only repository, reproducible build command, coverage evidence, and focused tests.
2. Regional evidence DTOs, FX/cost profiles, deterministic calculations, authorized APIs, and Settings controls.
3. Vendor Workspace regional evidence and pricing-intent presentation reusing the canonical purchase engine.
4. Ranked two-way arbitrage candidates, append-only availability verification, Opportunities UI, and integration validation.

## Constraints

- Do not enable or install the 03:00 LigaMagic schedule.
- Do not scrape marketplace pages or automate transactions.
- Treat Compra as consumer retail and Venda as dealer-buy benchmark.
- Never infer unknown cost as zero or call an unverified benchmark actionable.
- Quarantine Textless and every ambiguous cross-market identity.
- Preserve unrelated worktree and ignored local data.
- No public deployment, force push, or history rewriting.

## Testing Expectations

- Pure domain tests for identity and economic calculations.
- Repository migration/idempotency tests.
- Authorization tests for reads and mutations.
- UI integration tests for matched, incomplete, stale, and verified states.
- Full suite, standalone TypeScript, lint, production build, and diff hygiene at each checkpoint.

## Acceptance Criteria

- Exact regional evidence appears for a matched Vendor Workspace card.
- An owner can configure timestamped FX/cost assumptions without storing secrets.
- Candidate ranking is deterministic and truthfully gated.
- Availability verification can advance a costed candidate to actionable; benchmark data alone cannot.

## 2026-07-30 Presentation Amendment

- Preserve the four nullable direction-cost controls in Settings for later Product Owner population and label the deferred policy state explicitly.
- Rework the Opportunities Arbitrage surface into a responsive, net-first decision workspace with queue metrics, direction filters, candidate cards, visible blockers, evidence age, and a focused verification panel.
- Missing costs must remain a truthful blocker; this amendment does not authorize default assumptions, executable-availability fabrication, transactions, or public deployment.

## 2026-07-31 Catalogue And Targeting Amendment

- Pursue the closest defensible approach to complete LigaMagic/TCGplayer reconciliation; never manufacture coverage by fuzzy adoption, denominator manipulation, Textless reuse, or populated collector-number conflicts.
- Add a versioned missing-TCG-collector method only when exact/alias full-identity matching fails and normalized name + exact/accepted-alias edition + finish uniquely identifies a TCGplayer product whose collector number is blank.
- Preserve per-method counts, unresolved priced rows, ambiguity, quarantine counts, source lineage, and deterministic fingerprints. Rebuild the same source pair twice before acceptance.
- Model LigaMagic-specific catalogue conventions explicitly: documented treatment placement, Art/Stat and signature annotations, collector suffixes, mirrored variant shells, and source-to-target collisions. Preserve language and material edition qualifiers and never adopt a target twice.
- Add nullable direction-specific Settings targets for acquisition range, gross resale value, gross spread, net profit, profit margin, ROI, and evidence age, with currencies named in every monetary field.
- Make direction switching visibly reverse acquisition/exit roles and explain LigaMagic `Compra` (store retail) versus `Venda` (dealer-buy benchmark).
- Profit margin is net profit divided by gross proceeds; ROI is net profit divided by total cost. Target satisfaction never advances an evidence gate.

## 2026-07-31 Implementation Evidence

- The deterministic cascade now covers exact identity, evidence-derived edition aliases, unique blank TCGplayer collectors, pre-Exodus catalogue order, explicit historical/catalogue mappings, treatment placement on either edition or product name, physical Art Series/signature identity, one-letter collector suffixes, token face/collector identity, generic variants, and World Championship metadata.
- Pre-premium Foil, Art Series Foil, foil-only-treatment Normal, and `Textless` catalogue shells are quarantined before decision use; ambiguous results and target collisions are recorded but never adopted.
- Two full source-pair rebuilds produced 131,869 accepted mappings, zero duplicate TCGplayer targets, and byte-identical reports with fingerprint `8b96e2472cd3504d06a75bc475b158ef8bec5a722f2570b2bb33d133f8c22304`. Consumer-priced supported coverage is 83.04% and accepted-match price comparability is 98.44%.
- Route-specific target persistence, validation, calculations, API output, Settings controls, and visibly reversed Arbitrage cards are implemented. Product Owner values remain nullable.
- The 271-test suite, TypeScript, lint, production build, diff hygiene, and 390px responsive review pass; final Product Review remains pending.
