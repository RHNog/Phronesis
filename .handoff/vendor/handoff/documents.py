"""Markdown metadata, section parsing, and safe document writes."""

from __future__ import annotations

from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path
from typing import Iterator, Mapping
import json
import os
import re
import tempfile


METADATA_RE = re.compile(r"\A<!-- handoff: (\{.*\}) -->\n", re.DOTALL)


class DocumentError(ValueError):
    pass


def utc_now() -> datetime:
    return datetime.now(timezone.utc).replace(microsecond=0)


def isoformat(value: datetime | None = None) -> str:
    return (value or utc_now()).isoformat().replace("+00:00", "Z")


def metadata_line(metadata: Mapping[str, object]) -> str:
    payload = json.dumps(dict(metadata), sort_keys=True, separators=(",", ":"))
    return f"<!-- handoff: {payload} -->"


def with_metadata(metadata: Mapping[str, object], body: str) -> str:
    return f"{metadata_line(metadata)}\n{body.strip()}\n"


def parse_metadata(text: str) -> dict[str, object]:
    first = text.splitlines()[0] if text else ""
    match = re.fullmatch(r"<!-- handoff: (\{.*\}) -->", first)
    if not match:
        raise DocumentError("missing Handoff metadata comment on the first line")
    try:
        value = json.loads(match.group(1))
    except json.JSONDecodeError as exc:
        raise DocumentError(f"invalid Handoff metadata JSON: {exc}") from exc
    if not isinstance(value, dict):
        raise DocumentError("Handoff metadata must be a JSON object")
    return value


def section(text: str, title: str, default: str = "") -> str:
    pattern = re.compile(
        rf"^##\s+{re.escape(title)}\s*$\n(.*?)(?=^##\s+|\Z)",
        re.MULTILINE | re.DOTALL | re.IGNORECASE,
    )
    match = pattern.search(text)
    return match.group(1).strip() if match else default


def extract_markdown_links(text: str) -> tuple[str, ...]:
    links: list[str] = []
    for target in re.findall(r"\[[^\]]+\]\(([^)]+)\)", text):
        target = target.strip().split("#", 1)[0]
        if target and not re.match(r"^[a-z][a-z0-9+.-]*:", target, re.IGNORECASE):
            links.append(target)
    return tuple(links)


def _atomic_write(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    descriptor, temporary = tempfile.mkstemp(prefix=f".{path.name}.", dir=path.parent)
    try:
        with os.fdopen(descriptor, "w", encoding="utf-8", newline="\n") as stream:
            stream.write(content)
            stream.flush()
            os.fsync(stream.fileno())
        os.replace(temporary, path)
    except BaseException:
        try:
            os.unlink(temporary)
        except FileNotFoundError:
            pass
        raise


def write_text_atomic(path: Path, content: str) -> None:
    _atomic_write(path, content)


@contextmanager
def document_transaction(changes: Mapping[Path, str]) -> Iterator[None]:
    """Write a set atomically enough to roll back if final validation fails."""
    originals: dict[Path, bytes | None] = {
        path: path.read_bytes() if path.exists() else None for path in changes
    }
    try:
        for path, content in changes.items():
            _atomic_write(path, content)
        yield
    except BaseException:
        for path, original in originals.items():
            if original is None:
                path.unlink(missing_ok=True)
            else:
                path.parent.mkdir(parents=True, exist_ok=True)
                descriptor, temporary = tempfile.mkstemp(
                    prefix=f".{path.name}.rollback.", dir=path.parent
                )
                with os.fdopen(descriptor, "wb") as stream:
                    stream.write(original)
                    stream.flush()
                    os.fsync(stream.fileno())
                os.replace(temporary, path)
        raise
