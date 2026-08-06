"""Command implementations for repository continuity workflows."""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Any
from hashlib import sha256
import json
import subprocess

from handoff.config import (
    DEFAULT_DOCUMENT_PATHS,
    ConfigError,
    HandoffConfig,
    load_config,
)
from handoff.documents import document_transaction, isoformat, write_text_atomic
from handoff.git import (
    GitError,
    GitSnapshot,
    inspect_git,
    is_excluded_path,
    is_git_repository,
)
from handoff.models import ContinuityResult
from handoff.render import (
    active_task_fields,
    generation_id,
    render_bootstrap,
    render_current_context,
    render_handoff,
    render_session_summary,
    render_work_queue,
)
from handoff.templates import (
    AGENTS_TEMPLATE,
    CONFIG_TEMPLATE,
    GENERATED_TEMPLATES,
    MANUAL_TEMPLATES,
)
from handoff.validation import (
    load_validation_report,
    run_validation_commands,
    validate_repository,
)
from handoff import __version__


class CommandError(RuntimeError):
    pass


@dataclass
class CommandOutcome:
    message: str
    data: dict[str, Any]
    ok: bool = True


PORTABLE_WRAPPER = """\
#!/bin/sh
set -eu
HANDOFF_ROOT=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
for HANDOFF_PYTHON in python3.13 python3.12 python3.11 python3; do
  if command -v "$HANDOFF_PYTHON" >/dev/null 2>&1 &&
     "$HANDOFF_PYTHON" -c 'import sys; raise SystemExit(sys.version_info < (3, 11))'
  then
    PYTHONDONTWRITEBYTECODE=1 \\
      PYTHONPATH="$HANDOFF_ROOT/.handoff/vendor${PYTHONPATH:+:$PYTHONPATH}" \\
      exec "$HANDOFF_PYTHON" -m handoff "$@"
  fi
done
echo "Handoff requires Python 3.11 or newer." >&2
exit 2
"""


def _install_portable_runtime(root: Path) -> list[str]:
    package_source = Path(__file__).resolve().parent
    vendor = root / ".handoff/vendor/handoff"
    written: list[str] = []
    for source in sorted(package_source.glob("*.py")):
        target = vendor / source.name
        write_text_atomic(target, source.read_text(encoding="utf-8"))
        written.append(target.relative_to(root).as_posix())
    wrapper = root / "handoff"
    write_text_atomic(wrapper, PORTABLE_WRAPPER)
    wrapper.chmod(wrapper.stat().st_mode | 0o111)
    version_file = root / ".handoff/VERSION"
    write_text_atomic(version_file, f"{__version__}\n")
    written.extend(
        [wrapper.relative_to(root).as_posix(), version_file.relative_to(root).as_posix()]
    )
    return written


def initialize(
    root: Path, git_init: bool = False, portable: bool = False
) -> CommandOutcome:
    root = root.resolve()
    root.mkdir(parents=True, exist_ok=True)
    if is_git_repository(root):
        top_level = subprocess.run(
            ["git", "rev-parse", "--show-toplevel"],
            cwd=root,
            text=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            check=False,
        )
        if top_level.returncode:
            raise CommandError(top_level.stderr.strip() or "Cannot resolve Git root")
        root = Path(top_level.stdout.strip()).resolve()
    if git_init and not is_git_repository(root):
        completed = subprocess.run(
            ["git", "init"],
            cwd=root,
            text=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            check=False,
        )
        if completed.returncode:
            raise CommandError(completed.stderr.strip() or "git init failed")

    created: list[str] = []
    preserved: list[str] = []
    config_path = root / "handoff.toml"
    if config_path.exists():
        preserved.append("handoff.toml")
    else:
        write_text_atomic(
            config_path, CONFIG_TEMPLATE.format(project_name=root.name)
        )
        created.append("handoff.toml")

    config = load_config(root)
    content_by_role: dict[str, str] = {"agents": AGENTS_TEMPLATE}
    for role, default_path in DEFAULT_DOCUMENT_PATHS.items():
        if role == "agents":
            continue
        if default_path in MANUAL_TEMPLATES:
            content_by_role[role] = MANUAL_TEMPLATES[default_path]
        elif default_path in GENERATED_TEMPLATES:
            content_by_role[role] = GENERATED_TEMPLATES[default_path]

    for role, relative in config.document_paths.items():
        path = config.path(relative)
        if path.exists():
            preserved.append(path.relative_to(root).as_posix())
            continue
        write_text_atomic(path, content_by_role[role])
        created.append(path.relative_to(root).as_posix())
    config.path(config.reports_dir).mkdir(parents=True, exist_ok=True)
    portable_files: list[str] = []
    if portable:
        portable_files = _install_portable_runtime(root)
    return CommandOutcome(
        f"Initialized Handoff: {len(created)} created, {len(preserved)} preserved.",
        {
            "created": created,
            "preserved": preserved,
            "portable_runtime": portable_files,
            "root": str(root),
        },
    )


