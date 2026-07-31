"""Deterministic operational document generation."""

from __future__ import annotations

from hashlib import sha256
from pathlib import Path
from typing import Any
import json
import os
import re

from handoff.config import HandoffConfig
from handoff.documents import isoformat, section, with_metadata
from handoff.git import GitSnapshot


def _read(config: HandoffConfig, document_key: str) -> str:
    return config.path(config.document(document_key)).read_text(encoding="utf-8")


def _relative_target(config: HandoffConfig, source_key: str, target: str) -> str:
    source_parent = Path(config.document(source_key)).parent
    return Path(os.path.relpath(target, source_parent)).as_posix()


def _document_link(
    config: HandoffConfig, source_key: str, target_key: str, anchor: str = ""
) -> str:
    target = _relative_target(config, source_key, config.document(target_key))
    return f"{target}{anchor}"


def _report_link(config: HandoffConfig, source_key: str, filename: str) -> str:
    return _relative_target(config, source_key, f"{config.reports_dir}/{filename}")


def _plain(value: str, fallback: str) -> str:
    stripped = value.strip()
    return stripped if stripped else fallback


def active_task_fields(config: HandoffConfig) -> dict[str, str]:
    text = _read(config, "active_task")
    return {
        "objective": _plain(section(text, "Objective"), "No active objective documented."),
        "acceptance_criteria": _plain(
            section(text, "Acceptance criteria"), "- No acceptance criteria documented."
        ),
        "completed": _plain(
            section(text, "Completed this session"), "- No completed work documented."
        ),
        "remaining": _plain(
            section(text, "Remaining work"), "- No remaining work documented."
        ),
        "blockers": _plain(section(text, "Blockers"), "- None documented."),
        "next_action": _plain(
            section(text, "Exact next action"), "Review the active task."
        ),
    }


def generation_id(
    config: HandoffConfig,
    snapshot: GitSnapshot,
    active: dict[str, str],
    validation_report: dict[str, Any],
) -> str:
    payload = {
        "schema_version": config.schema_version,
        "config_digest": config.digest,
        "git": snapshot.as_dict(),
        "active_task": active,
        "validation": {
            "status": validation_report.get("status"),
            "commands": [
                {
                    "command": item.get("command"),
                    "exit_code": item.get("exit_code"),
                }
                for item in validation_report.get("commands", [])
                if isinstance(item, dict)
            ],
        },
    }
    encoded = json.dumps(payload, sort_keys=True, separators=(",", ":")).encode("utf-8")
    return sha256(encoded).hexdigest()[:20]


def _metadata(
    document: str,
    config: HandoffConfig,
    snapshot: GitSnapshot,
    generated_at: str,
    generation: str,
) -> dict[str, object]:
    return {
        "branch": snapshot.branch,
        "config_digest": config.digest,
        "document": document,
        "generated": True,
        "generated_at": generated_at,
        "generation_id": generation,
        "head": snapshot.head,
        "schema_version": config.schema_version,
        "worktree_fingerprint": snapshot.fingerprint,
    }


def _status_block(snapshot: GitSnapshot) -> str:
    if snapshot.clean:
        return "_Clean (excluding configured generated continuity files)._"
    return "```text\n" + "\n".join(snapshot.status_lines) + "\n```"


def _validation_commands(report: dict[str, Any]) -> str:
    commands = report.get("commands", [])
    if not commands:
        return "- PASS — no project-specific validation commands configured."
    lines = []
    for item in commands:
        if isinstance(item, dict):
            state = "PASS" if item.get("passed") else "FAIL"
            lines.append(
                f"- {state} — `{item.get('command', '')}` "
                f"({item.get('duration_seconds', 0)}s)"
            )
    return "\n".join(lines)


def _decision_summary(config: HandoffConfig, source_key: str) -> str:
    text = _read(config, "decisions")
    target = _document_link(config, source_key, "decisions")
    headings = re.findall(r"^##\s+(ADR-[^\n]+)", text, re.MULTILINE)
    if not headings:
        return f"- See [DECISIONS.md]({target}); no ADR headings were detected."
    return "\n".join(
        f"- [{heading}]({target}#{_slug(heading)})" for heading in headings[-5:]
    )


