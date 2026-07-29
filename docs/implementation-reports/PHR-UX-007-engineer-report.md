# PHR-UX-007 Engineer Implementation Report

## Evidence-contract repair

Designer review demonstrated that schema declarations alone did not prevent a Worker pass with count-only zoom diagnostics and an unpruned raw accessibility sequence. Engineering added executable completed-generation validation, a package command, and sanitized unit coverage. The preserved current generation was not edited and fails with 21 specific contract errors. Fresh serialized Worker evidence remains required.

## Compact-iPhone Sealed-Expansion Gesture Repair

The latest authority-receipted generation passed web semantics and genuine VoiceOver output but failed the compact native suite at `testSealedExpansion`. Its log showed the expander below the viewport at approximately y=904, an accessibility frame only 20 points high, and eight 0.08-second coordinate gestures that left the scroll indicator at 0%. Engineering made the expander label itself a full-width 44-point hit target and strengthened the bounded owning-`ScrollView` gesture to re-resolve safe interior coordinates and hold for 0.2 seconds so SwiftUI recognizes a drag rather than a tap on card content. The test still requires the expander to become hittable before activation. Product pricing behavior and evidence content are unchanged. Fresh serialized Mac Worker execution remains required; no native runtime pass is inferred from source inspection.

## Decision-Critical Semantic Remediation

The current authority-receipted generation proved execution but not the full spoken result flow. Engineering added explicit web result summaries for product type, full printing identity, delivered/listing/shipping state, history, and snapshot date. The native evidence host now exposes card facts as contained children instead of one combined truncation-prone utterance, and the VoiceOver UI test traverses up to 64 steps and asserts the complete decision flow. The Worker target contract requires both complete web result summaries and genuine non-truncated native utterances. Deterministic repository checks pass; runtime semantics remain unclaimed pending a fresh Worker generation.

## Universal Web Accessibility-Probe Recovery

Fresh Worker feedback showed that the universal web probe still emitted an empty web reading order. The repository contract had diverged from the executor by requiring `Accessibility.queryAXTree` while the Worker owns a page-target `Accessibility.getFullAXTree` probe, and the lookup root was a generic container that did not itself have an accessibility-tree identity.

Engineering now exposes `.pricing-lookup` as a labelled `Price lookup` region and aligns the handoff with the universal probe. The Worker must resolve that exact DOM element to a backend node, capture the full tree on the same page-target session, locate the region by matching `backendDOMNodeId`, and retain only the region plus descendants reachable through accessibility `childIds`. Missing region identity, empty descendants, document ancestors, siblings, and unrelated runtime nodes all invalidate the result. Product pricing behavior is unchanged. Deterministic checks can establish only target readiness; a fresh serialized Worker generation remains required for web screen-reader conformance.

Post-repair verification: focused pricing tests passed 11/11; runtime-target preflight, changed-source ESLint, scoped `git diff --check`, and the Next.js 16.2.10 Webpack production build passed. The supported full suite reproduced the established baseline at 153 pass/17 fail. Standalone TypeScript reproduced the established 27 `TS5097` test-import configuration errors. Repository-wide lint reproduced the preserved generated `.next-evidence` baseline at 135 errors/1,555 warnings; changed sources lint cleanly. Engineering did not launch a browser, simulator, native target, or renderer.

## Scoped Accessibility Query Recovery

The fresh Worker generation after the policy-v31 contract repair reached the lookup and passed visual, keyboard, focus, contrast, zoom, reduced-motion, increased-contrast, and native VoiceOver probes, but its web accessibility artifacts were empty. The raw artifact reported `Accessibility.getFullAXTree`, `reading_order: []`, and `named_nodes: 0`. The repository contract itself also contained an impossible requirement: `Accessibility.getPartialAXTree` with `fetchRelatives=false` cannot return the complete descendant subtree that the pass criteria require.

Engineering replaced that instruction with a page-target-scoped `Accessibility.queryAXTree` call rooted at the unique `.pricing-lookup` backend node and without accessible-name or role filters. The contract now requires `Accessibility.enable`, DOM resolution, and the query to share the navigation session; reconstructs order from AX parent/child relationships; records session and query provenance; and rejects zero returned nodes. Full and partial tree APIs are forbidden for this capture. No pricing markup or customer behavior changed. The failed authority-receipted evidence remains unchanged, and a fresh serialized Mac Worker generation is still required before runtime conformance can resume.

## Scoped Web Semantic Capture Repair

Designer review proved that the current web screen-reader artifact was captured from `Accessibility.getFullAXTree` despite the declared `.pricing-lookup` root. Engineering strengthened the repository-owned Worker contract with an executable scoped-capture algorithm: resolve exactly one rendered lookup root after hydration, obtain its backend node, query the accessibility subtree on the page-target session, serialize root provenance, and require the `Price lookup` heading as the first derived spoken node. Deterministic tests reject global capture and missing or ambiguous root metadata. Product markup and behavior are unchanged, rejected v31 artifacts were not modified, and runtime conformance remains unclaimed pending a fresh serialized Worker generation and matching authority receipt.

