# PHR-ARCH-017 — Personal Market Providers And Cost Structure

## Feature ID

`PHR-ARCH-017`

Feature IDs are permanent and must not be changed after assignment.

## Title

Personal Market Providers And Cost Structure

## Status

Completed — Privately Live; Product Review Ready

## Priority

High

## Category

Architecture / Authentication / Authorization / Database / Settings / Market Intelligence / UX

## Objective

Give every active permanent Phronesis member a private `My settings` workspace where they choose available market-evidence providers and override their own direction-specific operating costs without requiring Administration access.

## Background

The existing `/settings` control center is intentionally Administration-gated and stores workspace-wide provider credentials, business profiles, regional economics, people access, and timed access. Normal approved users need personal operating preferences, not access to owner controls or secrets.

## Problem Statement

Non-admin users cannot configure which available evidence providers appear in their workflow or tailor cross-market cost assumptions. Broadening `/settings` would expose unrelated administration surfaces and weaken the module boundary.

## Proposed Solution

Create a separate `/user-settings` surface and `/api/user/settings` contract. Access requires a Better Auth identity with an active permanent workspace membership, independent of assigned product modules. Timed event-worker and compatibility identities do not receive persistent personal settings. Provider availability is described by a server-owned registry; all current providers are included by default. Personal cost fields are nullable overrides layered on top of the workspace regional profile, so `null` means `Use workspace default` rather than zero.

## Functional Requirements

- Add `My settings` to every signed-in permanent account menu.
- Keep Administration `Settings` separate and visible only with its existing module assignment.
- Require an active permanent membership for page and API reads/writes.
- Deny timed event-worker sessions, pending accounts, disabled memberships, and anonymous requests.
- Offer TCGplayer, LigaMagic, LigaPokémon, and PriceCharting as available providers; all are enabled by default in this release.
- Persist explicit user provider choices by workspace and user.
- Require at least one enabled provider.
- Persist nullable personal overrides for US→Brazil and Brazil→US fixed costs, percentage costs, acquisition ranges, gross targets, net targets, margin, ROI, and maximum evidence age.
- Merge personal overrides over the workspace profile for an effective cost structure while keeping official FX workspace-owned.
- Apply the effective personal cost structure to the signed-in user's regional arbitrage candidate and availability-verification reads.
- Apply provider visibility to Vendor Workspace evidence, history controls, and PriceCharting disclosure without changing catalogue identity.
- Record an audit event for personal settings changes without storing secrets.
- Keep all provider credentials and workspace-wide policy in Administration Settings.

## Non-Functional Requirements

### Performance

One indexed settings read returns the provider set and cost row. Vendor Workspace receives initial preferences from the server without a layout-blocking provider request.

### Scalability

Settings are keyed by workspace and user and can accept future entitlement/billing metadata in the provider registry.

### Maintainability

Active-member authorization, provider registry, persistence, effective-profile merging, API DTOs, and UI remain separate modules.

### Reliability

Additive migration preserves all memberships and workspace profiles. Invalid writes are rejected transactionally and leave prior settings unchanged.

### Accessibility

Provider toggles use labeled native checkboxes. Cost fields have associated labels, units/currencies, inherited-value help, errors, status regions, visible focus, and 44-pixel actions.

### Offline Support

Settings use the locally hosted authentication and pricing databases; no external provider is contacted.

### Security

- Personal settings never grant a module or provider credential.
- Page and API perform secure database-backed active-membership checks close to the data source.
- Users can read and mutate only their own workspace-scoped settings.
- Restricted-public permanent sessions may use `/user-settings`; Administration routes remain blocked.

### Extensibility

Future provider pricing/entitlements can mark a provider unavailable without changing stored user choices. Additional personal strategy defaults may be added under a versioned DTO.

### Responsiveness

The surface is a focused control center at 390 pixels and desktop widths, with no administration-style endless scrolling.

## User Stories

- As an approved user, I want to select the providers I use, so that my Vendor Workspace contains relevant evidence.
- As a buyer, I want my own costs and targets, so that regional opportunities reflect my operation rather than the owner's defaults.
- As an owner, I want personal settings separated from administration, so that users never gain credential or access-management powers.

## Acceptance Criteria

- Every active permanent member can open `My settings` even without `ADMINISTRATION`.
- A user can save provider choices and personal cost overrides and see them after reload.
- A user cannot read or change another user's settings.
- `null` cost fields inherit the current workspace value; zero remains an explicit zero only where valid.
- Vendor Workspace and regional arbitrage consume the signed-in user's effective preferences.
- Existing Administration Settings, membership authorization, public gateway protections, and timed-worker behavior remain green.

## Edge Cases

- A provider is later unavailable: retain the preference but do not expose unavailable evidence as active.
- All providers unchecked: reject the write with a clear error.
- Workspace defaults change: inherited fields immediately use the new values; explicit user overrides remain stable.
- A membership is disabled after settings exist: access fails closed; rows remain for possible audited reactivation.

## Dependencies

- `PHR-ARCH-011` application identity and module authorization.
- `PHR-ARCH-016` trusted account registration and active membership.
- `PHR-UX-029` Administration Settings control center.
- `PHR-UX-013` regional Vendor Workspace.

## Future Enhancements

- Provider subscription entitlements and per-provider pricing.
- Personal business-profile and buying-strategy defaults.
- Import/export of personal operating profiles.

## Technical Notes

Store provider choices and one personal cost-override row in the authorization database. Resolve the user from the Better Auth session, then verify an active membership in the authorization repository. Effective values are computed by overlaying non-null personal fields on the workspace `RegionalCostProfile`.

## UI / UX Notes

Use a short introduction, a provider card group, and one compact cost form grouped by direction. Show `Included for now` on every provider. Use `Use workspace default` placeholders and disclose the effective inherited value beside each field.

## Success Metrics

- Active non-admin users reach personal settings in one account-menu action.
- Zero personal-settings writes broaden module access or expose credentials.
- Provider/cost choices remain stable across desktop, phone, and restricted-public login.

## Open Questions

- Provider billing and entitlement packaging remain a future product decision.

## Traceability

- Originating prompt or work order: Product Owner request on 2026-08-07 for default User's Settings, provider selection, and personal Cost Structures.
- Related implementation prompt: `docs/prompts/PHR-ARCH-017-personal-market-settings-prompt.md`.
- Related tests: `tests/user-market-settings.test.ts`.
- Related release notes: `docs/release-notes/PHR-ARCH-017.md`.
- Last modified: 2026-08-07.
- Modification reason: record completed active-member personal settings, effective cost overlays, authorization boundaries, and private deployment.
