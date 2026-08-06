"""Autonomous, preservation-first repository adoption and runtime upgrades."""

from __future__ import annotations

from pathlib import Path
from typing import Any
import json
import os

from handoff import __version__
from handoff.commands import CommandError, CommandOutcome, _install_portable_runtime, initialize
from handoff.config import DEFAULT_DOCUMENT_PATHS, load_config
from handoff.documents import write_text_atomic
from handoff.git import is_git_repository


DOCUMENT_CANDIDATES: dict[str, tuple[str, ...]] = {
    "project_state": (
        "docs/PROJECT_STATE.md",
        "docs/product-development/PROJECT_STATE.md",
    ),
    "architecture": ("docs/ARCHITECTURE.md",),
    "decisions": (
        "docs/DECISIONS.md",
        "docs/product-development/DECISIONS.md",
    ),
    "changelog": (
        "docs/CHANGELOG.md",
        "docs/product-development/CHANGELOG.md",
    ),
    "backlog": (
        "docs/BACKLOG.md",
        "docs/product-development/BACKLOG.md",
    ),
}

CONTRACT_START = "<!-- handoff:contract:start -->"
CONTRACT_END = "<!-- handoff:contract:end -->"
AGENT_CONTRACT = f"""\
{CONTRACT_START}
## Canonical Handoff continuity

The repository is authoritative; conversation history is disposable.

- **Acquire Handoff**: read `handoff.toml`, the configured canonical documents,
  and generated operational context; run `./handoff validate-continuity`; then
  execute the exact next action.
- **Handoff**: update canonical truth and `ACTIVE_TASK`, commit verified project
  state, then run bare `./handoff`. Do not claim transfer readiness on failure.
- Architectural decisions must never remain only in a conversation.
- Repository evidence supersedes conversational state whenever they conflict.
{CONTRACT_END}
"""

LEGACY_CI_WORKFLOW = """\
name: Handoff continuity

on:
  pull_request:
  push:

jobs:
  continuity:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Prepare and validate Handoff
        run: |
          ./handoff prepare-handoff
          ./handoff validate-continuity
"""


CI_WORKFLOW = """\
name: Handoff continuity

on:
  pull_request:
  push:
    branches:
      - main

permissions:
  contents: read

jobs:
  continuity:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
        with:
          fetch-depth: 0
          ref: ${{ github.event.pull_request.head.sha || github.sha }}
      - name: Restore Handoff branch identity
        env:
          HANDOFF_BRANCH: ${{ github.head_ref || github.ref_name }}
        run: git switch --force-create "$HANDOFF_BRANCH"
      - name: Validate committed Handoff
        run: ./handoff validate-continuity --json
"""


def _discover_documents(root: Path) -> dict[str, str]:
    mappings = dict(DEFAULT_DOCUMENT_PATHS)
    for role, candidates in DOCUMENT_CANDIDATES.items():
        for candidate in candidates:
            if (root / candidate).is_file():
                mappings[role] = candidate
                break
    return mappings


def _discover_validation(root: Path) -> tuple[str, ...]:
    commands: list[str] = []
    mindu = root / "mindu"
    if mindu.is_file() and os.access(mindu, os.X_OK):
        commands.append("./mindu validate")

    package_json = root / "package.json"
    if package_json.is_file():
        try:
            package = json.loads(package_json.read_text(encoding="utf-8"))
            scripts = package.get("scripts", {}) if isinstance(package, dict) else {}
        except (OSError, json.JSONDecodeError):
            scripts = {}
        if isinstance(scripts, dict):
            for script in ("test", "lint", "build"):
                if isinstance(scripts.get(script), str):
                    commands.append(f"npm run {script}")

    tests = root / "tests"
    if tests.is_dir() and any(tests.glob("test*.py")):
        commands.append("{python} -m unittest discover -s tests -v")
    commands.append("git diff --check")
    return tuple(dict.fromkeys(commands))


def _render_config(
    root: Path, mappings: dict[str, str], validation_commands: tuple[str, ...]
) -> str:
    required = list(dict.fromkeys(["AGENTS.md", *mappings.values()]))
    generated = [
        mappings["handoff"],
        mappings["session_summary"],
        mappings["current_context"],
        mappings["work_queue"],
        mappings["bootstrap"],
        "docs/ai/reports/",
    ]
    lines = ["[project]", f'name = {json.dumps(root.name)}', "", "[documents]"]
    lines.extend(f"{key} = {json.dumps(value)}" for key, value in mappings.items())
    lines.extend(
        [
            "",
            "[framework]",
            'schema_version = "1"',
            'docs_dir = "docs"',
            'ai_dir = "docs/ai"',
            'reports_dir = "docs/ai/reports"',
            "required_documents = [",
            *[f"  {json.dumps(path)}," for path in required],
            "]",
            "generated_paths = [",
            *[f"  {json.dumps(path)}," for path in generated],
            "]",
            "",
            "[validation]",
            "commands = [",
            *[f"  {json.dumps(command)}," for command in validation_commands],
            "]",
            "max_age_hours = 24",
            "stale_after_hours = 168",
            "fail_on_stale_documents = false",
            "",
        ]
    )
    return "\n".join(lines)


