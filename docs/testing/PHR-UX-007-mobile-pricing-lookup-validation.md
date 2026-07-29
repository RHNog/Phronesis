# PHR-UX-007 Validation Plan

## Executable completed-generation gate — 2026-07-28

Run `npm run evidence:validate -- <generation-directory>` after Worker capture and before using manifest statuses for conformance. The repository-owned validator rejects a zoom pass unless both controls carry full class lists and positive bounds, every visible SKU carries non-empty identity values plus whole-result and per-field bounds, and an explicit false intersection exists for each control/result pair. It rejects web semantic evidence unless it comes from a same-session `Accessibility.getFullAXTree` capture scoped to `.pricing-lookup`, contains no raw `StaticText` or `InlineTextBox` nodes, and derives exactly one ordered spoken sequence from retained named semantic nodes.

Deterministic sanitized tests cover complete payload acceptance and the rejected legacy count-only/raw-text shapes. The preserved current generation fails with 21 contract errors; that expected rejection proves the gate detects the reviewed defect but is not runtime conformance.

Run `npm run evidence:validator-test` to execute those four sanitized tests, and `npm run evidence:preflight` for the target-file contract. Both are repository-owned and cwd-independent, so the Worker can sequence them ahead of `evidence:validate` in its deterministic order. Verified 2026-07-28: 4 tests pass, preflight `status: pass` with no errors.

## Interrupted VoiceOver Run Evidence-Durability Recovery — 2026-07-28

- Failure fingerprint: `phronesis/runtime-evidence/policy-v31-interrupted-voiceover-tail-v1`.
- Supersedes the "External Native-Matrix Interruption Recovery" entry below, which concluded that no evidence-contract change was justified. Leaving the implementation unchanged left the fingerprint unchanged, so the interrupted capture was replayed rather than regenerated and the assignment could not clear this gate.
- Re-reading run 1's preserved log shows the interruption landed in the *tail* of `testVoiceOverProducesRealUtterances`, after all 32 utterances were captured and the transcript attachment was added at t=38.96s. The run was still recorded `status: fail` with `screenshot: null`. The evidence existed and was thrown away.
- That is a repository-owned durability defect, not merely an environmental interruption: the traversal kept driving VoiceOver after the transcript stopped yielding new content, and the transcript was serialized only after every content assertion.
- Correction: bounded early exit after four consecutive duplicate utterances, gated on the transcript already carrying every decision-critical phrase; transcript attached before the assertions; VoiceOver released as soon as traversal completes; one shared `decisionCriticalPhrases` list behind both the early exit and the pass criteria. The 64-move ceiling is unchanged.
- `tests/jarvis_runtime_evidence.py --preflight` now rejects removal of these safeguards and enforces that `add(attachment)` precedes the first `spokenDecisionFlow` assertion.
- These are source-level readiness checks only. The serialized Mac Worker must rerun the compact baseline, large baseline, large accessibility environment, runtime audit, and VoiceOver transcript as one fresh generation before any pass is recorded. Scenarios must not be combined across generations.

## External Native-Matrix Interruption Recovery — 2026-07-28

- Failure fingerprint: `phronesis/runtime-evidence/policy-v31-external-native-matrix-interruption-v1`.
- The authority receipt matches the failed manifest digest. Web evidence passed, three native scenarios passed, and the remaining compact baseline passed its first two tests before Xcode recorded `BUILD INTERRUPTED` during the VoiceOver test.
- The repeated debugger-version diagnostics are non-assertion host messages. No Phronesis test failure, product defect, or new source-level diagnostic was recorded.
- Keep the interrupted generation immutable and rejected. The serialized Mac Worker must produce one entirely fresh matrix and matching authority receipt after restart; passing scenarios must not be combined across generations.
- No product, iOS host, or evidence-contract change is justified for this fingerprint. If a fresh uninterrupted generation produces a source-level failure, open a new bounded debugger fingerprint from that evidence only.

## Compact-iPhone Sealed-Expansion Recovery — 2026-07-28

