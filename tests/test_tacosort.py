"""Unit and integration tests for Taco AI File Sorter (`tacosort`)."""

from __future__ import annotations

import json
from io import StringIO
from pathlib import Path
from unittest.mock import patch

from tacosort import (
    apply_plan,
    generate_bash_script,
    generate_powershell_script,
    load_profiles,
    plan_directory,
    undo_manifest,
)
from tacosort.cli import main as cli_main


def test_all_six_profiles_load():
    profiles = load_profiles()
    expected = {
        "general_productivity",
        "unconventional_polymath",
        "independent_musician",
        "digital_creator",
        "academic_scholar",
        "studio_artist",
    }
    assert expected.issubset(set(profiles.keys()))
    for pid, p in profiles.items():
        assert len(p["categories"]) >= 5, f"Profile {pid} should have categories"


def test_exclusions_and_duplicate_detection(tmp_path: Path):
    # Protected directories & hidden files must be ignored
    (tmp_path / ".git").mkdir()
    (tmp_path / ".git" / "config").write_text("git-data", encoding="utf-8")
    (tmp_path / "node_modules").mkdir()
    (tmp_path / "node_modules" / "pkg.js").write_text("console.log(1)", encoding="utf-8")
    (tmp_path / ".hidden_note.txt").write_text("secret", encoding="utf-8")

    # Real user files + exact duplicate
    (tmp_path / "invoice_2026_acme.pdf").write_bytes(b"%PDF-1.4 invoice payload 12345")
    (tmp_path / "invoice_copy.pdf").write_bytes(b"%PDF-1.4 invoice payload 12345")
    (tmp_path / "epistemology_notes.md").write_text("# Philosophy of Mind & Epistemology", encoding="utf-8")

    plan = plan_directory(tmp_path, profile_id="general_productivity")
    rels = {it.source_rel for it in plan.items}
    assert rels == {"invoice_2026_acme.pdf", "invoice_copy.pdf", "epistemology_notes.md"}
    assert len(plan.duplicates) == 1
    assert sum(1 for it in plan.items if it.is_duplicate) == 1


def test_polymath_and_musician_profiles(tmp_path: Path):
    (tmp_path / "esp32_pcb_schematic.kicad_pcb").write_text("pcb", encoding="utf-8")
    (tmp_path / "vocal_stem_120bpm.wav").write_bytes(b"RIFFWAVEdata")

    poly_plan = plan_directory(tmp_path, profile_id="unconventional_polymath")
    pcb_item = next(it for it in poly_plan.items if it.original_name == "esp32_pcb_schematic.kicad_pcb")
    assert "Hardware" in pcb_item.target_folder or "CAD" in pcb_item.target_folder

    music_plan = plan_directory(tmp_path, profile_id="independent_musician")
    wav_item = next(it for it in music_plan.items if it.original_name == "vocal_stem_120bpm.wav")
    assert wav_item.category != "Unsorted"


def test_collision_safety_and_apply_undo_roundtrip(tmp_path: Path):
    sub = tmp_path / "sub"
    sub.mkdir()
    # Two different files that normalize to the exact same stem/category
    (tmp_path / "Invoice Acme.txt").write_text("Invoice total $100", encoding="utf-8")
    (sub / "invoice_acme.txt").write_text("Invoice total $200", encoding="utf-8")

    plan = plan_directory(tmp_path, profile_id="general_productivity", naming_pattern="original_clean")
    dests = [it.dest_rel for it in plan.items]
    assert len(dests) == 2
    assert len(set(dests)) == 2  # collision resolved cleanly with _2 suffix

    # Apply moves
    res = apply_plan(plan, dry_run=False)
    assert res["moved_count"] == 2
    assert res["manifest_path"] is not None
    assert not (tmp_path / "Invoice Acme.txt").exists()
    assert not (sub / "invoice_acme.txt").exists()
    for d in dests:
        assert (tmp_path / d).exists()

    # Roll back via manifest
    undo_res = undo_manifest(res["manifest_path"])
    assert undo_res["restored_count"] == 2
    assert (tmp_path / "Invoice Acme.txt").read_text(encoding="utf-8") == "Invoice total $100"
    assert (sub / "invoice_acme.txt").read_text(encoding="utf-8") == "Invoice total $200"


def test_shell_escaping_prevents_injection(tmp_path: Path):
    weird = tmp_path / "report_$(whoami)_O'Connor.txt"
    weird.write_text("strategy memo", encoding="utf-8")

    plan = plan_directory(tmp_path, profile_id="general_productivity")
    bash = generate_bash_script(plan)
    ps1 = generate_powershell_script(plan)

    # Single-quoted in bash & powershell so $(whoami) is never evaluated
    assert "'report_$(whoami)_O'\"'\"'Connor.txt'" in bash
    assert "'report_$(whoami)_O''Connor.txt'" in ps1


def test_cli_scan_json_and_profiles(tmp_path: Path):
    (tmp_path / "receipt_coffee.txt").write_text("expense receipt $5", encoding="utf-8")

    with patch("sys.stdout", new_callable=StringIO) as out:
        assert cli_main(["profiles"]) == 0
        assert "unconventional_polymath" in out.getvalue()

    with patch("sys.stdout", new_callable=StringIO) as out:
        assert cli_main(["scan", str(tmp_path), "--json"]) == 0
        data = json.loads(out.getvalue())
        assert data["total_scanned"] == 1
        assert data["items"][0]["category"] == "Finance & Invoices"