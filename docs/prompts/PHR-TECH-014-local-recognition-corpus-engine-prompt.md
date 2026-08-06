# PHR-TECH-014 — Implementation Work Order

## Project Context

Implement the local, evidence-producing recognition foundation described by `PHR-TECH-014`. Documentation is authoritative and implementation must fail closed.

## Feature ID

`PHR-TECH-014`

## Required Reading

- `docs/architecture/PHR-ARCH-015-local-card-acquisition-recognition-platform.md`
- `docs/technical/PHR-TECH-014-local-recognition-corpus-engine.md`
- `docs/product-development/PHR-LOCAL-CARD-RECOGNITION-20260804-slice-plan.md`

## Implementation Requirements

- Make `pokemon-en` the first active recognition lane and record a Pokémon-specific pipeline version; the default worker must not query `magic-en`.
- Gate retrieval on observed Pokémon plus English evidence, ignore Pokémon structural header/HP/evolution text as card names, and search by probable name plus collector fraction before name-only fallback.
- Persist a pre-retrieval observed identity with probable name, collector number, game, and language even when the exact market lane abstains.
- Persist candidate name, set, collector number, catalogue variant, and language for exact operator review.
- Add append-only, idempotent session reprocessing for pipeline changes and ensure summaries/offers use only the latest active region revision.
- Add shared acquisition/region/recognition contracts and strict validators.
- Add a durable SQLite repository and content-addressed object layout with idempotent writes, leases, revisions, and decision evidence.
- Add manifest/checksum validation, transactional active-corpus pointer, rollback, and immutable split assignment.
- Add a deterministic candidate-fusion policy and benchmark reporter with explicit `NOT_QUALIFIED` output.
- Add a deterministic corpus-bundle builder that hashes source bytes, writes canonical manifests, and rejects cross-split identity leakage.
- Add an executable calibration runner with sealed reports for top-1/top-k recall, accepted precision, review/abstention, latency, pairing accuracy, and failure strata.
- Expose corpus and benchmark commands without bundling real card images or weakening provenance requirements.
- Add a local macOS Vision worker boundary for OCR and feature evidence; worker errors abstain.
- Bind Apple Vision request compute stages to an available CPU device so macOS 27 beta cannot strand the queue in ANE model compilation; retain the bounded process timeout and fail closed when CPU execution is unavailable.
- Add an explicit session-scoped recovery command for failed or expired recognition jobs. Preserve attempt counts and immutable evidence, reject completed jobs, and never mutate jobs outside the named session.
- Default all machine output to review or abstention until a qualified policy is explicitly activated.

## Constraints

- Preserve review-only policy; do not add Spanish or other game/language lanes in this increment.
- No cloud or paid runtime recognition, raw evidence in Git, redistribution-right assumption, automatic condition grading, or external publication.
- Do not mutate the live runtime database during tests.

## Testing Expectations

- Contract, Pokémon/language gating, name/collector retrieval, exact variant evidence, append-only reprocessing, latest-revision counts/offers, geometry, content-addressing, idempotency, lease recovery, session-scoped failed-job recovery, CPU compute-device selection, manifest activation/rollback, split leakage, deterministic corpus construction, scoring, abstention, benchmark qualification, and worker-failure tests.

## Acceptance Criteria

- The engine can ingest sealed frame evidence, produce reproducible region decisions, restart safely, and prove that an underpowered benchmark cannot enable auto-accept.
