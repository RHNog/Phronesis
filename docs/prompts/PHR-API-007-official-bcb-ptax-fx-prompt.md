# Engineer Work Order — Official BCB PTAX Exchange Rate

## Feature ID

`PHR-API-007`

## Objective

Replace manual regional FX entry with a resilient, automatically refreshed, official BCB PTAX closing-rate provider.

## Required Reading

- `docs/api/PHR-API-007-official-bcb-ptax-fx.md`
- `docs/api/PHR-API-006-regional-market-evidence.md`
- `docs/workflows/PHR-WORKFLOW-007-arbitrage-verification.md`

## Implementation Requirements

- Implement a server-only official PTAX adapter with fixed endpoint, timeout, schema validation, latest-close selection, and dependency injection for tests.
- Persist separate buy/sell quotes, official observation time, last successful retrieval, last attempt, and sanitized failure state.
- Refresh automatically on authorized profile and opportunity reads at most once per hour; add an authorized forced refresh action.
- Preserve last-good evidence on every upstream failure.
- Apply sell FX to US-to-Brazil and buy FX to Brazil-to-US calculations.
- Replace editable FX inputs in Settings with provenance-rich read-only evidence while retaining editable operating costs.
- Update documentation and verification evidence.

## Constraints

- Do not add a second scheduler, dependency, scraping path, credential, client-controlled URL, transaction, or marketplace mutation.
- Do not enable the LigaMagic 03:00 schedule.
- Do not silently fall back to zero, midpoint, or an unofficial provider.
- Preserve unrelated working-tree and product behavior.

## Expected Architecture

`BcbPtaxProvider` owns official transport and validation. `regional/server` owns refresh orchestration and throttling. `RegionalIntelligenceRepository` owns persistence. Domain calculation selects direction-specific rates. Route handlers remain the authorization boundary; Settings remains the control/evidence surface.

## Testing Expectations

- Provider parsing, latest selection, malformed-response rejection, timeout/failure behavior, and direction-specific calculations.
- Repository migration and last-good retention.
- Full supported suite, standalone TypeScript, lint, production build, and diff hygiene.
- Desktop and mobile Settings review plus runtime API verification.

## Documentation Updates

- Feature Registry, Prompt History, Roadmap, release notes, validation, implementation report, conformance review, Structure, and conversation history.

## Acceptance Criteria

- The official quote loads automatically, calculations use the correct side, failures are truthful and non-destructive, and all verification gates pass.

## Non-Goals

- FX trading, remittance execution, historical charting, commercial bank spread estimation, or LigaMagic scheduling.

## Notes For AI Coding Agents

- Preserve unrelated user changes.
- Keep edits scoped to the specification.
- Present improvement suggestions separately from implementation.
