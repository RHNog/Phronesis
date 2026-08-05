# PHR-TECH-014 — Local Recognition Corpus And Engine

## Feature ID

`PHR-TECH-014`

## Status

Implemented Foundation — Auto-Accept And Licensed Artwork Index Gated

## Priority

High

## Category

Technical / Computer Vision / Identity / Local Data / Testing / Reliability

## Objective

Build a versioned licensed local reference corpus, benchmark harness, evidence-producing recognition pipeline, calibrated confidence policy, and explicit abstention.

## Requirements

- Canonical Phronesis printing and physical-variant identity is source truth.
- Every reference asset records source, license/provenance, checksum, language, set, collector number, finish applicability, and corpus version.
- Derived fingerprints, embeddings, OCR indexes, and local-feature indexes are rebuildable versioned artifacts.
- Recognition stages include validation, region detection, normalization, high-recall retrieval, OCR, geometric verification, game-specific constraints, evidence fusion, and abstention.
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
- No paid or cloud recognition dependency exists at runtime.
- Restarted jobs are lease-safe and idempotent; duplicate frame or region delivery cannot create duplicate assets.
- A benchmark that lacks a powered holdout reports `NOT_QUALIFIED` and cannot activate auto-accept.

## Non-Goals

- Scanner control.
- Automated condition grading.
- Marketplace publication.

## Dependencies

- `PHR-ARCH-015` and accepted `PHR-TECH-013` acquisition evidence.

## Technical Notes

The first implementation uses a transport-neutral TypeScript domain and repository plus a local macOS Vision worker for OCR and image feature evidence. The Windows bridge continues to supply sealed frames; recognition runs after Mac import. Platform-specific worker failure is represented as failed evidence, never as a guessed identity.

Runtime authority lives under `.data/card-recognition/` and is ignored by Git. Source-controlled fixtures contain synthetic or explicitly permitted data only.

## Traceability

- Slice plan: `docs/product-development/PHR-LOCAL-CARD-RECOGNITION-20260804-slice-plan.md`.
- Related prompt: `docs/prompts/PHR-TECH-014-local-recognition-corpus-engine-prompt.md`.
- Last modified: 2026-08-04.
- Modification reason: advance the approved conservative local recognition foundation while keeping precision and licensing gates fail closed.
