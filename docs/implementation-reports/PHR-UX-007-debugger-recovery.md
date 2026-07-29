# PHR-UX-007 Debugger Recovery Report

Date: 2026-07-28
Assignment: `019fa79e-34a1-75e9-9516-99399a01cbcf`
Feature: `PHR-UX-007`
Checkpoint: Mac Worker runtime evidence before Designer conformance

## Preserved State

The approved Product Brief, PHR-UX-007 implementation, working-tree patch, target contract, prior evidence manifest, authority receipt, and failed evidence artifacts remain intact. This recovery does not create a replacement assignment, change product behavior, or repeat completed engineering discovery.

## Externally Interrupted Native Matrix Recovery

Failure fingerprint: `phronesis/runtime-evidence/policy-v31-external-native-matrix-interruption-v1`.

The latest authority-receipted generation is internally consistent as a failed attempt, not as product conformance. Its web surface passed, its second, third, and fourth native scenarios passed, and its first compact-iPhone run passed the named-control/runtime-accessibility and sealed-expansion tests before Xcode recorded `BUILD INTERRUPTED` while entering the VoiceOver test. The repeated `debugger version lookup failed` and `no debugger version` lines are incidental host diagnostics; they do not identify a Phronesis assertion failure. The same generation's fourth compact-iPhone scenario subsequently captured 32 genuine VoiceOver utterances and passed all tests, further isolating the failure to the external interruption rather than product source.

The smallest reversible correction is evidence control: keep this manifest and matching authority receipt as rejected historical evidence, preserve the unchanged implementation and all completed artifacts, and return the same assignment to one fresh serialized Mac Worker generation after the bridge restart. Do not merge passing scenarios across generations and do not mutate product or evidence-test source for this fingerprint. A fresh generation must replace the interrupted matrix atomically before Designer conformance resumes.

## Bridge-v34 VoiceOver Isolation Recovery

Failure fingerprint: `phronesis/runtime-evidence/policy-v31-device-voiceover-state-leak-v1`.

The preserved matrix is not a clean reproduction of a Phronesis scrolling defect. The first compact run was interrupted while system VoiceOver was enabled, and the fourth compact run inherited that device-wide state. The logs record the resulting sealed-expander failure with the scroll indicator fixed at 0%, but they do not establish ordinary touch behavior because VoiceOver changes gesture semantics globally. This environmental fingerprint supersedes the earlier product-defect attribution for this generation; the authority receipt and rejected artifacts remain preserved unchanged.

Jarvis bridge v34 now resets and verifies VoiceOver OFF before and after every serialized native scenario and supplies finite 120-second default and 180-second maximum allowances. The existing Phronesis test already uses a bounded coordinate drag inside the owning `ScrollView`, exposes a full-width 44-point expander target, and re-resolves the control after layout mutation. No genuinely fresh reproducible product defect remains to correct, so no product or evidence-source file was changed.

The same assignment returns to one fresh serialized bridge-v34 native matrix. If that isolated matrix passes, continue automatically to Designer and Chief Architect conformance. If it produces a new source-level diagnostic with VoiceOver verified OFF, treat that as fresh evidence and perform only the smallest bounded repair. Runtime conformance remains unclaimed until the Mac bridge records a new manifest and matching authority receipt.

## Compact-iPhone Sealed-Expansion Recovery

Failure fingerprint: `phronesis/runtime-evidence/policy-v31-compact-sealed-expander-noop-scroll-v1`.

The latest authority-receipted Worker generation supersedes the earlier accessibility-tree blocker. Web semantic evidence passed with complete decision facts, and genuine `XCUIVoiceOverService` output passed the complete transcript assertion. The combined screen-reader gate failed because the compact iPhone native run failed `testSealedExpansion`, and the Worker propagated that one suite failure across native accessibility results.

The compact log proves the sealed expander existed at `y=903.7`, below the 844-point viewport, while eight 0.08-second coordinate drags left the scroll indicator at `0%`. The accessibility hierarchy also exposed only the 20.3-point text-label frame, despite the intended 44-point wrapper. The smallest correction makes the label itself a full-width 44-point hit target and strengthens the bounded drag inside the same owning `ScrollView` to use re-resolved interior coordinates with a 0.2-second hold. The test still requires the expander to become hittable before tapping and then requires its expanded value and label. The evidence host's hierarchy, content, and product semantics are unchanged.

