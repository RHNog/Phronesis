"""Read-only Git inspection used by every continuity command."""

from __future__ import annotations

from dataclasses import dataclass
from hashlib import sha256
from pathlib import Path
import os
import subprocess


class GitError(RuntimeError):
    pass


@dataclass(frozen=True)
class GitSnapshot:
    repository: str
    root: Path
    branch: str
    head: str
    status_lines: tuple[str, ...]
    excluded_paths: tuple[str, ...]
    worktree_fingerprint: str

    @property
    def clean(self) -> bool:
        return not self.status_lines

    @property
    def fingerprint(self) -> str:
        return self.worktree_fingerprint

    def as_dict(self) -> dict[str, object]:
        return {
            "repository": self.repository,
            "branch": self.branch,
            "head": self.head,
            "clean": self.clean,
            "status_lines": list(self.status_lines),
            "worktree_fingerprint": self.fingerprint,
            "excluded_paths": list(self.excluded_paths),
        }


def _git(root: Path, *args: str, check: bool = True) -> subprocess.CompletedProcess[str]:
    try:
        return subprocess.run(
            ["git", *args],
            cwd=root,
            check=check,
            text=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
        )
    except FileNotFoundError as exc:
        raise GitError("Git is required but was not found on PATH") from exc
    except subprocess.CalledProcessError as exc:
        detail = exc.stderr.strip() or exc.stdout.strip() or "unknown Git error"
        raise GitError(f"`git {' '.join(args)}` failed: {detail}") from exc


def is_git_repository(root: Path) -> bool:
    result = _git(root, "rev-parse", "--is-inside-work-tree", check=False)
    return result.returncode == 0 and result.stdout.strip() == "true"


def is_excluded_path(path: str, exclusions: tuple[str, ...]) -> bool:
    normalized = path.replace("\\", "/")
    for item in exclusions:
        candidate = item.strip().lstrip("./")
        if candidate.endswith("/"):
            if normalized.startswith(candidate):
                return True
        elif normalized == candidate:
            return True
    return False


def is_generated_only_descendant(
    root: Path,
    recorded_head: str,
    current_head: str,
    generated_paths: tuple[str, ...],
) -> bool:
    """Return whether HEAD advanced only through generated-artifact commits.

    A sealed package records the implementation commit it describes. Committing
    that package necessarily advances Git, so validation follows the ancestry
    path and accepts only commits whose tree changes are entirely covered by the
    configured generated paths. At merge commits, the parent that already
    contains the recorded implementation commit is used as the comparison base.
    """
    if recorded_head == current_head:
        return True
    if recorded_head in {"", "UNBORN"} or current_head in {"", "UNBORN"}:
        return False
    ancestor = _git(
        root,
        "merge-base",
        "--is-ancestor",
        recorded_head,
        current_head,
        check=False,
    )
    if ancestor.returncode != 0:
        return False
    commits = _git(
        root,
        "rev-list",
        "--reverse",
        "--ancestry-path",
        f"{recorded_head}..{current_head}",
    ).stdout.splitlines()
    for commit in commits:
        parents = _git(root, "show", "-s", "--format=%P", commit).stdout.split()
        eligible_parents = []
        for parent in parents:
            if parent == recorded_head:
                eligible_parents.append(parent)
                continue
            parent_contains_anchor = _git(
                root,
                "merge-base",
                "--is-ancestor",
                recorded_head,
                parent,
                check=False,
            )
            if parent_contains_anchor.returncode == 0:
                eligible_parents.append(parent)
        commit_is_generated_only = False
        for parent in eligible_parents:
            changed = _git(
                root,
                "diff",
                "--name-only",
                "-z",
                parent,
                commit,
            ).stdout.split("\0")
            paths = [path for path in changed if path]
            if all(is_excluded_path(path, generated_paths) for path in paths):
                commit_is_generated_only = True
                break
        if not commit_is_generated_only:
            return False
    return True