def _slug(value: str) -> str:
    value = value.lower()
    value = re.sub(r"[^\w\s-]", "", value)
    return re.sub(r"[-\s]+", "-", value).strip("-")


def render_handoff(
    config: HandoffConfig,
    snapshot: GitSnapshot,
    active: dict[str, str],
    report: dict[str, Any],
    generated_at: str,
    generation: str,
) -> str:
    metadata = _metadata("HANDOFF", config, snapshot, generated_at, generation)
    validation_link = _report_link(
        config, "handoff", "validation-latest.md"
    )
    project_state_link = _document_link(config, "handoff", "project_state")
    architecture_link = _document_link(config, "handoff", "architecture")
    decisions_link = _document_link(config, "handoff", "decisions")
    backlog_link = _document_link(config, "handoff", "backlog")
    active_task_link = _document_link(config, "handoff", "active_task")
    current_context_link = _document_link(config, "handoff", "current_context")
    work_queue_link = _document_link(config, "handoff", "work_queue")
    body = f"""\
# Handoff

> Generated by Handoff. Repository evidence supersedes this file if validation reports
> a conflict.

## Repository identity

- **Repository:** `{snapshot.repository}`
- **Branch:** `{snapshot.branch}`
- **Commit:** `{snapshot.head}`
- **Implementation worktree:** {"clean" if snapshot.clean else "has changes"}
- **Generation ID:** `{generation}`

## Objective

{active['objective']}

## Completed work

{active['completed']}

## Remaining work

{active['remaining']}

## Blockers

{active['blockers']}

## Validation

- **Status:** {str(report.get('status', 'unknown')).upper()}
- **Completed:** {report.get('generated_at', 'unknown')}
- **Report:** [validation-latest.md]({validation_link})

{_validation_commands(report)}

## Important decisions

{_decision_summary(config, "handoff")}

## Exact next action

{active['next_action']}

## Implementation worktree snapshot

{_status_block(snapshot)}

## Authoritative references

- [Project state]({project_state_link})
- [Architecture]({architecture_link})
- [Architectural decisions]({decisions_link})
- [Backlog]({backlog_link})
- [Active task]({active_task_link})
- [Current context]({current_context_link})
- [Work queue]({work_queue_link})
"""
    return with_metadata(metadata, body)


def render_session_summary(
    config: HandoffConfig,
    snapshot: GitSnapshot,
    active: dict[str, str],
    generated_at: str,
    generation: str,
) -> str:
    body = f"""\
# Session Summary

## Objective

{active['objective']}

## Completed in the closing session

{active['completed']}

## State left behind

- Branch `{snapshot.branch}` at `{snapshot.head}`.
- Implementation worktree is {"clean" if snapshot.clean else "not clean"}.
- Continuity generation `{generation}` was prepared successfully.

## Remaining work

{active['remaining']}

## Blockers

{active['blockers']}

## Next action

{active['next_action']}
"""
    return with_metadata(
        _metadata(
            "SESSION_SUMMARY", config, snapshot, generated_at, generation
        ),
        body,
    )


def render_current_context(
    config: HandoffConfig,
    snapshot: GitSnapshot,
    active: dict[str, str],
    report: dict[str, Any],
    generated_at: str,
    generation: str,
) -> str:
    body = f"""\
# Current Context

## Operational state

- **Project:** {config.project_name}
- **Repository:** `{snapshot.repository}`
- **Branch:** `{snapshot.branch}`
- **HEAD:** `{snapshot.head}`
- **Worktree fingerprint:** `{snapshot.fingerprint}`
- **Validation:** {str(report.get('status', 'not run')).upper()}
- **Generated:** {generated_at}

## Current objective

{active['objective']}

## Acceptance criteria

{active['acceptance_criteria']}

## Constraints

- The repository is authoritative; conversation history is disposable.
- Generated context is valid only while its branch, HEAD, configuration digest, and
  implementation-worktree fingerprint match the repository.
- Human-owned canonical documents require deliberate edits.

## Exact next action

{active['next_action']}
"""
    return with_metadata(
        _metadata("CURRENT_CONTEXT", config, snapshot, generated_at, generation),
        body,
    )


