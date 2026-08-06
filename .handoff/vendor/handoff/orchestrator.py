"""Platform-neutral contracts for a future conversation orchestrator.

No ChatGPT, Codex, Claude, or other platform adapter is implemented here. The
repository package remains complete without one.
"""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Mapping, Protocol, Sequence


@dataclass(frozen=True)
class Workspace:
    workspace_id: str
    repository_root: Path
    branch: str
    metadata: Mapping[str, str]


@dataclass(frozen=True)
class PreparedHandoff:
    workspace_id: str
    generation_id: str
    bootstrap_path: Path
    commit: str


@dataclass(frozen=True)
class Conversation:
    conversation_id: str
    workspace_id: str
    platform: str


class WorkspaceDiscovery(Protocol):
    """Finds active repository workspaces without inspecting chat history."""

    def active_workspaces(self) -> Sequence[Workspace]: ...


class RepositoryContinuity(Protocol):
    """Invokes repository-owned validation and handoff operations."""

    def validate(self, workspace: Workspace) -> None: ...

    def prepare_handoff(self, workspace: Workspace) -> PreparedHandoff: ...


class ConversationPlatform(Protocol):
    """Creates and retires disposable execution environments."""

    @property
    def platform_name(self) -> str: ...

    def create_successor(
        self, workspace: Workspace, handoff: PreparedHandoff, bootstrap: str
    ) -> Conversation: ...

    def present_session_summary(
        self, conversation: Conversation, summary: str
    ) -> None: ...

    def archive(self, conversation: Conversation) -> None: ...


class OrchestrationJournal(Protocol):
    """Records orchestration events; never replaces repository continuity state."""

    def record_successor(
        self,
        predecessor: Conversation | None,
        successor: Conversation,
        handoff: PreparedHandoff,
    ) -> None: ...