def _parse_status(raw: str) -> list[tuple[str, tuple[str, ...]]]:
    """Parse porcelain v1 -z without losing unusual filenames."""
    fields = raw.split("\0")
    parsed: list[tuple[str, tuple[str, ...]]] = []
    index = 0
    while index < len(fields):
        entry = fields[index]
        index += 1
        if not entry:
            continue
        status = entry[:2]
        path = entry[3:]
        if "R" in status or "C" in status:
            original = fields[index] if index < len(fields) else ""
            index += 1
            parsed.append((f"{status} {original} -> {path}", (original, path)))
        else:
            parsed.append((f"{status} {path}", (path,)))
    return parsed


def _update_file_digest(digest: AnyHash, root: Path, relative: str) -> None:
    path = root / relative
    digest.update(relative.encode("utf-8", errors="surrogateescape"))
    digest.update(b"\0")
    if path.is_symlink():
        digest.update(b"symlink\0")
        digest.update(os.readlink(path).encode("utf-8", errors="surrogateescape"))
        return
    if not path.exists():
        digest.update(b"missing")
        return
    if path.is_file():
        digest.update(b"file\0")
        with path.open("rb") as stream:
            for chunk in iter(lambda: stream.read(1024 * 1024), b""):
                digest.update(chunk)
        return
    if path.is_dir():
        digest.update(b"directory\0")
        for child in sorted(
            (
                item
                for item in path.rglob("*")
                if ".git" not in item.relative_to(path).parts
            ),
            key=lambda item: item.as_posix(),
        ):
            child_relative = child.relative_to(root).as_posix()
            digest.update(child_relative.encode("utf-8", errors="surrogateescape"))
            digest.update(b"\0")
            if child.is_symlink():
                digest.update(b"symlink\0")
                digest.update(
                    os.readlink(child).encode("utf-8", errors="surrogateescape")
                )
            elif child.is_file():
                digest.update(b"file\0")
                with child.open("rb") as stream:
                    for chunk in iter(lambda: stream.read(1024 * 1024), b""):
                        digest.update(chunk)
            elif child.is_dir():
                digest.update(b"directory\0")
            else:
                digest.update(b"other")
        return
    digest.update(b"other")


# hashlib does not publish a stable concrete hash type for annotations.
AnyHash = object


def _worktree_fingerprint(
    root: Path, entries: list[tuple[str, tuple[str, ...]]]
) -> str:
    digest = sha256()
    for display, paths in sorted(entries, key=lambda item: item[0]):
        digest.update(display.encode("utf-8", errors="surrogateescape"))
        digest.update(b"\0")
        for path in paths:
            _update_file_digest(digest, root, path)
            digest.update(b"\0")
    return digest.hexdigest()


def inspect_git(
    root: Path,
    exclusions: tuple[str, ...] = (),
    repository: str | None = None,
) -> GitSnapshot:
    root = root.resolve()
    if not is_git_repository(root):
        raise GitError(f"{root} is not a Git repository")

    top = Path(_git(root, "rev-parse", "--show-toplevel").stdout.strip()).resolve()
    branch = _git(top, "branch", "--show-current").stdout.strip()
    if not branch:
        branch = "DETACHED"

    head_result = _git(top, "rev-parse", "--verify", "HEAD", check=False)
    head = head_result.stdout.strip() if head_result.returncode == 0 else "UNBORN"

    raw_status = _git(
        top, "status", "--porcelain=v1", "-z", "--untracked-files=all"
    ).stdout
    entries = [
        entry
        for entry in _parse_status(raw_status)
        if not all(is_excluded_path(path, exclusions) for path in entry[1])
    ]
    status_lines = tuple(sorted(entry[0] for entry in entries))
    return GitSnapshot(
        repository=repository or top.name,
        root=top,
        branch=branch,
        head=head,
        status_lines=status_lines,
        excluded_paths=exclusions,
        worktree_fingerprint=_worktree_fingerprint(top, entries),
    )
