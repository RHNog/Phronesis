"""Validation command execution and continuity invariants."""

from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from hashlib import sha256
import json
import shlex
import subprocess
import sys
import time

from handoff.config import HandoffConfig
from handoff.documents import (
    DocumentError,
    extract_markdown_links,
    isoformat,
    parse_metadata,
    write_text_atomic,
)
from handoff.git import GitSnapshot, inspect_git, is_generated_only_descendant
from handoff.models import ContinuityResult


GENERATED_SNAPSHOT_DOCUMENTS = (
    "handoff",
    "session_summary",
    "current_context",
    "work_queue",
    "bootstrap",
)


def _head_matches(
    config: HandoffConfig, snapshot: GitSnapshot, recorded_head: object
) -> bool:
    return isinstance(recorded_head, str) and is_generated_only_descendant(
        config.root,
        recorded_head,
        snapshot.head,
        config.generated_paths,
    )


def _report_paths(config: HandoffConfig) -> tuple[Path, Path]:
    base = config.path(config.reports_dir)
    return base / "validation-latest.json", base / "validation-latest.md"


def run_validation_commands(
    config: HandoffConfig, snapshot: GitSnapshot
) -> dict[str, Any]:
    """Run configured validation without a shell and persist an auditable report."""
    started = time.monotonic()
    results: list[dict[str, Any]] = []
    for command in config.validation_commands:
        command_started = time.monotonic()
        arguments: list[str] = []
        try:
            expanded = command.replace("{python}", sys.executable).replace(
                "{root}", str(config.root)
            )
            arguments = shlex.split(expanded)
            if not arguments:
                raise ValueError("command is empty")
            completed = subprocess.run(
                arguments,
                cwd=config.root,
                text=True,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                timeout=900,
                check=False,
            )
            result = {
                "command": command,
                "arguments": arguments,
                "exit_code": completed.returncode,
                "passed": completed.returncode == 0,
                "duration_seconds": round(time.monotonic() - command_started, 3),
                "stdout": completed.stdout[-20000:],
                "stderr": completed.stderr[-20000:],
            }
        except (OSError, ValueError, subprocess.TimeoutExpired) as exc:
            result = {
                "command": command,
                "arguments": arguments,
                "exit_code": None,
                "passed": False,
                "duration_seconds": round(time.monotonic() - command_started, 3),
                "stdout": getattr(exc, "stdout", "") or "",
                "stderr": str(exc),
            }
        results.append(result)

    passed = all(item["passed"] for item in results)
    report: dict[str, Any] = {
        "schema_version": config.schema_version,
        "generated_at": isoformat(),
        "duration_seconds": round(time.monotonic() - started, 3),
        "status": "passed" if passed else "failed",
        "commands_configured": len(config.validation_commands),
        "commands": results,
        "git": snapshot.as_dict(),
        "config_digest": config.digest,
    }
    json_path, markdown_path = _report_paths(config)
    write_text_atomic(json_path, json.dumps(report, indent=2, sort_keys=True) + "\n")

    rows = "\n".join(
        f"| `{item['command']}` | {'PASS' if item['passed'] else 'FAIL'} | "
        f"{item['exit_code'] if item['exit_code'] is not None else 'error'} | "
        f"{item['duration_seconds']:.3f}s |"
        for item in results
    )
    if not rows:
        rows = "| _No commands configured_ | PASS | — | 0.000s |"
    markdown = f"""\
# Validation Report

- **Status:** {report['status'].upper()}
- **Generated:** {report['generated_at']}
- **Branch:** `{snapshot.branch}`
- **HEAD:** `{snapshot.head}`
- **Implementation worktree fingerprint:** `{snapshot.fingerprint}`

| Command | Result | Exit | Duration |
|---|---:|---:|---:|
{rows}

Full command output is retained in
[`validation-latest.json`](validation-latest.json).
"""
    write_text_atomic(markdown_path, markdown)
    return report