def _load_snapshot(start: Path | str) -> tuple[HandoffConfig, GitSnapshot]:
    config = load_config(start)
    snapshot = inspect_git(
        config.root, config.generated_paths, repository=config.project_name
    )
    if snapshot.root != config.root:
        raise CommandError(
            f"handoff.toml must be at the Git repository root {snapshot.root}, "
            f"not {config.root}"
        )
    return config, snapshot


def prepare_handoff(start: Path | str = ".") -> CommandOutcome:
    config, snapshot = _load_snapshot(start)
    missing_inputs = [
        path
        for path in (
            config.document("project_state"),
            config.document("architecture"),
            config.document("decisions"),
            config.document("backlog"),
            config.document("active_task"),
        )
        if not config.path(path).is_file()
    ]
    if missing_inputs:
        raise CommandError(
            "Cannot prepare handoff; canonical inputs are missing: "
            + ", ".join(missing_inputs)
        )

    report = run_validation_commands(config, snapshot)
    if report["status"] != "passed":
        failed = [
            item["command"]
            for item in report["commands"]
            if not item.get("passed", False)
        ]
        raise CommandError(
            "Handoff refused because required validation failed: "
            + ", ".join(failed)
        )

    active = active_task_fields(config)
    generated_at = isoformat()
    generation = generation_id(config, snapshot, active, report)
    bootstrap_md, bootstrap_json = render_bootstrap(
        config, snapshot, active, report, generated_at, generation
    )
    changes = {
        config.path(config.document("handoff")): render_handoff(
            config, snapshot, active, report, generated_at, generation
        ),
        config.path(config.document("session_summary")): render_session_summary(
            config, snapshot, active, generated_at, generation
        ),
        config.path(config.document("current_context")): render_current_context(
            config, snapshot, active, report, generated_at, generation
        ),
        config.path(config.document("work_queue")): render_work_queue(
            config, snapshot, active, generated_at, generation
        ),
        config.path(config.document("bootstrap")): bootstrap_md,
        config.path(f"{config.reports_dir}/bootstrap-latest.json"): bootstrap_json,
    }
    artifact_digests = {
        path.relative_to(config.root).as_posix(): sha256(
            content.encode("utf-8")
        ).hexdigest()
        for path, content in sorted(
            changes.items(), key=lambda item: item[0].as_posix()
        )
    }
    for report_name in ("validation-latest.json", "validation-latest.md"):
        report_path = config.path(f"{config.reports_dir}/{report_name}")
        artifact_digests[report_path.relative_to(config.root).as_posix()] = (
            sha256(report_path.read_bytes()).hexdigest()
        )
    manifest = {
        "schema_version": config.schema_version,
        "generation_id": generation,
        "generated_at": generated_at,
        "branch": snapshot.branch,
        "head": snapshot.head,
        "worktree_fingerprint": snapshot.fingerprint,
        "config_digest": config.digest,
        "artifacts": artifact_digests,
    }
    changes[config.path(f"{config.reports_dir}/continuity-manifest.json")] = (
        json.dumps(manifest, indent=2, sort_keys=True) + "\n"
    )

    with document_transaction(changes):
        current_snapshot = inspect_git(
            config.root, config.generated_paths, repository=config.project_name
        )
        result = validate_repository(config, current_snapshot)
        if not result.ok:
            details = "; ".join(item.message for item in result.errors)
            raise CommandError(
                "Generated documents failed continuity validation and were rolled "
                f"back: {details}"
            )

    return CommandOutcome(
        f"Handoff prepared and validated (generation {generation}).",
        {
            "generation_id": generation,
            "bootstrap": config.document("bootstrap"),
            "validation": f"{config.reports_dir}/validation-latest.json",
            "warnings": [item.as_dict() for item in result.warnings],
        },
    )


def seal_handoff(start: Path | str = ".") -> CommandOutcome:
    """Prepare and commit a clone-resumable generated continuity package."""
    config, snapshot = _load_snapshot(start)
    if not snapshot.clean:
        raise CommandError(
            "Cannot seal Handoff while implementation or human-owned files are "
            "uncommitted. Commit the verified project state first."
        )

    prepared = prepare_handoff(config.root)
    generated_targets = [path.rstrip("/") for path in config.generated_paths]
    staged = subprocess.run(
        ["git", "add", "--all", "--", *generated_targets],
        cwd=config.root,
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        check=False,
    )
    if staged.returncode != 0:
        raise CommandError(
            "Could not stage generated Handoff artifacts: "
            + (staged.stderr.strip() or staged.stdout.strip())
        )

    staged_paths_result = subprocess.run(
        ["git", "diff", "--cached", "--name-only", "-z"],
        cwd=config.root,
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        check=False,
    )
    if staged_paths_result.returncode != 0:
        raise CommandError("Could not inspect staged Handoff artifacts")
    staged_paths = tuple(
        path for path in staged_paths_result.stdout.split("\0") if path
    )
    unexpected = [
        path
        for path in staged_paths
        if not is_excluded_path(path, config.generated_paths)
    ]
    if unexpected:
        raise CommandError(
            "Refusing to seal because non-generated paths are staged: "
            + ", ".join(unexpected)
        )
    if not staged_paths:
        raise CommandError("No generated Handoff artifacts changed; nothing to seal")

    generation = str(prepared.data["generation_id"])
    committed = subprocess.run(
        ["git", "commit", "-m", f"handoff: seal {generation}"],
        cwd=config.root,
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        check=False,
    )
    if committed.returncode != 0:
        raise CommandError(
            "Could not commit generated Handoff artifacts: "
            + (committed.stderr.strip() or committed.stdout.strip())
        )

    sealed_snapshot = inspect_git(
        config.root, config.generated_paths, repository=config.project_name
    )
    result = validate_repository(config, sealed_snapshot)
    if not result.ok:
        details = "; ".join(item.message for item in result.errors)
        raise CommandError(
            "Seal commit was created but continuity validation failed: " + details
        )
    return CommandOutcome(
        f"Handoff sealed in commit {sealed_snapshot.head} "
        f"(generation {generation}).",
        {
            **prepared.data,
            "seal_commit": sealed_snapshot.head,
            "staged_paths": list(staged_paths),
            "warnings": [item.as_dict() for item in result.warnings],
        },
    )


