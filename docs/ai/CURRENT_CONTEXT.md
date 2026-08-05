<!-- handoff: {"branch":"codex/phr-local-card-recognition-20260804","config_digest":"24af9188f29175240948655dcb0825cf42575569652aa5b2f688a4110d8542af","document":"CURRENT_CONTEXT","generated":true,"generated_at":"2026-08-05T13:32:10Z","generation_id":"08845c81fa3a8e0dc609","head":"52c19c704bc422eb05ed4164d0946ff2382b57ae","schema_version":"1","worktree_fingerprint":"e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"} -->
# Current Context

## Operational state

- **Project:** Phronesis
- **Repository:** `Phronesis`
- **Branch:** `codex/phr-local-card-recognition-20260804`
- **HEAD:** `52c19c704bc422eb05ed4164d0946ff2382b57ae`
- **Worktree fingerprint:** `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`
- **Validation:** PASSED
- **Generated:** 2026-08-05T13:32:10Z

## Current objective

Implement and verify the `PHR-TECH-014` calibration-tooling increment: deterministic local corpus construction, immutable split validation, and sealed executable benchmark evidence.

## Acceptance criteria

- [x] Build canonical local corpus bundles from explicit metadata and source paths without placing image evidence in Git.
- [x] Reject duplicate assets and canonical identities assigned across multiple train/dev/holdout splits.
- [x] Produce deterministic sealed benchmark reports with recall, precision, exception rate, latency, pairing, and failure-stratum evidence.
- [x] Prove underpowered or provenance-blocked evidence remains `NOT_QUALIFIED` and cannot enable auto-accept.
- [x] Pass focused/full tests, Swift tests, TypeScript, lint, build, diff hygiene, and Chief Architect conformance review.

## Constraints

- The repository is authoritative; conversation history is disposable.
- Generated context is valid only while its branch, HEAD, configuration digest, and
  implementation-worktree fingerprint match the repository.
- Human-owned canonical documents require deliberate edits.

## Exact next action

Obtain Product Owner approval for specific English Magic source provenance and recognition-use scope before constructing the first real corpus. Do not activate auto-accept from synthetic or underpowered evidence.
