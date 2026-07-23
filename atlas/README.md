# Atlas Development Companion

Atlas is the internal development companion for Phronesis.

It is not part of the customer-facing application. It does not change Vendor Workspace behavior, production UI, business engines, providers, or runtime evaluation.

Atlas exists to continuously understand the repository, preserve project memory, and generate development intelligence that reduces developer friction.

## Folder Structure

- `config/`: project identity, sprint, milestone, repository, and architecture metadata.
- `core/`: internal Atlas utilities such as repository scanning and summary generation.
- `reports/`: sprint reports and build/test status summaries.
- `templates/`: report templates for future automated generation.
- `history/`: known issues, regression risks, workarounds, and historical development notes.
- `architecture/`: architecture snapshots derived from repository structure and canonical docs.
- `backlog/`: prioritized internal development backlog.
- `knowledge/`: durable project knowledge, rules, decisions, and philosophy.

## How Atlas Works

Atlas reads the repository as input and produces internal development artifacts as output.

Current source-of-truth documents remain in `docs/`:

- `docs/SPRINT_HISTORY.md`
- `docs/ARCHITECTURE.md`
- `docs/ROADMAP.md`
- `docs/DECISIONS.md`
- `docs/PROMPTS.md`
- `docs/ATLAS.md`

Atlas should summarize, index, and cross-reference those sources instead of manually duplicating them. When future automation is added, Atlas should regenerate its reports from repository scans and canonical documentation.

## Isolation Rules

- No production imports.
- No runtime dependency.
- No UI surface.
- No business logic.
- No provider calls.
- No Vendor Workspace behavior changes.
- No customer-facing copy.

## Future Roadmap

- Automated sprint report generation.
- Repository graph generation.
- Architecture drift detection.
- Backlog clustering by subsystem.
- Regression-risk watchlists.
- Known-issue lifecycle tracking.
- Documentation freshness checks.
- Suggested next sprint generation from repo state and known risks.