## Policy-v31 Evidence-Contract Repair

Designer conformance accepted the authority receipt and all 92 artifact hashes but rejected the evidence content. The 200%/400% diagnostics omitted mandated reflow, class, position, identity, and intersection measurements; the web spoken sequence included Next.js Dev Tools and duplicated raw text descendants; and keyboard/focus capture assigned inconsistent names to the search and condition controls. Engineering added explicit accessible names without changing behavior and made every missing measurement, clean-reading-order constraint, and exact control name part of the machine-readable Worker contract. Rejected artifacts remain unchanged. Repository verification cannot establish runtime conformance; a fresh authority-receipted serialized Mac Worker generation is still mandatory.

The latest mandatory repair closes the remaining zoom-contract ambiguity demonstrated by policy v31. Rendered result identities now expose stable SKU and identity-value probes, and the Worker handoff defines exact non-null control records, non-empty identities with whole-result and per-field bounds, and two explicit control-intersection records per identity. A pass is rejected when selectors, values, bounds, or intersection pairs are missing; zero aggregate counts alone are no longer accepted. Fresh serialized evidence remains required and no runtime pass is claimed from source inspection.

Post-repair verification: focused pricing tests passed 11/11; runtime-target preflight, changed-source ESLint, `git diff --check`, and the Next.js 16.2.10 Webpack production build passed. The supported full suite reproduced the established baseline at 153 pass/17 fail. Standalone TypeScript reproduced the established 27 `TS5097` test-import configuration errors and no changed-source error. Engineering did not launch a browser, simulator, native target, or renderer.

Verification after this repair: focused pricing tests passed 11/11; runtime-target preflight, scoped ESLint, `git diff --check`, and the Next.js 16.2.10 production build passed. The supported full suite passed 153 tests and reproduced the established 17 unrelated baseline failures. Repository-wide lint reproduced the generated `.next-evidence` baseline (135 errors and 1,555 warnings), while changed-source lint passed. Standalone TypeScript reproduced the established 27 `TS5097` test-import errors and no changed-source error.

## Current zoom contract

Fresh policy-v31 rendered evidence supersedes the historical sticky-search assumption below: ordinary phone layouts keep both field controls sticky, while 200% and 400% desktop zoom place both search and the Singles condition panel in normal document flow. The implementation, deterministic tests, and Worker preflight now enforce this distinction. Fresh serialized Mac Worker evidence remains required to prove that neither control obscures decision content at runtime.

The mandatory repair is structural as well as visual. During browser-detected or explicit evidence-route zoom reflow, React removes sticky utility classes from both field controls and exposes separate search/condition reflow markers; CSS retains a pre-hydration fine-pointer fallback. The Worker contract now requires both markers, both computed positions to be static, both sticky-class checks to be false, zero field-control/result-identity intersections, and zero horizontal overflow at both zoom levels.

Verification: focused PHR-UX-007 tests passed 10/10; runtime-target preflight passed with zero errors; scoped ESLint and `git diff --check` passed; and the supported Webpack production build passed. The supported full suite reproduced the established 152-pass/17-failure baseline, standalone TypeScript reproduced the established 27 `TS5097` test-import errors, and the default Turbopack build reproduced the restricted-host port-bind failure before the supported Webpack build succeeded. No browser or renderer was launched. Verdict: `READY FOR CONFORMANCE`; production import certification and runtime zoom acceptance remain blocked on their separately documented external evidence inputs.

## 2026-07-28 Mandatory Zoom Remediation

Fresh review required another bounded repair for failed 200% and 400% zoom evidence. Engineering reconciled the rendered contract with the normative Designer Direction: only the Singles condition panel enters normal flow at zoom, while search remains sticky. CSS no longer selects the search panel in browser, evidence-scenario, or narrow fine-pointer reflow rules. The machine-readable Worker contract now requires computed `position: sticky` for search alongside static/non-sticky condition state, zero result-identity intersections, and zero horizontal overflow.

Verification: focused pricing tests 10/10; preflight pass; scoped repository lint pass; production build pass; `git diff --check` pass. The full suite reproduced 152 pass/17 established unrelated failures. Standalone TypeScript reproduced the established 27 `TS5097` test-import errors. Unscoped lint failed only after traversing preserved generated `.next-evidence` output. No browser or renderer was launched, so zoom conformance remains blocked on fresh serialized Mac Worker evidence.

## Explicit Zoom-Evidence Routing Remediation

The fine-pointer fallback from the first zoom repair was still dependent on Worker emulation and also returned the search panel to normal flow. Engineering replaced that fallback with explicit `zoom=200` and `zoom=400` URLs on the non-shipping evidence route. Those scenarios force only the Singles condition panel into normal flow; search remains sticky, ordinary phone evidence keeps the sticky condition interaction, and the product route retains measured browser-zoom detection.

