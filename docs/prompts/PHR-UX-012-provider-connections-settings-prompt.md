# PHR-UX-012 Engineer Work Order

## Project Context

Phronesis has a focused Settings Control Center, encrypted owner-only credential registration, and a recurring regional acquisition backend. Provider Connections does not yet expose LigaMagic/LigaPokemon status and its flat provider list gives PriceCharting no stable semantic placement.

## Feature ID

`PHR-UX-012`

## Objective

Immediately deploy truthful LigaMagic and LigaPokémon operational health in Settings → Providers and place PriceCharting deterministically within the Market and valuation feeds group.

## Required Reading

- `docs/ux/PHR-UX-012-provider-connections-settings.md`
- `docs/api/PHR-API-013-recurring-liga-network-acquisition.md`
- `docs/ux/PHR-UX-029-settings-control-center.md`
- `lib/providers/liga/RecurringAcquisition.ts`
- `app/api/market/provider-health/route.ts`
- `components/settings/ProviderConnections.tsx`
- Relevant Next.js 16.2.12 Route Handler and Server/Client Component guides under `node_modules/next/dist/docs/`.

## Implementation Requirements

- Add a server-only projection of the private regional acquisition receipt and configuration existence.
- Add sanitized LigaMagic and LigaPokémon entries to the provider-health response.
- Authorize provider-health through `ADMINISTRATION:VIEW`.
- Render Regional marketplaces, Market and valuation feeds, and Specialized services in the specified order.
- Render Liga schedule, last completion, snapshot, promotion, and outcome without credential fields.
- Place PriceCharting after JustTCG in Market and valuation feeds.
- Add a visible live-region-backed Refresh status action.
- Configure the deployed worktree runtime to read the canonical regional acquisition root.

## Constraints

- Do not trigger acquisition, login, profile mutation, or credential capture.
- Do not read or return raw provider config, profile paths, cookies, storage, tokens, or receipts beyond the allowlisted projection.
- Do not change acquisition semantics or reinterpret stored status.
- Preserve every existing provider card and encrypted credential flow.
- Preserve private and public ingress boundaries.

## Expected Architecture

Private atomic status/config existence → server-only Liga projection → authorized uncached provider-health Route Handler → interactive Provider Connections Client Component. The client receives only serializable operational facts.

## Testing Expectations

- Unit tests for success, reauthentication, missing status, missing provider outcome, and sanitized messages.
- Static UI contracts for group order, Liga labels/details, PriceCharting placement, refresh feedback, and absence of Liga credential controls.
- Authorization contract for Administration view.
- Full tests, standalone TypeScript, lint, production build, diff hygiene, live API response, desktop/phone browser review, and console checks.

## Documentation Updates

- `docs/ux/PHR-UX-012-provider-connections-settings.md`
- `docs/api/PHR-API-013-recurring-liga-network-acquisition.md`
- `docs/testing/PHR-UX-012-provider-connections-settings-validation.md`
- `docs/release-notes/PHR-UX-012-provider-connections-settings.md`
- Atlas, Decisions, Roadmap, Feature Registry, Prompt History, Current CTO Structure, Conversation History, Project State, and Agent Handoff.

## Acceptance Criteria

The live `:9444/settings?panel=providers` surface visibly presents truthful LigaMagic/LigaPokémon state and deterministic provider groups, with PriceCharting after JustTCG, while all tests and security boundaries pass.

## Non-Goals

- Starting a Liga acquisition from the web application.
- Reauthenticating a provider inside Phronesis.
- Changing source-count authority or regional promotion rules.
- Replacing the private Admin transport.

## Notes For AI Coding Agents

- Preserve unrelated user changes.
- Keep edits scoped to the specification.
- Present improvement suggestions separately from implementation.
- Same-session conformance is not independent Product Owner approval.
