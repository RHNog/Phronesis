# PHR-UX-007 Implementation Prompt

## Objective

Implement the approved mobile Pricing Lookup as a focused Decide-area web surface using a strict file-contract importer, unified singles/sealed model, transactional idempotent change history, fast printing-level search, and explicit uncertainty states.

## Required Reading

- `docs/ux/PHR-UX-007-mobile-pricing-lookup.md`
- `docs/design/PHR-UX-007-mobile-pricing-lookup.md`
- `.agents/roles/engineer.md`
- `docs/DOCUMENTATION_FIRST_DEVELOPMENT.md`
- Relevant guides under `node_modules/next/dist/docs/` after locked dependencies are restored.

## Implementation Requirements

- Add configurable active categories and display/freshness defaults.
- Add normalized import types, strict schema-contract validation, CSV decoding, row validation, and category guards without inferred upstream column names.
- Add SQLite schema and repository boundaries for import receipts, products, latest prices, category freshness, FTS search, and change-only snapshots.
- Add server search/detail/import boundaries without live marketplace calls.
- Add responsive, accessible lookup UI with sealed grouping, persistent list-wide condition, missing-price alternatives, delivered breakdown, market movement, freshness, and asking-price spread.
- Add deterministic domain/import/repository/search tests.
- Update traceability documentation and report the missing real schema and runtime visual evidence honestly.

## Constraints

- Do not change the Pricing Tool or implement extraction.
- Do not guess authoritative export headers.
- Do not deploy, install dependencies, access credentials, mutate external services, commit, launch browsers, or create visual evidence.
- Do not add recommendations, profit/fee logic, sold comps, alerts, inventory, accounts, or other non-goals.

## Expected Architecture

`CSV + external schema contract -> strict normalization -> transactional PricingRepository -> bounded search/read model -> API/server boundary -> mobile PricingLookup UI`. SQLite and FTS5 remain behind the repository. UI consumes normalized view models only.

## Testing Expectations

- Test contract drift before writes, invalid rows and rollback, same-file re-run, unchanged second import, changed second import, market movement, sealed shipping, missing condition, grouping and relevance, category configuration, and spread format.
- Run focused Node tests, supported repository suite, lint, typecheck, and build when installed dependencies permit.
- Run deterministic Python evidence-contract tests and validate completed Worker output with `npm run evidence:validate -- <generation-directory>`; never repair a rejected generation in place or reuse it.
- Leave all Mac Worker evidence checks unclaimed until runtime evidence exists.
- Disable the Next.js development indicator only for the isolated evidence runtime, and assert that stale fixtures use the same snapshot date for category freshness and every visible priced result.
- For compact-iPhone sealed-expansion evidence, use a bounded coordinate drag inside the owning native `ScrollView`; reject a run where the expander never becomes hittable or the gesture does not move content. After activation, re-resolve the identified disclosure while waiting for `Show fewer sealed products` and `expanded`, because insertion of the third card repositions the SwiftUI element.

## Acceptance And Non-Goals

The Product Brief and `docs/ux/PHR-UX-007-mobile-pricing-lookup.md` are normative. No deployment, hosted persistence decision, real export certification, or visual conformance approval is part of this Engineer patch.
