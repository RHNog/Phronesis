# PHR-ARCH-010 Implementation Prompt

## Project Context

Phronesis is an evidence-driven decision intelligence platform for collectible markets. Documentation is part of implementation.

## Feature ID

`PHR-ARCH-010`

## Objective

Preserve Phronesis as the sole identity and restore the previously approved raster logo into the active application without changing domain behavior or rewriting history.

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
- Replace the generic framework favicon with Next.js application icon metadata derived from the same canonical local asset.

## Constraints

- Do not rewrite Git history, rename external remotes, or rebuild architecture.
- Do not modify generated dependency content.
- Do not redraw, recolor, infer, or fetch a substitute logo.
- Do not remove visible Phronesis text merely because the icon is present.

## Testing Expectations

- Run lint, type checking, relevant tests, and the identity scan.
- Verify the logo hash, rendered icon metadata, desktop/mobile shell adoption, production build, and private runtime.

## Documentation Updates

- Feature Registry, Decisions, Atlas, handoff, release note, validation record, changelog, and conversation ledger.

## Acceptance Criteria

- All criteria in `PHR-ARCH-010` pass.

## Non-Goals

- Commercial repositioning or architecture redesign.