- Failure fingerprint: `phronesis/runtime-evidence/policy-v31-compact-sealed-expander-noop-scroll-v1`.
- The authority-receipted generation proved the web accessibility capture and genuine native VoiceOver transcript. Its compact iPhone run failed only because twenty `ScrollView.swipeUp(velocity: .slow)` gestures left the sealed expander at the same off-screen frame, so XCTest never tapped it.
- The evidence test now performs a bounded drag between normalized coordinates inside the owning `ScrollView`, then requires the expander to become hittable before tapping. Product hierarchy, card content, and customer-facing behavior are unchanged.
- Repository preflight and focused source tests guard the targeted gesture. Runtime conformance remains unclaimed until the serialized Mac Worker executes a fresh generation and produces a matching authority receipt.

## Decision-Critical Spoken Semantics Repair — 2026-07-28

- Fresh conformance review found that valid web and native evidence omitted or truncated result facts required to make a buy decision.
- Web results now expose an explicit semantic summary containing product type, name, full printing identity, delivered-price state, listing/shipping breakdown, history, and snapshot date.
- Native evidence cards no longer combine every fact into one truncation-prone utterance. The VoiceOver test traverses a bounded 64 steps and fails unless genuine host-observed speech contains full variant names, delivered/listing/shipping content, history, and snapshot date.
- The Worker contract now includes the VoiceOver UI test and rejects incomplete or truncated web/native semantic evidence. Repository checks validate the contract only; runtime conformance remains pending a fresh authority-receipted Worker generation.

## Bridge-v34 Native Isolation Recovery — 2026-07-28

- Rejected fingerprint: `phronesis/runtime-evidence/policy-v31-device-voiceover-state-leak-v1`.
- The first compact scenario was interrupted with system VoiceOver enabled, and the fourth compact scenario inherited the same device-wide state. Because VoiceOver changes native gesture semantics, the resulting 0%-scroll observation is environmental evidence rather than a clean reproduction of an ordinary-scroll product defect.
- The canonical rerun must use Jarvis bridge v34, verify VoiceOver OFF immediately before and after every serialized native scenario, and enforce the bridge's finite 120-second default and 180-second maximum allowances.
- Preserve the current bounded `ScrollView` gesture, 44-point expander target, post-layout control re-resolution, all rejected artifacts, and the assignment identity. Change product source only if the isolated v34 matrix supplies a genuinely fresh reproducible source-level diagnostic.
- Repository checks cannot promote the rejected generation. Runtime conformance remains unclaimed until the Mac bridge produces a new manifest and matching authority receipt.

## 2026-07-28 Universal Web Probe Regression Guard

- The lookup root is a labelled `Price lookup` region with a stable `.pricing-lookup` selector.
- The target contract uses the Worker's page-session `Accessibility.getFullAXTree` probe, resolves the region by backend DOM node identity, and scopes output through AX `childIds`.
- Preflight rejects an absent or ambiguous root, a missing region match, empty scoped descendants, out-of-scope nodes, development tooling, duplicate raw text descendants, and missing named controls.
- Repository tests do not claim runtime screen-reader conformance; the serialized Mac Worker must produce and hash a fresh non-empty artifact.

## Empty Scoped Accessibility Capture Recovery

The first fresh generation after the scoped-capture repair returned an empty `accessibility-tree.json`, zero named nodes, and a failed web `screen_reader_output` result while all visual and keyboard probes reached the rendered lookup. The failed artifact still identified `Accessibility.getFullAXTree`, proving the Worker did not execute the new scoped algorithm. More importantly, the repository contract incorrectly paired `Accessibility.getPartialAXTree` with `fetchRelatives=false` while requiring a complete descendant subtree. Chrome's protocol defines that mode as the target node without its relatives; it cannot satisfy the stated evidence requirement.

