# PHR-TECH-014 — Local Recognition Corpus And Engine

## Feature ID

`PHR-TECH-014`

## Status

Calibration Tooling In Progress — Auto-Accept And Licensed Artwork Index Gated

## Priority

High

## Category

Technical / Computer Vision / Identity / Local Data / Testing / Reliability

## Objective

Build a versioned licensed local reference corpus, benchmark harness, evidence-producing recognition pipeline, calibrated confidence policy, and explicit abstention.

## Requirements

- Use English Pokémon (`pokemon-en`) as the first active product lane. The default worker must not query Magic.
- Treat game and language classification as pre-retrieval gates. English Pokémon evidence may proceed; card backs, non-English Pokémon, Magic, unknown game, and unknown language abstain.
- Emit a structured observed identity (probable name, collector number, game, and language) before the retrieval gate so an unsupported-language card can remain visibly identified without acquiring an unsafe English catalogue binding.
- Build Pokémon OCR queries from the probable card-name header and collector fraction when available. Ignore structural headers such as `BASIC`, `STAGE 1`, `STAGE 2`, HP text, and evolution text as names.
- Preserve name, set, collector number, catalogue variant, and language on every candidate so the operator can distinguish exact Pokémon printings and finishes.
- Canonical Phronesis printing and physical-variant identity is source truth.
- Every reference asset records source, license/provenance, checksum, language, set, collector number, finish applicability, and corpus version.
- Derived fingerprints, embeddings, OCR indexes, and local-feature indexes are rebuildable versioned artifacts.
- Recognition stages include validation, region detection, normalization, high-recall retrieval, OCR, geometric verification, game-specific constraints, evidence fusion, and abstention.
- Local Apple Vision requests must bind their main compute stage to an available CPU device. This deterministic compatibility mode avoids a confirmed macOS 27 beta Apple Neural Engine model-compilation deadlock; the existing bounded process timeout remains the final fail-closed guard.
- An immutable ground-truth manifest fixes train/dev/holdout allocation before tuning.
- Condition and price-material finish uncertainty do not silently inherit aggregate identity confidence.
- Auto-accept remains disabled until an unseen holdout supports the approved precision and stratum policy.
- Corpus sources are allow-listed per manifest. Local cache evidence may be indexed for private use only when its recorded provenance permits it; the implementation never grants redistribution rights.
- A corpus bundle contains a canonical JSON manifest, content hashes, immutable train/dev/holdout assignment, and a separately activated derived-index version.
- Recognition accepts zero or more ordered regions per frame and emits candidates without mutating canonical identity.
- Candidate fusion is deterministic. Name, set, collector number, artwork similarity, geometry, language, and finish evidence remain separately inspectable.
- The default policy maps all machine results to `REVIEW` or `ABSTAINED`; `ACCEPTED` requires an explicitly activated benchmark-qualified policy version.
- Originals and derived artifacts have independent hashes. Raw evidence has no automatic deletion in this phase; retention is a later owner policy and storage health must remain observable.

## Acceptance Criteria

- Corpus activation is transactional, checksum-verified, and rollback-capable.
- Benchmark reports top-1/top-k exact-printing recall, accepted precision, review rate, latency, pairing accuracy, and failure strata.
- Every decision is reproducible from corpus, pipeline, model/index, and policy versions.
- Unsupported-language observations can report identity evidence while remaining ineligible for exact English-market resolution.
- No paid or cloud recognition dependency exists at runtime.
- Restarted jobs are lease-safe and idempotent; duplicate frame or region delivery cannot create duplicate assets.
- A failed or expired job may be explicitly requeued only through a session-scoped recovery operation that preserves its attempt history and immutable evidence. Recovery must never requeue completed work or another session.
- A versioned pipeline change can reprocess immutable session evidence append-only; current counts and offer drafts use only the latest active region revision and its latest decision/resolution.
- A benchmark that lacks a powered holdout reports `NOT_QUALIFIED` and cannot activate auto-accept.
- Corpus construction copies source bytes into a content-addressed bundle, emits canonical JSON, and rejects identity leakage across train/dev/holdout partitions.
- The executable benchmark reports top-1/top-k exact-printing recall, accepted precision, review and abstention rates, latency percentiles, pairing accuracy, and failure strata.
- Unknown or restricted provenance may be retained for private review-only experiments, but corpus readiness must report it explicitly and cannot silently authorize redistribution or auto-accept.
- Calibration readiness requires an explicit per-asset recognition-use approval record with approver, timestamp, and scope; a license label or redistribution flag alone is insufficient.

## Non-Goals

- Scanner control.
- Automated condition grading.
- Marketplace publication.

## Dependencies

- `PHR-ARCH-015` and accepted `PHR-TECH-013` acquisition evidence.

## Technical Notes

The first implementation uses a transport-neutral TypeScript domain and repository plus a local macOS Vision worker for OCR and image feature evidence. The Windows bridge continues to supply sealed frames; recognition runs after Mac import. Platform-specific worker failure is represented as failed evidence, never as a guessed identity. On macOS 27 beta, ANE-backed text-model compilation was observed to block inside Vision until the 60-second worker timeout. CPU-bound Vision requests are the approved compatibility path because they keep recognition local and deterministic while preserving the same OCR and feature-print contract.

Runtime authority lives under `.data/card-recognition/` and is ignored by Git. Source-controlled fixtures contain synthetic or explicitly permitted data only.

## Traceability

- Slice plan: `docs/product-development/PHR-LOCAL-CARD-RECOGNITION-20260804-slice-plan.md`.
- Related prompt: `docs/prompts/PHR-TECH-014-local-recognition-corpus-engine-prompt.md`.
- Last modified: 2026-08-06.
- Modification reason: preserve language-safe observed identity separately from exact English-market candidate retrieval.
