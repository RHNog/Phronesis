# PHR Local Card Recognition — Validation

## Automated Gates

- Focused card-recognition tests: pass, 11/11.
- Full Phronesis suite: pass, 404/404.
- Standalone TypeScript: pass.
- ESLint with zero warnings: pass.
- Next.js 16.2.12 production build: pass; scanner page and four card-recognition API routes emitted.
- macOS Vision Swift tests: pass, 2/2.
- Windows bridge tests remain pass: Node 10/10 and PowerShell 13/13 from S1W.

## Real Evidence Replay

- Bundle manifest SHA-256: `723ee7e9be1b91aae5d5e97f3fe55aa8cfe966532ba89b274d27a8647614ad2b`.
- Import: `already_imported`, 18/18 frame hashes retained.
- Repository: 18 frames, 18 active regions, 18 completed jobs, zero pending/failed.
- Final recognition: 18 abstained, zero review/accepted after game gate correction.
- Evidence image endpoint: HTTP 200, `image/jpeg`, 209,102 bytes, SHA-256 `2c50390fd9ab18afda0c0602846044ed82bdbd5776ed0d0d9945ec4dcf72eac8`.

## UI Evidence

- Desktop 1280×720: content width 957px inside the existing shell; no console warnings/errors.
- Phone 390×844: document width 375px, no horizontal overflow, all visible controls 44px high.
- Authenticated scan image loaded at 741×1058.
- Capture, Resolve, Offer, safe abstention, empty offer, and exact counts were visible and text-labelled.

## Calibration Result

`NOT_QUALIFIED`. The current physical scans lack immutable exact-printing ground truth and are not a powered unseen English Pokémon holdout. Auto-accept remains disabled even when a candidate score is high.

## 2026-08-05 Calibration Tooling Validation

- Focused corpus/calibration tests: pass, 7/7.
- Full Phronesis suite: pass, 409/409.
- macOS Vision Swift tests: pass, 2/2.
- Standalone TypeScript: pass.
- ESLint with zero warnings: pass.
- Next.js 16.2.12 production build: pass; 52 pages emitted.
- Diff whitespace validation: pass before documentation closeout.
- Synthetic evidence proves deterministic bundle/report hashes, idempotent bundle construction, no object writes for invalid manifests, canonical identity/object split-leakage rejection, immutable case binding, duplicate holdout-asset rejection, explicit usage approval, and fail-closed `NOT_QUALIFIED` output.

## 2026-08-05 Binder Segmentation Tooling Validation

- Focused region/binder tests: pass, 6/6.
- Full Phronesis suite: pass, 414/414.
- macOS Vision Swift tests: pass, 4/4.
- Standalone TypeScript, zero-warning ESLint, and Next.js 16.2.12 production build: pass; 52 pages emitted.
- Contract evidence covers top-left origin, contiguous reading order, duplicate rejection, bounded IoU, one-to-one label matching, synthetic exclusion, real-label approval, source reuse denial, threshold validation, and deterministic report sealing.
- Real single-card smoke: worker executed successfully but localized an internal rectangle rather than the edge-to-edge card. Result remains `NOT_QUALIFIED`; automatic region adoption is disabled.

## 2026-08-05 Private Operational Validation

- Full Phronesis suite: pass, 415/415, including durable session-state reconciliation.
- ESLint with zero warnings and Next.js 16.2.12 production build: pass; 52 pages emitted.
- Both user LaunchAgents report `running`; the scanner service binds loopback `127.0.0.1:3200` and the worker watches `/Users/Shared/PhronesisScannerBridge/ready`.
- Tailnet-only `:9444` scanner route: HTTP 200. Existing tailnet-only `:9443`: HTTP 200. Existing public `:10000` gateway remains configured unchanged and responds with its expected redirect.
- Live API: session state `REVIEW`; 18 frames, 18 regions, 18 abstained, zero pending, review-candidate, accepted, or failed results.
- Live evidence route: HTTP 200; 209,102 bytes; SHA-256 `2c50390fd9ab18afda0c0602846044ed82bdbd5776ed0d0d9945ec4dcf72eac8`.
- Worker idle-log line count remained 21 before and after a seven-second interval, proving the five-second poll does not emit idle heartbeat spam.
- Browser validation at 390×844: 375px document width inside a 390px viewport, no horizontal overflow, primary buttons at least 44px high, correct `REVIEW` state and exact counts, and zero console warnings/errors.

