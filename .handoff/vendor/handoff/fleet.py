"""Canonical multi-repository registry, compliance audit, and upgrades."""

from __future__ import annotations

from pathlib import Path
from typing import Any
import tomllib

from handoff import __version__
from handoff.adoption import adopt_repository, upgrade_repository
from handoff.commands import CommandError, CommandOutcome
from handoff.config import load_config
from handoff.git import inspect_git
from handoff.validation import validate_repository


FLEET_TEMPLATE = """\
schema_version = "1"
required_version = "{version}"

# Paths may be absolute or relative to this fleet file.
#[[repositories]]
#name = "example"
#path = "../example"
#required = true
"""


def initialize_fleet(path: Path) -> CommandOutcome:
    path = path.resolve()
    if path.exists():
        raise CommandError(f"Fleet registry already exists: {path}")
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(FLEET_TEMPLATE.format(version=__version__), encoding="utf-8")
    return CommandOutcome(
        f"Initialized Handoff fleet registry at {path}.",
        {"path": str(path), "required_version": __version__},
    )


def _load_fleet(path: Path) -> tuple[str, list[dict[str, Any]]]:
    path = path.resolve()
    try:
        raw = tomllib.loads(path.read_text(encoding="utf-8"))
    except (OSError, tomllib.TOMLDecodeError) as exc:
        raise CommandError(f"Cannot load fleet registry {path}: {exc}") from exc
    if str(raw.get("schema_version", "")) != "1":
        raise CommandError("Fleet registry schema_version must be \"1\"")
    required_version = str(raw.get("required_version", __version__))
    repositories = raw.get("repositories", [])
    if not isinstance(repositories, list):
        raise CommandError("Fleet repositories must be an array of tables")
    normalized: list[dict[str, Any]] = []
    seen: set[str] = set()
    for index, item in enumerate(repositories):
        if not isinstance(item, dict):
            raise CommandError(f"Fleet repository #{index + 1} must be a table")
        name = str(item.get("name", "")).strip()
        raw_path = str(item.get("path", "")).strip()
        if not name or not raw_path:
            raise CommandError(f"Fleet repository #{index + 1} needs name and path")
        if name in seen:
            raise CommandError(f"Duplicate fleet repository name: {name}")
        seen.add(name)
        candidate = Path(raw_path).expanduser()
        if not candidate.is_absolute():
            candidate = path.parent / candidate
        normalized.append(
            {
                "name": name,
                "path": candidate.resolve(),
                "required": bool(item.get("required", True)),
            }
        )
    return required_version, normalized


def fleet_status(path: Path) -> CommandOutcome:
    required_version, repositories = _load_fleet(path)
    results: list[dict[str, Any]] = []
    fleet_ok = True
    for item in repositories:
        root: Path = item["path"]
        row: dict[str, Any] = {
            "name": item["name"],
            "path": str(root),
            "required": item["required"],
            "required_version": required_version,
        }
        try:
            if not root.is_dir():
                raise CommandError("repository path does not exist")
            config = load_config(root)
            version_path = root / ".handoff/VERSION"
            installed = (
                version_path.read_text(encoding="utf-8").strip()
                if version_path.is_file()
                else "missing"
            )
            snapshot = inspect_git(
                config.root,
                config.generated_paths,
                repository=config.project_name,
            )
            continuity = validate_repository(config, snapshot)
            row.update(
                {
                    "installed_version": installed,
                    "version_current": installed == required_version,
                    "continuity_valid": continuity.ok,
                    "errors": [finding.as_dict() for finding in continuity.errors],
                    "warnings": [finding.as_dict() for finding in continuity.warnings],
                    "branch": snapshot.branch,
                    "head": snapshot.head,
                }
            )
            row["ok"] = bool(row["version_current"] and row["continuity_valid"])
        except Exception as exc:  # Fleet audit must report every repository.
            row.update(
                {
                    "installed_version": "unknown",
                    "version_current": False,
                    "continuity_valid": False,
                    "errors": [{"message": str(exc)}],
                    "warnings": [],
                    "ok": False,
                }
            )
        if item["required"] and not row["ok"]:
            fleet_ok = False
        results.append(row)
    compliant = sum(1 for row in results if row["ok"])
    return CommandOutcome(
        f"Handoff fleet: {compliant}/{len(results)} repositories compliant "
        f"with {required_version}.",
        {
            "fleet": str(path.resolve()),
            "required_version": required_version,
            "repository_count": len(results),
            "compliant_count": compliant,
            "repositories": results,
        },
        ok=fleet_ok,
    )


def fleet_upgrade(path: Path, *, adopt_missing: bool = False) -> CommandOutcome:
    required_version, repositories = _load_fleet(path)
    if required_version != __version__:
        raise CommandError(
            f"This Handoff runtime is {__version__}, but the fleet requires "
            f"{required_version}"
        )
    results: list[dict[str, Any]] = []
    for item in repositories:
        root: Path = item["path"]
        if not (root / "handoff.toml").exists():
            if not adopt_missing:
                results.append(
                    {
                        "name": item["name"],
                        "action": "skipped",
                        "ok": False,
                        "message": "not adopted",
                    }
                )
                continue
            outcome = adopt_repository(root)
            action = "adopted"
        else:
            outcome = upgrade_repository(root)
            action = "upgraded"
        results.append(
            {
                "name": item["name"],
                "action": action,
                "ok": outcome.ok,
                "message": outcome.message,
            }
        )
    ok = all(row["ok"] for row in results)
    return CommandOutcome(
        f"Fleet upgrade prepared in {sum(1 for row in results if row['ok'])}/"
        f"{len(results)} repositories. Commit and run Handoff in each repository.",
        {"fleet": str(path.resolve()), "repositories": results},
        ok=ok,
    )