The corrected contract uses the protocol operation intended for this job: enable accessibility on the page-target session, resolve exactly one `.pricing-lookup` backend node, and call `Accessibility.queryAXTree` for that backend node without name or role filters. The Worker must use the same page-target session for navigation, DOM resolution, accessibility enablement, and capture; reconstruct descendant order from AX parent/child relationships; and reject an empty scoped query before hashing evidence. Full-tree and partial-tree capture are both forbidden. Product markup and behavior remain unchanged, and the failed generation remains preserved as diagnostic evidence.

## Scoped Web Semantic Capture Repair

Designer review found that the policy-v31 artifact declared `.pricing-lookup` scope but was produced from Chrome's full accessibility tree: it included global Phronesis chrome and placed lookup controls before the `Price lookup` heading. The Worker contract now specifies the executable capture boundary rather than only its intent. After interactive readiness, the Worker must resolve exactly one `.pricing-lookup` element, obtain that element's `backendNodeId`, and query the accessibility subtree rooted at that node on the same page-target session. It must serialize root metadata, retain only that accessibility subtree, and derive one semantic sequence whose first spoken node is the `Price lookup` heading. A full-tree capture, document ancestors, unrelated nodes, ambiguous roots, an empty query, or a different first spoken node invalidate the pass. Rejected artifacts remain unchanged; fresh serialized Mac Worker evidence and a matching authority receipt are required.

## Policy-v31 Designer Evidence Repair

The authority receipt and artifact hashes were coherent, but design conformance rejected incomplete zoom measurements, development-runtime contamination and duplicated raw descendants in the web spoken sequence, and inconsistent names for the search and condition controls. Engineering now gives both controls explicit accessible names and strengthens the Worker contract with mandatory structured zoom measurements, a `.pricing-lookup` accessibility capture root, semantic-node pruning, development-tool exclusions, and exact required control names. Focused repository tests and preflight validate this handoff only; one fresh authority-receipted serialized Mac Worker generation remains required for runtime conformance.

Post-repair deterministic results: 11/11 focused pricing tests passed; runtime-target preflight, scoped ESLint, diff validation, and production build passed. The supported full suite remained at 153 pass/17 baseline failures. Repository-wide lint remained contaminated only by preserved generated `.next-evidence` content at 135 errors/1,555 warnings, and standalone TypeScript retained the 27 documented `TS5097` test-import errors.

## Structural Field-Control Zoom Repair — 2026-07-28

- Fresh review input: 200% and 400% remain failed until the condition overlay no longer obscures decision content.
- Repair: zoom reflow now structurally removes sticky classes from search and `Singles condition`, placing both in normal document order while ordinary phone layouts retain sticky controls.
- Worker gate: both zoom diagnostics must record active search and condition reflow markers, static positions, absent sticky classes, zero search/result-identity intersections, zero condition/result-identity intersections, and zero horizontal overflow.
- Deterministic result: focused pricing tests pass 10/10, runtime-target preflight passes, scoped repository lint passes, `git diff --check` passes, and the supported Webpack production build passes. The supported full suite remains at the established 152-pass/17-failure baseline, standalone TypeScript retains 27 established `TS5097` errors, and the default Turbopack build retains the restricted-host port-bind failure.
- Runtime verdict: 200% and 400% remain unclaimed pending one fresh coherent serialized Mac Worker generation.

## Global Topbar Visible-Focus Remediation — 2026-07-28

- Fresh host input: `Search anything…⌘K / Ctrl+K` and `User menu` rendered no visibly distinguishable focus indicator; transparent outlines and shadows were explicitly rejected.
- Source repair: both Topbar buttons now use an opaque cyan `:focus` outline and border. The user-menu button has a transparent resting border to prevent layout movement when the focused border becomes visible.
- Deterministic guard: runtime-target preflight requires the shared opaque-focus classes and the user-menu border marker.
- Repository result: focused pricing tests pass 8/8, runtime-target preflight and scoped Topbar lint pass, and the production build passes. The supported full suite remains at its documented 150-pass/17-failure baseline. Standalone TypeScript remains at 27 established `TS5097` errors. Unscoped lint currently traverses preserved `.next-evidence` Worker output and reports generated-code findings; no changed source lint error was found.
- Runtime verdict: visible focus remains unclaimed until a fresh internally coherent serialized Mac Worker generation captures computed indicators for both controls.