## 2026-08-05 Pokémon-First Operational Validation

- Full Phronesis suite: pass, 416/416.
- Standalone TypeScript, zero-warning ESLint, Next.js 16.2.12 production build, and diff whitespace validation: pass.
- A safety replay against a SQLite backup of the live store produced the expected eight review results and ten abstentions before the production mutation.
- The authorized live append-only replay created exactly 18 revision-2 regions while retaining all 18 revision-1 regions and decisions. Current live counts are 18 frames, 18 active regions, eight review, ten abstained, zero pending, zero accepted, and zero failed.
- Review frames 1, 3, 5, 7, 9, 11, 13, and 17 produced two exact catalogue-variant candidates each. Their first-ranked identities are Alcremie `071/172` Normal, Geodude `074/165` Normal, Barbaracle `107/196` Holofoil, Pinsir `127/165` Normal twice, Hitmontop `072/172` Normal, Geodude `074/165` Normal, and Drowzee `096/165` Normal.
- Frames 2, 4, 6, 8, 10, 12, 14, 16, and 18 are card backs and abstained. Frame 15 is Spanish Toxicroak and abstained. No unsupported frame queried into a current review result.
- Repeating the same command returned `ALREADY_REPROCESSED` with `regionCount: 0`.
- Mobile browser validation at 390×844 reports a 375px document width, no horizontal overflow, 301×110px candidate choices, and all primary actions at least 44px high. Selecting Reverse Holofoil changed the bound finish from `Normal` to `Reverse Holofoil`; reload restored the first-ranked Normal choice. Browser console logs were empty.
- Persistent scanner and recognition LaunchAgents report `running`. Tailnet-only `:9443` and `:9444` return HTTP 200; the pre-existing public `:10000` Funnel mapping remains unchanged and returns its expected HTTP 307 redirect.

## 2026-08-05 Duplex Evidence Increment Validation

- Node Windows-bridge tests: pass, 12/12. Coverage includes valid legacy `v1`, valid reciprocal `v2`, odd-pair rejection, contradictory-side rejection, marker/hash/path/collision checks, and idempotent import.
- Focused recognition-platform tests: pass, 25/25. A synthetic `v2` import stores two frames, creates only one front region/job, returns the paired back ID in session detail, and serves the exact back object.
- Full Phronesis suite: pass, 418/418. Standalone TypeScript, warning-free ESLint, Next.js 16.2.12 production build (52 pages), and diff hygiene pass.
- Private services were rebuilt and restarted. Loopback `:3200` and tailnet-only `:9444` return HTTP 200; both LaunchAgents are running.
- Live API remains unchanged at 18 legacy frames, 18 regions, eight review, ten abstained, zero pending/accepted/failed. Its first frame truthfully returns `side: UNKNOWN` and `pairedFrameId: null`.
- Browser semantic validation shows `Paired reverse unavailable`, the no-inference explanation, both exact Alcremie variants, `Select condition` as the disabled selected placeholder, the exact-condition pricing action disabled, and no offer line. No live recognition, offer, purchase, inventory, or publication mutation occurred.
- Windows PowerShell bridge self-tests: pass, 15/15 through the running VM's current-user context. The added cases prove reciprocal `v2` sealing and fail-closed rejection of an incomplete duplex pair.
- One supervised low-value `v2` physical capture remains the final acquisition gate; it is not claimed as passed.

## 2026-08-05 Homogeneous Batch Material Validation

- Focused recognition-platform tests: pass, 26/26. Coverage proves required condition/finish validation, canonical Pokémon finish normalization, append-only revisions, idempotent same-value writes, legacy-session configuration, and lock-after-first-resolution behavior.
- Full Phronesis suite: pass, 419/419. Standalone TypeScript, scoped and full warning-free ESLint, Next.js 16.2.12 production build (52 pages), and diff whitespace validation pass.
- Session creation requires one condition and one of `Normal`, `Holofoil`, or `Reverse Holofoil`. Mixed material has no bypass value and must use separate sessions.
- Resolution derives condition and finish from persisted session material rather than client fields. Exact-condition pricing is reloaded and verified against the batch condition, and a candidate whose exact catalogue variant differs from the batch finish fails closed.
- The isolated application and recognition-worker LaunchAgents were restarted from the rebuilt worktree. Loopback `:3200` and tailnet-only `:9444` return HTTP 200; the additive session-material table is present. The current legacy session remains unchanged at eight reviews, ten abstentions, zero resolutions, and no batch declaration.
- Live browser validation at 390×844 reports a 375px document width, no horizontal overflow, 44px minimum visible button height, two batch-condition controls, two batch-finish controls, no per-card finish control, and a fail-closed instruction to configure the legacy batch before resolution.
- Current fixed-light scanner evidence remains unqualified for either condition grading or finish classification. No auto-grade, auto-finish, auto-accept, purchase, inventory, consumer, or publication gate opened.

