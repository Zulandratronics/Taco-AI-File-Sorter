"""Taco AI File Sorter — Local-first content-aware file organizer & rollback utility."""

from .engine import (
    DuplicateGroup,
    PlanItem,
    ScanPlan,
    ScannedFile,
    apply_plan,
    classify_with_ollama,
    compute_fast_hash,
    generate_bash_script,
    generate_powershell_script,
    load_profiles,
    plan_directory,
    undo_manifest,
)

__version__ = "1.0.0"

__all__ = [
    "DuplicateGroup",
    "PlanItem",
    "ScanPlan",
    "ScannedFile",
    "__version__",
    "apply_plan",
    "classify_with_ollama",
    "compute_fast_hash",
    "generate_bash_script",
    "generate_powershell_script",
    "load_profiles",
    "plan_directory",
    "undo_manifest",
]