def load_validation_report(config: HandoffConfig) -> dict[str, Any] | None:
    json_path, _ = _report_paths(config)
    if not json_path.exists():
        return None
    try:
        value = json.loads(json_path.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        return None
    return value if isinstance(value, dict) else None


def _check_required_documents(config: HandoffConfig, result: ContinuityResult) -> None:
    roles = {path: key for key, path in config.document_paths.items()}
    for relative in config.required_documents:
        role = roles.get(relative)
        path = config.path(relative)
        if not path.is_file():
            result.add("error", "missing-document", "Required document is missing", relative)
            continue
        if relative.endswith(".md") and role != "agents":
            try:
                metadata = parse_metadata(path.read_text(encoding="utf-8"))
            except (DocumentError, OSError) as exc:
                result.add("error", "invalid-metadata", str(exc), relative)
                continue
            if str(metadata.get("schema_version")) != config.schema_version:
                result.add(
                    "error",
                    "schema-mismatch",
                    f"Document schema {metadata.get('schema_version')!r} does not match "
                    f"configuration schema {config.schema_version!r}",
                    relative,
                )
            if role and role != "agents":
                expected_document = role.upper()
                if metadata.get("document") != expected_document:
                    result.add(
                        "error",
                        "document-role-mismatch",
                        f"Metadata document {metadata.get('document')!r} does not "
                        f"match configured role {expected_document!r}",
                        relative,
                    )
                is_generated = role in GENERATED_SNAPSHOT_DOCUMENTS
                if is_generated and metadata.get("generated") is not True:
                    result.add(
                        "error",
                        "ownership-mismatch",
                        "Machine-owned document is not marked generated",
                        relative,
                    )
                if not is_generated and metadata.get("owner") != "human-and-agent":
                    result.add(
                        "error",
                        "ownership-mismatch",
                        "Canonical source is not marked human-and-agent owned",
                        relative,
                    )


def _check_generated_snapshot(
    config: HandoffConfig,
    snapshot: GitSnapshot,
    result: ContinuityResult,
) -> None:
    generation_ids: dict[str, str] = {}
    for key in GENERATED_SNAPSHOT_DOCUMENTS:
        relative = config.document(key)
        path = config.path(relative)
        if not path.exists():
            continue
        try:
            metadata = parse_metadata(path.read_text(encoding="utf-8"))
        except (DocumentError, OSError):
            continue
        if metadata.get("state") == "not-prepared":
            result.add(
                "error",
                "handoff-not-prepared",
                "Operational package has not been prepared",
                relative,
            )
            continue
        expected = {
            "branch": snapshot.branch,
            "worktree_fingerprint": snapshot.fingerprint,
            "config_digest": config.digest,
        }
        for key, current in expected.items():
            if metadata.get(key) != current:
                result.add(
                    "error",
                    f"stale-{key.replace('_', '-')}",
                    f"Recorded {key} {metadata.get(key)!r} does not match {current!r}",
                    relative,
                )
        if not _head_matches(config, snapshot, metadata.get("head")):
            result.add(
                "error",
                "stale-head",
                f"Recorded head {metadata.get('head')!r} is neither current HEAD "
                "nor the anchor of a generated-only seal",
                relative,
            )
        generation_id = metadata.get("generation_id")
        if isinstance(generation_id, str):
            generation_ids[relative] = generation_id
        else:
            result.add(
                "error",
                "missing-generation-id",
                "Generated document has no generation ID",
                relative,
            )
    if len(set(generation_ids.values())) > 1:
        result.add(
            "error",
            "mixed-generation",
            "Generated bootstrap documents come from different preparation runs",
        )


def _check_validation_report(
    config: HandoffConfig,
    snapshot: GitSnapshot,
    result: ContinuityResult,
) -> None:
    report = load_validation_report(config)
    relative = f"{config.reports_dir}/validation-latest.json"
    if report is None:
        result.add("error", "missing-validation", "Validation report is missing or invalid", relative)
        return
    if report.get("status") != "passed":
        result.add("error", "validation-failed", "Latest validation did not pass", relative)
    if report.get("config_digest") != config.digest:
        result.add(
            "error",
            "stale-validation-config",
            "Validation was produced with a different configuration",
            relative,
        )
    git_data = report.get("git", {})
    if not isinstance(git_data, dict):
        git_data = {}
    expected = {
        "branch": snapshot.branch,
        "worktree_fingerprint": snapshot.fingerprint,
    }
    for key, current in expected.items():
        if git_data.get(key) != current:
            result.add(
                "error",
                "stale-validation-state",
                f"Validation {key} {git_data.get(key)!r} does not match {current!r}",
                relative,
            )
    if not _head_matches(config, snapshot, git_data.get("head")):
        result.add(
            "error",
            "stale-validation-state",
            f"Validation head {git_data.get('head')!r} is neither current HEAD "
            "nor the anchor of a generated-only seal",
            relative,
        )
    generated = report.get("generated_at")
    try:
        timestamp = datetime.fromisoformat(str(generated).replace("Z", "+00:00"))
        age_hours = (datetime.now(timezone.utc) - timestamp).total_seconds() / 3600
        if age_hours > config.max_validation_age_hours:
            result.add(
                "error",
                "expired-validation",
                f"Latest validation is {age_hours:.1f}h old; maximum is "
                f"{config.max_validation_age_hours:.1f}h",
                relative,
            )
    except (TypeError, ValueError):
        result.add(
            "error",
            "invalid-validation-time",
            "Validation timestamp is missing or invalid",
            relative,
        )


def _check_manifest(
    config: HandoffConfig,
    snapshot: GitSnapshot,
    result: ContinuityResult,
) -> None:
    relative = f"{config.reports_dir}/continuity-manifest.json"
    path = config.path(relative)
    try:
        manifest = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        result.add(
            "error",
            "missing-manifest",
            "Continuity artifact manifest is missing or invalid",
            relative,
        )
        return
    if not isinstance(manifest, dict):
        result.add("error", "invalid-manifest", "Manifest must be a JSON object", relative)
        return
    expected_snapshot = {
        "branch": snapshot.branch,
        "worktree_fingerprint": snapshot.fingerprint,
        "config_digest": config.digest,
    }
    for key, current in expected_snapshot.items():
        if manifest.get(key) != current:
            result.add(
                "error",
                "stale-manifest",
                f"Manifest {key} {manifest.get(key)!r} does not match {current!r}",
                relative,
            )
    if not _head_matches(config, snapshot, manifest.get("head")):
        result.add(
            "error",
            "stale-manifest",
            f"Manifest head {manifest.get('head')!r} is neither current HEAD nor "
            "the anchor of a generated-only seal",
            relative,
        )
    artifacts = manifest.get("artifacts")
    if not isinstance(artifacts, dict):
        result.add(
            "error",
            "invalid-manifest",
            "Manifest artifact map is missing",
            relative,
        )
        return
    expected_artifacts = {
        config.document(key) for key in GENERATED_SNAPSHOT_DOCUMENTS
    }
    expected_artifacts.update(
        {
            f"{config.reports_dir}/bootstrap-latest.json",
            f"{config.reports_dir}/validation-latest.json",
            f"{config.reports_dir}/validation-latest.md",
        }
    )
    for missing in sorted(expected_artifacts.difference(artifacts)):
        result.add(
            "error",
            "unsealed-artifact",
            f"Generated artifact is absent from the manifest: {missing}",
            relative,
        )
    manifest_generation = manifest.get("generation_id")
    for key in GENERATED_SNAPSHOT_DOCUMENTS:
        document_relative = config.document(key)
        document_path = config.path(document_relative)
        if not document_path.exists():
            continue
        try:
            metadata = parse_metadata(document_path.read_text(encoding="utf-8"))
        except (DocumentError, OSError):
            continue
        if metadata.get("generation_id") != manifest_generation:
            result.add(
                "error",
                "manifest-generation-mismatch",
                f"Manifest generation does not match {document_relative}",
                relative,
            )
    for artifact, expected_digest in artifacts.items():
        if not isinstance(artifact, str) or not isinstance(expected_digest, str):
            result.add(
                "error",
                "invalid-manifest-entry",
                "Manifest entries must map paths to SHA-256 strings",
                relative,
            )
            continue
        artifact_path = config.path(artifact)
        try:
            artifact_path.resolve().relative_to(config.root)
        except ValueError:
            result.add(
                "error",
                "external-manifest-entry",
                f"Manifest path escapes repository: {artifact}",
                relative,
            )
            continue
        if not artifact_path.is_file():
            result.add(
                "error",
                "missing-artifact",
                f"Manifest artifact does not exist: {artifact}",
                relative,
            )
            continue
        actual = sha256(artifact_path.read_bytes()).hexdigest()
        if actual != expected_digest:
            result.add(
                "error",
                "artifact-digest-mismatch",
                f"Generated artifact changed after sealing: {artifact}",
                relative,
            )


def _check_handoff_links(config: HandoffConfig, result: ContinuityResult) -> None:
    for key in ("handoff", "bootstrap"):
        relative = config.document(key)
        path = config.path(relative)
        if not path.exists():
            continue
        try:
            text = path.read_text(encoding="utf-8")
        except OSError as exc:
            result.add("error", "unreadable-document", str(exc), relative)
            continue
        for target in extract_markdown_links(text):
            resolved = (path.parent / target).resolve()
            try:
                resolved.relative_to(config.root)
            except ValueError:
                result.add(
                    "error",
                    "external-reference",
                    f"Reference escapes the repository: {target}",
                    relative,
                )
                continue
            if not resolved.exists():
                result.add(
                    "error",
                    "broken-reference",
                    f"Referenced file does not exist: {target}",
                    relative,
                )


def _check_document_age(config: HandoffConfig, result: ContinuityResult) -> None:
    now = time.time()
    manual = [
        config.document("project_state"),
        config.document("architecture"),
        config.document("decisions"),
        config.document("backlog"),
        config.document("active_task"),
    ]
    severity = "error" if config.fail_on_stale_documents else "warning"
    for relative in manual:
        path = config.path(relative)
        if not path.exists():
            continue
        age_hours = (now - path.stat().st_mtime) / 3600
        if age_hours > config.stale_after_hours:
            result.add(
                severity,
                "possibly-stale-document",
                f"Document has not changed for {age_hours:.1f}h; review its current truth",
                relative,
            )


def validate_repository(
    config: HandoffConfig, snapshot: GitSnapshot | None = None
) -> ContinuityResult:
    snapshot = snapshot or inspect_git(
        config.root, config.generated_paths, repository=config.project_name
    )
    result = ContinuityResult()
    _check_required_documents(config, result)
    _check_generated_snapshot(config, snapshot, result)
    _check_validation_report(config, snapshot, result)
    _check_manifest(config, snapshot, result)
    _check_handoff_links(config, result)
    _check_document_age(config, result)
    return result