## 2026-08-05 Offer Consolidation And Lot Total Validation

- Full Phronesis suite: pass, 419/419. Standalone TypeScript, scoped and full warning-free ESLint, Next.js 16.2.12 production build (52 pages), and diff whitespace validation pass.
- Repository coverage proves that two resolutions with the same exact identity/material/snapshot/preset/unit-offer/currency binding consolidate to quantity five and retain two evidence-region IDs.
- A third resolution with a different buying preset remains a separate group, and a fourth BRL resolution remains a third group. The server-authoritative projection reports eight units across four scans with separate BRL 10.00 and USD 7.25 lot totals.
- Unsafe quantity-by-unit-offer multiplication fails before resolution. Consolidated quantities, subtotals, unit counts, and currency totals are also guarded against unsafe integer overflow.
- The projection is read-only: it does not rewrite append-only resolutions and performs no purchase, inventory, publication, or consumer mutation.
- The rebuilt private services were restarted and both LaunchAgents report running. Loopback `:3200` and tailnet-only `:9444` return HTTP 200. The live API returns the new empty offer summary while preserving the legacy session at 18 frames, eight reviews, ten abstentions, zero resolutions, and no batch material.
- Live browser validation at 390×844 reports a 375px document width, no horizontal overflow, 44px visible actions, the exact consolidation explanation, and a truthful empty-offer state.

## 2026-08-05 Authenticated Remote Access Recovery

- Reproduced the phone failure from server digest `1507235227`: the isolated worktree service used its relative authorization database, whose temporary-access schema lacked `phronesis_purchase_event`. Anonymous HTTP probes returned 200 while an authenticated worker-cookie request crashed during authorization.
- Persistently added `PHRONESIS_AUTH_DB_PATH=/Volumes/JarvisSSD/Projects/Phronesis/.data/phronesis-auth.sqlite` to the scanner LaunchAgent, re-registered it, and confirmed the loaded process environment contains the canonical binding.
- Added a repository regression proving a task-scoped temporary grant can be created, redeemed, listed, and authorized without the optional purchase-event table. Event-bound creation still fails closed.
- Focused temporary-access tests: pass, 10/10. Full Phronesis suite: pass, 420/420. Standalone TypeScript, full warning-free ESLint, Next.js 16.2.12 production build (52 pages), and diff whitespace validation pass.
- After the final rebuild/restart, loopback `:3200` and tailnet-only `:9444` return HTTP 200. An authenticated browser session renders Phronesis with the unchanged eight-review/ten-abstention state and no server-error page; the service error log remained exactly 50 lines before and after the authenticated probe.

## 2026-08-06 Physical V2 Import And Vision Recovery

- Physical session `phr-pokemon-duplex-20260806-001` imported 18 frames under an initially incorrect front-first declaration. Nine odd Pokémon-back observations were first scheduled while the nine even card faces remained evidence-only; the orientation correction checkpoint below supersedes that interpretation.
- The first local analysis exposed a macOS 27 beta Vision stall while compiling text recognition for the Apple Neural Engine. Sampling located the wait in `VNRecognizeTextRequest` → ANE compilation.
- Both Vision requests now bind their main compute stage to an available CPU. A real-frame smoke completed in 34.03 seconds inside the existing 60-second worker boundary.
- Session-scoped recovery requeued only failed or expired active jobs, preserved attempts/error history, and did not alter completed work.
- Historical pre-correction truth: session `REVIEW`; nine completed card-back jobs; zero pending, leased, or failed jobs; nine conservative abstentions because no candidate met the review threshold.
- Historical authenticated browser verification showed the inverted labels. The orientation correction checkpoint below records the current durable and visual truth.
- Full repository tests: 424/424. Swift tests: 5/5. Standalone TypeScript, zero-warning ESLint, production build (56 pages), release worker build, and diff hygiene pass.
- Auto-accept, purchasing, inventory, consumer adoption, and publication remain closed.

