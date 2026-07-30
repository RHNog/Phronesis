# PHR-TECH-008 Engineer Prompt — Pokémon And Lorcana Event Readiness

## Project Context

Project Phronesis is the internal engineering initiative responsible for an evidence-driven collectible buying platform. Documentation is part of implementation.

## Feature ID

`PHR-TECH-008`

## Objective

Increase strict Pokémon thumbnail coverage and activate a current Lorcana catalogue with durable local artwork, without changing buying logic or mutating the Pricing Update Tool.

## Required Reading

- `docs/technical/PHR-TECH-008-pokemon-lorcana-event-readiness.md`
- `docs/api/PHR-API-002-cross-game-catalogue-artwork-providers.md`
- `docs/technical/PHR-TECH-006-event-snapshot-activation.md`
- `docs/technical/PHR-TECH-007-durable-local-artwork-cache.md`
- `docs/workflows/PHR-WORKFLOW-004-snapshot-powered-vendor-workspace.md`
- `node_modules/next/dist/docs/01-app/01-getting-started/15-route-handlers.md`
- `node_modules/next/dist/docs/01-app/01-getting-started/06-fetching-data.md`

## Implementation Requirements

1. Add a Pokémon-specific explicit alias registry and apply it symmetrically to snapshot and provider set labels.
2. Cover known TCGplayer/TCGdex set-label mismatches with positive and fail-closed tests.
3. Do not weaken collector-number, normalized-name, unique-printing, category, or ambiguity requirements.
4. Acquire a Lorcana-only TCGplayer catalogue through the existing authenticated export operation. Do not run hide, pricing, review, publish, or unhide workflows.
5. Retain the stable source in ignored Phronesis storage, record its hash/checkpoint, and import it as `lorcana-en` into the active review database.
6. Confirm Lorcana unified search, Lorcast artwork resolution, and same-origin durable cache behavior.
7. Return exact commands, file list, results, remaining limitations, and negative-effect declarations.

## Constraints

- Preserve unrelated work in both repositories.
- Do not modify, stage, commit, or push the dirty Pricing Update Tool repository.
- No Riftbound work.
- No store visibility, inventory, pricing, review, publication, schedule, credential, or account mutation.
- No provider-wide image crawl or speculative artwork matching.
- No new buying or intelligence engine.

## Expected Architecture

`PricingRepository` remains snapshot authority. `resolveSnapshotArtwork` owns strict catalogue-to-provider reconciliation. TCGdex and Lorcast remain identity/artwork providers only. `DurableArtworkCache` remains the sole image-byte retention boundary.

## Testing Expectations

- Focused resolver/provider/catalogue tests.
- Before/after runtime mapping counts for representative Pokémon and Lorcana queries.
- Supported full suite, lint, application build, standalone TypeScript classification, and diff checks.
- Desktop and 390px private review checks when runtime evidence is available.

## Documentation Updates

- Specification, validation, implementation report, conformance review, release note.
- Structure, Feature Registry, Prompt History, Atlas, Roadmaps, Sprint History, Agent Handoff, and conversation memory as applicable.

## Acceptance Criteria

All criteria in `PHR-TECH-008` pass with no product-behavior regression and no Pricing Update Tool mutation.

## Non-Goals

- Riftbound.
- Pricing Update Tool redesign or canonical adoption.
- Marketplace publication or store operations.
- Phronesis Intelligence dashboard implementation; that is the next separately tracked roadmap increment.

## Notes For AI Coding Agents

- Preserve unrelated user changes.
- Keep edits scoped to the specification.
- Present improvement suggestions separately from implementation.
