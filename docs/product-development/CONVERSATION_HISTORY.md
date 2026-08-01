# CTO Product Development Conversation History

## 2026-07-31 — Purchase-Fed Event Flip And Display Case Inventory

The Product Owner defined three operational inventory lanes. General Inventory remains the ownership, acquisition-cost, and broad sealed/supplies control. Every event Purchase must feed an Event Flip panel so a handler can sort exact cards, select several, edit intended Sale prices, and add them to a physical Display Case. Display Case must show what should be exposed, decrease through Sales, increase through purchase allocations, and support rapid end-of-event verification. Binder Inventory must be preserved as a later product lane.

`PHR-STRUCT-20260731-006` assigns `PHR-WORKFLOW-013` and `PHR-WORKFLOW-014`; `PHR-WORKFLOW-015` records Binder intent without premature implementation. Event Flip derives immediately from finalized receipt-backed Inventory rather than copying queue or ownership state. Exact `SINGLE` lots are actionable. Exact sealed, aggregate Bulk, and description-only manual Purchases remain visible but General-only until a separately approved itemization workflow establishes exact identity.

Display Case is a reserved allocation over owned lots. Allocation changes Case-reserved and generally available quantities but not total owned. Prepared Sheet stock remains a separate no-lot source presented beside event flips. Both Event Ledger Sale surfaces share one source-labelled picker. Explicit Case-linked Sales atomically update Case, the underlying General Inventory lot, the Event Ledger, and sold-item evidence; reversal restores both only when later General count evidence has not made restoration ambiguous. Handler price remains intended/list evidence, while the actual whole-Sale amount remains on the Event Ledger.

The implementation adds retry-safe allocation/return, append-only price/movement/count evidence, combined verification CSV, reservation-safe disposition/count/receipt-void guards, dedicated Event Flip and Display Case destinations, and owned/reserved/available presentation in General Inventory. Focused 6/6 and full 290/290 tests, TypeScript, lint, production build, diff hygiene, private health, desktop, and 390px no-overflow/clean-console gates pass. The browser review prompted a full-width phone search and conditional sticky batch bar so the empty state remains unobstructed. No live event was mutated. Product Review, commit, and push remain pending.

The Product Owner then approved a faster Vendor Workspace path: before finalizing an eligible exact-card purchase, the buyer may mark the cart line for Display Case and must enter its intended Case price. The receipt, receipt-backed Inventory lot, initial Case price, and Case reservation must commit together. Cards not selected for Case continue to surface in Event Flip, preserving that workflow as the sorting and exception queue.

The quantity amendment distinguishes acquisition from placement: an exact purchase may contain multiple copies, but direct Case quantity defaults to one and is independently editable only up to the purchased quantity. Any remainder stays generally available and continues to surface in Event Flip.

## 2026-07-31 — Event Stock Control And Intelligent Set Search

The Product Owner directed Phronesis to ingest human-maintained event stock from Google Sheets into local SQL, let sellers choose the exact option at Sale time from either Event Ledger surface, and produce sold plus expected-leftover/physical-verification evidence. The same direction required the catalogue search to understand intent at higher confidence after `Charizard v sh03` failed to find `SWSH03: Darkness Ablaze`.

`PHR-STRUCT-20260731-005` assigns `PHR-WORKFLOW-012` and `PHR-UX-016`. The implemented design uses an owner-scoped native Sheet with exact Item Name, Price, Quantity, Color, and Variation columns, explicit CSV export, strict validation, and a SHA-256-recorded immutable event manifest in local SQLite. Full Event Ledger and Vendor Workspace Quick Sale reuse one exact-option picker and the canonical Event Ledger transaction. Tracked Sale rows atomically append negative movements; reversal appends compensation. Manual lines remain explicitly untracked. Physical counts remain append-only observations, and reports separate whole-Sale actual amount, imported list price, expected leftover, counted quantity, and variance.

Catalogue retrieval and ranking now share one bounded, escaped intent plan. `SH03`, `SH3`, `SWSH03`, and `SWSH3` resolve as the same numbered-set intent, all other logical query tokens remain required, and the UI displays `Understood SH03 as SWSH03` without rewriting or auto-selecting catalogue identity.

The native Sheet, complete disposable import/Sale/count/report/reversal workflow, exact live SH03 result, 10,000-option median search of 29.93 ms, 284/284 tests, TypeScript, warning-free lint, production build, diff hygiene, private health, and 390px no-overflow/clean-console gates pass. No live user event was mutated. Authenticated live Sheet sync, global Inventory allocation, broader typo/OCR interpretation, external transactions, commit, and push remain outside this increment. Same-session Chief Architect conformance passes; Product Review remains pending.

## 2026-07-31 — Vendor Workspace Lite Event Ledger

The Product Owner directed Phronesis to let a buyer record an incidental Sale without leaving Vendor Workspace while retaining Event Ledger as the seller's panel. Both interfaces must feed the same event control.

`PHR-STRUCT-20260731-004` assigns `PHR-UX-015`. Vendor Checkout is now an Event station with default `Purchase intake` and `Quick sale`. The Lite mode records one overall Sale amount, one to 25 manually described item/quantity rows, payment method, and optional note through the canonical active event, authorized `/api/event-ledger`, validation, `PurchaseLedgerRepository`, idempotency, returned summary, and immutable activity. Event start, full activity, cash adjustment, reversal, correction, close, and reconciliation remain exclusively in `/event-ledger`; manual Sales do not mutate Inventory.

An isolated production-runtime review started a $100.00 drawer, entered a two-item $25.50 Cash Sale from Vendor Workspace at 390px, and observed $125.50 expected cash plus $25.50 gross sales immediately in both the Lite panel and full Event Ledger, including both sold-item descriptions. Purchase intake remained present, desktop and phone layouts had no horizontal overflow, required controls met 44px, and the browser console was clean. Full 279/279 tests, TypeScript, lint, production build, diff hygiene, and private-service health pass. Same-session Chief Architect conformance passes; Product Review, commit, and push remain pending.

## 2026-07-31 — Complete Phone Application Shell

During Event Ledger Product Review, the Product Owner asked where the rest of Phronesis was. Inspection confirmed a shared-shell defect: the persistent desktop sidebar was hidden below the `md` breakpoint, but the top bar offered no mobile navigation replacement. The operator could use the current workflow and Search but could not move to another Phronesis destination without editing the URL.

`PHR-STRUCT-20260731-003` assigns `PHR-UX-014`, which now passes the same server entitlement-filtered `navigationItems` list to the desktop sidebar and an accessible phone drawer. The drawer exposes Opportunities, Vendor Workspace, Event Ledger, Market Watch, Inventory, and Settings when authorized, preserves active-route state, and supports explicit close, backdrop, Escape, focus containment/restoration, body-scroll restoration, and automatic desktop-breakpoint dismissal. Search and User remain available at 390px.

Focused navigation tests pass 5/5 and the full suite passes 278/278. Standalone TypeScript, warning-free lint, production build, diff hygiene, private-service health, complete six-route phone navigation, 44–52px touch targets, zero horizontal overflow, desktop recovery, and zero-console-error checks pass. Same-session Chief Architect conformance passes; Product Review, commit, and push remain pending.

## 2026-07-31 — Event Cash Ledger Approval