## Tab-Completion Remediation Checkpoint — 2026-07-28

- Host input: 18 declared native controls; empty forward and reverse traversal; visible-focus failure because no control was reachable.
- Source repair: record the pre-Tab target on `keydown`, preserve successful native traversal, and complete the unchanged-focus fallback synchronously on `keyup`, with a short missing-keyup safeguard.
- Focus behavior: the existing opaque Price Lookup `:focus` and `:focus-visible` indicator is unchanged and becomes inspectable after traversal reaches a control.
- Deterministic result: focused pricing/navigation tests pass 11/11; runtime-target preflight, scoped lint, and production build pass; the full suite remains 150 pass/17 established failures; standalone TypeScript remains at 27 established `TS5097` errors.
- Runtime verdict: keyboard operation and visible focus remain unclaimed until a fresh internally coherent serialized Mac Worker generation executes this patch.

## Fresh Host Keyboard/Focus Remediation Checkpoint — 2026-07-28

- Host input: 18 declared native controls; empty forward and reverse traversal; visible-focus failure because no control was reachable.
- Source repair: observe Tab without preventing native behavior; after native processing, advance in logical DOM order only if focus is unchanged.
- Focus repair: opaque Price Lookup indicator applies to both `:focus` and `:focus-visible`, including forced-colors behavior.
- Deterministic result: pricing tests 8/8 pass; runtime-target preflight passes; changed-source lint passes; production build passes; full suite remains 150 pass/17 baseline failures; standalone TypeScript remains at 27 baseline `TS5097` errors.
- Required runtime result: a fresh Worker generation must record non-empty matching forward/reverse traversal and computed visible indicators. Source inspection is not a runtime pass.

## Deterministic Repository Checks

- Strict exact-header and semantic mapping validation occurs before storage mutation.
- Invalid rows roll back the whole import.
- Same file hash is a no-op; a different file with unchanged values updates freshness without duplicate history.
- Changed price state adds one snapshot; movement uses market price and previous changed snapshot.
- SKU plus condition separates variants and condition prices; collector number never identifies a product.
- Search score and stable identity order determine results, never price.
- Sealed relevance and single-target suppression work; mobile sealed preview is capped by presentation.
- Selected-condition absence names a nearest grade without substituting it.
- Assumed shipping is permitted and labelled for singles only; absent sealed shipping never yields delivered price.
- Asking-price threshold switches between absolute and percentage display.
- Active-category and stale settings are configuration-driven.

## Mac Worker Runtime Evidence

Fresh policy-v26 review rejected web environment conformance because reduced-motion and increased-contrast passes cited only native evidence, their web screenshots carried no behavioral diagnostics, and the top-level contrast result was not attributed to the web surface. The repository target now requires separate `reduced-motion.json` and `increased-contrast.json` reports alongside their screenshots, records the exact enabled media query, and requires web-scoped manifest results for reduced motion, increased contrast, and contrast. A deterministic source guard verifies the two CSS media-query treatments and diagnostic contract. Only a fresh Worker generation can satisfy this gate.

The serialized Mac Worker must populate `jarvis-runtime-evidence/manifest.json` using `pass`, `fail`, or explained `not-applicable` for: 320/768/1200/1440 rendered web widths; named compact and large iPhone layouts if an executable iOS target exists; keyboard operation; focus visibility; screen-reader output; contrast; 200% and 400% zoom; Dynamic Type; reduced motion; and increased contrast. Source inspection cannot pass these checks.

The fresh 200% and 400% zoom diagnostics must go beyond horizontal-overflow measurements: each must confirm that the browser-zoom reflow state is active and that the visible Singles condition panel does not intersect or clip the first result's product type, name, or printing identity. The matching screenshots must make those fields readable.

