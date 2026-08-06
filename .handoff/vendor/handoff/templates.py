"""Built-in, repository-independent document templates."""

from __future__ import annotations

from handoff.documents import with_metadata


CONFIG_TEMPLATE = """\
[project]
name = "{project_name}"

[documents]
# Stable logical roles may be mapped to repository-specific paths.
agents = "AGENTS.md"
project_state = "docs/PROJECT_STATE.md"
architecture = "docs/ARCHITECTURE.md"
decisions = "docs/DECISIONS.md"
changelog = "docs/CHANGELOG.md"
backlog = "docs/BACKLOG.md"
active_task = "docs/ai/ACTIVE_TASK.md"
handoff = "docs/ai/HANDOFF.md"
session_summary = "docs/ai/SESSION_SUMMARY.md"
current_context = "docs/ai/CURRENT_CONTEXT.md"
work_queue = "docs/ai/WORK_QUEUE.md"
bootstrap = "docs/ai/BOOTSTRAP.md"

[framework]
schema_version = "1"
docs_dir = "docs"
ai_dir = "docs/ai"
reports_dir = "docs/ai/reports"
required_documents = [
  "AGENTS.md",
  "docs/PROJECT_STATE.md",
  "docs/ARCHITECTURE.md",
  "docs/DECISIONS.md",
  "docs/CHANGELOG.md",
  "docs/BACKLOG.md",
  "docs/ai/ACTIVE_TASK.md",
  "docs/ai/HANDOFF.md",
  "docs/ai/SESSION_SUMMARY.md",
  "docs/ai/CURRENT_CONTEXT.md",
  "docs/ai/WORK_QUEUE.md",
  "docs/ai/BOOTSTRAP.md",
]
# Generated files are excluded from the implementation-worktree fingerprint.
generated_paths = [
  "docs/ai/HANDOFF.md",
  "docs/ai/SESSION_SUMMARY.md",
  "docs/ai/CURRENT_CONTEXT.md",
  "docs/ai/WORK_QUEUE.md",
  "docs/ai/BOOTSTRAP.md",
  "docs/ai/reports/",
]

[validation]
# Commands run without a shell, in order, from the repository root.
commands = []
max_age_hours = 24
stale_after_hours = 168
fail_on_stale_documents = false
"""


AGENTS_TEMPLATE = """\
# Repository AI Operating Contract

This repository is the authoritative source of project state. Conversation history,
agent memory, IDE state, and external notes are non-authoritative execution context.
When any conflict exists, verified repository state wins.

## Required startup sequence

The canonical user command **Acquire Handoff** triggers this sequence.

1. Read `handoff.toml` and resolve the logical document roles in `[documents]`.
2. Read `docs/PROJECT_STATE.md`, `docs/ARCHITECTURE.md`, and `docs/DECISIONS.md`
   (or their configured paths).
3. Read `docs/ai/ACTIVE_TASK.md`, `docs/ai/HANDOFF.md`,
   `docs/ai/CURRENT_CONTEXT.md`, and `docs/ai/WORK_QUEUE.md` (or their configured
   paths).
4. Run `validate-continuity` (or `handoff validate-continuity`) before changing files.
5. Execute the exact next action unless repository evidence requires a correction.

## During work

- Record durable architecture choices in the configured `decisions` document;
  never leave them only in a conversation.
- Keep the configured `project_state` document as current truth, not a historical
  diary.
- Keep the present objective and acceptance criteria in the configured
  `active_task` document.
- Put future work in `backlog`; record meaningful evolution in `changelog`.
- Do not treat generated documents as substitutes for inspecting the repository.
- Never silently rewrite human-owned canonical documents.

## Required closure sequence

The canonical user command **Handoff** triggers this sequence.

1. Update human-owned canonical documents that were made inaccurate by the work.
2. Update the configured `active_task` document, including completed work,
   remaining work, blockers, and the exact next action.
3. Commit verified implementation and human-owned canonical state.
4. Run `handoff` with no subcommand (compatibility alias: `seal-handoff`) to
   prepare and commit the generated continuity package.
5. Do not declare the session ready for transfer when that command fails.

Generated operational documents are safe to regenerate only through Handoff commands.
"""


def _manual(document: str, title: str, body: str) -> str:
    return with_metadata(
        {
            "document": document,
            "owner": "human-and-agent",
            "schema_version": "1",
        },
        f"# {title}\n\n{body}",
    )


MANUAL_TEMPLATES = {
    "docs/PROJECT_STATE.md": _manual(
        "PROJECT_STATE",
        "Project State",
        """## Mission

Describe the project's present mission.

## Current capabilities

- None documented yet.

## Current constraints

- None documented yet.

## Known risks

- None documented yet.
""",
    ),
    "docs/ARCHITECTURE.md": _manual(
        "ARCHITECTURE",
        "Architecture",
        """## System overview

Describe the stable system shape and boundaries.

## Components

- None documented yet.

## Data and control flow

Describe stable flows.

## Extension points

Describe supported extension mechanisms.
""",
    ),
    "docs/DECISIONS.md": _manual(
        "DECISIONS",
        "Architectural Decisions",
        """Decisions are append-only. Supersede a decision with a new entry; do not
rewrite the old rationale.

## ADR-0001: Adopt repository-native AI continuity

- **Status:** Accepted
- **Context:** AI conversation history is disposable.
- **Decision:** Durable project state and handoffs live in the repository.
- **Consequences:** Sessions must validate and prepare a handoff before closure.
""",
    ),
    "docs/CHANGELOG.md": _manual(
        "CHANGELOG",
        "Changelog",
        """Record meaningful project evolution. This is not a raw commit log.

## Unreleased

### Added

- Handoff continuity structure initialized.
""",
    ),
    "docs/BACKLOG.md": _manual(
        "BACKLOG",
        "Backlog",
        """Use `- [ ] [P0]`, `[P1]`, `[P2]`, or `[P3]` for machine ordering.

## Candidate work

- [ ] [P2] Replace this seed item with project work.
""",
    ),
    "docs/ai/ACTIVE_TASK.md": _manual(
        "ACTIVE_TASK",
        "Active Task",
        """## Objective

Define one implementation objective.

## Acceptance criteria

- [ ] Define measurable completion criteria.

## Completed this session

- Nothing yet.

## Remaining work

- Complete the acceptance criteria.

## Blockers

- None.

## Exact next action

Inspect the repository and select the first acceptance criterion.
""",
    ),
}


def generated_placeholder(document: str, title: str) -> str:
    return with_metadata(
        {
            "document": document,
            "generated": True,
            "schema_version": "1",
            "state": "not-prepared",
        },
        f"""# {title}

This file has not been generated yet. Run **Handoff**.
""",
    )


GENERATED_TEMPLATES = {
    "docs/ai/HANDOFF.md": generated_placeholder("HANDOFF", "Handoff"),
    "docs/ai/SESSION_SUMMARY.md": generated_placeholder(
        "SESSION_SUMMARY", "Session Summary"
    ),
    "docs/ai/CURRENT_CONTEXT.md": generated_placeholder(
        "CURRENT_CONTEXT", "Current Context"
    ),
    "docs/ai/WORK_QUEUE.md": generated_placeholder("WORK_QUEUE", "Work Queue"),
    "docs/ai/BOOTSTRAP.md": generated_placeholder("BOOTSTRAP", "Bootstrap Package"),
}