Verification: pricing tests passed 10/10; runtime target preflight passed; scoped ESLint passed; production build passed. The full repository suite remains at its established 152 pass / 17 fail baseline. Standalone TypeScript remains at 27 established `TS5097` errors. Unscoped lint still traverses preserved `.next-evidence` generated output and reports 135 errors / 1,555 warnings there. Runtime zoom conformance is not claimed until the serialized Mac Worker produces a fresh coherent generation.

## Browser-Zoom Sticky-Overlap Remediation

Fresh Designer review accepted the v27 evidence generation's authority and hashes but rejected the rendered 200% and 400% zoom surfaces: the independently sticky Singles condition panel covered the first result's product-type label, name, and printing identity. Engineering preserved those rejected artifacts and added a bounded desktop-browser-zoom reflow mode. Normal phone and unzoomed responsive layouts retain the sticky selector; when both browser pixel density and the screen-to-CSS-viewport ratio indicate zoom, the condition panel returns to normal document flow so it cannot cover result identity. The target contract now requires distinct 200% and 400% screenshots and diagnostics that verify unobscured identity content rather than horizontal overflow alone. Runtime conformance remains unclaimed until the serialized Mac Worker produces a fresh coherent generation.

The remediation handoff now also exposes stable probe hooks for the condition panel, product type, product name, and printing identity. Both zoom diagnostics must report computed normal-flow positioning, zero panel/identity intersections, zero horizontal overflow, and visible non-empty identity fields; a screenshot or source-marker-only result is insufficient.

Post-repair deterministic verification: focused PHR-UX-007 tests pass 10/10; runtime-target preflight passes; targeted ESLint and `git diff --check` pass; and the Next.js 16.2.10 production build passes. The supported full suite remains at its documented 17-failure baseline (152 pass), while standalone TypeScript retains only the documented 27 `TS5097` test-import configuration errors. Repository-wide lint retains its generated `.next-evidence` contamination baseline (135 errors and 1,555 warnings); the changed TypeScript sources lint cleanly. No browser, simulator, or renderer was launched.

## 2026-07-28 Policy-v26 Web Environment Remediation

Fresh review accepted the v26 generation's identity, hashes, and artifact inventory but rejected web reduced-motion and increased-contrast conformance. The manifest cited native evidence for those results, the web environment screenshots had no behavioral diagnostics and were byte-identical to the zoom capture, and contrast was not attributed to the web surface. Engineering added scoped `prefers-reduced-motion: reduce` and `prefers-contrast: more` behavior, then strengthened the target contract to require separate web JSON diagnostics plus screenshots and explicit web-scoped manifest results for reduced motion, increased contrast, and contrast. The focused suite now passes 9/9 and target preflight passes. Existing evidence was not modified; fresh serialized Worker evidence and a matching authority receipt remain required.

Post-repair verification: `git diff --check` passed; focused tests passed 9/9; preflight passed; scoped ESLint returned zero errors (CSS and Python are outside its configured file set); the production build passed compilation, framework type checking, static generation, and both pricing routes. The supported full suite is 151 pass/17 established failures, adding the new passing regression guard to the prior 150/17 baseline. Standalone TypeScript retains exactly the established 27 `TS5097` errors. Unscoped lint retains the documented generated `.next-evidence` contamination at 135 errors and 1,555 warnings.

## Fresh Host Tab-Completion Remediation

Fresh serialized host evidence declared 18 native controls but observed no forward or reverse Tab targets, leaving visible-focus validation with no reachable control. The existing unchanged-focus fallback advanced from a zero-delay timer after `keydown`; a serialized runner could inspect focus before that callback executed. Engineering retained native browser traversal as authoritative, recorded the pre-Tab element on `keydown`, and now completes the unchanged-focus check synchronously on `keyup`, with a short timer only as a missing-keyup safeguard. The existing opaque cyan `:focus` and `:focus-visible` indicator remains unchanged and becomes inspectable once traversal reaches a control. Repository preflight now guards the keyup completion path. Runtime keyboard and focus conformance remains unclaimed until a fresh internally coherent serialized Mac Worker generation executes this patch.

Post-repair deterministic evidence: focused pricing/navigation tests passed 11/11; runtime-target preflight passed; scoped ESLint passed; and the Next.js production build passed, including framework TypeScript validation. The full suite reproduced the documented 150-pass/17-failure baseline. Standalone TypeScript reproduced the documented 27 `TS5097` errors in test imports. No browser, simulator, deployment, external mutation, dependency installation, commit, or publication occurred.

## Fresh Host Zero-Reachable-Control Remediation

The latest serialized host artifact declared 18 visible native controls but recorded empty forward and reverse traversal arrays. Its visible-focus check consequently had no reachable control to inspect. Engineering added a bounded document-level fallback that observes Tab without preventing it, waits for the browser's native focus action, and advances once in logical DOM order only when `document.activeElement` remains unchanged. Normal native traversal is preserved. Price Lookup's opaque cyan focus treatment now applies to `:focus` as well as `:focus-visible`, with the existing forced-colors override, and repository preflight guards both repair markers.

