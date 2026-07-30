# PHR-TECH-009 Validation Record

Date: 2026-07-30
Verdict: **PASS — SLICE ACCEPTED**

## Outcome

- Supported behavioral suite: **204/204 passed**.
- Standalone TypeScript: **zero diagnostics**.
- `npm run lint`: passed with zero warnings.
- `npm run build`: passed, including the Next.js application TypeScript gate and all 17 static pages.
- `git diff --check`: passed.
- The supported full suite completes without live provider access; provider-dependent Market Intelligence cases use certified local JustTCG fixtures.

## Failure classification and disposition

The 17 established failures were classified before correction:

- **Production regressions (5):** one immutable-history failure, three field-scoped repository-refresh failures, and one `Nonfoil`/`foil` finish-token collision. The owning production boundaries were corrected.
- **Obsolete assertions (6):** three card-decision assertions, one collector-facing capability label, and two TCGplayer intelligence assertions encoded older thresholds or internal wording. Expectations now assert the current documented contracts.
- **Fixture drift (4):** identity normalization, market-evidence condition specificity, and two system-readiness cases used incomplete or economically impossible fixtures. Fixtures now make their intended contract explicit.
- **External dependency / replay drift (2):** Market Intelligence tests attempted provider replay with incomplete legacy identities. They now normalize certified local fixtures through the real JustTCG adapter.
- **Specification ambiguities left unresolved:** zero.

## Production corrections

- Returned and appended evaluation-history snapshots are recursively frozen, preserving the documented append-only immutable contract.
- Market refresh chooses providers from the evidence domains required by the requested fields, rather than requiring coverage for unrelated missing fields.
- Finish-token matching treats `Nonfoil` as distinct from `Foil`.

## Configuration correction

`allowImportingTsExtensions` is enabled under the repository's existing `noEmit` contract. This makes standalone TypeScript validation agree with the supported TypeScript test imports without enabling emitted JavaScript.

## Negative-effect declaration

This slice adds no login, persistence, tracking, alert, provider request, pricing formula, UI, deployment, credential, or external-account behavior. It does not alter catalogue snapshots, inventory, marketplace state, or the Pricing Update Tool.