def _list_items(text: str, checkbox_only: bool) -> list[str]:
    start = (
        re.compile(r"^-\s+\[\s\]\s+(.+?)\s*$", re.IGNORECASE)
        if checkbox_only
        else re.compile(r"^-\s+(?:\[[ xX]\]\s+)?(.+?)\s*$")
    )
    items: list[str] = []
    current: list[str] | None = None
    for line in text.splitlines():
        match = start.match(line)
        if match:
            if current:
                items.append(" ".join(current))
            current = [match.group(1).strip()]
            continue
        continuation = re.match(r"^\s{2,}(\S.*?)\s*$", line)
        if current is not None and continuation:
            current.append(continuation.group(1).strip())
        elif line.strip() and current:
            items.append(" ".join(current))
            current = None
    if current:
        items.append(" ".join(current))
    return items


def _table_items(text: str) -> list[tuple[int, str]]:
    """Extract open work from Markdown tables with item/state columns."""
    rows = [line.strip() for line in text.splitlines() if line.strip().startswith("|")]
    if len(rows) < 2:
        return []
    header_index = -1
    columns: list[str] = []
    for index, row in enumerate(rows):
        cells = [cell.strip().lower() for cell in row.strip("|").split("|")]
        if "item" in cells and ("state" in cells or "status" in cells):
            header_index = index
            columns = cells
            break
    if header_index < 0:
        return []
    item_index = columns.index("item")
    state_name = "state" if "state" in columns else "status"
    state_index = columns.index(state_name)
    priority_index = columns.index("priority") if "priority" in columns else -1
    terminal = (
        "approved",
        "complete",
        "completed",
        "done",
        "closed",
        "cancelled",
        "archived",
        "disabled",
    )
    items: list[tuple[int, str]] = []
    for row in rows[header_index + 1 :]:
        cells = [cell.strip() for cell in row.strip("|").split("|")]
        if all(re.fullmatch(r":?-{3,}:?", cell) for cell in cells):
            continue
        if len(cells) <= max(item_index, state_index, priority_index):
            continue
        description = cells[item_index]
        state = cells[state_index].lower()
        if not description or any(word in state for word in terminal):
            continue
        priority = 2
        if priority_index >= 0:
            raw_priority = cells[priority_index].strip()
            marker = re.fullmatch(r"P([0-3])", raw_priority, re.IGNORECASE)
            rank = re.fullmatch(r"\d+", raw_priority)
            if marker:
                priority = int(marker.group(1))
            elif rank:
                priority = min(3, max(0, int(raw_priority) - 1))
        items.append((priority, description))
    return items


def _queue_items(config: HandoffConfig, active: dict[str, str]) -> list[tuple[int, str, str]]:
    items: list[tuple[int, str, str]] = []
    for index, item in enumerate(_list_items(active["remaining"], checkbox_only=False)):
        normalized = item.lower().strip()
        if not normalized.startswith(("none", "nothing", "no remaining work")):
            items.append((0, f"ACTIVE-{index + 1:03d}", item.strip()))

    backlog = _read(config, "backlog")
    priority_pattern = re.compile(
        r"^(?:\[(P[0-3])\]\s+)?(.+?)\s*$", re.IGNORECASE
    )
    for index, item in enumerate(_list_items(backlog, checkbox_only=True)):
        match = priority_pattern.match(item)
        if not match:
            continue
        priority = int((match.group(1) or "P2")[1])
        items.append((priority, f"BACKLOG-{index + 1:03d}", match.group(2).strip()))
    for index, (priority, description) in enumerate(_table_items(backlog)):
        items.append((priority, f"BACKLOG-TABLE-{index + 1:03d}", description))
    return sorted(items, key=lambda item: (item[0], item[1], item[2].lower()))