Post-repair deterministic evidence: focused pricing tests passed 8/8; runtime-target preflight passed; changed TypeScript source lint passed; the production build passed including framework TypeScript validation; and the full suite reproduced the documented 150-pass/17-failure baseline. Standalone TypeScript reproduced the documented 27 `TS5097` errors. Repository-wide lint and unscoped `git diff --check` remain contaminated by preserved generated `.next-evidence` files, while scoped changed-source checks pass. Runtime keyboard and focus conformance remains unclaimed until a fresh serialized Mac Worker generation executes this patch.

## Fresh Host Accessibility-Audit Target Remediation

The preserved per-test diagnostics identify the repeated `testNamedControlsAndRuntimeAccessibility` failure as accessibility-audit error `-902 Invalid target app`. The test previously performed bounded swipes to discover off-screen named controls before asking XCTest to audit the application. The audit now runs immediately after the launched search field proves the application is ready and foregrounded; off-screen control discovery follows afterward. This keeps the audit attached to the stable launch target while preserving the named-control assertions. Product UI and pricing behavior are unchanged. Runtime conformance remains unclaimed until the serialized Mac Worker executes a fresh generation.

## Fresh Host Sealed-Expansion Scroll Remediation

Fresh host evidence showed `testSealedExpansion` still failing at the pre-tap hittability assertion across Dynamic Type, increased-contrast, reduced-motion, screen-reader, and native runtime runs. The test was sending swipe gestures to the entire application even though the expander lives inside a SwiftUI `ScrollView`. The bounded repair targets that owning scroll view with slow, settled swipes and includes the runtime hierarchy in the assertion diagnostic if the control still cannot become hittable. Product UI and pricing behavior are unchanged. Runtime conformance remains unclaimed until the serialized Mac Worker executes a fresh generation.

Post-repair checks: runtime-target preflight passed; focused pricing/navigation tests passed 11/11; targeted changed-source ESLint and the scoped diff check passed; the Next.js 16.2.10 production build passed. The full suite reproduced its documented 150-pass/17-failure baseline, standalone TypeScript reproduced the documented 27 `TS5097` errors, and repository-wide lint reproduced generated `.next-evidence` contamination at 135 errors and 1,555 warnings. No PHR-UX-007 deterministic regression was found.

## Policy-v20 Keyboard Diagnostic Remediation

Fresh host evidence reported `keyboard_operation: fail` with `no diagnostic`. Focused deterministic product checks remained green, and the host result supplied no product-level failure trace to justify changing lookup behavior. Engineering therefore repaired the machine-readable Worker handoff: the keyboard artifact now has an explicit result schema requiring forward/reverse tab-order traces, per-control activation records with before/after state, and a non-empty diagnostic on pass or failure. Failures must identify the control, key, observed states, and page URL; empty, null, and `no diagnostic` values are rejected. Runtime keyboard conformance remains unclaimed pending a fresh serialized generation.

## 2026-07-28 Policy-v19 Bounded Remediation

Fresh serialized host evidence identified six command-palette labels at a 4.12:1 contrast ratio and reported that Space did not operate Price Lookup disclosure summaries. The affected command-palette labels now use `text-zinc-400`, and Price Lookup summaries explicitly toggle their owning disclosure on Space while preserving native Enter behavior. The runtime target contract now requires non-null diagnostics for contrast, keyboard operation, and visible focus, preventing another bare `no diagnostic` result from qualifying as conformance evidence.

Focused pricing tests (8/8), changed-source lint, runtime-target preflight, and the production build pass. The supported full suite retains its existing 150-pass/17-failure baseline; standalone TypeScript retains the existing 27 `TS5097` errors. Repository-wide lint is presently polluted by the preserved `.next-evidence` Worker output (135 errors and 1,555 warnings), while direct lint of both changed TypeScript source files passes. Runtime contrast and keyboard conformance remain unclaimed pending a fresh serialized Mac Worker generation.

Date: 2026-07-28
Assignment: `019fa79e-34a1-75e9-9516-99399a01cbcf`
Verdict: `READY FOR CHIEF ARCHITECT AND DESIGNER CONFORMANCE REVIEW`

## Zoom Selector Regression Repair

The current focused test reproduced one source-level regression before runtime
capture: all high-zoom CSS paths placed both the search panel and the Singles
condition panel in normal flow, despite the approved direction requiring search
to remain sticky. The repair narrows browser-detected, explicit evidence-route,
and fine-pointer fallback selectors to the condition panel alone. Repository
preflight now rejects either zoom attribute if it is broadened back to the search
panel. This deterministic repair does not establish rendered 200% or 400%
conformance; a fresh serialized Mac Worker generation remains mandatory.

## Structural Zoom-Reflow Remediation

Fresh 200% and 400% diagnostics confirmed zero horizontal overflow but classified the Singles condition panel as a sticky overlay intersecting the heading and first result. Zoom reflow now removes the sticky class from the rendered panel instead of relying only on a CSS position override. Ordinary phone layouts retain the sticky selector, and search remains sticky in every mode. The Worker contract requires the active reflow attribute, no sticky class, static computed position, zero identity intersections, and zero overflow.

