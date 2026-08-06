"""Stable extension contracts for future Handoff integrations.

The core does not load third-party code yet. These protocols define the semantic
boundary so later adapters do not change repository document meaning.
"""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Any, Mapping, Protocol, Sequence


@dataclass(frozen=True)
class ExtensionContext:
    repository_root: Path
    branch: str
    head: str
    generation_id: str


@dataclass(frozen=True)
class ExtensionFinding:
    severity: str
    code: str
    message: str
    evidence: Mapping[str, Any]


class ValidationProvider(Protocol):
    """Contributes read-only checks to continuity validation."""

    @property
    def name(self) -> str: ...

    def validate(self, context: ExtensionContext) -> Sequence[ExtensionFinding]: ...


class ContextProvider(Protocol):
    """Returns evidence that may be rendered into generated context."""

    @property
    def name(self) -> str: ...

    def collect(self, context: ExtensionContext) -> Mapping[str, Any]: ...


class LifecycleHook(Protocol):
    """Receives lifecycle events; it may not redefine repository semantics."""

    @property
    def name(self) -> str: ...

    def before_prepare(self, context: ExtensionContext) -> None: ...

    def after_prepare(self, context: ExtensionContext, package: Path) -> None: ...
