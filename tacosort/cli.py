"""Command-line interface for Taco AI File Sorter (`taco-sort`)."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Sequence

from .engine import (
    apply_plan,
    generate_bash_script,
    generate_powershell_script,
    load_profiles,
    plan_directory,
    undo_manifest,
)


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="taco-sort",
        description="Local-first file organizer & renamer with niche taxonomies, Ollama support, and 1-command rollback.",
    )
    sub = parser.add_subparsers(dest="command", required=True)

    # profiles
    sub.add_parser("profiles", help="List available niche taxonomy profiles.")

    # shared scan options helper
    def add_scan_args(p: argparse.ArgumentParser) -> None:
        p.add_argument("directory", help="Target directory to scan/organize.")
        p.add_argument("--profile", default="general_productivity", help="Niche taxonomy profile ID.")
        p.add_argument(
            "--naming",
            choices=["date_category_name", "category_date_name", "kebab_case", "original_clean", "keep_original"],
            default=None,
            help="Override the profile's default naming pattern.",
        )
        p.add_argument("--no-recursive", action="store_true", help="Only scan top-level files.")
        p.add_argument("--ollama", metavar="MODEL", default=None, help="Refine classifications via local Ollama model (e.g. llama3.2).")
        p.add_argument("--ollama-url", default="http://localhost:11434", help="Local Ollama endpoint URL.")

    # scan (preview only)
    p_scan = sub.add_parser("scan", help="Dry-run scan and preview proposed organization plan.")
    add_scan_args(p_scan)
    p_scan.add_argument("--json", action="store_true", dest="as_json", help="Emit structured JSON plan.")

    # apply (transactional execute + rollback manifest)
    p_apply = sub.add_parser("apply", help="Apply organization plan and save a rollback manifest.")
    add_scan_args(p_apply)
    p_apply.add_argument("--dry-run", action="store_true", help="Simulate without moving files.")
    p_apply.add_argument("--json", action="store_true", dest="as_json", help="Emit JSON result.")

    # undo
    p_undo = sub.add_parser("undo", help="Roll back a previous apply using its .tacosort-manifest-*.json file.")
    p_undo.add_argument("manifest", help="Path to rollback manifest JSON file.")
    p_undo.add_argument("--dry-run", action="store_true", help="Simulate rollback without moving files.")

    # script
    p_script = sub.add_parser("script", help="Export an escaped PowerShell or Bash organizer script.")
    add_scan_args(p_script)
    p_script.add_argument("--shell", choices=["powershell", "bash"], default="powershell", help="Target script shell.")
    p_script.add_argument("-o", "--output", default=None, help="Write script to file instead of stdout.")

    return parser


def main(argv: Sequence[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)

    if args.command == "profiles":
        profiles = load_profiles()
        for pid, info in profiles.items():
            print(f"{pid:26s} | {info['name']} ({len(info['categories'])} categories)")
        return 0

    if args.command == "undo":
        res = undo_manifest(args.manifest, dry_run=args.dry_run)
        prefix = "[DRY-RUN] " if args.dry_run else ""
        print(f"{prefix}Restored {res['restored_count']} file(s), skipped {res['skipped_count']}.")
        return 0

    plan = plan_directory(
        args.directory,
        profile_id=args.profile,
        naming_pattern=args.naming,
        recursive=not args.no_recursive,
        ollama_model=args.ollama,
        ollama_endpoint=args.ollama_url,
    )

    if args.command == "scan":
        if args.as_json:
            print(json.dumps(plan.to_dict(), indent=2))
        else:
            print(f"TacoSort Preview | Profile: {plan.profile_id} | Files: {plan.total_scanned} | Duplicate groups: {len(plan.duplicates)}")
            for it in plan.items:
                dup = " [DUP]" if it.is_duplicate else ""
                print(f"  {it.source_rel}  ->  {it.dest_rel}  ({it.category}, {int(it.confidence * 100)}%){dup}")
        return 0

    if args.command == "apply":
        res = apply_plan(plan, dry_run=args.dry_run)
        if args.as_json:
            print(json.dumps(res, indent=2))
        else:
            prefix = "[DRY-RUN] " if args.dry_run else ""
            print(f"{prefix}Moved {res['moved_count']} file(s), skipped {res['skipped_count']}.")
            if res["manifest_path"]:
                print(f"Rollback manifest saved: {res['manifest_path']}")
                print(f"To undo: taco-sort undo \"{res['manifest_path']}\"")
        return 0

    if args.command == "script":
        script_text = generate_powershell_script(plan) if args.shell == "powershell" else generate_bash_script(plan)
        if args.output:
            Path(args.output).write_text(script_text, encoding="utf-8", newline="\n")
            print(f"Wrote {args.shell} script to {args.output}")
        else:
            print(script_text)
        return 0

    return 0


if __name__ == "__main__":
    raise SystemExit(main())