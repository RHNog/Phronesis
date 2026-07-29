# PHR-UX-007 — Mobile Pricing Lookup

## Status

Implemented with bounded pre-activation native disclosure re-resolution; awaiting fresh serialized Mac Worker validation and conformance (2026-07-28)

## Priority And Category

Critical. Product, UX, UI, database, import workflow, search, and technical architecture.

## Objective

Give Ramon one trustworthy phone lookup for deciding whether an offered English Pokémon single or sealed product is attractively priced, while stating missing, assumed, stale, and unavailable data explicitly.

## Background And Problem

TCGplayer browser lookup is slow on weak connections, excludes shipping from the headline comparison, requires mental arithmetic, and does not preserve snapshot movement. This is most harmful at the moment money is committed. Phronesis will consume the existing Pricing Tool catalogue export as a file contract; it will not extract from TCGplayer or modify that tool.

## Proposed Solution

Add a focused Decide-area price lookup backed by a unified product/condition row model. A strict, externally supplied schema contract maps an authoritative export into normalized rows. Imports are transactional and idempotent. SQLite stores product identity, latest condition state, category freshness, import receipts, and change-only snapshot history. Search returns printing-level results, condition-wide repricing, delivered-price components, history, and explicit uncertainty.

The repository does not contain the authoritative upstream schema. Therefore column names are not guessed. The importer requires a versioned contract file whose expected headers and semantic field mapping are supplied with the sanitized upstream export. Test fixtures may exercise the generic contract mechanism but are not production contracts.

## Functional Requirements

- One responsive web panel searches name, set, collector number, and sealed name.
- One import path and normalized row model serve singles and sealed products; `productType` distinguishes them.
- SKU is product identity and SKU plus condition is a priced row. Collector number is search-only.
- Strict header equality rejects missing, renamed, added, duplicated, or reordered columns before a transaction begins.
- Import receipts keyed by category, file hash, and contract version make identical files safe to re-run.
- A snapshot row is inserted only when market, listing, shipping, or delivered-price state differs from the latest stored state.
- Active categories, stale duration, assumed single shipping, and asking-price display threshold are configuration.
- English Pokémon is initially the only active category.
- Search preserves printing variants and separates relevant sealed products above singles without price ordering.
- Collector-number and single-specific queries suppress sealed results. Sealed results must clear a higher relevance threshold and are capped at two until expanded on small screens.
- Singles condition defaults to Lightly Played, controls all visible singles, and persists locally. Sealed products never have or inherit condition.
- Singles may use configured assumed shipping with an explicit label. Sealed delivered price is unavailable whenever exported shipping is absent.
- Missing selected-condition prices name, but do not substitute, the nearest priced grade.
- First observations say `No history yet`; later movement compares market price to the previous changed snapshot.
- Asking-price comparison is neutral: percentage at or above the configured threshold and absolute dollars below it.
- Result freshness is category-scoped and every priced result shows its snapshot date.
- Category-not-loaded, no-match-in-loaded-category, stale, partial-price, import-unavailable, and unexpected-error states use distinct wording.

## Non-Functional Requirements