The evidence route exposes stable, non-semantic `data-pricing-*` probe hooks for the condition panel and the three required result-identity fields. Each zoom diagnostic must record a computed `position: static`, zero panel/identity intersections, zero horizontal-overflow CSS pixels, and visible non-empty product-type, product-name, and printing-identity fields. These hooks do not change accessibility names or product behavior.

The evidence contract now gives each result a unique SKU probe plus product-type, product-name, and printing-identity attribute values. Its exact schema rejects a zoom pass unless both controls resolve uniquely with positive bounds, at least one visible identity has positive whole-result and per-field bounds, and both controls have an explicit false intersection record for every captured identity. Null selectors/positions, empty identity values, and inferred zero counts are not accepted.

Fresh host diagnostics showed `scroll_width` equal to viewport width with no overflow offenders at both zoom levels; every failure was an intersection between sticky field controls and decision content. The bounded repair gives the Worker's 640px/320px captures explicit `zoom=200`/`zoom=400` evidence URLs, reflows both field controls there, and preserves ordinary sticky phone behavior. This replaces the prior pointer-emulation-dependent fallback. Deterministic tests and preflight guard that distinction; only a fresh Worker generation can establish rendered success.

The latest remediation makes that distinction structural: zoom reflow renders both field panels without sticky utility classes and exposes matching `data-pricing-*-reflow="true"` markers. A CSS-only narrow fine-pointer fallback establishes normal flow before hydration when browser zoom metrics are delayed or inconsistent, and imported product/printing identity text is explicitly shrinkable and wrappable. The Worker pass contract requires both markers, computed `position: static`, no sticky classes, zero identity intersections, and zero horizontal overflow at both zoom levels.

The iOS matrix must retain separate compact-iPhone baseline, large-iPhone baseline, and large-iPhone accessibility-environment artifacts. Both baseline runs use the standard `large` content-size category with increased contrast disabled; the large accessibility run uses accessibility-extra-extra-extra-large with increased contrast enabled. Visible-focus evidence must record a distinguishable computed indicator, not merely a matching `:focus-visible` selector.

Run `python3 tests/jarvis_runtime_evidence.py --preflight` to discover and validate the host targets without launching them. The returned JSON names the Webpack-pinned loopback web command, readiness URL/status/text/timeout, deterministic scenario URLs, widths, Xcode project, shared scheme, executable application target, UI-test target, and test cases. The isolated evidence browser must poll readiness before navigation and must not launch desktop Chrome. Only the serialized Mac Worker executes those targets and records runtime results.

HTTP readiness is not interaction readiness. Before any keyboard, focus, screen-reader, or scenario operation, the Worker must wait for `.pricing-lookup[data-interactive-ready="true"]`. React sets that marker after hydration without scheduling a component state update. This closes the known race in which the host operated server-rendered controls before their client handlers mounted and logged a React state-update warning.

The preflight also guards the two explicit source-level conformance repairs: the lookup uses native search-field semantics rather than an incomplete combobox contract, and sealed overflow is hidden only below the `768px` breakpoint with a small-screen expander. These checks establish target readiness, not rendered conformance.

The target contract also requires separate, hashed web artifacts for focus traversal and screen-reader output. The focus artifact must report `focus_visible: true` for every visible tabbable control, including `Singles condition`. The screen-reader artifact must come from the rendered web surface and record names, roles, states, and reading order; iOS accessibility nodes cannot substitute for web screen-reader evidence. Artifact hashes must be computed after capture is complete and must match the immutable files referenced by the final manifest.

Fresh serialized Worker evidence must additionally emit distinct `keyboard_operation`, `visible_focus`, and `contrast` artifacts. Each artifact must include a non-null diagnostic on pass or failure; a bare `no diagnostic` result is insufficient for conformance. The keyboard probe must confirm Space-key operation of the Price Lookup disclosure summaries as well as native buttons. The Worker must exercise the rendered Price Lookup rather than an HTTP error document.

