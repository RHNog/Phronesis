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

- Add shared acquisition/region/recognition contracts and strict validators.
- Add a durable SQLite repository and content-addressed object layout with idempotent writes, leases, revisions, and decision evidence.
- Add manifest/checksum validation, transactional active-corpus pointer, rollback, and immutable split assignment.
- Add a deterministic candidate-fusion policy and benchmark reporter with explicit `NOT_QUALIFIED` output.
- Add a local macOS Vision worker boundary for OCR and feature evidence; worker errors abstain.
- Default all machine output to review or abstention until a qualified policy is explicitly activated.

## Constraints

- No cloud or paid runtime recognition, raw evidence in Git, redistribution-right assumption, automatic condition grading, or external publication.
- Do not mutate the live runtime database during tests.

## Testing Expectations

- Contract, geometry, content-addressing, idempotency, lease recovery, manifest activation/rollback, scoring, abstention, benchmark qualification, and worker-failure tests.

## Acceptance Criteria

- The engine can ingest sealed frame evidence, produce reproducible region decisions, restart safely, and prove that an underpowered benchmark cannot enable auto-accept.
