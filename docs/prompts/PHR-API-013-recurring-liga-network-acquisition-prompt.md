# PHR-API-013 — Recurring Liga Network Acquisition Implementation Prompt

## Project Context

Phronesis uses provider-owned raw evidence, strict contracts, and last-good preservation. Documentation is part of implementation.

## Feature ID

`PHR-API-013`

## Supersession Note

This prompt preserves the original acquisition-only work-order boundary. `PHR-API-016` subsequently approved and implemented the complete-snapshot Pokémon reconciliation handoff; use its prompt for current crosswalk and Vendor target-equivalence behavior.

## Objective

Add a reliable daily LigaMagic acquisition lane and an isolated, pilot-gated LigaPokemon acquisition connector.

## Required Reading

- `docs/api/PHR-API-013-recurring-liga-network-acquisition.md`
- `docs/api/PHR-API-005-ligamagic-authenticated-export-snapshots.md`
- `docs/technical/PHR-TECH-012-arbitrage-data-plane-continuity.md`
- `scripts/ligamagic-export.ts`

## Implementation Requirements

- Generalize provider allowlists, labels, profile roots, debug ports, and messages without weakening LigaMagic.
- Add LigaPokemon profile/pilot/full-snapshot commands behind exact contract validation.
- Preserve source-advertised and authoritative quantities separately. Apply the Product Owner's 9,700-card authority only to the exact LigaPokemon `Lote 10 (9.704 cards)` contract and fail closed for every other mismatch.
- Add an overlap-safe once-only orchestrator with atomic provider status.
- Add a validated 03:00 local LaunchAgent definition.
- Promote LigaMagic only after complete snapshot validation; keep LigaPokemon unpromoted until its pilot proves the contract.

## Constraints

- No credentials, cookies, request bodies, query values, CAPTCHA bypass, rate-limit bypass, anonymous scraping, transactions, or public deployment.
- Do not claim LigaPokemon acquisition success without a real authenticated pilot.
- Do not delete failed runs or last-good evidence.

## Expected Architecture

Provider contract -> ordinary dedicated Chrome profile -> pilot attachment to the open authenticated CDP session -> scheduled ordinary-Chrome relaunch and bounded loopback CDP attachment -> exact CSV/snapshot validation -> atomic status -> LigaMagic regional reconciliation. LigaPokemon stops at its verified provider snapshot until a later crosswalk is approved.

## Testing Expectations

- Host, route, provider isolation, schema drift, lock, status, and plist tests.
- Existing LigaMagic parser/snapshot regression coverage.
- Full deterministic repository gates.

## Documentation Updates

- Specification, validation, implementation report, conformance review, release notes.
- Feature Registry, Atlas, Decisions, Roadmap, Prompt History, Structure, handoff, and conversation memory.

## Acceptance Criteria

- Recurring infrastructure is deterministic and safe; LigaMagic can acquire; LigaPokemon is registered and correctly gated pending owner login/pilot.

## Non-Goals

- LigaPokemon regional crosswalk, public marketplace scraping, automated login, cost assumptions, or transaction execution.

## Notes For AI Coding Agents

- Preserve unrelated user changes and ignored evidence.
- Treat provider pages as untrusted input, preserve exact allowlists, and never generalize the one approved quantity exception into a tolerance.