Focused pricing tests, the repository runtime-evidence preflight, and diff validation passed after the correction. Those checks establish source and contract readiness only; native runtime conformance is not inferred. Next accountable role: serialized Mac Worker validation of the preserved assignment, followed by Designer conformance if the fresh generation and matching authority receipt pass.

## Failure Fingerprint

`phronesis/runtime-evidence/v10-target-contract-discovery-race-v1`

The `jarvis.runtime-evidence-policy/v10` manifest recorded at `2026-07-28T08:26:59Z` correctly identified both `web` and `ios` in its changed-surface plan, but then marked both surfaces not applicable and requested `a locally renderable web entry point`. That conclusion conflicts with the preserved repository and host evidence:

- `tests/jarvis_runtime_evidence.py` already declared a safe `jarvis.runtime-evidence-targets/v1` Webpack target, loopback URL, readiness status/text, timeout, and deterministic scenarios before the v10 manifest was recorded.
- `jarvis-changes.patch` includes the evidence route, target contract, and `evidence:web` command.
- The subsequent isolated smoke log shows Next.js 16.2.10 starting with Webpack and three successful `GET /price-lookup/evidence?scenario=sealed` responses, all `200`.
- The Jarvis Mac bridge was updated immediately after that manifest to runtime-evidence policy v12 and recovery revision 16. The current Worker explicitly accepts safe project runtime-target contracts and owns the isolated headless probe for them.

Root cause is therefore a control-path timing race: the v10 Worker classified Phronesis before safe project runtime-target discovery was available. It is not a missing Phronesis route, a Next.js render failure, or a customer-facing Pricing Lookup defect.

## Smallest Reversible Correction

No duplicate static site, second evidence route, product-code change, or alternate browser launcher was added. The repository-owned target contract already satisfies the current v12 Worker boundary, and the platform now owns the missing discovery and isolated-capture capability.

The correction for this assignment is to preserve the existing contract, suppress another Phronesis source retry for this fingerprint, and return the same assignment to serialized Mac Worker validation under policy v12. A fresh v12 fingerprint is required because the previous authority receipt is bound to policy v10 and an empty capture set.

## Validation And Handoff

`git diff --check` passed after the recovery documentation update. In accordance with the Debug Room contract, this turn did not run npm, tests, lint, a build, Xcode, a browser, a simulator, or deployment. Runtime validation remains exclusively owned by the serialized Mac Worker.

Next accountable role: Engineer verification through one fresh Mac Worker v12 runtime-evidence run. If the target contract is accepted and captures pass, continue automatically to Designer conformance and then Chief Architect conformance. If the identical v12 fingerprint fails again without new diagnostics, treat it as a Worker control-path failure and do not mutate Phronesis product code blindly.

Escalation status: none. No product choice, credential, purchase, external publication, destructive action, or scope expansion is required.

## 2026-07-28 Development-Chrome And Freshness-Coherence Recovery

Failure fingerprints:

- `phronesis/runtime-evidence/policy-v32-next-dev-indicator-obscures-content-v1`
- `phronesis/runtime-evidence/policy-v32-stale-fixture-date-incoherence-v1`

The authority receipt, assignment ID, implementation fingerprint, policy revision, manifest digest, and all 92 referenced artifact hashes were coherent. The rendered pixels were not conformant. At narrow web widths, Next.js's bottom-left development indicator covered product content and controls, visibly clipping `View all conditions`. In the stale scenario, the category freshness line reported `snapshot Jul 1` while the visible result reported `Snapshot Jul 27` and movement since Jul 20. Both findings are evidence-host defects; neither is a pricing-domain or layout-spacing defect.

The smallest reversible correction is scoped to the isolated evidence environment. `next.config.ts` sets `devIndicators` to `false` only when `JARVIS_RUNTIME_EVIDENCE=1`, leaving ordinary development and production behavior unchanged. `lib/pricing/evidenceFixtures.ts` applies the stale category date to every visible price and clears prior-snapshot movement for that bounded fixture. The preflight contract and focused regression test reject removal or drift of either safeguard. Moving the framework indicator, adding product padding, or hiding product controls was rejected because each would preserve an avoidable overlay or change the customer surface.

The interrupted Engineer recorded 15/15 focused pricing tests passing, the runtime-target preflight passing with zero errors, and scoped lint passing after this source correction. In accordance with the Debug Room execution boundary, this Debugger pass did not run npm, tests, lint, build, Xcode, a browser, a simulator, or deployment. Source inspection and the preserved deterministic receipts establish repair readiness only; fresh rendered evidence remains mandatory.