Verification: focused PHR-UX-007 tests passed 10/10; runtime-target preflight passed; changed TypeScript lint passed; Webpack production build passed; and `git diff --check` passed. The supported full suite reproduced its documented baseline at 152 pass/17 fail. Standalone TypeScript reproduced the documented 27 `TS5097` errors. Repository-wide lint is polluted by preserved generated `.next-evidence` output (135 errors/1,555 warnings), while changed-source lint has no errors. Default Turbopack build remains unavailable in the restricted host because it attempts a prohibited local port bind. Fresh serialized Worker evidence is still required; no runtime zoom pass is claimed.

## Fresh Host 200% And 400% Zoom Remediation

The latest serialized host diagnostics reported no horizontal overflow at either zoom level: viewport and scroll widths matched and the offender lists were empty. Every failure instead named an intersection between the sticky Singles condition panel and the Singles heading or first card identity. The prior script-only zoom detector was false in the Worker's 640px and 320px desktop viewport captures. Engineering added a pre-hydration CSS fallback that places the condition panel in normal flow for narrow fine-pointer desktop contexts while retaining sticky behavior for coarse-pointer phone browsers; product and printing identity containers now also shrink and wrap defensively. The target contract declares the expected desktop fine-pointer environments, and deterministic source/preflight checks guard both obscuration and overflow. The rejected runtime artifacts remain historical diagnostics; rendered zoom conformance is unclaimed pending a fresh serialized generation.

Post-repair verification: focused pricing/navigation tests passed 13/13; runtime-target preflight passed with zero errors; changed TypeScript source lint passed; and the Next.js 16.2.10 production build passed, including framework TypeScript validation. The supported full suite passed 152 tests and reproduced the same 17 documented unrelated behavioral failures. Standalone TypeScript reproduced the documented 27 `TS5097` test-import errors. Repository-wide lint reproduced the preserved generated `.next-evidence` baseline at 135 errors and 1,555 warnings; no changed source file contributed an ESLint error. No browser, simulator, renderer, deployment, external mutation, network installation, commit, or publication occurred.

## Product Outcome

Implemented a phone-first Decide-area Pricing Lookup at `/price-lookup`. It consumes only an externally supplied, versioned Pricing Tool file contract; production import refuses test-only schemas and never guesses upstream headers. One normalized row model handles singles and sealed products. SQLite stores category state, products, current prices, import receipts, FTS5 search data, and change-only history. The UI groups relevant sealed results above singles, suppresses sealed for clearly single-specific queries, persists one list-wide singles condition, exposes the full grade ladder, distinguishes absent selected-condition prices, shows delivered-price components and assumptions, reports market-price movement and category freshness, and compares optional asking prices neutrally.

The Vendor Workspace links to the new panel. With no authoritative import, the page deliberately reports that English Pokémon has no snapshot rather than presenting fixtures or fabricated prices.

## Implementation Evidence

- `npm ci --offline --ignore-scripts` — exit 0; restored 358 locked packages from local cache, no network access, 0 reported vulnerabilities.
- Read installed Next.js 16.2.10 App Router guides for pages/layouts, navigation, server/client components, data fetching, route handlers, route convention, and Node runtime.
- `node --import ./tests/register-test-hooks.mjs --test tests/pricing-lookup.test.ts` — exit 0; 8 pass, 0 fail.
- `npm run lint` — exit 0.
- `npm run build` — exit 0; compilation, framework TypeScript, static generation, `/price-lookup`, and `/api/pricing/search` passed.
- `npm test` — exit 1; 150 pass and the same documented 17 behavioral baseline failures. All 8 PHR-UX-007 tests pass in the full run.
- `npx tsc --noEmit` — exit 2; only the documented 27 existing `TS5097` test-import errors remain. No PHR-UX-007 file appears in the final error list.
- `git diff --check` — exit 0.
- `python3 tests/jarvis_runtime_evidence.py --preflight` — exit 0; reports the local `/price-lookup` web entry point, required 320/768/1200/1440 capture widths, executable Xcode application target, shared scheme, UI-test target, and named UI tests.
- `node --import ./tests/register-test-hooks.mjs --test tests/pricing-lookup.test.ts tests/application-navigation.test.ts` — exit 0; 11 pass, 0 fail after evidence-target remediation.
- `xcodebuild build-for-testing ... -destination 'generic/platform=iOS' ...` — exit 65 in the restricted Engineer sandbox. Xcode resolved the executable app and UI-test dependency graph, then its Swift macro plugin server was denied by `sandbox-exec: sandbox_apply: Operation not permitted`. This is host-environment evidence, not a source-level runtime pass; the serialized Mac Worker must perform the authoritative build and UI-test run.

## Covered Behaviors

