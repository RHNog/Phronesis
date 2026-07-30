# PHR-WORKFLOW-004 — Snapshot-Powered Vendor Workspace

Status: Product Review candidate; not yet canonically adopted or deployed.

## Added

- Desktop-first Vendor Workspace combining catalogue search, condition evidence, asking price, Business Profile, negotiation ladder, and BUY / NEGOTIATE / PASS decision.
- Responsive single-column mobile backup using identical data and business logic.
- Automatic read-only observer for completed Magic, Pokémon, and One Piece Pricing Update Tool catalogues.
- Transactional SQLite import with strict validation, source SKU retention, four-per-day history, freshness, movement, last-good recovery, and per-checkpoint idempotency.
- Manual catalogue sync/import commands, operational runbook, and sanitized pricing-status API.

## Preserved

- `/price-lookup` compatibility surface.
- Existing Business Profile, evaluation, offer-ladder, and decision ownership.
- Pricing Update Tool schedules, data, credentials, and cleanup behavior.

Focused checks pass 34/34, lint/build/diff checks pass, and a full 792,927-row Magic catalogue imports in under 15 seconds. The repository retains its documented 17 behavioral-test failures and 27 standalone `TS5097` test-configuration errors.