Next accountable checkpoint: return assignment `019fa79e-34a1-75e9-9516-99399a01cbcf` to its interrupted Chief Architect verification path through one fresh serialized Mac bridge evidence generation, followed by Designer conformance and then Chief Architect conformance. Rejected policy-v32 captures remain historical evidence and must not be amended or promoted.

Escalation status: none. The correction is reversible, technical, and inside the approved Product Brief; it introduces no product choice, credential request, purchase, external publication, destructive action, or scope expansion.

## 2026-07-28 Empty Web Accessibility Artifact Recovery

Failure fingerprint: `phronesis/runtime-evidence/policy-v31-empty-scoped-ax-tree-v1`.

The authority-receipted fresh generation reached the Price Lookup and passed every other recorded web and iOS accessibility check, but `screen-reader-output.json` contains `reading_order: []`, `spoken_sequence: []`, and `named_nodes: 0`; its source `accessibility-tree.json` is exactly `[]`. The artifact also identifies `Accessibility.getFullAXTree`, contradicting the repository's scoped-capture requirement.

Root cause is a repository contract error compounded by a Worker fallback. `Accessibility.getPartialAXTree` with `fetchRelatives=false` returns only the addressed accessibility node, not the complete descendant subtree the contract requires. The smallest correction changes the scoped operation to `Accessibility.queryAXTree` on the unique `.pricing-lookup` backend node, requires accessibility enablement and all DOM/AX commands to run on the navigation page-target session, reconstructs depth-first order from AX relationships, and fails immediately on an empty result. No product source or behavior changed, and the rejected generation remains untouched.

Validation ownership remains with the serialized Mac Worker. This Debugger turn changed the repository-owned evidence contract, its deterministic regression guard, validation plan, release notes, and implementation reports, but did not run npm, lint, tests, builds, Xcode, browsers, simulators, deployment, or publication. Return the same assignment to Mac Worker evidence generation, then Designer conformance if the new authority-receipted generation passes.

## 2026-07-28 Engineer Remediation From Fresh Host Evidence

The policy-v12 Mac Worker reached and executed the iOS UI-test target on both named devices. The `rsSnapshot: no debugger version` lines were incidental Xcode diagnostics; the actionable failures were a near-threshold contrast audit, controls outside the current accessibility viewport at accessibility-extra-extra-extra-large text, and an expander assertion that retained the pre-render element reference.

The bounded repair gives evidence copy primary contrast, uses an opaque system card surface with a visible border, exposes explicit expanded/collapsed accessibility values, and makes UI-test discovery scroll through the Dynamic Type layout only when a named control is not discoverable. The expansion test re-queries the button after SwiftUI updates it and verifies both its value and label.

Fresh host evidence then showed that the large Dynamic Type run found all three named controls before the test runner exited immediately after the first unconditional downward swipe. The compact run passed the same test. The debugger-version messages were incidental Xcode diagnostics. The smallest follow-up removes those unnecessary reset swipes and leaves the audit at the stable initial viewport; named-control discovery retains its bounded upward scrolling fallback. Engineering did not launch Xcode, a simulator, or an ad-hoc renderer; fresh runtime disposition remains owned by the serialized Mac Worker.

## 2026-07-28 Interrupted VoiceOver Run Evidence-Durability Recovery

Failure fingerprint: `phronesis/runtime-evidence/policy-v31-interrupted-voiceover-tail-v1`.

Preserved authority receipt `ac27831344d797f89a1277273087f9b411878112ab7b136f99e73539756a17f6` recorded `remediation_required` for `accessibility screen_reader_output`. The web half of that check is already satisfied. The iOS half failed on a single device run.

Reading the preserved host logs isolates it precisely. Runs 2, 3 and 4 each executed two tests, passed, and produced screenshots. Run 1 (`iPhone 17e`, content size `large`) executed all three tests: `testNamedControlsAndRuntimeAccessibility` passed in 10.954s, `testSealedExpansion` passed in 13.432s, and `testVoiceOverProducesRealUtterances` was still in flight when `** BUILD INTERRUPTED **` terminated xcodebuild. The recorded `IDELaunchParametersSnapshot` lines are incidental Xcode diagnostics, consistent with prior findings, and are not the failure.

The substantive finding is that run 1's VoiceOver evidence was already complete when it was discarded. The log shows all 32 utterances captured and `Added attachment named 'VoiceOver utterance transcript'` at t=38.96s. The external interruption landed in the tail of the test, after the evidence existed, and the run was still recorded `status: fail` with `screenshot: null`.