def _add_metadata(path: Path, role: str) -> bool:
    text = path.read_text(encoding="utf-8")
    if text.startswith("<!-- handoff:"):
        return False
    metadata = json.dumps(
        {"document": role.upper(), "owner": "human-and-agent", "schema_version": "1"},
        separators=(",", ":"),
        sort_keys=True,
    )
    write_text_atomic(path, f"<!-- handoff: {metadata} -->\n{text}")
    return True


def _merge_agent_contract(path: Path) -> bool:
    current = path.read_text(encoding="utf-8") if path.exists() else "# Agent Instructions\n"
    if CONTRACT_START in current:
        start = current.index(CONTRACT_START)
        end = current.index(CONTRACT_END, start) + len(CONTRACT_END)
        updated = current[:start].rstrip() + "\n\n" + AGENT_CONTRACT + current[end:].lstrip()
    else:
        updated = current.rstrip() + "\n\n" + AGENT_CONTRACT
    if updated == current:
        return False
    write_text_atomic(path, updated)
    return True


def _has_handoff_ci(root: Path) -> bool:
    workflows = root / ".github/workflows"
    if not workflows.is_dir():
        return False
    for path in (*workflows.glob("*.yml"), *workflows.glob("*.yaml")):
        try:
            text = path.read_text(encoding="utf-8").lower()
        except OSError:
            continue
        if "handoff" in text and "validate-continuity" in text:
            return True
    return False


def _install_or_upgrade_ci(root: Path, *, enabled: bool) -> tuple[bool, bool]:
    """Install missing CI or replace only the exact unsafe legacy template."""

    if not enabled:
        return False, False
    ci_path = root / ".github/workflows/handoff-continuity.yml"
    if ci_path.is_file():
        current = ci_path.read_text(encoding="utf-8")
        if current == LEGACY_CI_WORKFLOW:
            write_text_atomic(ci_path, CI_WORKFLOW)
            return False, True
        return False, False
    if _has_handoff_ci(root):
        return False, False
    write_text_atomic(ci_path, CI_WORKFLOW)
    return True, False


def adopt_repository(
    root: Path,
    *,
    portable: bool = True,
    ci: bool = True,
) -> CommandOutcome:
    root = root.resolve()
    if not is_git_repository(root):
        raise CommandError(f"Canonical Handoff adoption requires a Git repository: {root}")
    if (root / "handoff.toml").exists():
        raise CommandError(
            "Repository already has handoff.toml; use `handoff upgrade` instead"
        )
    mappings = _discover_documents(root)
    commands = _discover_validation(root)
    write_text_atomic(root / "handoff.toml", _render_config(root, mappings, commands))
    initialized = initialize(root, git_init=False, portable=portable)

    metadata_updated: list[str] = []
    for role, relative in mappings.items():
        if role in {"agents", "handoff", "session_summary", "current_context", "work_queue", "bootstrap"}:
            continue
        path = root / relative
        if path.is_file() and _add_metadata(path, role):
            metadata_updated.append(relative)
    contract_updated = _merge_agent_contract(root / mappings["agents"])

    ci_created, ci_upgraded = _install_or_upgrade_ci(root, enabled=ci)

    config = load_config(root)
    return CommandOutcome(
        f"Adopted canonical Handoff {__version__} in {root.name}.",
        {
            **initialized.data,
            "version": __version__,
            "document_mappings": config.document_paths,
            "validation_commands": list(config.validation_commands),
            "metadata_updated": metadata_updated,
            "agent_contract_updated": contract_updated,
            "ci_created": ci_created,
            "ci_upgraded": ci_upgraded,
        },
    )


def upgrade_repository(root: Path, *, ci: bool = True) -> CommandOutcome:
    root = root.resolve()
    config = load_config(root)
    version_path = root / ".handoff/VERSION"
    previous = version_path.read_text(encoding="utf-8").strip() if version_path.exists() else "missing"
    files = _install_portable_runtime(root)
    contract_updated = _merge_agent_contract(config.path(config.document("agents")))
    ci_created, ci_upgraded = _install_or_upgrade_ci(root, enabled=ci)
    return CommandOutcome(
        f"Upgraded Handoff from {previous} to {__version__} in {root.name}.",
        {
            "root": str(root),
            "previous_version": previous,
            "version": __version__,
            "portable_runtime": files,
            "agent_contract_updated": contract_updated,
            "ci_created": ci_created,
            "ci_upgraded": ci_upgraded,
        },
    )