Strict schema drift with no writes; production/test contract separation; same-file idempotency; unchanged-file snapshot suppression; changed-price history; market movement; printing-level separation; FTS search; relevance-based sealed grouping; single-query sealed suppression; sealed unknown shipping; explicit assumed single shipping; missing-condition nearest-grade labeling; category-not-loaded distinction; and asking-price threshold modes.

## Honest Limitations And Required Inputs

- No authoritative sanitized Pricing Tool export or schema/version exists in the workspace. Real import activation and acceptance cannot be certified until supplied; the generic contract mechanism is complete and tested.
- No production hosting or durable-volume decision exists. SQLite is safe for the scoped single-user application only where storage is durable.
- The Engineer did not launch Chrome, Safari, Playwright, a simulator, or any renderer. Required 320/768/1200/1440 web, iPhone, keyboard, screen-reader, contrast, zoom, Dynamic Type, reduced-motion, and increased-contrast checks remain unclaimed for the serialized Mac Worker.
- The repository now contains a non-shipping executable iOS evidence host and UI-test target. It mirrors the approved Pricing Lookup hierarchy solely for Mac Worker device/accessibility capture and does not make a native mobile app part of the product. Engineering validated its project/scheme contract but did not launch or execute it.
- The restricted Engineer sandbox cannot complete Xcode Swift macro compilation or connect to CoreSimulatorService. The project-native preflight passes, but only fresh Mac Worker execution can prove that the app/test host builds and runs on its unrestricted host.
- No deploy, external mutation, credential access, destructive operation, commit, or recommendation logic occurred.

## Fresh Host Evidence Remediation

After the Mac Worker reported that it could not discover a locally renderable web entry point, Engineering added a deterministic non-shipping evidence route with explicit scenario URLs for sealed-plus-singles, single-specific, missing-price, stale, and request-error states. The preflight contract now validates and publishes those URLs. The runtime uses system font stacks so local build and rendering do not depend on fetching Google Fonts. Production data and the normal `/price-lookup` path remain unchanged.

The subsequent visual-evidence attempt still produced no captures. Debugger inspection confirmed that the evidence route exists in the compiled route manifest and identified the evidence launcher as the smallest remaining source-controlled failure surface: it selected Next.js 16's default Turbopack development path despite the earlier recorded internal port-bind failure on that path. The recovery pins the evidence-only launcher to the framework-supported Webpack path and publishes an explicit loopback readiness probe, expected response text, timeout, and isolated-browser ownership. This repair awaits fresh serialized Mac Worker validation; no runtime pass is claimed here.

The bounded conformance repair also removes incomplete combobox semantics from the plain search field and makes the sealed preview responsive: only the first two relevant sealed matches show below 768px until expanded, while all relevant matches render from 768px upward. The preflight now rejects regressions in those source-level handoff markers. Runtime behavior remains unclaimed until the Mac Worker records fresh evidence.

## Debugger Control-Path Amendment

The policy-v10 Mac Worker generation recorded both web and iOS in its changed-surface plan but marked both not applicable and requested a local web entry point. That result is inconsistent with the already sealed safe runtime-target contract and the subsequent isolated Webpack smoke log, which shows the evidence route returning `200` three times. The failure is preserved as a historical Worker target-contract discovery race. Later policies support the existing Phronesis contract and own isolated capture. See `PHR-UX-007-debugger-recovery.md` for the preserved evidence and handoff; the current required rerun is governed by the policy-v14 remediation below.

## Policy-v12 Smoke Remediation

The recovered isolated web probe rendered the evidence route at 320, 768, 1200, and 1440 CSS pixels and recorded passing keyboard, focus, runtime accessibility-tree, 200% zoom, reduced-motion, and increased-contrast checks. Its contrast audit found eight uses of zinc-500 secondary text below 4.5:1: the global search prompt plus Pricing Lookup condition-scope and snapshot labels. Engineering changed only those rendered text tokens to zinc-400. No content, ordering, data rule, or interaction changed.

Fresh deterministic verification after that patch: focused pricing/navigation tests passed 11/11; lint passed; the Webpack production build passed; evidence preflight passed with the Webpack readiness contract and all web/iOS targets; and `git diff --check` passed. The default Turbopack build repeated the documented restricted-host internal port-bind failure. The full repository suite repeated the documented baseline exactly at 150 pass and 17 fail, while all eight PHR-UX-007 tests passed. A new serialized Worker capture is still required to verify the corrected pixels and complete iPhone/Dynamic Type evidence; Engineering does not promote the smoke artifacts to final conformance evidence.

## Policy-v13 iOS Remediation

Fresh host logs showed the compact-device UI tests passing. On the large device at accessibility-extra-extra-extra-large text, the named-controls test successfully discovered the search field, sealed expander, and singles condition before the test runner exited immediately after an unconditional downward reset swipe. The reset gesture was unnecessary: named-control discovery already has a bounded scrolling fallback, and the accessibility audit can start from the stable initial viewport. Engineering removed only those two reset swipes; product UI and evidence content are unchanged.

