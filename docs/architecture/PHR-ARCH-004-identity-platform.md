# Identity Platform

## Feature ID

`PHR-ARCH-004`

## Title

Provider-Agnostic Identity Platform

## Status

Completed

## Priority

Critical

## Category

Architecture, Technical, API

## Objective

Make collectible identity a provider-agnostic orchestration platform used by the Universal Command Palette and all current and future workflows.

## Background

Platform v1.0 correctly separates identity from market evidence, but application routes still construct Scryfall directly. This makes provider choice an application concern and limits identity to Magic.

## Problem Statement

The platform cannot distinguish an empty result from a known game whose provider is pending, and adding a game would require editing UI or route code.

## Proposed Solution

Introduce an Identity Orchestrator, registry, capability model, provider contract, adapter contract, selection policy, canonical identity model, and diagnostics. Register operational Scryfall for Magic and pending adapters for Lorcana, Pokémon, One Piece, and Flesh and Blood. Application surfaces call only the orchestrator.

PHR-ARCH-007 supersedes the original flattened canonical record internally. Providers now map into Gameplay, Printing, Physical Variant, and Market Identity; `CardIdentity` remains a compatibility projection for existing workflows.

PHR-ARCH-009 owns collector-facing terminology. The Identity Platform and provider adapters emit canonical concepts and do not format Treatment, Finish, Market, or Condition labels.

## Functional Requirements

- Register identity providers by stable provider ID and supported games.
- Select by explicit game, parsed search context, recognized identity hints, then a documented Magic fallback.
- Execute only operational providers.
- Normalize every provider result into `CanonicalIdentityModel`.
- Include game, name, printings, collector number, language, finish, condition availability, artwork, provider identity, provider confidence, and canonical identity.
- Return explicit operational, no-match, pending, unconfigured, and offline outcomes.
- Expose selected provider, confidence, normalization source, canonical identity, fallback provider, latency, and capability diagnostics.
- Keep artwork under identity-provider ownership.
- Never request market data.

## Non-Functional Requirements

### Performance

Reuse provider caches, execute one selected provider today, and record provider/orchestration latency.

### Scalability

New games register a provider and adapter without UI changes.

### Maintainability

UI and application routes cannot import concrete identity providers.

### Reliability

Provider lifecycle status determines precise error behavior before execution.

### Accessibility

Status messages supplied to UI are concise and distinguish corrective actions.

### Offline Support

Offline identity repositories and replay adapters fit the registry later; they are not implemented in Epic 2.

### Security

Raw records remain diagnostics-only. Canonical normalized records cross production boundaries.

### Extensibility

Selection accepts game, search context, and future preference inputs.

### Responsiveness

No additional synchronous UI work is introduced.

## User Stories

- As a workflow, I request identity without knowing which provider owns a game.
- As a user, I receive operational Lorcana identities through Lorcast without provider-specific UI logic.
- As a developer, I inspect selection, normalization, capability, and latency.

## Acceptance Criteria

- Magic selects operational Scryfall.
- “Mox Opal” defaults to Magic and executes Scryfall.
- “Mulan” selects operational Lorcast and returns canonical Lorcana identities.
- Explicit Pokémon and One Piece queries select operational TCGdex and Bandai providers; Flesh and Blood reports its pending provider.
- API routes, Command Palette, Vendor Workspace page, and Identity Explorer do not construct Scryfall.
- No market API or market provider is referenced by the identity platform.

## Edge Cases

- Unknown selected games return provider-not-configured.
- Operational provider exceptions return temporarily-offline.
- Operational empty results return no-match.
- Ambiguous queries use the configured Magic fallback and disclose it in diagnostics.

## Dependencies

- Existing query, canonical, intent, printing, and Scryfall normalization engines.
- PHR-UX-002 Command Palette.
- PHR-UI-001 artwork system.

## Future Enhancements

- Connect approved Pokémon, One Piece, and Flesh and Blood providers.
- Add user provider preferences, multi-provider aggregation, repository identity index, and replay.

## Technical Notes

The orchestrator composes the existing `searchIdentityCardsWithDiagnostics` engine for operational providers. Existing Card/CardIdentity contracts remain compatible while canonical provider metadata is added at the orchestration boundary.

## UI / UX Notes

Unavailable-provider messaging replaces the generic empty state only when the registry knows the game and provider lifecycle state.

## Success Metrics

- Zero concrete-provider imports in application and feature UI layers.
- One registry entry per supported or planned game.
- Deterministic status for all five validation games.

## Open Questions

- Provider choices for non-Magic games remain pending approval and connection.

## Traceability

- Originating work order: Epic 2 Provider-Agnostic Identity Platform.
- Related implementation prompt: `docs/prompts/PHR-ARCH-004-implementation-prompt.md`.
- Related tests: `tests/identity-platform.test.ts`.
- Related release notes: `docs/release-notes/PHR-ARCH-004.md`.
- Last modified: 2026-07-09.
- Modification reason: PHR-API-001 made Lorcast operational for Lorcana.
