"""Configuration loading and path resolution for Handoff."""

from __future__ import annotations

from dataclasses import dataclass, field
from hashlib import sha256
from pathlib import Path
from typing import Any
import tomllib


DEFAULT_REQUIRED_DOCUMENTS = (
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
)

DEFAULT_GENERATED_PATHS = (
    "docs/ai/HANDOFF.md",
    "docs/ai/SESSION_SUMMARY.md",
    "docs/ai/CURRENT_CONTEXT.md",
    "docs/ai/WORK_QUEUE.md",
    "docs/ai/BOOTSTRAP.md",
    "docs/ai/reports/",
)

DEFAULT_DOCUMENT_PATHS = {
    "agents": "AGENTS.md",
    "project_state": "docs/PROJECT_STATE.md",
    "architecture": "docs/ARCHITECTURE.md",
    "decisions": "docs/DECISIONS.md",
    "changelog": "docs/CHANGELOG.md",
    "backlog": "docs/BACKLOG.md",
    "active_task": "docs/ai/ACTIVE_TASK.md",
    "handoff": "docs/ai/HANDOFF.md",
    "session_summary": "docs/ai/SESSION_SUMMARY.md",
    "current_context": "docs/ai/CURRENT_CONTEXT.md",
    "work_queue": "docs/ai/WORK_QUEUE.md",
    "bootstrap": "docs/ai/BOOTSTRAP.md",
}


@dataclass(frozen=True)
class HandoffConfig:
    root: Path
    config_path: Path
    schema_version: str = "1"
    docs_dir: str = "docs"
    ai_dir: str = "docs/ai"
    reports_dir: str = "docs/ai/reports"
    required_documents: tuple[str, ...] = DEFAULT_REQUIRED_DOCUMENTS
    generated_paths: tuple[str, ...] = DEFAULT_GENERATED_PATHS
    document_paths: dict[str, str] = field(
        default_factory=lambda: dict(DEFAULT_DOCUMENT_PATHS)
    )
    validation_commands: tuple[str, ...] = ()
    max_validation_age_hours: float = 24.0
    fail_on_stale_documents: bool = False
    stale_after_hours: float = 168.0
    project_name: str = ""
    extra: dict[str, Any] = field(default_factory=dict)

    def path(self, relative: str) -> Path:
        return self.root / relative

    def document(self, key: str) -> str:
        try:
            return self.document_paths[key]
        except KeyError as exc:
            raise ConfigError(f"No path configured for document {key!r}") from exc

    @property
    def digest(self) -> str:
        if not self.config_path.exists():
            return "MISSING"
        return sha256(self.config_path.read_bytes()).hexdigest()


class ConfigError(ValueError):
    pass


def _as_tuple(value: Any, key: str) -> tuple[str, ...]:
    if value is None:
        return ()
    if not isinstance(value, list) or not all(isinstance(item, str) for item in value):
        raise ConfigError(f"{key} must be an array of strings")
    return tuple(value)


def _repository_path(value: str, key: str, preserve_trailing_slash: bool = False) -> str:
    if not value.strip():
        raise ConfigError(f"{key} must be a non-empty repository-relative path")
    trailing_slash = value.replace("\\", "/").endswith("/")
    candidate = Path(value)
    if candidate.is_absolute() or ".." in candidate.parts:
        raise ConfigError(f"{key} must remain inside the repository")
    normalized = candidate.as_posix()
    while normalized.startswith("./"):
        normalized = normalized[2:]
    if not normalized or normalized == ".":
        raise ConfigError(f"{key} cannot refer to the repository root")
    if preserve_trailing_slash and trailing_slash:
        normalized += "/"
    return normalized


def _path_is_generated(path: str, exclusions: tuple[str, ...]) -> bool:
    for exclusion in exclusions:
        if exclusion.endswith("/") and path.startswith(exclusion):
            return True
        if path == exclusion:
            return True
    return False


def discover_root(start: Path | str = ".") -> Path:
    current = Path(start).resolve()
    if current.is_file():
        current = current.parent
    for candidate in (current, *current.parents):
        if (candidate / "handoff.toml").exists():
            return candidate
    return current


def load_config(start: Path | str = ".") -> HandoffConfig:
    root = discover_root(start)
    config_path = root / "handoff.toml"
    if not config_path.exists():
        raise ConfigError(
            f"No handoff.toml found at or above {Path(start).resolve()}. "
            "Run `handoff init` first."
        )
    try:
        raw = tomllib.loads(config_path.read_text(encoding="utf-8"))
    except (tomllib.TOMLDecodeError, OSError) as exc:
        raise ConfigError(f"Cannot load {config_path}: {exc}") from exc

    framework = raw.get("framework", {})
    validation = raw.get("validation", {})
    project = raw.get("project", {})
    documents = raw.get("documents", {})
    if (
        not isinstance(framework, dict)
        or not isinstance(validation, dict)
        or not isinstance(documents, dict)
    ):
        raise ConfigError(
            "[framework], [documents], and [validation] must be TOML tables"
        )
    document_paths = dict(DEFAULT_DOCUMENT_PATHS)
    for key, value in documents.items():
        if key not in document_paths:
            raise ConfigError(f"Unknown document mapping: documents.{key}")
        if not isinstance(value, str) or not value.strip():
            raise ConfigError(f"documents.{key} must be a non-empty path string")
        document_paths[key] = _repository_path(value, f"documents.{key}")

    required = framework.get("required_documents", list(DEFAULT_REQUIRED_DOCUMENTS))
    generated = framework.get("generated_paths", list(DEFAULT_GENERATED_PATHS))
    commands = validation.get("commands", [])
    required_documents = tuple(
        _repository_path(value, "framework.required_documents")
        for value in _as_tuple(required, "framework.required_documents")
    )
    generated_paths = tuple(
        _repository_path(value, "framework.generated_paths", preserve_trailing_slash=True)
        for value in _as_tuple(generated, "framework.generated_paths")
    )
    for key, document_path in document_paths.items():
        if document_path not in required_documents:
            raise ConfigError(
                f"documents.{key} path {document_path!r} must be listed in "
                "framework.required_documents"
            )
    for key in (
        "handoff",
        "session_summary",
        "current_context",
        "work_queue",
        "bootstrap",
    ):
        document_path = document_paths[key]
        if not _path_is_generated(document_path, generated_paths):
            raise ConfigError(
                f"documents.{key} path {document_path!r} must be covered by "
                "framework.generated_paths"
            )
    reports_dir = _repository_path(
        str(framework.get("reports_dir", "docs/ai/reports")),
        "framework.reports_dir",
    )
    if not _path_is_generated(f"{reports_dir}/placeholder", generated_paths):
        raise ConfigError(
            "framework.reports_dir must be covered by framework.generated_paths"
        )

    return HandoffConfig(
        root=root,
        config_path=config_path,
        schema_version=str(framework.get("schema_version", "1")),
        docs_dir=_repository_path(
            str(framework.get("docs_dir", "docs")), "framework.docs_dir"
        ),
        ai_dir=_repository_path(
            str(framework.get("ai_dir", "docs/ai")), "framework.ai_dir"
        ),
        reports_dir=reports_dir,
        required_documents=required_documents,
        generated_paths=generated_paths,
        document_paths=document_paths,
        validation_commands=_as_tuple(commands, "validation.commands"),
        max_validation_age_hours=float(validation.get("max_age_hours", 24)),
        fail_on_stale_documents=bool(validation.get("fail_on_stale_documents", False)),
        stale_after_hours=float(validation.get("stale_after_hours", 168)),
        project_name=str(project.get("name", root.name)),
        extra=raw,
    )