Post-repair deterministic evidence: target preflight passed; all eight focused PHR-UX-007 tests passed; lint and `git diff --check` passed. The supported full suite repeated its documented baseline at 150 pass and 17 fail, with all PHR-UX-007 tests passing. The first ad-hoc focused command used an unavailable `tsx` loader and was superseded by the repository-supported test hook. Engineering did not launch Xcode, a simulator, browser, or renderer. Fresh serialized Mac Worker execution remains required to establish the iOS runtime, Dynamic Type, increased-contrast, and screen-reader verdicts.

## Policy-v14 Conformance Remediation

Designer review rejected the policy-v14 generation for three internally contradictory evidence claims: the manifest's server-log digest does not match the referenced file, `focus-traversal.json` reports no visible focus for the Singles condition selector while the manifest marks visible focus passed, and the web screen-reader pass relies only on iOS accessibility nodes. Engineering did not mutate the rejected Worker artifacts. The selector now has an explicit high-contrast outline in addition to its ring, and the machine-readable target contract requires separate hashed web focus-traversal and screen-reader-output artifacts with precise pass conditions. A fresh serialized Mac Worker generation must compute hashes only after capture completes and must replace the rejected generation. No web, iOS, responsive, or accessibility runtime pass is claimed by this Engineer report.

## Policy-v15 Evidence-Host Remediation

The policy-v15 summary reported keyboard-operation and visible-focus failures without a diagnostic, but its hashed artifacts identify a common host failure: every focus-traversal entry is the invisible body of Next.js's HTTP 500 error document. The server served the evidence route twice, then logged `Unexpected end of JSON input` and returned 500. Because the evidence dev server used the default `.next` directory, overlapping Next.js work could rewrite generated JSON while the Worker read it. The evidence command now sets `JARVIS_RUNTIME_EVIDENCE=1`, `next.config.ts` routes only that process to `.next-evidence`, and repository preflight enforces the launcher/config pair. Product behavior and focus styling are unchanged. Fresh serialized Mac Worker execution remains required.

## Fresh Host Keyboard And Focus Remediation

The subsequent Architect review again surfaced `keyboard_operation` and `visible_focus` as failures with no diagnostic. Engineering added a scoped cyan `:focus-visible` fallback across every native Price Lookup control, with a forced-colors override, and strengthened the machine-readable Worker contract to require distinct keyboard-operation and visible-focus artifacts with diagnostics on both pass and failure. The contract names the required traversal, activation, and indicator assertions and preflight guards the source markers.

The next bounded Designer remediation changes the compact sealed preview from one to the approved two rows, suppresses the empty-result panel while an operational error exists, adds an explicit opaque cyan focus outline/ring to the search control, and makes representative baseline large-iPhone evidence a separate required Worker run from the accessibility-extra-extra-extra-large/increased-contrast environment. These source and contract changes do not themselves establish runtime conformance.

Post-repair verification: target preflight passed; all eight focused PHR-UX-007 tests passed; ESLint passed; the Webpack production build passed; `git diff --check` passed; and the full suite reproduced the documented 150-pass/17-failure baseline with all PHR-UX-007 tests passing. Standalone TypeScript reproduced only the documented 27 `TS5097` test-import errors. Runtime keyboard/focus conformance remains unclaimed pending a fresh coherent serialized Worker generation.

## Sealed Expansion Accessibility-Environment Remediation

Fresh host evidence failed `testSealedExpansion` in Dynamic Type, reduced-motion, and increased-contrast runs. The test's discovery helper scrolled a generic descendant into view, but the test then discarded it and tapped a separately queried button without proving that element was hittable. Engineering now queries the button once, scrolls that same element until hittable with accessibility-size headroom, taps it, and waits for its `expanded` value and `Showing all sealed products` label. No product behavior changed. Xcode and simulator execution remain reserved for the serialized Mac Worker, so the runtime verdict remains unclaimed.

Post-repair deterministic evidence: evidence preflight passed; all eight focused PHR-UX-007 tests passed; source lint passed when the preserved generated `.next-evidence` directory was explicitly excluded; the Webpack production build passed; `git diff --check` passed; and the full suite reproduced the documented 150-pass/17-failure baseline. The ordinary lint command is currently contaminated by generated Worker output under untracked `.next-evidence`, and the default Turbopack build reproduced the documented restricted-host port-bind failure. Standalone TypeScript reproduced only the documented 27 `TS5097` test-import errors.

## Policy-v18 Runtime Contract Remediation

Architect review found that the otherwise coherent policy-v18 authority still reused traversal evidence for keyboard operation and visible focus, omitted the required web screen-reader artifact and non-sealed scenarios, left web reduced-motion and increased-contrast captures unhashed by the top-level manifest, and did not resolve a React pre-mount state-update warning. Engineering added a hydration-complete DOM marker without a React state update and now requires the Worker to wait for that marker before interaction. The target contract also enumerates separate immutable scenario artifacts and web-specific environment captures. Existing Worker evidence was not changed and no runtime result is claimed; a fresh serialized generation remains required.

## Compact iPhone And VoiceOver Remediation