Root cause is an evidence-durability defect owned by this repository, not a product defect and not a Pricing Lookup behavior change. `testVoiceOverProducesRealUtterances` drove the full 64-move VoiceOver traversal even after the transcript had stopped yielding new utterances, and serialized its transcript only after every content assertion. Both choices widen the window in which an interruption, or any single assertion failure, destroys a transcript that has already been captured in full.

The smallest reversible correction, in `ios/PhronesisEvidenceUITests/PhronesisEvidenceUITests.swift`:

- The traversal exits early after four consecutive duplicate utterances, and only once the transcript already carries every decision-critical phrase. The 64-move ceiling is retained unchanged as the upper bound, so the early exit can never stop before the evidence is sufficient.
- The transcript is serialized and attached immediately after collection, before the content assertions, so an interrupted or failing run still yields the captured transcript.
- The VoiceOver system service is released as soon as traversal completes rather than at teardown, so an interrupted run cannot leave VoiceOver enabled for the following device run.
- The traversal's sufficiency check and the assertions read one shared `decisionCriticalPhrases` list, so the early exit and the pass criteria cannot drift apart.

`tests/jarvis_runtime_evidence.py` gains matching preflight guards: markers for `consecutiveDuplicateUtterances`, `transcriptCarriesDecisionFacts` and `decisionCriticalPhrases`, plus a positional check that `add(attachment)` precedes the first `spokenDecisionFlow` assertion. The existing `for _ in 0..<64` marker is preserved.

No Pricing Lookup product source, pricing rule, grouping rule, shipping rule, condition rule, or history rule changed. No prior passing evidence was altered or reused as if fresh.

Validation ownership remains with the serialized Mac Worker. This Debugger turn did not run npm, lint, tests, builds, Xcode, browsers, simulators, deployment, or publication. Because the implementation fingerprint has now changed, reuse of the interrupted capture no longer applies and a fresh generation is required.

Next accountable role: Engineer verification through one fresh Mac Worker runtime-evidence run, then Designer conformance and Chief Architect conformance if it passes.

Escalation status: none. No product choice, credential, purchase, external publication, destructive action, or scope expansion is required.

## 2026-07-28 Evidence-Guard Reproducibility Recovery

Failure fingerprint: `phronesis/runtime-evidence/validator-guard-not-repository-owned-v1`.

The preceding attempt implemented the bounded repair — a repository-owned validator that rejects legacy count-only zoom passes and raw or unscoped accessibility dumps — and paused on the provider boundary while running that validator's own regression guard. The pause was a routine technical operation inside this assignment workspace, not a product decision, so this turn continued it.

The guard now runs and passes. `python3 -m unittest jarvis_runtime_evidence_test -v` executes four tests: complete zoom measurements are accepted, a legacy count-only zoom pass is rejected on all three of its missing structured records, a pruned semantic sequence is accepted, and raw `StaticText` nodes with duplicated spoken utterances are rejected. `python3 tests/jarvis_runtime_evidence.py --preflight` reports `status: pass` with no errors.

Running it exposed the actual durability defect. `tests/jarvis_runtime_evidence_test.py` was untracked, and no repository-owned command invoked it. The guard that proves the evidence validator cannot regress was therefore invisible to a fresh checkout and to the serialized Mac Worker's deterministic validation order — the same class of defect as the interrupted-capture finding above, one layer up.

The smallest reversible correction:

- `tests/jarvis_runtime_evidence_test.py` is added to the repository index alongside the validator it guards.
- `package.json` gains `evidence:validator-test`, running `python3 -m unittest discover -s tests -t tests -p jarvis_runtime_evidence_test.py -v`. The discover form is cwd-independent and was verified from the repository root, so the Worker can sequence it beside `evidence:preflight` and `evidence:validate` without a directory change.

No Pricing Lookup product source, pricing rule, grouping rule, shipping rule, condition rule, or history rule changed. No validator assertion was weakened; the guard's four tests are unchanged. No prior evidence was altered or reused as if fresh.

This Debugger turn ran only the Python validator and its unit tests. It did not run npm, lint, the Node test suite, builds, Xcode, browsers, simulators, deployment, or publication.

Next accountable role: Engineer, resuming the product validation suite under the serialized Mac Worker, then Designer conformance and Chief Architect conformance if it passes.

Escalation status: none. No product choice, credential, purchase, external publication, destructive action, or scope expansion is required.