def render_work_queue(
    config: HandoffConfig,
    snapshot: GitSnapshot,
    active: dict[str, str],
    generated_at: str,
    generation: str,
) -> str:
    items = _queue_items(config, active)
    active_task_name = config.document("active_task")
    backlog_name = config.document("backlog")
    if items:
        table = "\n".join(
            f"| {position} | P{priority} | `{identifier}` | {description} |"
            for position, (priority, identifier, description) in enumerate(items, 1)
        )
    else:
        table = "| — | — | — | No queued work |"
    body = f"""\
# Work Queue

> Machine-generated from `{active_task_name}` and `{backlog_name}`. Edit the sources, then
> run `update-work-queue`.

| Rank | Priority | Source ID | Work |
|---:|---:|---|---|
{table}

## Ordering policy

Active-task remaining work is P0. Backlog items use their explicit P0–P3 marker
and default to P2. Ties retain source order.
"""
    return with_metadata(
        _metadata("WORK_QUEUE", config, snapshot, generated_at, generation),
        body,
    )


def bootstrap_payload(
    config: HandoffConfig,
    snapshot: GitSnapshot,
    active: dict[str, str],
    report: dict[str, Any],
    generated_at: str,
    generation: str,
) -> dict[str, Any]:
    return {
        "schema_version": config.schema_version,
        "generation_id": generation,
        "generated_at": generated_at,
        "repository": snapshot.repository,
        "branch": snapshot.branch,
        "commit": snapshot.head,
        "worktree_fingerprint": snapshot.fingerprint,
        "worktree_clean": snapshot.clean,
        "objective": active["objective"],
        "completed_work": active["completed"],
        "remaining_work": active["remaining"],
        "blockers": active["blockers"],
        "validation": {
            "status": report.get("status", "unknown"),
            "completed_at": report.get("generated_at"),
            "report": f"{config.reports_dir}/validation-latest.json",
        },
        "important_decisions": "docs/DECISIONS.md",
        "exact_next_action": active["next_action"],
        "authoritative_files": list(config.required_documents),
        "resume_instruction": "Acquire Handoff",
    }


def render_bootstrap(
    config: HandoffConfig,
    snapshot: GitSnapshot,
    active: dict[str, str],
    report: dict[str, Any],
    generated_at: str,
    generation: str,
) -> tuple[str, str]:
    payload = bootstrap_payload(
        config, snapshot, active, report, generated_at, generation
    )
    validation_link = _report_link(
        config, "bootstrap", "validation-latest.json"
    )
    decisions_link = _document_link(config, "bootstrap", "decisions")
    project_state_link = _document_link(config, "bootstrap", "project_state")
    architecture_link = _document_link(config, "bootstrap", "architecture")
    active_task_link = _document_link(config, "bootstrap", "active_task")
    handoff_link = _document_link(config, "bootstrap", "handoff")
    bootstrap_json_link = _report_link(
        config, "bootstrap", "bootstrap-latest.json"
    )
    body = f"""\
# Bootstrap Package

Use this instruction in a new AI session:

> Acquire Handoff

## Deterministic resume data

- **Repository:** `{payload['repository']}`
- **Branch:** `{payload['branch']}`
- **Commit:** `{payload['commit']}`
- **Generation ID:** `{generation}`
- **Worktree fingerprint:** `{payload['worktree_fingerprint']}`

## Objective

{active['objective']}

## Completed work

{active['completed']}

## Remaining work

{active['remaining']}

## Blockers

{active['blockers']}

## Validation

- **Status:** {str(report.get('status', 'unknown')).upper()}
- **Report:** [validation-latest.json]({validation_link})

## Important decisions

Read [DECISIONS.md]({decisions_link}) before implementation.

## Exact next action

{active['next_action']}

## Resume protocol

1. Confirm this file's branch, commit, configuration digest, and worktree
   fingerprint with `validate-continuity`.
2. Read [PROJECT_STATE.md]({project_state_link}),
   [ARCHITECTURE.md]({architecture_link}), and
   [DECISIONS.md]({decisions_link}).
3. Read [ACTIVE_TASK.md]({active_task_link}) and [HANDOFF.md]({handoff_link}).
4. Execute the exact next action.
5. Commit verified project state and close with **Handoff** (`handoff`).

The machine-readable equivalent is
[`bootstrap-latest.json`]({bootstrap_json_link}).
"""
    markdown = with_metadata(
        _metadata("BOOTSTRAP", config, snapshot, generated_at, generation), body
    )
    return markdown, json.dumps(payload, indent=2, sort_keys=True) + "\n"
