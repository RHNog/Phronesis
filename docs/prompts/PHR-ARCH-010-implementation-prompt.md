# PHR-ARCH-010 Implementation Prompt

## Project Context

Phronesis is an evidence-driven decision intelligence platform for collectible markets. Documentation is part of implementation.

## Feature ID

`PHR-ARCH-010`

## Objective

Preserve Phronesis as the sole identity, retain the full recovered raster logo in application chrome, and adopt the Product Owner-supplied dedicated mark for browser favicon and iOS application-icon metadata without changing domain behavior or rewriting history.

## Required Reading

- `docs/architecture/PHR-ARCH-010-phronesis-product-identity.md`
- `docs/DOCUMENTATION_FIRST_DEVELOPMENT.md`
- Relevant local Next.js documentation under `node_modules/next/dist/docs/`

## Implementation Requirements

- Update UI, package metadata, provider user agents, browser storage, Atlas, and documentation.
- Verify a case-insensitive content search has no retired-name matches.
- Preserve unrelated changes and application behavior.
- Copy the exact Product Owner raster into a stable `public/brand/` path and verify its recorded SHA-256.
- Use the recovered asset in desktop and mobile shell identity while keeping readable text and accessible navigation labels.
- Preserve `public/brand/phronesis-logo.png` and its desktop/mobile shell usage unchanged.
- Convert the supplied 1254×1254 JPEG application mark deterministically into a canonical repository PNG.
- Replace the generated icon routes with static Next.js metadata assets: 512×512 `app/icon.png`, 180×180 `app/apple-icon.png`, and 32×32 `app/favicon.ico`.
- Record and test source, canonical, and derived asset hashes, formats, and dimensions.

## Constraints

- Do not rewrite Git history, rename external remotes, or rebuild architecture.
- Do not modify generated dependency content.
- Do not redraw, recolor, infer, generatively alter, or fetch a substitute logo or app icon.
- Do not remove visible Phronesis text merely because the icon is present.

## Testing Expectations

- Run lint, type checking, relevant tests, and the identity scan.
- Verify the full-logo hash, dedicated-icon hashes/dimensions, rendered icon metadata, desktop/mobile shell separation, production build, and private runtime when deployment is authorized.

## Documentation Updates

- Feature Registry, Decisions, Atlas, handoff, release note, validation record, changelog, and conversation ledger.

## Acceptance Criteria

- All criteria in `PHR-ARCH-010` pass.

## Non-Goals

- Commercial repositioning, shell-logo replacement, generative artwork changes, or architecture redesign.
