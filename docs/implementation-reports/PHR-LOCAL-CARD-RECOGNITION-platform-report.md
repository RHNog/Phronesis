# PHR Local Card Recognition — Engineer Report

## Scope

Implemented authorized slices S2-S6 through the conservative Product Review boundary. Auto-accept, licensed catalogue-scale artwork ingestion, automatic binder segmentation, downstream consumer adoption, deployment, and publication remain gated.

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
- No live Phronesis, purchase, inventory, credential, or marketplace state changed.
- No TCGPLAYER Tools source changed; its dirty independent repository was inspected read-only.
- No consumer adapter exposes publication.
- No precision or coverage claim was made from the 138 unlabeled scans.

## Remaining Evidence Gates

- Curate a provenance-approved English Magic corpus and immutable powered holdout.
- Benchmark exact-printing precision/coverage by risk stratum before activating auto-accept.
- Product Owner reviews the visible workflow.
- Consumer projects separately adopt conformance fixtures.
- Deployment, scheduler installation, push, and publication require their own authority.

## 2026-08-05 Calibration Tooling Continuation

- Added `recognition:corpus:build` to hash explicitly supplied local files, create a content-addressed bundle, and emit a canonical manifest without committing image evidence.
- Added immutable canonical-identity and identical-object split leakage rejection before bundle writes.
- Added explicit recognition-use approval evidence; descriptive licensing metadata alone does not make a corpus calibration-ready.
- Added `recognition:benchmark` to validate every case against its immutable corpus asset and emit a deterministic SHA-256-sealed report.
- Added top-1/top-k recall, accepted precision, review/abstention, p50/p95 latency, pairing accuracy, and per-stratum failure metrics with minimum holdout, accepted, and stratum power gates.
- Prevented repeated use of one corpus asset from inflating holdout size.
- Used synthetic test bytes only. No live corpus, runtime, policy, service, or external repository changed.
