<!-- handoff: {"branch":"codex/phr-local-card-recognition-20260804","config_digest":"24af9188f29175240948655dcb0825cf42575569652aa5b2f688a4110d8542af","document":"CURRENT_CONTEXT","generated":true,"generated_at":"2026-08-05T14:25:56Z","generation_id":"1bbb2c3636b40bea5766","head":"57423ef0a40c35a08b4e88691ccf44fb84ec4d92","schema_version":"1","worktree_fingerprint":"e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"} -->
# Current Context

## Operational state

- **Project:** Phronesis
- **Repository:** `Phronesis`
- **Branch:** `codex/phr-local-card-recognition-20260804`
- **HEAD:** `57423ef0a40c35a08b4e88691ccf44fb84ec4d92`
- **Worktree fingerprint:** `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`
- **Validation:** PASSED
- **Generated:** 2026-08-05T14:25:56Z

## Current objective

Implement and verify the benchmark-only `PHR-UX-026` automatic binder-region detection increment without activating detector suggestions in production sessions.

## Acceptance criteria

- [x] Add local Vision rectangle suggestions with versioned JSON and deterministic reading order.
- [x] Preserve top-left normalized geometry and reject malformed or overlapping duplicate worker output.
- [x] Add sealed IoU-based precision, recall, exact-count, latency, and failure-stratum reports.
- [x] Prove synthetic or underpowered evidence remains `NOT_QUALIFIED` and cannot change active regions.
- [x] Pass focused/full tests, Swift tests, TypeScript, lint, build, diff hygiene, and Chief Architect conformance review.

## Constraints

- The repository is authoritative; conversation history is disposable.
- Generated context is valid only while its branch, HEAD, configuration digest, and
  implementation-worktree fingerprint match the repository.
- Human-owned canonical documents require deliberate edits.

## Exact next action

Obtain Product Owner-approved real binder frames and immutable labels across the required failure strata, then run the implemented benchmark. Do not activate suggestions from synthetic or single-image evidence.