The latest host summary obscured two actionable failures that were present in its per-device logs. The compact-iPhone accessibility audit named `pricing-search` with `Hit area is too small`, and the failed iOS 27 VoiceOver traversal began in the unrelated Coin application before Phronesis received assistive focus. The evidence-only SwiftUI host now gives the search field an explicit 44-point frame and content shape. After enabling `XCUIVoiceOverService`, the UI test explicitly reactivates Phronesis, verifies foreground state and the named search control, then traverses without terminating on a repeated utterance. Repository preflight guards both repairs.

Post-repair deterministic evidence: runtime-target preflight passed; focused pricing/navigation tests passed 11/11; source lint passed with preserved generated Worker directories excluded; the Webpack production build passed; and the full suite reproduced the documented 150-pass/17-failure baseline. Standalone TypeScript reproduced only the documented 27 `TS5097` test-import errors. No browser, simulator, renderer, or native application was launched. Implementation is complete, but conformance remains **BLOCKED** until one fresh serialized Mac Worker generation builds and executes the native tests and supplies coherent hashed artifacts.

## Sealed Expansion Snapshot Remediation

Fresh serialized evidence still failed `PhronesisEvidenceUITests.testSealedExpansion`. Expansion inserts the third sealed card before the disclosure, moving the SwiftUI element while the test retained its pre-mutation XCUI snapshot. The evidence host now exposes a genuine toggle (`Show all 3 sealed products`/`collapsed` and `Show fewer sealed products`/`expanded`), and the UI test re-resolves the stable identifier while polling the post-mutation accessibility state. A deterministic repository test guards this interaction contract. Engineering did not launch Xcode, a simulator, browser, or renderer; fresh serialized Mac Worker execution remains the runtime gate.

Post-repair verification: focused PHR-UX-007 tests passed 14/14; runtime-target preflight passed with zero errors; scoped ESLint, `git diff --check`, and the supported Webpack production build passed. The full suite passed 156 and reproduced the same 17 documented baseline failures. Standalone TypeScript reproduced only the same 27 documented `TS5097` test-import errors. No PHR-UX-007 regression appeared.

## Pre-Activation Snapshot Remediation

The next serialized run still failed `testSealedExpansion`. The remaining stale XCUI handle was captured before the bounded SwiftUI scroll and used for activation. The test now resolves the stable identifier on every scroll check, re-resolves it immediately before activation, verifies the expected hittable `Show all 3 sealed products`/`collapsed` state, and then separately re-resolves the post-insertion expanded state. Focused checks pass 14/14, preflight and diff validation pass, scoped ESLint passes, and the production build passes. The supported full suite remains at 156 pass/17 documented baseline failures; standalone TypeScript remains at 27 documented `TS5097` errors. Ordinary lint is contaminated by preserved untracked `.next-evidence` generated output. Fresh serialized Mac Worker execution remains required; no native runtime pass is claimed.

## Development-Chrome And Freshness-Coherence Remediation

The latest authoritative rendered review demonstrated two bounded defects. Next.js development chrome obscured controls and result text in narrow captures, and the stale scenario combined a Jul 1 category snapshot with Jul 27 row snapshots. Engineering disabled the framework indicator only when `JARVIS_RUNTIME_EVIDENCE=1`, preserved normal development behavior, and normalized every visible stale fixture price to the category snapshot date. Focused tests pass 15/15; scoped lint, target preflight, diff validation, and the supported Webpack production build pass. The full suite now reports 157 pass and the same 17 documented baseline failures; standalone TypeScript reports the same 27 `TS5097` errors. Ordinary lint remains contaminated only by preserved untracked `.next-evidence` generated output. Fresh serialized Mac Worker evidence remains required; no visual or accessibility runtime result is claimed.

## Policy-v34 Native Accessibility Remediation

The accepted policy-v34 artifact inventory exposed two remaining conformance defects: genuine VoiceOver did not speak history and snapshot facts for every visible result, and the completed manifest retained a retryable `local_visual_analysis: skipped` state. The native evidence card no longer supplies a combined card label. Each decision fact is an independently traversable child whose accessible label includes the result name, fact type, and value. The UI test now asserts per-result history and snapshot utterances for both sealed results and both singles, while retaining the complete general decision-flow checks.

The evidence validator now inspects completed manifest checks and surface checks. Only `pass`, `fail`, and explained `not-applicable` are accepted; `skipped` is rejected. The preserved policy-v34 directory now fails validation for exactly that stale status and was not rewritten. Focused preflight, six validator tests, and 15 pricing tests pass after this repair; the source guard was then strengthened to cover all four required native result identities. The supported Webpack production build and diff check pass. The full suite remains at its documented 157-pass/17-failure baseline, standalone TypeScript retains exactly 27 documented `TS5097` errors, default Turbopack build remains blocked by the restricted host's prohibited port bind, and repository-wide lint retains the preserved generated `.next-evidence` baseline of 135 errors and 1,555 warnings. Native execution and all visual/accessibility conclusions remain reserved for one fresh serialized Mac Worker generation.
