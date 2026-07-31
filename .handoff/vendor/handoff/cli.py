"""Argument parsing and console entry points."""

from __future__ import annotations

from pathlib import Path
from typing import Callable
import argparse
import json
import sys

from handoff.commands import (
    CommandError,
    CommandOutcome,
    initialize,
    prepare_handoff,
    refresh_context,
    resume_session,
    seal_handoff,
    status_report,
    update_work_queue,
    validate_continuity,
)
from handoff.adoption import adopt_repository, upgrade_repository
from handoff.config import ConfigError
from handoff.fleet import fleet_status, fleet_upgrade, initialize_fleet
from handoff.git import GitError


COMMANDS: dict[str, Callable[[str], CommandOutcome]] = {
    "prepare-handoff": prepare_handoff,
    "seal-handoff": seal_handoff,
    "acquire-handoff": resume_session,
    "resume-session": resume_session,
    "refresh-context": refresh_context,
    "update-work-queue": update_work_queue,
    "validate-continuity": validate_continuity,
    "status-report": status_report,
}


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="handoff",
        description="Repository-native AI continuity framework",
    )
    parser.add_argument("--version", action="version", version="handoff 0.5.0")
    subparsers = parser.add_subparsers(dest="command")

    init_parser = subparsers.add_parser(
        "init", help="Install the Handoff structure without overwriting existing files"
    )
    init_parser.add_argument("--repo", default=".", help="Repository directory")
    init_parser.add_argument(
        "--git-init",
        action="store_true",
        help="Initialize Git when the target is not already a repository",
    )
    init_parser.add_argument(
        "--portable",
        action="store_true",
        help="Vendor the runtime and add a repository-local ./handoff command",
    )
    init_parser.add_argument("--json", action="store_true", help="Emit JSON")

    adopt_parser = subparsers.add_parser(
        "adopt", help="Autonomously adopt canonical Handoff in an existing repository"
    )
    adopt_parser.add_argument("--repo", default=".", help="Repository directory")
    adopt_parser.add_argument("--no-portable", action="store_true")
    adopt_parser.add_argument("--no-ci", action="store_true")
    adopt_parser.add_argument("--json", action="store_true", help="Emit JSON")

    upgrade_parser = subparsers.add_parser(
        "upgrade", help="Upgrade a repository's portable Handoff runtime"
    )
    upgrade_parser.add_argument("--repo", default=".", help="Repository directory")
    upgrade_parser.add_argument("--no-ci", action="store_true")
    upgrade_parser.add_argument("--json", action="store_true", help="Emit JSON")

    fleet_init_parser = subparsers.add_parser("fleet-init")
    fleet_init_parser.add_argument("--fleet", default="handoff-fleet.toml")
    fleet_init_parser.add_argument("--json", action="store_true", help="Emit JSON")

    fleet_status_parser = subparsers.add_parser("fleet-status")
    fleet_status_parser.add_argument("--fleet", default="handoff-fleet.toml")
    fleet_status_parser.add_argument("--json", action="store_true", help="Emit JSON")

    fleet_upgrade_parser = subparsers.add_parser("fleet-upgrade")
    fleet_upgrade_parser.add_argument("--fleet", default="handoff-fleet.toml")
    fleet_upgrade_parser.add_argument("--adopt-missing", action="store_true")
    fleet_upgrade_parser.add_argument("--json", action="store_true", help="Emit JSON")

    for name in COMMANDS:
        child = subparsers.add_parser(name)
        child.add_argument("--repo", default=".", help="Repository directory")
        child.add_argument("--json", action="store_true", help="Emit JSON")
    return parser


def _emit(outcome: CommandOutcome, as_json: bool) -> int:
    if as_json:
        print(json.dumps({"ok": outcome.ok, "message": outcome.message, **outcome.data}, indent=2))
    else:
        print(outcome.message)
        if not outcome.ok:
            for finding in outcome.data.get("findings", []):
                location = f" [{finding['path']}]" if finding.get("path") else ""
                print(
                    f"{finding['severity'].upper()}: {finding['code']}: "
                    f"{finding['message']}{location}"
                )
    return 0 if outcome.ok else 1


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    try:
        if args.command is None:
            outcome = seal_handoff(".")
        elif args.command == "init":
            outcome = initialize(
                Path(args.repo), git_init=args.git_init, portable=args.portable
            )
        elif args.command == "adopt":
            outcome = adopt_repository(
                Path(args.repo),
                portable=not args.no_portable,
                ci=not args.no_ci,
            )
        elif args.command == "upgrade":
            outcome = upgrade_repository(Path(args.repo), ci=not args.no_ci)
        elif args.command == "fleet-init":
            outcome = initialize_fleet(Path(args.fleet))
        elif args.command == "fleet-status":
            outcome = fleet_status(Path(args.fleet))
        elif args.command == "fleet-upgrade":
            outcome = fleet_upgrade(
                Path(args.fleet), adopt_missing=args.adopt_missing
            )
        else:
            outcome = COMMANDS[args.command](args.repo)
        return _emit(outcome, getattr(args, "json", False))
    except (CommandError, ConfigError, GitError, OSError, ValueError) as exc:
        if getattr(args, "json", False):
            print(json.dumps({"ok": False, "error": str(exc)}, indent=2))
        else:
            print(f"ERROR: {exc}", file=sys.stderr)
        return 2


def _entry(command: str) -> int:
    return main([command, *sys.argv[1:]])


def prepare_handoff_entry() -> int:
    return _entry("prepare-handoff")


def seal_handoff_entry() -> int:
    return _entry("seal-handoff")


def acquire_handoff_entry() -> int:
    return _entry("acquire-handoff")


def resume_session_entry() -> int:
    return _entry("resume-session")


def refresh_context_entry() -> int:
    return _entry("refresh-context")


def update_work_queue_entry() -> int:
    return _entry("update-work-queue")


def validate_continuity_entry() -> int:
    return _entry("validate-continuity")


def status_report_entry() -> int:
    return _entry("status-report")