- Optimize payload and layout for a narrow phone and weak connection; search is server-side and bounded.
- Repository boundaries isolate SQLite so durable hosted storage can replace it later.
- Imports are all-or-nothing and fail before mutation on contract mismatch or row validation failure.
- Search escapes wildcard input, limits results, and never interpolates values into SQL.
- UI supports semantic headings/lists, labelled controls, polite live regions, focus visibility, 44px targets, reduced motion, 200% zoom, and 400% reflow. Global Topbar controls used alongside the lookup retain an opaque cyan `:focus` outline and border so host or programmatic focus is visibly distinguishable even when `:focus-visible` is not exposed.
- Every result exposes one intelligible web semantic summary containing product type, exact printing identity, delivered-price state, listing/shipping breakdown, history, and snapshot date. The native evidence host exposes those facts as separately traversable VoiceOver content so a long combined card utterance cannot truncate the decision flow.
- At desktop browser zoom of 200% or greater, search and the Singles condition panel remain visible in normal document flow instead of independently sticking over result cards. Fresh 200% and 400% evidence must show every result's product type, name, and printing identity unobscured.
- Zoom reflow removes both field controls' sticky classes as well as their sticky computed positions, preventing evidence hosts and assistive tooling from treating either as an overlay after reflow.
- Because the serialized desktop Worker does not expose stable pointer or screen metrics for emulated zoom, its non-shipping evidence route accepts explicit `zoom=200` and `zoom=400` scenarios that select normal-flow field-control reflow. Ordinary phone evidence retains the approved sticky controls, while the product route uses measured browser zoom.
- The web lookup explicitly honors `prefers-reduced-motion: reduce` by minimizing animation and transition durations, and `prefers-contrast: more` by strengthening result boundaries and secondary copy. These source rules require fresh rendered Worker verification.
- Native Tab order remains authoritative; if a host exposes visible native controls but leaves focus unchanged after Tab, the lookup advances once in logical DOM order and renders an opaque focus indicator.
- No live pricing calls, recommendations, sold comps, fees, profit, inventory, watchlists, alerts, native app, accounts, or multi-marketplace behavior.

## Data Contract

The importer receives `(CSV file, schema contract, category configuration, snapshot date)`. The schema contract declares its version, exact ordered headers, and the header assigned to each normalized semantic field. Required semantics are SKU, product type, name, set name, variant, condition, language, market price, listing price, shipping, and snapshot date. Collector number and image URL are nullable semantics. The production contract remains unavailable until the Pricing Tool supplies an authoritative sanitized export and schema/version.

## Acceptance Criteria

The approved Product Brief acceptance criteria are normative. Deterministic tests must additionally prove strict pre-write schema rejection, duplicate-file idempotency, change-only history, market-price movement, sealed shipping rules, condition fallback semantics, search grouping/suppression, configurable categories, and asking-price threshold behavior.

## Dependencies And Constraints