The Product Owner approved replacing the purchase-only event operating experience with a frictionless Event Cash Ledger. Each event begins with an explicit opening cash amount and one event currency. Operators record Sales and Purchases throughout the event; payment method determines whether an entry affects expected drawer cash. Closing records actual counted cash and exposes the exact over/short variance.

The approved amendment requires every manual Sale to state what was actually sold and permits more than one manually described item in a single Sale. One Sale owns one overall amount plus one to 25 description/quantity item lines. Manual Sales are deliberately independent of catalogue and Inventory identity and do not decrement an Inventory lot. Existing evaluated purchases preserve immutable receipts and Inventory intake and gain one atomic linked cash-ledger entry, avoiding double entry.

`PHR-WORKFLOW-006` is reopened as an approved additive revision under `PHR-STRUCT-20260731-002`. Payment processing, customer CRM, tax, settlement, accounting export, profit claims, multi-currency events, and automatic manual-sale Inventory reconciliation remain outside scope. Implementation and validation proceed automatically through the canonical workflow; Product Review remains the acceptance gate.

Implementation now passes the complete 278-test suite after the separately documented `PHR-UX-014` phone-shell correction, standalone TypeScript, warning-free lint, production build, private runtime health, desktop review, and 390px no-overflow/minimum-touch-target review. Live workflow review proved a two-item cash Sale, a non-cash Purchase that did not alter expected drawer cash, and immutable closing variance; its disposable review records were removed at that gate. Same-session Chief Architect conformance passes. The feature remains Product Review pending and has not been declared CTO accepted.

## 2026-07-30 — LigaMagic/TCGplayer Acquired-Data Validation

The Product Owner deferred listing readiness to the backlog and made LigaMagic/TCGplayer arbitrage validation the immediate priority. Listing readiness is now bounded as `PHR-WORKFLOW-011`: readiness gates, internal reservations, price/margin evidence, draft review, and cancellation, explicitly excluding publication, payment, shipping, repricing, and settlement.

The acquired LigaMagic run `dry-run-20260730T203243818Z` was reconciled against pricing fingerprint `529fe0c52e646b1755700508acaa7580f18547668aae55324f224fd4a9262a9c`. An initial relaxed alias experiment was rejected after it produced unrelated-edition matches. Structural compatibility removed those mappings; price-distribution review then caught Japanese and Retro Frame qualifiers being lost. The accepted algorithm requires two or more unique anchors, one conflict-free target, structural label compatibility, and preservation of language/material-treatment qualifiers.

The accepted result is 71,954 exact plus 14,438 alias mappings: 86,392 matches (39.35% of supported Normal/Foil identities), 86,032 two-sided price pairs, 133,146 supported unmatched rows, zero ambiguities, and 109,763 quarantined Textless rows. Two consecutive builds produced fingerprint `ada5cb0288f45d16636bc3e34aab144709d0ff0b12c9eda629aa5ce6fcff20d2`. Arbitrage now uses delivered/listing TCGplayer evidence for US acquisition and market/listing evidence for US resale. The 261-test suite, TypeScript, warning-free lint, build, private restart, and live API pass. CTO accepts the data-validation checkpoint; candidates correctly remain `IDENTITY_VERIFIED` until owner costs and real executable availability are supplied.

## 2026-07-30 — Inventory Disposition Ledger

The Product Owner directed Phronesis to move on after Inventory reconciliation acceptance. The autonomous workflow selected the roadmap's next declared dependency: explain inventory leaving a lot before listing readiness. `PHR-WORKFLOW-010` adds explicit Sale, Loss, Damage, Transfer Out, and Correction records with known-quantity enforcement and mandatory reasons.

Disposition creation is workspace-idempotent and atomically decrements materialized operational quantity. Sales record gross proceeds plus optional channel/counterparty; transfers require a destination. Reasoned reversal restores quantity without deleting the original record, while a count revision blocks reversal after newer physical evidence. Receipt quantity, approximate intake, acquisition cost, provenance, and prior counts remain invariant. View-only users see the ledger without controls; mutations require `INVENTORY:OPERATE` and server-side ownership checks.

The supported suite passes 259/259, standalone TypeScript, warning-free lint, production build, and diff hygiene are clean. Private 1280×720 and 390×844 review passed with no horizontal overflow or console warnings; the tailnet Inventory route returns HTTP 200. No sample disposition or external transaction was created. Same-session Chief Architect conformance passes and CTO accepts the increment under `PHR-WORKFLOW-002`. Listing readiness is the next inventory maturity step; settlement, accounting, authentication activation, LigaMagic scheduling, and public deployment remain gated.

## 2026-07-30 — Inventory Location And Count Reconciliation

The Product Owner directed Phronesis to continue immediately after receipt-backed Inventory acceptance. The autonomous workflow selected the next declared maturity step: organize lots physically and reconcile counts without changing source receipts. `PHR-WORKFLOW-009` adds normalized workspace locations, visible Unassigned state, derived on-hand quantity basis, and reasoned append-only MOVE and COUNT events.

Operators with `INVENTORY:OPERATE` can atomically move a lot, record a non-negative physical count, or do both. A first count matching intake still establishes COUNTED evidence; an actual repeat no-op is rejected. Zero remains a visible discrepancy. Exact receipt quantity, approximate Bulk intake, acquisition cost, and receipt provenance remain invariant. Voided and foreign-workspace resources fail closed. View-only users receive the inventory view without mutation controls.

The supported suite passes 252/252, standalone TypeScript, warning-free lint, production build, and diff hygiene are clean, and the private 1280px plus 390×844 review passed without horizontal overflow or console warnings. No sample data was added to the live inventory. Same-session Chief Architect conformance passes and CTO accepts the increment under `PHR-WORKFLOW-002`. Sales/disposition rules, required authentication, LigaMagic scheduling, external transactions, and public deployment remain gated.

## 2026-07-30 — Receipt-Backed Inventory Intake

After official FX acceptance, the Product Owner directed Phronesis to continue the development roadmap. The autonomous canonical workflow selected the first Inventory Management capability because the already-approved event purchase ledger contained sufficient product intent and reliable source evidence. `PHR-WORKFLOW-008` now creates one workspace inventory lot per finalized receipt line without requiring duplicate operator entry.

Exact lots preserve catalogue SKU, printing, condition, quantity, unit and total acquisition cost, notes, operator, event, receipt, and timestamp. Bulk remains one aggregate lot with selected product lines and only explicitly approximate count/weight; Phronesis does not manufacture item identities. Checkout and intake are atomic, existing receipt lines reconcile idempotently, and administrative receipt voids preserve but deactivate linked lots with their reason. `/inventory` and `/api/inventory` require the assigned Inventory module and are workspace-scoped.

The supported suite passes, standalone TypeScript, lint, production build, and diff hygiene are clean, and private desktop plus 390×844 review passed with no console warnings or horizontal overflow. The persistent private service was restarted after build verification. Same-session Chief Architect conformance passes and CTO accepts the increment under `PHR-WORKFLOW-002`. Required authentication, daily LigaMagic scheduling, external transactions, and public deployment remain gated.

## 2026-07-30 — Automatic Official BCB PTAX FX

The Product Owner directed Phronesis to make regional FX automatic using official information. `PHR-API-007` now retrieves the latest Banco Central do Brasil PTAX closing USD quotation on authorized regional use, at most hourly, and preserves separate buy and sell evidence. US→Brazil costing uses the official sell quote; Brazil→US costing uses the official buy quote. The provider searches an eight-day period for weekend/holiday resilience, validates the response, coalesces concurrent work, and preserves last-good evidence with a sanitized error on failure.