## 2026-08-06 Back-First Orientation And Review Recovery

- Direct inspection of the first reciprocal pair confirms observation 1 is the Pokémon card back and observation 2 is the Drowzee card face. The verified PaperStream profile order is therefore back-first.
- The live SQLite store was backed up before repair to `card-recognition-before-duplex-orientation-20260806T1606.sqlite`; `PRAGMA integrity_check` returned `ok`.
- The audited correction retained all 18 content-addressed objects, the sealed manifest, reciprocal pair IDs, nine prior decisions, and job history. It appended rejected revisions for the previously active odd observations, flipped the durable side declarations, and created exactly nine new jobs for the even card faces. Repeating the correction is idempotent; a first-time correction after operator resolution fails closed.
- Current durable truth for `phr-pokemon-duplex-20260806-001`: `REVIEW`, 18 frames, nine active FRONT regions on observations 2–18 even, nine completed jobs, eight `REVIEW`, one `ABSTAINED`, zero pending/leased/accepted/failed. Every active front retains the preceding odd observation as reciprocal BACK evidence.
- Original-manifest replay honors the recorded correction and remains `already_imported`; it cannot re-activate the old side assignment or crash the watcher.
- Focused recognition-platform tests: 32/32. Full repository tests: 429/429. Node bridge tests: 13/13. Windows PowerShell bridge self-tests: 16/16 in the active VM console context. Warning-free ESLint, TypeScript through Next.js, production build, and diff hygiene pass.
- The rebuilt private services report running. In the installed Safari WebApp, batches default by creation time, explicit selection restores the physical batch, `Card 1 of 9` advances to `Card 2 of 9`, and `Refresh status` changes the visible completion timestamp while preserving Card 2.
- Visual evidence verifies Drowzee under `FRONT EVIDENCE` and the Pokémon design under `PAIRED REVERSE EVIDENCE`. Auto-accept, automatic grading/finish inference, offer creation, purchasing, inventory, publication, and public exposure remain closed.

## 2026-08-06 Per-Card Material, Valuation, And Front-Only Validation

- Focused recognition/workflow tests: 34/34. Full repository tests: 431/431. Node bridge importer tests: 15/15. Windows PowerShell bridge self-tests: 17/17 in the active VM console context. Standalone TypeScript, warning-free ESLint, Next.js 16.2.12 production build (56 pages), and diff hygiene pass.
- Repository tests prove that a Reverse Holofoil card can retain `LIGHTLY_PLAYED` / `Reverse Holofoil` resolution material while its locked batch defaults remain `NEAR_MINT` / `Holofoil`; the selected finish must still equal the exact catalogue variant.
- Pricing fixtures prove TCG listing-low, TCG market, Liga low, and 80%-of-TCG-Low aggregation with quantity and coverage. USD and BRL remain separate. Regional condition/language provenance remains visible.
- Synthetic `v3` bridge evidence accepts three unpaired fronts, schedules all three exactly once, and rejects a back or pair contradiction. Existing `v1`/`v2` tests remain green.
- The live append-only replay of `phr-pokemon-duplex-20260806-001` completed nine current jobs: Drowzee, Geodude (twice), Hitmontop, Pinsir (twice), Alcremie, Barbaracle, and Spanish Toxicroak are visibly observed; the eight English cards each retain two exact candidates and Toxicroak remains ineligible for an English-market binding.
- Installed Safari WebApp semantic validation shows `Observed identities: 9/9`, `Exact English-market candidates: 8/9`, collapsed reverse evidence, condition and variation controls, automatic valuation, and the server-controlled preset. Selecting Barbaracle Reverse Holofoil changes TCG Low from USD 0.10 to 0.12, TCG Market from USD 0.20 to 0.25, LigaPokemon low from BRL 1.79 to 1.99, and Suggested Offer from USD 0.08 to 0.10 without persisting a resolution.
- The current evidence set is operational proof, not a powered holdout. The requested 9.9/10 target remains a qualification metric; auto-accept is still disabled.
- No physical scan ran while the Product Owner was away. PaperStream profile creation and the optional seven-card simplex acceptance remain supervised because the fi-8170 gate requires a person beside the scanner.