- Required engineering input: representative sanitized Pricing Tool export plus authoritative schema/version.
- Locked dependencies were restored from local cache without network access. Relevant repository-local Next.js 16.2.10 guides were read and the production build passed.
- SQLite requires a deployment target with durable storage; deployment and provisioning are not authorized.
- Jarvis Mac Worker owns rendered, browser, accessibility, and device evidence. Engineer must not launch browsers or ad-hoc renderers.
- Serialized native evidence must run with system VoiceOver verified OFF immediately before and after each scenario. VoiceOver traversal may enable the service only inside its bounded scenario and must restore the OFF state even after interruption; the canonical bridge-v34 rerun uses finite 120-second default and 180-second maximum allowances.
- Compact-iPhone interaction evidence must scroll within the owning native `ScrollView` using a bounded coordinate gesture before operating the sealed expander. A convenience swipe that leaves the expander's frame unchanged is not valid interaction evidence.
- The Worker contract requires separate keyboard-operation, visible-focus, and contrast artifacts, each with a non-null diagnostic on pass or failure. Price Lookup disclosure summaries explicitly support Space-key operation in addition to their native Enter behavior. Price Lookup provides a scoped focus-visible fallback, including forced-colors behavior, for every native control; the top search input also carries an explicit opaque cyan outline/ring so selector matching alone cannot be treated as evidence.
- Web reduced-motion and increased-contrast each require a screenshot plus a distinct diagnostic report proving the matching browser media environment was enabled and recording computed behavior. The authoritative manifest must report reduced motion, increased contrast, and contrast against the web surface rather than citing native evidence.
- Web keyboard and focus capture must resolve the lookup field as `Search card, set, collector number, or sealed product` and the selector as `Singles condition`; both controls carry explicit accessible names so collectors may not substitute element tags, null names, or concatenated option text.
- Web reading-order capture is rooted at the labelled `Price lookup` region at `.pricing-lookup`. The Worker resolves its backend DOM node, captures the full accessibility tree on the same page-target session, and retains only that matching region plus descendants reachable through AX `childIds`. Development-runtime overlays, document ancestors, siblings, and raw `StaticText`/`InlineTextBox` duplicates are invalid evidence.
- Each 200% and 400% zoom diagnostic must serialize both controls' reflow markers, class lists, sticky-class booleans, computed positions, and bounds; non-empty visible product type/name/printing identity values and bounds; explicit per-control/per-identity intersections; and viewport, scroll-width, and overflow measurements. A screenshot or generic assertion alone is insufficient.
- Zoom diagnostics use repository-owned identity hooks keyed by SKU and an exact result schema. A pass is invalid when either control is null or non-unique, when no visible identity is captured, when any identity value or field bound is null/empty, or when either control lacks an explicit intersection result for every visible identity.
- After policy v20 again returned a diagnostic-free keyboard failure, the keyboard artifact contract was strengthened to require non-empty forward/reverse traversal traces, activation before/after states, and failure fields naming the control, key, observed states, and page URL. `No diagnostic`, null, and empty diagnostics are invalid evidence outcomes.
- Large-iPhone evidence requires distinct baseline and accessibility-environment runs; accessibility-extra-extra-extra-large Dynamic Type with increased contrast cannot stand in for the representative baseline layout.
- The iOS sealed disclosure exposes a full-width 44-point hit target, toggles between expanded and collapsed states, and uses a bounded, settled coordinate drag within its owning SwiftUI scroll view until the button is hittable across accessibility text sizes. Scrolling and expansion can each invalidate SwiftUI accessibility snapshots, so the UI test re-resolves the identified button immediately before activation and again while waiting for its expanded accessibility value and label; it reports the runtime hierarchy if scrolling or state propagation fails.
- The repository exposes a Webpack-pinned local Next.js evidence command, deterministic non-shipping web scenarios at `/price-lookup/evidence`, an executable non-shipping iOS app/UI-test host, and `tests/jarvis_runtime_evidence.py` as the machine-readable preflight contract. The contract includes a loopback readiness probe so the isolated Mac Worker waits for the route before capture. The web scenarios cover sealed-plus-singles, single-specific suppression, missing price, stale, and error states without writing fixtures to production storage.
- The evidence-only Next.js process disables its development indicator so framework chrome cannot obscure narrow-layout product controls or result text. Evidence fixtures keep category freshness and every visible result snapshot date internally coherent.
- The policy-v10 empty-capture result is preserved as a historical Worker target-contract discovery race. Later Worker policies accepted the safe target contract and reached both web and iOS surfaces. Policy v14 is rejected for internal evidence incoherence described in the validation plan; no alternate Phronesis render path is required unless a fresh current-policy generation supplies a new source-level diagnostic.

## UI / UX Direction

Follow the approved Designer Direction in `docs/design/PHR-UX-007-mobile-pricing-lookup.md`. The result hierarchy is freshness, relevant sealed results, sticky singles condition, then printing-level singles. Trust is conveyed through stable hierarchy and exact labels, not recommendation colors or confidence scores.

## Configurable Product Preferences

- Initial asking-price threshold: `$20.00`.
- Initial stale threshold: `7 days`.
- Initial assumed single shipping: `$1.27`.

These are bounded configuration defaults, not hard-coded business rules, and may be changed after field use.

## Traceability

- Origin: Approved Product Brief and Chief Architect Structure, Jarvis assignment `019fa79e-34a1-75e9-9516-99399a01cbcf`.
- Prompt: `docs/prompts/PHR-UX-007-implementation-prompt.md`.
- Design: `docs/design/PHR-UX-007-mobile-pricing-lookup.md`.
- Tests: `docs/testing/PHR-UX-007-mobile-pricing-lookup-validation.md`.
- Release notes: `docs/release-notes/PHR-UX-007.md`.
- Last modified: 2026-07-28.
- Modification reason: Disabled development chrome for the evidence-only runtime and made stale category/result snapshot dates coherent after authoritative rendered review found both defects.
