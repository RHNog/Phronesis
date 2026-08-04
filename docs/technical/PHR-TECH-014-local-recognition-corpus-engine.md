# PHR-TECH-014 — Local Recognition Corpus And Engine

## Feature ID

`PHR-TECH-014`

## Status

Planned — Blocked By Corpus And Licensing Gates

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

## Acceptance Criteria

- Corpus activation is transactional, checksum-verified, and rollback-capable.
- Benchmark reports top-1/top-k exact-printing recall, accepted precision, review rate, latency, pairing accuracy, and failure strata.
- Every decision is reproducible from corpus, pipeline, model/index, and policy versions.
- No paid or cloud recognition dependency exists at runtime.

## Non-Goals

- Scanner control.
- Automated condition grading.
- Marketplace publication.

## Dependencies

- `PHR-ARCH-015` and accepted `PHR-TECH-013` acquisition evidence.

## Traceability

- Slice plan: `docs/product-development/PHR-LOCAL-CARD-RECOGNITION-20260804-slice-plan.md`.
- Last modified: 2026-08-04.