The private JarvisSSD deployment persisted the July 30 close at buy 5.0733 and sell 5.0739 BRL/USD. Settings makes FX provenance read-only and retains only operating costs as owner inputs. All 245 tests, standalone TypeScript, lint, production build, diff hygiene, live API, desktop, 390px regional-panel, forced-refresh, throttle, and browser-console checks pass. Same-session Chief Architect conformance passes and CTO accepts the increment under the autonomous canonical workflow. Direction-specific costs remain unset, so actionable arbitrage is still gated. No LigaMagic schedule, credential, transaction, dependency, unofficial provider, or public deployment was introduced.

## 2026-07-30 — LigaMagic Authenticated Export Snapshot

The Product Owner defined LigaMagic pricing semantics (`Compra` is the consumer price paid to a store; `Venda` is the store's buy offer) and authorized one supervised export plus a complete non-scheduled dry run across the account's collections. The initial Playwright-launched persistent browser could not support the required login. Read-only inspection of the existing TCGPlayer Pricing Tool established its proven boundary: ordinary Chrome owns manual authentication, and Playwright attaches over CDP only after the saved session exists. Phronesis adopted that pattern without reading or copying Safari/default-browser cookies.

The supervised Lote 1 pilot completed with 9,396 rows and a sanitized trace of the authenticated collection-export POST. It also proved that LigaMagic's shorter `Padrão LigaMagic CSV` is a price-free 13-column format; Phronesis now requires the explicit 19-column collection-model export. A fail-closed Lote 19 discrepancy revealed that collection labels count physical quantity rather than rows: two byte-identical exports contained 8,865 rows whose `Quantidade` summed exactly to 8,938 advertised cards. The contract now records and validates both measures.

The final `PHR-API-005` dry run exported all 37 collections and reconciled 329,976 advertised cards across 329,903 rows. The merged snapshot contains 329,301 unique identities, 602 identical cross-collection duplicates, zero conflicting duplicates, and quantified `Compra`/`Venda` coverage. Raw source hashes, sanitized receipts, manifest, and SQLite evidence remain ignored and local. All 238 tests, standalone TypeScript, lint, diff hygiene, and production build pass. No credential, schedule, canonical pricing activation, scraping, marketplace mutation, push, or deployment occurred. The 03:00 schedule and arbitrage crosswalk remain separate authorization gates.

## 2026-07-30 — Authentication Configuration And Private Publication

### Source

Current CTO chat.

### User Intent

- Configure GitHub OAuth for the invite-only employee identity system.
- Bootstrap the initial owner identity.
- Commit, push, and deploy the accepted development checkpoint before continuing.

### Result

- Rotated authentication credentials are present only in ignored local configuration; no secret or runtime identity database entered repository history.
- The local identity schema is current and the initial owner invitation is pending a live GitHub callback.
- Authentication remains `OPTIONAL` until that callback and resulting owner membership are verified.
- The six-commit implementation branch through `f1a49c5` was pushed as `codex/phr-price-monitoring-20260730`; draft GitHub PR `#5` targets `main`.
- The launch-managed private JarvisSSD deployment was restarted and returned HTTP 200 through loopback and tailnet HTTPS. Five catalogue checkpoints report `CURRENT`, and OAuth initiation produces the canonical GitHub callback URL.

### Acceptance State

CTO authorized publication and private deployment. Canonical merge and required-auth activation remain gated on PR adoption and successful live owner sign-in respectively.

## 2026-07-30 — Store Championship Artwork, Provider Settings, And Login Gate

The Product Owner reported that intelligent catalogue search found the correct Store Championship Urza's Saga but its thumbnail remained blank, directed provider registration/enabling into Settings, and asked what was required to activate Employee login. The artwork failure came from using the user's qualified search text against Scryfall and then requiring equal set labels between Scryfall and the pricing catalogue.

`PHR-API-004-R1` now queries Magic by each visible canonical name and permits provider set-label drift only when exact name plus collector number yields one candidate. The Foil Store Championship SKU now returns and renders the verified Scryfall artwork; the separate Winner product remains a placeholder because no unique provider artwork is available. `PHR-UX-012` makes Settings the provider status/control surface and adds the exact employee-login checklist. Credential entry remains intentionally locked until authenticated owner-only encrypted storage exists, because compatibility mode treats every tailnet request as administrator. Full verification passes 234/234 plus type, lint, build, diff, private runtime, visual, and console gates. External GitHub OAuth application creation and credentials remain the user-controlled activation gate.

## 2026-07-30 — Card-Show Operations Improvement Program

The Product Owner approved autonomous implementation of the previously discussed improvement brief: repair Market Watch refresh, collect target/notes before manual tracking, lay module-scoped employee-login foundations, show recommended offer immediately, add an event purchase ledger with mixed Bulk, and recover missing sealed/First Partner artwork without false identity matches.

The completed program is `PHR-TECH-010`, `PHR-UX-010`, `PHR-ARCH-012`, `PHR-UX-011`, `PHR-WORKFLOW-006`, and `PHR-API-004` under `PHR-STRUCT-20260730-005`. GitHub remains the installed identity proof and required authentication is deliberately activation-gated; passkey lifecycle work is deferred to a separate security decision. Vendor operators may finalize their own receipts, while administrative voids are audited. Vendor Workspace keeps one-action tracking; the composer applies to manual/global additions.

Live verification repaired the reported Urza's Saga failure by reconciling its unique Scryfall “Store Championships” identity to the catalogue's “Game Day & Store Championship Promos” label and refreshing it to `$469.04`. A separate `server-only` import defect that terminated the four-daily observer was also corrected. All 232 tests, standalone TypeScript, lint, build, diff, and private runtime gates pass. JustTCG is configured but still explicitly disabled; eBay and CardTrader credentials are absent. The CTO accepted the completed program automatically under `PHR-WORKFLOW-002`; local feature-branch checkpoint `6c38c1f` was created and nothing was pushed or published.

## 2026-07-30 — Thumbnail Runtime Reliability Remediation

The Product Owner reported blank thumbnails for Mox Opal, Mulan, and several Pokémon results through the private phone review surface. Runtime diagnosis separated honest identity gaps from implementation defects. Scryfall successfully returned Mox Opal search identities but rejected Phronesis's Node image download with HTTP 400 `generic_user_agent`, which the same-origin image route surfaced as HTTP 502. Lorcast contained both requested Winterspell Mulan printings but treated the TCGplayer hyphenated partial title as search syntax and returned no records.

Under bounded `PHR-TECH-007-R1` remediation, provider image downloads now send a stable Phronesis User-Agent and Lorcana provider discovery derives a punctuation-safe query from the first exact catalogue result. Strict set/collector attachment, cache security, pricing, and buying logic are unchanged. The exact Mox request now returns locally retained HTTP 200 JPEG data; `Mulan - res` renders both strict Winterspell artworks. Twelve representative small/normal assets were prewarmed. The remaining Mox special variants and Pokémon foreign-language, code-card, sealed, or ambiguous records retain honest placeholders. Same-session Engineer and Chief Architect evidence passed; CTO accepted the patch for canonical adoption.

GitHub authentication was restored, and PR `#4` merged the remediation with the already accepted `PHR-UX-009` panel normally into `main` at `cd7363f7c0f7fc14c10558cc9569e976f2cc8663`.

## 2026-07-30 — Visible Phronesis Intelligence Panel

After completing Pokémon/Lorcana event readiness, the autonomous roadmap continuation assigned `PHR-UX-009`. Ready Snapshot evaluations now expose the existing Asset Assessment, evidence coverage, confidence, business conclusion, primary signals, opportunities, risks, and current Decision Resolver action. Detailed model evidence remains progressively disclosed through the established Intelligence Console; no intelligence score, formula, provider request, Strategy, Offer Ladder, or decision path was duplicated.

Focused checks pass 6/6, lint/build/diff and application TypeScript pass, the full suite retains exactly 17 established failures with three new passes, and standalone TypeScript retains only the 29 known `TS5097` errors. Desktop 1280px and mobile 390px browser reviews passed with a 44px disclosure target and no horizontal overflow. Same-session Designer and Chief Architect conformance pass. CTO accepted the exact patch for canonical adoption. Riftbound remains deferred.

GitHub PR `#4` merged the accepted panel normally into `main` at `cd7363f7c0f7fc14c10558cc9569e976f2cc8663` together with the bounded thumbnail reliability remediation.

## 2026-07-30 — Pokémon Improvement, Lorcana Activation, And Riftbound Deferral

The Product Owner explicitly deferred Riftbound and directed autonomous continuation through Pokémon improvement, Lorcana acquisition/ingestion, and then the already-approved roadmap. `PHR-TECH-008` added an explicit fail-closed Pokémon set-alias registry, improving representative Pikachu mappings from 12/40 to 25/40. A catalogue-only TCGplayer read produced a 30,531-row Lorcana receipt with SHA-256 `35cc2651ad5b88d6db9d32732652f6fe9dd03b1cf4220af728e4a1aec9cc2814`; 6,243 Lorcana products are now searchable in the private review database.

Runtime verification exposed and remediated a pre-existing local-cache gap: Lorcast returns AVIF, which the cache requested but rejected. Strict AVIF container-brand validation is now implemented; bounded Pokémon and Lorcana results were prewarmed locally. Focused 18/18, lint/build/diff, and desktop/mobile checks pass; the full suite retains exactly 17 established failures and standalone TypeScript retains only the 29 known `TS5097` test-import errors. Same-session conformance passes. Riftbound remains deferred, the dirty Pricing Update Tool repository was not changed, and the next approved product increment is the visible Phronesis Intelligence panel after canonical adoption.

GitHub PR `#3` adopted the exact reviewed patch into `main` as merge commit `a7891cf574aaf05fb4da8ddf7559448c9c1619de`. The private desktop/phone service restarted successfully with its tailnet-only mapping intact; deployed API checks returned 25 strict Pokémon mappings, 30 Lorcana mappings, and Lorcana `CURRENT` at the verified checkpoint. PHR-TECH-008 is complete.

## 2026-07-29 — Product Review Acceptance And Deployment Authorization

The Product Owner accepted the current interdependent Product Review tree, including `PHR-WORKFLOW-004`, `PHR-TECH-005`, `PHR-TECH-006`, `PHR-UI-002`, `PHR-API-002`, `PHR-UX-008`, and `PHR-TECH-007`, and instructed Phronesis to deploy it and continue development. GitHub PR `#1` merged the accepted implementation into `main` at commit `8ed1b98da2879f44976b008e6991588d78f4f49e`; the canonical checkout matched `origin/main`, and the existing private desktop/phone service returned HTTP 200 after merge. Public hosting, Pricing Update Tool mutation, provider-wide bulk acquisition, unofficial Riftbound assets, and new external credentials remain outside that authorization.

## 2026-07-29 — Official Bandai One Piece Artwork And Durable Local Cache

The Product Owner instructed Phronesis to consider Bandai authorization given and requested local image retention. Under `PHR-STRUCT-20260729-006`, the official Bandai English card list became the operational One Piece identity/artwork source and Scrydex became fallback-only. `PHR-TECH-007` adds a same-origin, exact-allowlist durable raster cache under ignored `.data/artwork/` storage; authorization provenance, source identity, retrieval time, length, MIME, and hashes are retained without credentials.

Strict set, card-number, normalized-name, and explicit base/parallel/reprint/SP evidence control matching. Ambiguous variants continue to show placeholders, and artwork cannot change snapshot prices or buying decisions. The 12 unique official artworks mapped by the active `luffy` event search were prewarmed. Focused checks pass 23/23, lint/build/diff checks pass, desktop and 390px phone review pass, and the full suite remains at the unchanged 17-failure baseline with seven additional passing tests. Status is **PRODUCT REVIEW READY**; no upstream mutation, bulk provider catalogue acquisition, commit, push, deployment, or publication occurred. Riftbound remains gated on Riot approval and an app-specific key.

## 2026-07-29 — Cross-Game Thumbnails, Unified Search, And Artwork-First Variants

### User intent

- Find trustworthy thumbnail providers for Pokémon, Lorcana, One Piece, and Riftbound.
- Remove manual catalogue switching; search should automatically cover the relevant catalogues.
- When thumbnails do not visually distinguish finishes, show one result per unique artwork and select foil/holofoil/other finish after choosing the card.
- Determine whether Phronesis Intelligence already has a roadmap for the buying decision dashboard.

### Decisions and implementation

- Assigned `PHR-API-002` and `PHR-UX-008`.
- Connected Pokémon through TCGdex; retained Lorcast for Lorcana and Scryfall for Magic.
- Approved Scrydex as the One Piece candidate subject to Product Owner-owned credentials/terms; required Riot's official API for Riftbound subject to app approval/key.
- Implemented one five-category search, visible game badges, deterministic artwork grouping, and exact Finish-before-Condition selection.
- Registered Lorcana and Riftbound for future verified upstream receipts without changing or triggering the Pricing Update Tool.
- Confirmed that Phronesis Intelligence already executes inside `evaluatePurchase`; documented a separate recommended visible panel that reuses current engine outputs.

### Acceptance state

Implementation, focused verification, desktop/mobile Designer review, and same-session Chief Architect conformance are complete. The package is Product Review ready. Product Owner acceptance, canonical adoption, commit, push, deployment, publication, One Piece credential activation, and Riftbound Riot approval remain pending.

## 2026-07-29 — Event Snapshot Activation And Thumbnails

The Product Owner directed immediate acquisition of the freshest possible snapshot data for the August 1 event and requested thumbnails. Under `PHR-STRUCT-20260729-004`, Engineering recovered the completed July 29 18:20 cycle through read-only local Postgres exports because the observer began after the transient CSVs had been deleted. Magic, Pokémon, and One Piece are now active in the isolated review repository, source evidence is archived, and the persistent observer is following future four-daily completions. The upstream schedule, code, database rows, inventory, prices, and publication behavior were not changed and no extra run was triggered.

`PHR-UI-002` adds fixed thumbnail slots and non-blocking strict Scryfall matching for Magic. The source catalogues supplied virtually no image URLs, so Pokémon and One Piece retain honest placeholders pending an approved identity artwork provider. Focused tests pass 14/14, lint/build/diff checks pass, the full suite retains its established 17 failures, standalone TypeScript retains only the established 27 `TS5097` errors, and desktop/390px review passed without horizontal overflow. Same-session conformance is complete and status is **PRODUCT REVIEW READY**; no commit, push, deployment, public release, or price/inventory mutation occurred.

## 2026-07-29 — PHR-TECH-005 Private Mobile Review Access

The Product Owner requested a quick way to follow and review Phronesis from a phone while away from the Mac. Tailscale was already installed, online, and serving two unrelated private endpoints. Engineering added a third, isolated private handler on HTTPS 9443 that proxies only a loopback Phronesis review server on 3100. A per-user LaunchAgent keeps the review server alive and recovered successfully after a forced child-process termination. The exact private URL passed TLS, 390x844 rendering, stale-data disclosure, catalogue search, lint, focused tests, build, and diff checks. Funnel, public deployment, anonymous access, credentials, existing handlers, commit, push, and live-data activation were untouched. The Mac must remain awake and online, and the phone must join the same tailnet.

## 2026-07-29 — PHR-WORKFLOW-004 Snapshot-Powered Vendor Workspace

### Product intent

The Product Owner directed Phronesis to merge the former Vendor Workspace concept with the new snapshot approach, follow Pricing Update Tool catalogue downloads at their existing four-daily cadence, and pivot the primary device from phone to desktop while retaining mobile as a backup. The autonomous canonical workflow was authorized through implementation, bounded remediation, Designer review, and Chief Architect conformance, with Product Owner interaction reserved for the visible Product Review gate or critical risk.

### Result and decisions

- Assigned `PHR-WORKFLOW-004` under Structure `PHR-STRUCT-20260729-002`.
- Pricing Update Tool remains the schedule/acquisition owner; Phronesis follows verified completion checkpoints read-only.
- Magic, Pokémon, and One Piece catalogues share one strict adapter/repository/search boundary.
- `/vendor` is the desktop-first buying station; `/price-lookup` remains a shared-data compatibility surface.
- Exact snapshot evidence feeds the existing Business Profile, evaluation, offer-ladder, and decision engines.
- Imports are transactional, fail-closed, last-good preserving, and idempotent per completion; later identical catalogues still advance freshness.

### Acceptance state

Implementation, deterministic verification, real-catalog performance, desktop/mobile runtime review, Designer conformance, and Chief Architect conformance are complete. Focused tests pass 34/34, lint/build/diff checks pass, and a 792,927-row Magic catalogue imports in under 15 seconds. The supported full suite reproduces the established 17 behavioral failures, and standalone TypeScript reproduces the established 27 `TS5097` errors. Status is **PRODUCT REVIEW READY**. No commit, push, deployment, public release, or live production data activation has occurred; Product Owner acceptance remains required.

## 2026-07-28 — PHR-UX-007 Bridge-v34 VoiceOver Isolation Recovery

The Product Owner directed canonical Debugger recovery for the preserved assignment `019fa79e-34a1-75e9-9516-99399a01cbcf`. The latest compact-native matrix was rejected as product-defect evidence because its first run was interrupted while system VoiceOver was enabled and its fourth run inherited that device-wide state, preventing ordinary scrolling semantics. Jarvis bridge v34 now verifies VoiceOver OFF before and after every serialized native scenario and enforces finite 120/180-second allowances. Debugger preserved every product change, the authority artifacts, and the assignment identity; no fresh reproducible Phronesis defect justified another source edit. Acceptance remains pending one fresh bridge-v34 matrix, followed by Designer and Chief Architect conformance if it passes.

## 2026-07-28 — PHR-UX-007 Compact Native Evidence Recovery

The latest authority-receipted Worker generation passed complete web semantic evidence and genuine native VoiceOver utterance capture. Its compact iPhone run failed `testSealedExpansion`: the expander remained at approximately y=904 below the viewport, eight 0.08-second drags left the scroll indicator at 0%, and accessibility exposed only the 20-point text-label frame. Debugger fingerprint `phronesis/runtime-evidence/policy-v31-compact-sealed-expander-noop-scroll-v1` now gives the label a full-width 44-point hit target and uses re-resolved interior coordinates with a 0.2-second hold inside the owning `ScrollView`. Focused pricing tests, runtime-evidence preflight, and diff validation passed; native runtime conformance remains unclaimed until serialized Mac Worker validation. No customer-facing pricing behavior changed. The preserved assignment then returns to Designer and Chief Architect conformance if fresh evidence passes.

## 2026-07-28 — PHR-UX-007 Decision-Critical Spoken Semantics Repair

Fresh conformance review accepted the Worker generation's authority and artifact integrity but found that web and native spoken evidence omitted decision-critical result content. Engineering added complete semantic result summaries on web, replaced truncation-prone combined native cards with separately traversable facts, strengthened genuine VoiceOver transcript assertions, and made the VoiceOver test plus complete result content mandatory in the Worker contract. Deterministic checks pass. Accessibility conformance remains unclaimed until a fresh internally coherent serialized Mac Worker generation supplies matching immutable artifacts and hashes.

## 2026-07-28 — Mobile Pricing Lookup

### Source And Intent

Jarvis assignment `019fa79e-34a1-75e9-9516-99399a01cbcf` supplied an approved Product Brief, Chief Architect Structure, and Designer Direction. Ramon needs a phone-first, one-lookup delivered-price reference for English Pokémon singles and sealed product, with movement history and explicit uncertainty.

### Decisions And Scope

- Assigned `PHR-UX-007`.
- One strict file-contract importer and row model serve singles and sealed products.
- SKU plus condition is the price identity; collector number is search-only.
- Change-only SQLite history, FTS-backed repository boundaries, configurable categories and thresholds, market-price movement, and strict sealed-shipping rules preserve the approved architecture.
- Initial bounded configuration is `$20` asking-price threshold, seven-day stale threshold, and `$1.27` assumed single shipping.
- No live extraction, recommendations, fees/profit, deployment, credentials, external mutation, or Pricing Tool change is authorized.

### Dependencies And Acceptance State

The required 200%/400% zoom remediation was strengthened after review: pointer-media emulation is no longer used as the Worker gate. Explicit non-shipping zoom scenario URLs place only the Singles condition panel in normal flow, preserving sticky search and ordinary sticky phone behavior. Focused tests, preflight, scoped lint, and production build pass; fresh serialized Mac Worker evidence is still required before zoom or final conformance can be claimed.

Policy-v26 evidence was internally coherent but did not prove web reduced-motion or increased-contrast behavior and attributed contrast only to native evidence. Engineering added explicit scoped web media-query behavior and a stricter target contract requiring separate web diagnostics, screenshots, and web-scoped manifest results. Focused deterministic checks pass. Final conformance still requires a fresh serialized Mac Worker generation and matching authority receipt; prior evidence was not altered or promoted.

Fresh host evidence subsequently reproduced `testSealedExpansion` at its pre-tap hittability assertion across accessibility-environment runs. The UI test had been swiping the application container rather than the SwiftUI scroll view that owns the expander. Engineering narrowly redirected the bounded scroll loop to that owning scroll view, used slow settled gestures, and added the runtime hierarchy to any remaining failure diagnostic. Product behavior is unchanged and fresh serialized Mac Worker execution remains required.

Engineering implementation and deterministic repository checks are complete. Fresh host-preflight remediation added a local Next.js evidence entry point, a non-shipping executable iOS app/UI-test host, and a project-native machine-readable preflight harness. A subsequent visual retry produced no captures while preserving the assignment. Debugger recovery verified the evidence route in the compiled manifest, pinned the evidence server to Webpack, and added an explicit readiness contract for the isolated browser.

The preserved policy-v10 evidence generation then misclassified web and iOS as not applicable despite listing both in its changed-surface plan and requested a local web entry point that already existed. Later generations reached the route and exercised native targets. Policy v14 is nevertheless rejected as final authority because its referenced server-log hash does not match the artifact, its focus artifact reports the Singles condition selector without visible focus while the manifest says the check passed, and its claimed web screen-reader pass cites only iOS accessibility nodes. Engineering added an explicit selector focus outline and made separate hashed web focus and screen-reader artifacts mandatory in the target contract. One fresh internally coherent serialized Mac Worker generation remains required, and no runtime pass is claimed. Production import certification is blocked on a representative sanitized Pricing Tool export plus authoritative schema/version; columns were not guessed. Locked dependencies were restored offline, relevant local Next.js 16.2.10 guides were read, focused tests/lint/build passed, and the full suite retained its documented 150-pass/17-failure baseline. Designer/Architect conformance and CTO acceptance have not occurred.

Policy v15 then captured keyboard and focus traversal against Next.js's HTTP 500 error document after the evidence server logged an incomplete generated JSON read. Engineering isolated Worker output from ordinary Next.js activity by pairing `JARVIS_RUNTIME_EVIDENCE=1` with `.next-evidence` and made repository preflight enforce both sides. The rejected generation remains historical evidence; fresh Worker execution is still required.

Fresh host review subsequently returned keyboard-operation and visible-focus failures without diagnostics. Engineering added a scoped focus-visible fallback with forced-colors behavior and made separate diagnostic-bearing keyboard and focus artifacts mandatory in the Worker contract. Deterministic checks pass, but runtime conformance remains unclaimed until the Worker produces one fresh coherent generation.

Fresh host evidence later declared 18 native controls but recorded zero forward and reverse Tab targets, so visible focus had no reachable control to inspect. Engineering added a bounded fallback that waits for native Tab behavior and advances in logical DOM order only when focus remains unchanged, plus an opaque `:focus` treatment alongside `:focus-visible`. Repository preflight now guards both repairs. Fresh serialized Mac Worker evidence remains required; no runtime pass is inferred from source.

The next fresh host generation still declared 18 controls but observed zero forward and reverse Tab targets. The unchanged-focus fallback had completed from a zero-delay `keydown` timer, allowing the serialized runner to inspect focus first. Engineering moved unchanged-focus completion to synchronous `keyup` handling while retaining native traversal and a short missing-keyup safeguard. The opaque focus treatment is unchanged. Deterministic verification passes, but keyboard and visible-focus conformance remain unclaimed pending fresh Worker evidence.

Policy v20 again returned `keyboard_operation: fail` with `no diagnostic`. Because focused product checks passed and the host supplied no actionable product trace, Engineering did not mutate lookup behavior blindly. The Worker handoff now requires structured forward/reverse traversal and activation traces plus non-empty failure diagnostics naming the control, key, before/after states, and page URL. Fresh serialized evidence remains required.

Policy v19 then returned contrast and keyboard-operation failures without top-level diagnostics. Its underlying artifacts demonstrated six command-palette labels at 4.12:1 and Space-key failures on Price Lookup disclosures. Engineering raised those labels to zinc-400, added explicit Space operation to the disclosures, and made non-null contrast, keyboard, and focus diagnostics mandatory. Focused checks and production build pass; a fresh serialized generation is still required.

Designer review of a fresh coherent generation then found four bounded defects: only one sealed row appeared before the compact expander, the error scenario also rendered the loaded-category empty state, the search focus artifact lacked a visible indicator, and the large-iPhone evidence used only a special accessibility environment. Engineering restored the approved two-row sealed cap, made error and empty states mutually exclusive, added an explicit opaque search focus outline/ring, and split baseline versus accessibility large-iPhone Worker requirements. Fresh runtime conformance remains unclaimed pending the next serialized generation.

The next host generation's top-level iOS summary obscured two actionable per-device failures. Its compact-iPhone log identified a too-small `pricing-search` hit area, while its failed VoiceOver transcript began in the unrelated Coin app because system assistive focus was not reset after service activation. Engineering gave the evidence-host search field an explicit 44-point target, reactivated and foreground-verified Phronesis before VoiceOver traversal, and added preflight guards for both repairs. Focused checks, lint, and the production build pass; the full-suite and standalone-TypeScript baselines are unchanged. Fresh serialized Mac Worker evidence remains required, so no runtime acceptance is claimed.

Fresh web zoom evidence then failed at 200% and 400%. Its diagnostics ruled out horizontal overflow and isolated every failure to the sticky Singles condition panel covering the Singles heading or first card identity. Engineering added a fine-pointer CSS reflow fallback for the Worker's 640px and 320px desktop zoom viewports while retaining sticky behavior on coarse-pointer phones, updated the evidence contract, and added deterministic guards. Fresh serialized Mac Worker evidence remains required; rejected artifacts are diagnostic history only.

This ledger preserves material product-development context across chat sessions. It does not claim to be a verbatim transcript unless a transcript is explicitly attached and identified. Never store credentials or unnecessary sensitive information here.

## 2026-07-31 — Independent Event Employee Permissions

The CTO directed that Event Ledger and Event Flip be individually selectable for employees in Settings. `PHR-ARCH-012` was enhanced with first-class `EVENT_LEDGER` and `EVENT_FLIP` permissions across invitation editing, timed worker access, navigation, pages, and APIs. Existing Vendor Workspace and Inventory assignments migrate to the corresponding event permission at the same access level to prevent surprise access loss.

## 2026-07-31 — Timed Event Worker Login

### User Intent

- Let event workers access Phronesis for the duration of an event using a system-generated code and no external account.

### CTO Direction

- Assigned `PHR-ARCH-014`: a separate event-bound authentication path with one-time codes, narrow operational module assignments, automatic expiry/event-close invalidation, and owner revocation.
- Permanent GitHub identity remains mandatory for owner/administrator operations; temporary workers never receive Administration or permanent membership.

### Acceptance State

Implemented locally; verification is in progress. Production enforcement remains gated on transition from OPTIONAL to REQUIRED authentication mode.

## 2026-07-28 — Canonical Repository Reconciliation

### User Intent

- Confirm that development from JarvisSSD is connected to GitHub and adequately documented.
- Reconcile the canonical repository after review found unpublished commits, uncommitted governance and relocation records, new shared-workflow artifacts, and stale completion metadata.

### CTO Direction

- Assign `PHR-WORKFLOW-003` to the shared master-workflow adoption and `PHR-TECH-004` to repository reconciliation.
- Operate only from `/Volumes/JarvisSSD/Projects/Phronesis`; retain the former checkout and migration evidence as rollback.
- Record npm as canonical, preserve pnpm artifacts locally without committing them, and exclude `.DS_Store` noise.
- Reconcile documentation, verify the known baseline, create intentional commits, and publish ordinary `main` without rewriting history.

### Acceptance State

Accepted. Documentation and ownership were reconciled under `PHR-TECH-003`, `PHR-WORKFLOW-003`, and `PHR-TECH-004`. Lint, diff hygiene, and Git integrity passed. The supported suite remained at 142/159 with the same 17 behavioral failures, and standalone TypeScript retained the same 27 `TS5097` errors. Commit `b96450b` published the four previously local July commits plus the reconciliation checkpoint to `origin/main` through an ordinary fast-forward. No force push, history rewrite, deployment, dependency installation, rollback cleanup, pnpm deletion, or secret publication occurred.

## 2026-07-28 — PHR-UX-007 Development-Chrome And Stale-Date Repair

Authoritative rendered review rejected otherwise coherent evidence because the Next.js development indicator covered narrow-layout product controls and result text, while the stale scenario showed conflicting category and row snapshot dates. Engineering disabled the indicator only for the isolated evidence runtime, aligned every visible stale fixture price with category-scoped freshness, and added deterministic source/preflight guards. Fresh serialized Mac Worker evidence remains required; production import certification remains blocked on the authoritative sanitized Pricing Tool export schema.

## 2026-07-28 — PHR-UX-007 Sealed Expansion Evidence Repair

Fresh serialized Mac Worker evidence failed the native sealed-expansion UI test. Engineering preserved the assignment and repaired the bounded evidence interaction: the disclosure now toggles explicitly, and the test re-resolves its stable accessibility identifier after SwiftUI inserts the third card and changes the control's frame. Repository-owned deterministic checks cover the contract. No runtime conformance is claimed until the Mac Worker reruns the native target; production import certification remains blocked on the authoritative sanitized export schema.

The next serialized run still failed `testSealedExpansion`. The remaining stale handle was the element captured before the bounded scroll: the test re-resolved only after activation. Engineering now queries by stable identifier throughout scrolling, re-resolves immediately before tapping, asserts the control is hittable and exposes the expected `collapsed` label/value, then independently re-resolves the post-insertion `expanded` state. Deterministic source checks cover both re-resolution boundaries. Fresh serialized evidence remains required.

## 2026-07-28 — PHR-UX-007 Policy-v31 Evidence-Contract Repair

Designer conformance confirmed the authority receipt and all referenced hashes but rejected incomplete zoom diagnostics, a development-runtime-contaminated and duplicate-heavy web spoken sequence, and inconsistent accessible names in keyboard/focus artifacts. Engineering added explicit names for the lookup and condition controls and strengthened the repository-owned Worker contract to require complete zoom measurements and clean product-rooted semantic reading order. No rejected evidence was promoted or modified. Fresh serialized Mac Worker evidence remains required, and production import certification remains blocked on the authoritative sanitized export schema.

Fresh review then showed the zoom artifacts could still report pass with null controls and empty identities while exposing only aggregate zero-intersection counts. Engineering added stable SKU/value probes to every rendered result identity and replaced prose-only zoom diagnostics with an exact schema requiring unique visible controls, positive control/result/field bounds, at least one non-empty identity, and explicit search/condition intersection outcomes for every identity. Runtime conformance remains unclaimed pending a new coherent Worker generation and matching authority receipt.

## 2026-07-28 — PHR-UX-007 Mandatory Zoom Remediation

Fresh review required a source change rather than another evidence-only retry. Engineering found that zoom CSS made search static while its rendered element still carried sticky utility classes, allowing host tooling to continue treating it as an overlay. The bounded repair now structurally removes sticky classes from both search and the Singles condition panel during 200%/400% reflow, exposes separate reflow markers, and requires fresh Worker diagnostics to prove both controls are static/non-sticky, non-intersecting, and free of horizontal overflow. Ordinary phone layouts retain sticky controls. Runtime conformance remains unclaimed pending a fresh serialized Mac Worker generation.

Fresh review kept 200% and 400% zoom failed because sticky/fixed controls could obscure decision content. Engineering found the current zoom CSS also put search into normal flow, contradicting the approved Designer Direction. The bounded repair now keeps search sticky while structurally removing sticky positioning only from the Singles condition panel. Deterministic tests and the Worker preflight require sticky search, static/non-sticky condition state, zero condition/result-identity intersections, and zero horizontal overflow. Focused tests, scoped lint, preflight, diff validation, and production build pass; the established full-suite and standalone-TypeScript baselines are unchanged. Runtime zoom conformance remains unclaimed until a fresh internally coherent serialized Mac Worker generation supplies matching immutable artifacts and hashes.

The final Engineer pass found obsolete search selectors still present in all zoom CSS paths and a Worker contract that still expected `position: static`. Those selectors were removed, the contract now requires sticky search plus zero search/result intersections, and the conflicting Designer text was reconciled. Focused tests passed 10/10, preflight/scoped lint/diff/build passed, and the full suite and standalone-TypeScript checks reproduced the established 152-pass/17-failure and 27-`TS5097` baselines. Fresh Worker evidence remains the conformance gate.

The next authority-receipted generation reached the Price Lookup and passed every recorded web and iOS check except web screen-reader output, whose source accessibility tree was empty and named zero nodes. Debugger recovery identified the repository contract error: `Accessibility.getPartialAXTree` with relatives disabled cannot supply a descendant subtree. The contract now uses `Accessibility.queryAXTree` on the unique `.pricing-lookup` backend node within the navigation page-target session, records query provenance, reconstructs AX order from relationships, and rejects empty output. No customer-facing behavior changed; the same assignment returns to serialized Mac Worker validation before Designer conformance.

## 2026-07-26 — Autonomous Canonical Workflow Direction

### Source

Current CTO chat.

### User Intent

- Preserve the CTO -> Chief Architect -> Engineer workflow while eliminating manual role-by-role prompting.
- Continue approved work autonomously and request user interaction only when critically risky input or a materially consequential product decision is required.

### CTO Direction

- Amend `PHR-WORKFLOW-002` so gates are evidence checkpoints rather than conversational permission prompts.
- Automatically perform role handoffs, bounded remediation, conformance review, and final memory updates within the approved objective.
- Preserve user control over irreversible destruction without recovery, production/public changes outside the objective, secrets and security, force-push/history rewriting, material financial or legal exposure, suspected loss/corruption, and unresolved choices that materially change the requested outcome.
- Do not treat ordinary validation failures, reversible implementation choices, or recoverable migration phases as critical escalation by themselves.

### Acceptance State

Workflow governance updated and effective for subsequent Phronesis work. The role boundaries and documentation-first contract remain mandatory; repeated `Prompt`, `Implement`, `Review`, and `Final Review` commands are no longer required after objective approval.

## 2026-07-26 — Repository Relocation Direction

### Source

Current CTO chat.

### User Intent

- Move Phronesis from `/Users/ramonnogueira/Developer/Phronesis` to `/Volumes/JarvisSSD/Projects/Phronesis` without manually moving or renaming project content.
- Use the most reliable automated method and preserve a rollback path.

### Confirmed State

- The destination exists and is empty.
- JarvisSSD has sufficient capacity.
- The source Git repository is healthy, four commits ahead of `origin/main`, and contains two intentional untracked pnpm artifacts.
- Dependency symlinks and complete local Git state require preservation.

### CTO Direction

- Assigned permanent Feature ID `PHR-TECH-003`.
- `PHR-STRUCT-20260726-001` authorizes a Chief Architect migration specification and Engineer work order only.
- The required strategy is staged copy, verification, atomic cutover, new-path validation, and retention of the source as rollback.
- Migration execution, deletion of the source, push, publication, and external access remain unauthorized pending later CTO gates.

### Acceptance State

Chief Architect specification and Engineer prompt completed. The CTO approved the architecture and `PHR-STRUCT-20260726-002` authorizes execution phases 1–6: preflight, backup/evidence, staged copy, staged verification, atomic cutover, and offline validation. Because the active Codex task remains sandboxed to the old workspace, documentation-path updates are deferred until the user reopens Codex at the destination. Source cleanup, commit, push, publication, dependency installation, and network access remain unauthorized.

Attempt one created and verified the Git bundle but produced an incomplete 1.6 MiB staging copy with only 53 files, an incomplete `.git`, missing dependency content, and broken symlinks. Attempt two correctly classified volatile Codex refs but Apple `rsync -E` again failed on healthy provenance-tagged Git content. Both failures were preserved under quarantine.

The autonomous workflow issued bounded remediation through `PHR-STRUCT-20260726-005`: a macOS pax archive copied the repository while excluding only root `.next/`. Attempt three verified 42,248 files and 811,862,702 bytes, exact Git and content state, zero broken symlinks, matching required metadata, and no missing source extended attributes. `PHR-STRUCT-20260726-006` authorized and completed atomic cutover.

The canonical checkout is now `/Volumes/JarvisSSD/Projects/Phronesis`. The old `/Users/ramonnogueira/Developer/Phronesis` checkout remains intact as rollback. Backup bundles, archives, evidence, and both failed-stage quarantines remain preserved. Offline validation passed Git integrity and lint; the full suite remains at the documented 142-pass/17-failure baseline, and standalone TypeScript retains the documented 27 `TS5097` errors. No dependency installation, network access, commit, push, deployment, source cleanup, or compatibility symlink occurred.

## 2026-07-22 — Checkpoint Stabilization Direction

### Source

Current CTO chat.

### User Intent

- Structure the July 22 stopping-point summary as the next Chief Architect assignment.
- Stabilize and review the uncommitted checkpoint before selecting another product feature.

### CTO Direction

- `PHR-STRUCT-20260722-002` authorizes a read-only Chief Architect conformance review of the complete current working tree under `PHR-WORKFLOW-002`.
- The Architect must reconcile the user-provided historical snapshot with later `PHR-UX-006` and Structure-isolation changes.
- The Architect must return readiness evidence, remediation needs, and a proposed commit/publication sequence.
- Commit, push, deployment, publication, and selection of the next product feature remain unauthorized.

### Acceptance State

Chief Architect review completed with verdict `REQUIRES ENGINEER REMEDIATION`. The CTO accepted the verdict and authorized bounded local verification/test-infrastructure remediation under `PHR-STRUCT-20260722-003`. Engineer evidence was returned, including a supported full-suite command, correction of `TS2367`, package-manager analysis, and truthful disclosure of 17 behavioral test failures, 27 existing `TS5097` errors, and the restricted build environment failure. Final conformance under `PHR-STRUCT-20260722-004` returned `READY FOR CTO ACCEPTANCE`; the remaining failures were classified as visible baseline debt rather than July 22 regressions. The CTO accepted the local checkpoint and `PHR-STRUCT-20260722-005` authorized hunk-level staging plus exactly four local commits. Commit verification found that the four unpublished commits had the correct order and final tree but the governance commit absorbed identity and navigation hunks from shared documents. `PHR-STRUCT-20260722-006` now authorizes a recoverable reconstruction using an exact safety branch and mixed reset. Push, publication, deployment, dependency installation, external access, and product-scope expansion remain unauthorized.

## 2026-07-22 — Structure Command Project Isolation

### Source

Current CTO chat and user-provided screenshot of a Phronesis Chief Architect task.

### User Intent

- Fix the Chief Architect workflow after a bare `Prompt` command resolved to a Muamba Arte Structure document instead of Phronesis authority.

### Confirmed Problem

- Phronesis had role contracts and product memory but no repository-owned canonical Structure file.
- A separate Chief Architect task therefore followed an ambiguous Structure reference, found `CTO-STRUCT-20260722-002` for Muamba Arte, and correctly refused to invent Phronesis scope—but used the wrong source to reach that refusal.

### Decisions

- Extend `PHR-WORKFLOW-002` with strict project isolation.
- Make `docs/product-development/CURRENT_CTO_STRUCTURE.md` the only Phronesis source for bare role commands.
- Require Phronesis identity, repository-root, `PHR-` prefix, and readiness checks before prompts or implementation.
- Reject Muamba Arte, `MA-*`, and other cross-project artifacts unless the CTO explicitly authorizes comparison or import.

### Acceptance State

Implemented on 2026-07-22. Role-contract, Structure identity, command-routing, and cross-project rejection checks passed. Existing Phronesis product behavior was not changed.

## 2026-07-22 — Application Structure

### Source

Current CTO chat.

### User Intent

- Make application structure the next development objective.

### Decisions

- Organize the product lifecycle around Discover, Decide, Monitor, Manage, and Administer (`PHR-UX-006`).
- Expose only operational destinations in primary navigation: Opportunities, Vendor Workspace, Market Watch, and Settings.
- Preserve Purchase Evaluation and opportunity details as contextual routes.
- Keep Manage, Cards, Alerts, Analytics, Inventory, Portfolio, and mobile behavior outside this implementation scope.

### Resulting Artifacts

- `docs/ux/PHR-UX-006-application-information-architecture.md`
- `docs/prompts/PHR-UX-006-implementation-prompt.md`
- `docs/testing/PHR-UX-006-application-structure-validation.md`
- `docs/release-notes/PHR-UX-006.md`
- Typed navigation configuration and focused regression tests.

### Acceptance State

Implemented and accepted on 2026-07-22 through the sequential CTO, Chief Architect, Engineer, conformance, and CTO gates. This was same-session review, not independent approval. Focused tests, lint, production build, TypeScript validation, and diff checks passed.

## 2026-07-22 — Development Resumption and Governance Upkeep

### Source

Current CTO chat. Earlier chat transcripts were not available in the repository and were not reconstructed.

### User Intent

- Resume development after a break of more than ten days.
- Replace the legacy project identity with Phronesis everywhere.
- Review Phronesis against strong documentation practices.
- Install a Canonical Workflow with CTO, Chief Architect, and Engineer roles.
- Make product conversations durable historical memory and use this chat as the CTO interface.
- Consider a clean restart if it produces a materially cleaner application without losing available knowledge.

### Decisions

- Phronesis is the sole canonical repository and product identity (`PHR-ARCH-010`).
- Product development uses the three-role gated workflow (`PHR-WORKFLOW-002`).
- The current primary chat operates as the CTO interface; repository artifacts, not transient chat context, are durable memory (`PHR-TECH-002`).
- Existing Git history and architecture are preserved. A rebuild is not authorized by this upkeep session and requires evidence plus a separate CTO decision.
- Unavailable prior transcripts are an explicit memory gap. They may be imported later only from an authorized source.

### Resulting Artifacts

- `docs/architecture/PHR-ARCH-010-phronesis-product-identity.md`
- `docs/workflows/PHR-WORKFLOW-002-canonical-product-development.md`
- `docs/technical/PHR-TECH-002-product-development-memory.md`
- `.agents/README.md` and `.agents/roles/`
- `docs/reviews/2026-07-22-documentation-practices-review.md`

### Open Questions

- Should the external Git repository and local checkout directory be renamed in a coordinated follow-up?
- Are prior product-development chat exports available for governed import?

### Acceptance State

Implemented and verified on 2026-07-22. Lint, production build, identity scan, traceability checks, role-file checks, and diff checks passed. Standalone `npx tsc --noEmit` exposed a pre-existing test configuration defect (`TS5097` for `.ts` import extensions); Next.js production type checking passed. External GitHub repository and active checkout-directory renames remain a coordinated follow-up.