Policy v20 still returned `keyboard_operation: fail` with `no diagnostic`, despite the earlier boolean diagnostic requirement. The target contract now defines the keyboard artifact structurally: it requires non-empty forward and reverse tab-order traces, activation records with before/after state, and a non-empty diagnostic on pass or failure. A failure must name the failed control, attempted key, observed states, and page URL; empty, null, and `no diagnostic` values are explicitly rejected. This is an evidence-control repair, not a runtime pass or a product-behavior change.

The same immutable generation must hash and reference separate artifacts for sealed-plus-singles, single-specific suppression, missing selected condition, stale data, category-not-loaded, no match, loading, and recoverable error/retry. Web reduced-motion and increased-contrast artifacts must also be referenced and hashed by the authoritative top-level manifest; an iOS run cannot establish either web result.

The UI-test host's sealed-expansion check must scroll the identified button until it is hittable, activate it, then repeatedly re-resolve that identifier until the repositioned disclosure exposes `expanded` plus `Show fewer sealed products`. Retaining the pre-expansion XCUI element snapshot is invalid because insertion of the third sealed card moves the disclosure. This is required at every Worker accessibility environment, including large Dynamic Type, reduced motion, and increased contrast.

Deterministic repair verification on 2026-07-28: focused PHR-UX-007 tests 14/14 pass; evidence preflight, scoped lint, diff validation, and supported Webpack production build pass. The full suite remains at its 17-failure behavioral baseline (156 pass after the added guard), and standalone TypeScript retains the documented 27 `TS5097` test-import errors. Native runtime execution remains exclusively owned by the serialized Mac Worker.

The latest source guard additionally requires fresh identifier resolution throughout the sealed-expander scroll loop, a fresh hittable `collapsed` disclosure immediately before activation, and an independent fresh query for the post-insertion `expanded` state. This closes both SwiftUI snapshot-invalidating boundaries. It is deterministic source coverage only; the serialized Mac Worker must still execute `testSealedExpansion` and supply the immutable runtime artifacts.

## Development-Chrome And Stale-Date Remediation

Failure fingerprints: `phronesis/runtime-evidence/policy-v32-next-dev-indicator-obscures-content-v1` and `phronesis/runtime-evidence/policy-v32-stale-fixture-date-incoherence-v1`.

Authoritative rendered review found the Next.js development indicator covering product controls and result text at narrow widths, and found a stale category labelled `snapshot Jul 1` while its visible result said `Snapshot Jul 27`. The evidence-only process now disables development indicators without changing ordinary development or production behavior. The stale fixture assigns every visible price the same category-scoped date and clears prior-snapshot movement that would be incoherent for the bounded fixture. Deterministic tests verify both repairs, and preflight rejects removal of the config marker. Fresh Worker evidence is still required to prove unobscured rendering.

## Policy-v34 Native Decision-Fact And Final-Status Remediation

Fresh host evidence proved that the second sealed result and both singles did not each contribute their own history and snapshot utterances. The evidence host now leaves the card as a containing accessibility group while exposing product type, name, printing identity, delivered state, breakdown, history, and snapshot as separate child elements. Every child label is prefixed with its result name so repeated values remain attributable in the immutable transcript. The VoiceOver UI test now refuses early completion and fails unless both visible sealed results and both singles each contribute separately traversable `History. No history yet` and `Snapshot date. Snapshot Jul 28` utterances.

Completed evidence-directory validation now reads `manifest.json`, validates accessibility checks and surface results, and rejects any status outside `pass`, `fail`, or `not-applicable`. A `not-applicable` result requires a non-empty reason, explanation, or diagnostic. The preserved policy-v34 generation deterministically fails this validator because `local_visual_analysis` is `skipped`; it remains historical evidence rather than being modified in place.

## Input And Environment Gates

- Real import certification requires the authoritative sanitized export and schema/version.
- Locked dependencies were restored offline; local Next.js 16 guide review, evidence preflight, lint, focused tests, and production build passed. Mac Worker UI runtime checks remain outstanding.