def refresh_context(start: Path | str = ".") -> CommandOutcome:
    config, snapshot = _load_snapshot(start)
    active = active_task_fields(config)
    report = load_validation_report(config) or {
        "status": "not run",
        "commands": [],
    }
    generated_at = isoformat()
    generation = generation_id(config, snapshot, active, report)
    content = render_current_context(
        config, snapshot, active, report, generated_at, generation
    )
    context_path = config.document("current_context")
    write_text_atomic(config.path(context_path), content)
    return CommandOutcome(
        "Current context refreshed. Run prepare-handoff to seal a complete package.",
        {"generation_id": generation, "path": context_path},
    )


def update_work_queue(start: Path | str = ".") -> CommandOutcome:
    config, snapshot = _load_snapshot(start)
    active = active_task_fields(config)
    report = load_validation_report(config) or {"status": "not run", "commands": []}
    generated_at = isoformat()
    generation = generation_id(config, snapshot, active, report)
    content = render_work_queue(config, snapshot, active, generated_at, generation)
    queue_path = config.document("work_queue")
    write_text_atomic(config.path(queue_path), content)
    return CommandOutcome(
        "Work queue regenerated from ACTIVE_TASK and BACKLOG.",
        {"generation_id": generation, "path": queue_path},
    )


def validate_continuity(start: Path | str = ".") -> CommandOutcome:
    config, snapshot = _load_snapshot(start)
    result = validate_repository(config, snapshot)
    return CommandOutcome(
        _validation_message(result),
        {
            **result.as_dict(),
            "git": snapshot.as_dict(),
            "config_digest": config.digest,
        },
        ok=result.ok,
    )


def _validation_message(result: ContinuityResult) -> str:
    state = "valid" if result.ok else "invalid"
    return (
        f"Continuity is {state}: {len(result.errors)} error(s), "
        f"{len(result.warnings)} warning(s)."
    )


def status_report(start: Path | str = ".") -> CommandOutcome:
    config, snapshot = _load_snapshot(start)
    result = validate_repository(config, snapshot)
    active = active_task_fields(config)
    lines = [
        "# Handoff Status Report",
        "",
        f"- **Repository:** `{snapshot.repository}`",
        f"- **Branch:** `{snapshot.branch}`",
        f"- **HEAD:** `{snapshot.head}`",
        f"- **Implementation worktree:** {'clean' if snapshot.clean else 'has changes'}",
        f"- **Continuity:** {'VALID' if result.ok else 'INVALID'}",
        f"- **Errors:** {len(result.errors)}",
        f"- **Warnings:** {len(result.warnings)}",
        "",
        "## Current objective",
        "",
        active["objective"],
        "",
        "## Exact next action",
        "",
        active["next_action"],
        "",
        "## Findings",
        "",
    ]
    if result.findings:
        for finding in result.findings:
            location = f" (`{finding.path}`)" if finding.path else ""
            lines.append(
                f"- **{finding.severity.upper()} {finding.code}:** "
                f"{finding.message}{location}"
            )
    else:
        lines.append("- None.")
    content = "\n".join(lines) + "\n"
    path = config.path(f"{config.reports_dir}/status-latest.md")
    write_text_atomic(path, content)
    return CommandOutcome(
        f"Status report written to {path.relative_to(config.root)}.",
        {
            "path": path.relative_to(config.root).as_posix(),
            "report": content,
            **result.as_dict(),
        },
        ok=result.ok,
    )


def resume_session(start: Path | str = ".") -> CommandOutcome:
    outcome = validate_continuity(start)
    if not outcome.ok:
        raise CommandError(
            "Refusing to resume from a stale bootstrap package. Run "
            "`prepare-handoff` after resolving continuity errors."
        )
    config = load_config(start)
    bootstrap = config.path(config.document("bootstrap"))
    return CommandOutcome(
        bootstrap.read_text(encoding="utf-8"),
        {
            "bootstrap": bootstrap.relative_to(config.root).as_posix(),
            "generation_id": json.loads(
                config.path(f"{config.reports_dir}/bootstrap-latest.json").read_text(
                    encoding="utf-8"
                )
            ).get("generation_id"),
        },
    )
