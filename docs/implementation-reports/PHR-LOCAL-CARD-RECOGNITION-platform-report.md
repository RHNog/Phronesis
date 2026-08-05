# PHR Local Card Recognition — Engineer Report

## Scope

Implemented authorized slices S2-S6 and privately activated the conservative scanner-to-offer path on the owner's tailnet. Auto-accept, licensed catalogue-scale artwork ingestion, automatic binder segmentation, downstream consumer adoption, public deployment, and publication remain gated.

## Implementation

- Added transport-neutral scan frame, multi-region, evidence, candidate, and decision contracts.
- Added a content-addressed object store and SQLite repository with idempotent frames, append-only region corrections, recoverable job leases, corpus activation/rollback, operator resolutions, and bound offer drafts.
- Added a local macOS Vision worker for OCR and feature-print evidence with no network dependency.
- Added read-only FTS retrieval against the canonical pricing catalogue, explicit game classification, deterministic candidate policy, review/abstention, and benchmark qualification.
- Added an idempotent Windows batch-folder watcher over the existing sealed bridge.
- Added authenticated scanner session, evidence image, pricing, resolution, and offer APIs plus a responsive Capture/Resolve/Offer Vendor surface.
- Added Recognized Asset Envelope v1, stable checksums, duplicate/staleness validation, and pure TCGplayer, LigaMagic, and LigaPokémon draft adapters.
- Added normalized region correction foundations for later multi-card and binder workflows.

## Real Batch Evidence

The exact sealed bundle with manifest SHA-256 `723ee7e9be1b91aae5d5e97f3fe55aa8cfe966532ba89b274d27a8647614ad2b` imported idempotently as 18 frames and 18 full-frame regions. The first recognition pass surfaced three irrelevant Magic review candidates from Pokémon `BASIC` headers. The game-evidence gate was corrected and the complete batch was replayed from immutable originals. The final result was 18 `ABSTAINED`, zero `REVIEW`, zero `ACCEPTED`, zero `FAILED`, and zero pending jobs. That is the correct fail-closed outcome because this physical batch is Pokémon while the approved first-release recognition lane is English Magic.

## Boundaries Preserved

- No automatic condition grading or finish inference.
- No raw scan or derived runtime object entered Git.
- No purchase, inventory, credential, marketplace, existing `:9443` runtime, or public Funnel state changed.
- No TCGPLAYER Tools source changed; its dirty independent repository was inspected read-only.
- No consumer adapter exposes publication.
- No precision or coverage claim was made from the 138 unlabeled scans.

## Remaining Evidence Gates

- Curate a provenance-approved English Pokémon corpus and immutable powered holdout.
- Benchmark exact-printing precision/coverage by risk stratum before activating auto-accept.
- Product Owner reviews the visible workflow.
- Consumer projects separately adopt conformance fixtures.
- Public deployment, push, and publication require their own authority.

## 2026-08-05 Private Operational Activation

- Built and installed a persistent local recognition worker and an isolated loopback Next.js scanner-review service under user LaunchAgents.
- Exposed only the isolated service through tailnet-only HTTPS at `:9444`; the existing private `:9443` runtime and public `:10000` Funnel were preserved.
- Reconciled session state from durable jobs and resolutions. This corrected a stale `PROCESSING` badge after all work completed and prevents an idempotent bundle reimport from regressing a terminal session.
- Live session `phr-card-test-20260804-002` reports `REVIEW`, 18 frames, 18 regions, 18 abstentions, and zero pending/review-candidate/accepted/failed results.
- The recurring watcher is quiet while idle, recovers expired leases, and retains its dedicated recognition SQLite store with owner-only file permissions.

## 2026-08-05 Calibration Tooling Continuation

- Added `recognition:corpus:build` to hash explicitly supplied local files, create a content-addressed bundle, and emit a canonical manifest without committing image evidence.
- Added immutable canonical-identity and identical-object split leakage rejection before bundle writes.
- Added explicit recognition-use approval evidence; descriptive licensing metadata alone does not make a corpus calibration-ready.
- Added `recognition:benchmark` to validate every case against its immutable corpus asset and emit a deterministic SHA-256-sealed report.
- Added top-1/top-k recall, accepted precision, review/abstention, p50/p95 latency, pairing accuracy, and per-stratum failure metrics with minimum holdout, accepted, and stratum power gates.
- Prevented repeated use of one corpus asset from inflating holdout size.
- Used synthetic test bytes only. No live corpus, runtime, policy, service, or external repository changed.

## 2026-08-05 Binder Segmentation Benchmark Tooling

- Added `detect-regions` to the local macOS Vision worker with versioned JSON, top-left normalized coordinates, confidence, orientation, duplicate suppression, containing-page suppression, and deterministic row-major order.
- Added a strict TypeScript worker boundary; malformed origin, geometry, confidence, order, and high-IoU duplicates fail closed.
- Added `recognition:regions:benchmark` with one-to-one IoU matching, precision, recall, exact-count rate, matched IoU, p95 latency, failure strata, and deterministic report sealing.
- Real qualification requires unique source-frame and label hashes plus explicit labeling approval. Synthetic cases are counted but excluded from qualification.
- A real edge-to-edge card scan with SHA-256 `ec25cf42ee3ebec05cc8129c55b58a163146ae2e4b24623b5081e4572ee4f637` produced one small landscape suggestion at `(0.227963, 0.220926, 0.186268, 0.142377)`, visibly corresponding to internal artwork rather than the whole card. This is retained as negative evidence; no tuning exception or production activation followed.
- No suggestion was written to the repository and no UI, runtime, deployment, or external state changed.

## 2026-08-05 Pokémon-First Operational Revision

- Changed the default worker lane from English Magic to English Pokémon (`pokemon-en`). Magic retrieval remains available only when an explicit non-default category is supplied.
- Added pre-retrieval English-language gating, Pokémon header normalization, collector-fraction extraction, and name-plus-collector catalogue queries. Card backs, Spanish Pokémon, Magic, and insufficient game/language evidence abstain before catalogue access.
- Preserved name, set, collector number, variant, and language on each candidate. The mobile Resolve step now presents every returned catalogue SKU as an explicit labelled choice and binds the read-only finish field to that exact choice.
- Added server-side validation that the submitted finish matches the chosen catalogue candidate.
- Added an append-only, reason-bound session reprocessing command. Current counts, review items, resolutions, and offer drafts use only the latest active region revision; historical decisions remain auditable.
- Reprocessed live session `phr-card-test-20260804-002` from immutable evidence. The repository now retains 18 revision-1 regions and decisions plus 18 revision-2 regions and decisions. Current truth is eight `REVIEW`, ten `ABSTAINED`, zero pending, zero accepted, and zero failed.
- The eight review results are Alcremie, Geodude, Barbaracle, Pinsir, Pinsir, Hitmontop, Geodude, and Drowzee. Nine card backs and the Spanish Toxicroak abstained.
- Repeating the same replay returned `ALREADY_REPROCESSED` and created zero additional regions. Auto-accept, purchases, inventory mutation, downstream publication, and active binder segmentation remain disabled.