## Debugger Recovery

The first fresh visual-evidence retry preserved the assignment but produced no captures. The evidence page was already present in the compiled Next.js route manifest; the remaining reproducible launcher risk was that `next dev` selected Next.js 16's default Turbopack path even though prior Engineer evidence recorded an internal port-bind failure on that path. The bounded recovery pins the evidence-only server to the installed framework's documented `--webpack` fallback and adds a machine-readable readiness gate. This changes neither the production route nor product behavior. Fresh Mac Worker execution remains the authority for the runtime verdict.

The policy-v10 evidence generation returned `remediation_required`, but its own manifest listed both web and iOS as changed surfaces while marking them not applicable and requesting a web entry point. The sealed patch already contained the safe runtime-target contract, and a later isolated smoke server logged three successful evidence-route responses. This is preserved as historical fingerprint `phronesis/runtime-evidence/v10-target-contract-discovery-race-v1`, not a product render failure. Later policies accepted the declared target contract. Current validation must create a fresh generation and must not reuse the v10 authority receipt, the smoke capture, or the rejected v14 generation.

The recovered policy-v12 web smoke probe subsequently produced captures at all four required widths and found one bounded conformance defect: zinc-500 secondary labels failed the required 4.5:1 text contrast ratio. Those Pricing Lookup labels and the visible global search prompt now use zinc-400. Repository checks pass after the change, but the old smoke capture remains pre-remediation evidence; only a fresh serialized Worker run may establish the corrected runtime contrast result or final responsive/accessibility conformance.

The next host iOS run passed on the compact device and found every named control on the large Dynamic Type device, but the UI-test runner exited after an unconditional downward reset swipe. That gesture was not needed for control discovery or the runtime audit and is removed. A fresh serialized Worker run must verify both device tests and remains the only authority for iOS runtime, Dynamic Type, increased-contrast, and screen-reader evidence.

The policy-v14 generation is rejected as conformance evidence. Its referenced server-log digest does not match the current artifact, its focus traversal records `focus_visible: false` for `Singles condition` while the manifest says visible focus passed, and its web screen-reader pass cites only iOS XCUITest nodes. Engineering added an explicit focus outline to the singles condition selector and strengthened the target contract with the two required web artifacts. A fresh serialized Worker generation must replace—not amend—the rejected generation before any runtime pass is claimed.

The policy-v15 keyboard and visible-focus failures share a captured host diagnostic even though the review summary says `no diagnostic`: `focus-traversal.json` contains only the Next.js HTTP 500 error document, and the server log records `Unexpected end of JSON input` after two successful evidence-route requests. The launcher previously shared `.next` with ordinary Next.js work. It now sets `JARVIS_RUNTIME_EVIDENCE=1`, and `next.config.ts` maps that process to `.next-evidence`; preflight rejects either side of this isolation contract if it drifts. The rejected generation remains historical evidence, and fresh Mac Worker execution is still required to prove keyboard operation and visible focus.

Fresh host evidence then failed `testSealedExpansion` under Dynamic Type, reduced motion, and increased contrast. The test had found the expander through a generic descendant query but then tapped a separate button query without establishing that it was hittable. The bounded repair uses one button element throughout, permits additional scrolling for accessibility layouts, and waits on its final accessibility value and label. Only a fresh serialized Worker run can validate the repair.

The latest compact-iPhone host log refines the native failure to `pricing-search: Hit area is too small`; the corresponding host now uses an explicit 44-point search frame and content shape. The failed VoiceOver log began with utterances from Coin, showing that enabling the system service retained focus in a previously frontmost app. The test now reactivates Phronesis after enabling VoiceOver and verifies foreground/search state before traversal. `tests/jarvis_runtime_evidence.py --preflight` rejects removal of these safeguards. These are source-level readiness checks only: the serialized Mac Worker must rerun the compact baseline, large baseline, large accessibility environment, runtime audit, and VoiceOver transcript before any pass is recorded.
