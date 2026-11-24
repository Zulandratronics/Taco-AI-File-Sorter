"""Pure-stdlib local-first file scanner, heuristic & Ollama classifier, and transactional executor."""

from __future__ import annotations

from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
import re
import shutil
import struct
from typing import Any
import urllib.error
import urllib.request

PROTECTED_DIRS = frozenset(
    {
        ".git",
        ".github",
        "node_modules",
        ".venv",
        "venv",
        "__pycache__",
        "dist",
        "build",
        "target",
        ".next",
        ".out",
        "Intermediate",
        "Saved",
    }
)

IGNORED_FILENAMES = frozenset({".ds_store", "thumbs.db", "desktop.ini"})

TEXT_EXTENSIONS = frozenset(
    {
        ".txt", ".md", ".markdown", ".json", ".csv", ".tsv", ".yaml", ".yml",
        ".toml", ".ini", ".cfg", ".py", ".js", ".ts", ".tsx", ".jsx", ".html",
        ".css", ".xml", ".sql", ".sh", ".ps1", ".rs", ".go", ".c", ".cpp", ".h",
    }
)

INVALID_FILENAME_CHARS = re.compile(r'[<>:"/\\|?*\x00-\x1f]')
WHITESPACE_SEP_RE = re.compile(r"[\s\-]+")


@dataclass(frozen=True)
class ScannedFile:
    id: str
    name: str
    rel_path: str
    extension: str
    size: int
    mtime: float
    fast_hash: str
    snippet: str = ""


@dataclass
class PlanItem:
    id: str
    source_rel: str
    original_name: str
    size: int
    fast_hash: str
    category: str
    target_folder: str
    proposed_filename: str
    dest_rel: str
    reasoning: str
    confidence: float
    engine: str = "heuristic"
    is_duplicate: bool = False


@dataclass(frozen=True)
class DuplicateGroup:
    fast_hash: str
    size: int
    files: list[str]


@dataclass
class ScanPlan:
    root: str
    profile_id: str
    naming_pattern: str
    generated_at: str
    total_scanned: int
    duplicates: list[DuplicateGroup] = field(default_factory=list)
    items: list[PlanItem] = field(default_factory=list)

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


def load_profiles() -> dict[str, Any]:
    data_path = Path(__file__).parent / "data" / "profiles.json"
    return json.loads(data_path.read_text(encoding="utf-8"))


def should_ignore_path(rel_parts: tuple[str, ...], ignore_hidden: bool = True) -> bool:
    if not rel_parts:
        return True
    filename = rel_parts[-1]
    if filename.lower() in IGNORED_FILENAMES:
        return True
    if filename.startswith(".tacosort-manifest-") and filename.endswith(".json"):
        return True
    for part in rel_parts[:-1]:
        if part in PROTECTED_DIRS:
            return True
        if ignore_hidden and part.startswith("."):
            return True
    if ignore_hidden and filename.startswith("."):
        return True
    return False


def compute_fast_hash(file_path: Path, sample_chunk_kb: int = 64) -> str:
    """Hash head + middle + tail chunks plus file size (fast & memory-safe for GB files)."""
    size = file_path.stat().st_size
    chunk = sample_chunk_kb * 1024
    h = hashlib.sha256()
    with file_path.open("rb") as fh:
        h.update(fh.read(min(chunk, size)))
        if size > chunk:
            mid = max(0, (size // 2) - (chunk // 2))
            fh.seek(mid)
            h.update(fh.read(min(chunk, size - mid)))
            tail = max(0, size - chunk)
            fh.seek(tail)
            h.update(fh.read(min(chunk, size - tail)))
    h.update(struct.pack("<Q", size))
    return h.hexdigest()[:16]


def extract_text_snippet(file_path: Path, max_bytes: int = 16384) -> str:
    if file_path.suffix.lower() not in TEXT_EXTENSIONS:
        return ""
    try:
        with file_path.open("rb") as fh:
            raw = fh.read(max_bytes)
        return raw.decode("utf-8", errors="ignore")
    except OSError:
        return ""


def sanitize_filename(name: str, fallback: str = "untitled") -> str:
    cleaned = INVALID_FILENAME_CHARS.sub("_", name.strip())
    cleaned = cleaned.replace("..", "_").strip(" .")
    return cleaned or fallback


def sanitize_rel_folder(folder: str) -> str:
    parts: list[str] = []
    for raw_part in folder.replace("\\", "/").split("/"):
        p = raw_part.strip()
        if not p or p in (".", ".."):
            continue
        p = INVALID_FILENAME_CHARS.sub("_", p).strip(" .")
        if p:
            parts.append(p)
    return "/".join(parts) if parts else "Unsorted"


def slugify_stem(stem: str) -> str:
    s = INVALID_FILENAME_CHARS.sub(" ", stem)
    s = re.sub(r"[^A-Za-z0-9]+", "_", s).strip("_").lower()
    return s[:64] or "file"


def format_filename(
    original_name: str,
    category_name: str,
    mtime: float,
    pattern: str,
) -> str:
    path = Path(original_name)
    ext = path.suffix.lower()
    stem = path.stem

    if pattern == "keep_original":
        return sanitize_filename(original_name)

    date_str = datetime.fromtimestamp(mtime, tz=timezone.utc).strftime("%Y-%m-%d")
    cat_slug = slugify_stem(category_name.split("&")[0].split("/")[0])[:24]
    clean_stem = slugify_stem(stem)

    if pattern == "kebab_case":
        kebab = clean_stem.replace("_", "-")
        return f"{kebab}{ext}"
    if pattern == "original_clean":
        return f"{clean_stem}{ext}"
    if pattern == "category_date_name":
        return f"{cat_slug}_{date_str}_{clean_stem}{ext}"
    # default: date_category_name
    return f"{date_str}_{cat_slug}_{clean_stem}{ext}"


def _classify_single_heuristic(
    sf: ScannedFile,
    categories: list[dict[str, Any]],
    naming_pattern: str,
) -> PlanItem:
    combined = f"{sf.rel_path.lower()} {sf.snippet.lower()}"
    best_cat: dict[str, Any] | None = None
    best_score = 0.0
    matched_kw: list[str] = []
    ext_matched = False

    for cat in categories:
        score = 0.0
        hits: list[str] = []
        cat_exts = [e.lower() for e in cat.get("extensions", [])]
        is_ext = bool(sf.extension and sf.extension.lower() in cat_exts)
        if is_ext:
            score += 4.0

        for kw in cat.get("keywords", []):
            kw_low = kw.lower()
            if kw_low in sf.name.lower():
                score += 12.0
                hits.append(kw)
            elif kw_low in combined:
                score += 6.0
                hits.append(kw)

        if score > best_score:
            best_score = score
            best_cat = cat
            matched_kw = hits[:3]
            ext_matched = is_ext

    if best_cat is None or best_score == 0:
        folder = "Unsorted"
        cat_name = "Unsorted"
        reason = f"No taxonomy match for extension {sf.extension or '(none)'}"
        conf = 0.40
    else:
        folder = sanitize_rel_folder(best_cat.get("targetFolder", best_cat["name"]))
        cat_name = best_cat["name"]
        if matched_kw:
            reason = f"Matched {cat_name} keywords ({', '.join(matched_kw)})"
            conf = min(0.96, 0.68 + 0.08 * len(matched_kw) + (0.06 if ext_matched else 0.0))
        else:
            reason = f"Matched {cat_name} by file extension ({sf.extension})"
            conf = 0.72

    proposed = format_filename(sf.name, cat_name, sf.mtime, naming_pattern)
    dest_rel = f"{folder}/{proposed}" if folder else proposed

    return PlanItem(
        id=sf.id,
        source_rel=sf.rel_path,
        original_name=sf.name,
        size=sf.size,
        fast_hash=sf.fast_hash,
        category=cat_name,
        target_folder=folder,
        proposed_filename=proposed,
        dest_rel=dest_rel,
        reasoning=reason,
        confidence=round(conf, 2),
        engine="heuristic",
    )

def _resolve_collisions(items: list[PlanItem], existing_files: set[str] | None = None) -> None:
    """Guarantee zero destination collisions across the batch and existing files."""
    claimed: set[str] = set()
    existing = existing_files or set()
    sources = {item.source_rel for item in items}

    for item in items:
        candidate = item.dest_rel
        p = Path(candidate)
        stem, suffix = p.stem, p.suffix
        parent = p.parent.as_posix()
        counter = 2
        while candidate in claimed or (candidate in existing and candidate not in sources):
            new_name = f"{stem}_{counter}{suffix}"
            candidate = f"{parent}/{new_name}" if parent and parent != "." else new_name
            counter += 1
        claimed.add(candidate)
        item.dest_rel = candidate
        item.proposed_filename = Path(candidate).name


def classify_with_ollama(
    scanned: list[ScannedFile],
    items: list[PlanItem],
    categories: list[dict[str, Any]],
    model: str = "llama3.2",
    endpoint: str = "http://localhost:11434",
    batch_size: int = 12,
    timeout: int = 60,
) -> int:
    """Refine heuristic PlanItems using a local Ollama LLM (pure stdlib HTTP).

    Returns the count of items successfully refined by Ollama. Any failure falls back
    gracefully to the heuristic classification without losing data.
    """
    by_id = {it.id: it for it in items}
    cat_summary = [
        {"name": c["name"], "targetFolder": c.get("targetFolder", c["name"])}
        for c in categories
    ]
    refined = 0

    for idx in range(0, len(scanned), batch_size):
        batch = scanned[idx : idx + batch_size]
        payload_files = [
            {
                "id": sf.id,
                "name": sf.name,
                "extension": sf.extension,
                "snippet": sf.snippet[:400],
            }
            for sf in batch
        ]
        prompt = (
            "Classify each file into the best matching category and suggest a clean snake_case "
            "filename keeping the original extension. Return ONLY a JSON object of shape "
            '{"items":[{"id":"...","category":"...","targetFolder":"...","proposedName":"...","reasoning":"...","confidence":0.9}]}.\n'
            f"Categories: {json.dumps(cat_summary)}\n"
            f"Files: {json.dumps(payload_files)}"
        )
        body = json.dumps(
            {
                "model": model,
                "prompt": prompt,
                "system": "Output strict valid JSON only. Never use path traversal (..).",
                "stream": False,
                "format": "json",
            }
        ).encode("utf-8")

        req = urllib.request.Request(
            f"{endpoint.rstrip('/')}/api/generate",
            data=body,
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        try:
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                raw = json.loads(resp.read().decode("utf-8")).get("response", "{}")
            parsed = json.loads(raw)
            rows = parsed.get("items", parsed) if isinstance(parsed, dict) else parsed
            if not isinstance(rows, list):
                continue
            for row in rows:
                if not isinstance(row, dict):
                    continue
                target = by_id.get(str(row.get("id", "")))
                if not target:
                    continue
                orig_ext = Path(target.original_name).suffix.lower()
                folder = sanitize_rel_folder(str(row.get("targetFolder", target.target_folder)))
                prop = sanitize_filename(str(row.get("proposedName", target.proposed_filename)), target.proposed_filename)
                if orig_ext and not prop.lower().endswith(orig_ext):
                    prop = f"{Path(prop).stem}{orig_ext}"
                target.category = str(row.get("category", target.category))[:80]
                target.target_folder = folder
                target.proposed_filename = prop
                target.dest_rel = f"{folder}/{prop}"
                target.reasoning = str(row.get("reasoning", f"Classified via local Ollama ({model})"))[:200]
                conf = row.get("confidence", 0.88)
                target.confidence = round(max(0.1, min(0.99, float(conf))), 2)
                target.engine = f"ollama:{model}"
                refined += 1
        except (urllib.error.URLError, TimeoutError, ValueError, OSError):
            continue

    return refined


def plan_directory(
    root_dir: str | Path,
    profile_id: str = "general_productivity",
    naming_pattern: str | None = None,
    recursive: bool = True,
    ignore_hidden: bool = True,
    ollama_model: str | None = None,
    ollama_endpoint: str = "http://localhost:11434",
) -> ScanPlan:
    """Scan a local directory and produce a collision-safe organization plan."""
    root = Path(root_dir).resolve()
    if not root.is_dir():
        raise FileNotFoundError(f"Directory not found: {root}")

    profiles = load_profiles()
    if profile_id not in profiles:
        valid = ", ".join(sorted(profiles.keys()))
        raise ValueError(f"Unknown profile '{profile_id}'. Available: {valid}")

    profile = profiles[profile_id]
    categories = profile["categories"]
    pattern = naming_pattern or profile.get("defaultNamingPattern", "date_category_name")

    scanned: list[ScannedFile] = []
    existing_rels: set[str] = set()
    iterator = root.rglob("*") if recursive else root.glob("*")

    for idx, path in enumerate(sorted(iterator)):
        if not path.is_file() or path.is_symlink():
            continue
        rel = path.relative_to(root)
        if should_ignore_path(rel.parts, ignore_hidden=ignore_hidden):
            continue
        rel_posix = rel.as_posix()
        existing_rels.add(rel_posix)
        try:
            st = path.stat()
            fhash = compute_fast_hash(path)
            snippet = extract_text_snippet(path)
        except OSError:
            continue
        scanned.append(
            ScannedFile(
                id=f"f_{idx + 1}",
                name=path.name,
                rel_path=rel_posix,
                extension=path.suffix.lower(),
                size=st.st_size,
                mtime=st.st_mtime,
                fast_hash=fhash,
                snippet=snippet,
            )
        )

    # Detect duplicate groups by (fast_hash, size)
    hash_groups: dict[tuple[str, int], list[str]] = {}
    for sf in scanned:
        hash_groups.setdefault((sf.fast_hash, sf.size), []).append(sf.rel_path)

    dup_groups: list[DuplicateGroup] = []
    dup_paths: set[str] = set()
    for (fhash, fsize), paths in hash_groups.items():
        if len(paths) > 1:
            dup_groups.append(DuplicateGroup(fast_hash=fhash, size=fsize, files=paths))
            dup_paths.update(paths[1:])

    items = [_classify_single_heuristic(sf, categories, pattern) for sf in scanned]
    for it in items:
        if it.source_rel in dup_paths:
            it.is_duplicate = True

    if ollama_model and scanned:
        classify_with_ollama(
            scanned=scanned,
            items=items,
            categories=categories,
            model=ollama_model,
            endpoint=ollama_endpoint,
        )

    _resolve_collisions(items, existing_files=existing_rels)

    return ScanPlan(
        root=str(root),
        profile_id=profile_id,
        naming_pattern=pattern,
        generated_at=datetime.now(timezone.utc).isoformat(),
        total_scanned=len(scanned),
        duplicates=dup_groups,
        items=items,
    )


def apply_plan(plan: ScanPlan, dry_run: bool = False) -> dict[str, Any]:
    """Execute a ScanPlan safely and write a rollback manifest when not dry_run."""
    root = Path(plan.root).resolve()
    moved: list[dict[str, Any]] = []
    skipped: list[dict[str, str]] = []

    for item in plan.items:
        src = (root / item.source_rel).resolve()
        dst = (root / item.dest_rel).resolve()

        # Strict containment check — never escape root
        if root not in src.parents or (root != dst.parent and root not in dst.parents):
            skipped.append({"source": item.source_rel, "reason": "path_outside_root"})
            continue
        if src == dst:
            skipped.append({"source": item.source_rel, "reason": "already_in_place"})
            continue
        if not src.exists():
            skipped.append({"source": item.source_rel, "reason": "source_missing"})
            continue
        if dst.exists():
            skipped.append({"source": item.source_rel, "reason": "destination_exists"})
            continue

        if not dry_run:
            dst.parent.mkdir(parents=True, exist_ok=True)
            shutil.move(str(src), str(dst))

        moved.append(
            {
                "source_rel": item.source_rel,
                "dest_rel": item.dest_rel,
                "fast_hash": item.fast_hash,
                "moved_at": datetime.now(timezone.utc).isoformat(),
            }
        )

    manifest_path: str | None = None
    if not dry_run and moved:
        stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
        mfile = root / f".tacosort-manifest-{stamp}.json"
        manifest_payload = {
            "version": "1.0.0",
            "root": str(root),
            "profile_id": plan.profile_id,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "operations": moved,
        }
        mfile.write_text(json.dumps(manifest_payload, indent=2) + "\n", encoding="utf-8")
        manifest_path = str(mfile)

    return {
        "dry_run": dry_run,
        "moved_count": len(moved),
        "skipped_count": len(skipped),
        "manifest_path": manifest_path,
        "moved": moved,
        "skipped": skipped,
    }


def undo_manifest(manifest_path: str | Path, dry_run: bool = False) -> dict[str, Any]:
    """Roll back every move recorded in a .tacosort-manifest-*.json file in reverse order."""
    mpath = Path(manifest_path).resolve()
    data = json.loads(mpath.read_text(encoding="utf-8"))
    root = Path(data["root"]).resolve()
    ops = list(reversed(data.get("operations", [])))

    restored = 0
    skipped: list[dict[str, str]] = []
    touched_dirs: set[Path] = set()

    for op in ops:
        src = (root / op["source_rel"]).resolve()
        dst = (root / op["dest_rel"]).resolve()
        if not dst.exists():
            skipped.append({"dest": op["dest_rel"], "reason": "file_missing"})
            continue
        if src.exists():
            skipped.append({"dest": op["dest_rel"], "reason": "original_path_occupied"})
            continue
        if not dry_run:
            src.parent.mkdir(parents=True, exist_ok=True)
            shutil.move(str(dst), str(src))
            touched_dirs.add(dst.parent)
        restored += 1

    # Prune empty directories created during sorting
    if not dry_run:
        for d in sorted(touched_dirs, key=lambda p: len(p.parts), reverse=True):
            cur = d
            while cur != root and root in cur.parents:
                try:
                    cur.rmdir()
                    cur = cur.parent
                except OSError:
                    break

    return {
        "dry_run": dry_run,
        "restored_count": restored,
        "skipped_count": len(skipped),
        "skipped": skipped,
    }


def _bash_sq(s: str) -> str:
    return "'" + s.replace("'", "'\"'\"'") + "'"


def _ps_sq(s: str) -> str:
    return "'" + s.replace("'", "''") + "'"


def generate_bash_script(plan: ScanPlan) -> str:
    """Generate a shell-injection-safe Bash organizer script with --dry-run."""
    lines = [
        "#!/usr/bin/env bash",
        "# Taco AI File Sorter — Safe Escaped Organizer Script",
        f"# Profile: {plan.profile_id} | Generated: {plan.generated_at}",
        "set -euo pipefail",
        "",
        'DRY_RUN=false',
        'if [[ "${1:-}" == "--dry-run" || "${1:-}" == "-d" ]]; then DRY_RUN=true; fi',
        'TARGET_ROOT="${TARGET_ROOT:-.}"',
        "",
    ]
    folders = sorted({it.target_folder for it in plan.items if it.target_folder})
    for f in folders:
        lines.append(f'if [ "$DRY_RUN" = false ]; then mkdir -p "${{TARGET_ROOT}}/"{_bash_sq(f)}; fi')
    lines.append("")
    for it in plan.items:
        if it.source_rel == it.dest_rel:
            continue
        src_q = _bash_sq(it.source_rel)
        dst_q = _bash_sq(it.dest_rel)
        lines.append(f'if [ "$DRY_RUN" = true ]; then')
        lines.append(f'  printf "[DRY-RUN] %s -> %s\\n" {src_q} {dst_q}')
        lines.append(f'elif [ -f "${{TARGET_ROOT}}/"{src_q} ]; then')
        lines.append(f'  mv -n "${{TARGET_ROOT}}/"{src_q} "${{TARGET_ROOT}}/"{dst_q}')
        lines.append("fi")
    return "\n".join(lines) + "\n"


def generate_powershell_script(plan: ScanPlan) -> str:
    """Generate a single-quote-escaped PowerShell organizer script with -DryRun."""
    lines = [
        "# Taco AI File Sorter — Safe Escaped PowerShell Organizer Script",
        f"# Profile: {plan.profile_id} | Generated: {plan.generated_at}",
        "param([switch]$DryRun)",
        '$TargetRoot = if ($PSScriptRoot) { $PSScriptRoot } else { "." }',
        "",
    ]
    folders = sorted({it.target_folder for it in plan.items if it.target_folder})
    for f in folders:
        lines.append(f'if (-not $DryRun) {{ New-Item -ItemType Directory -Force -Path (Join-Path $TargetRoot {_ps_sq(f)}) | Out-Null }}')
    lines.append("")
    for it in plan.items:
        if it.source_rel == it.dest_rel:
            continue
        src_q = _ps_sq(it.source_rel)
        dst_q = _ps_sq(it.dest_rel)
        lines.append(f'$src = Join-Path $TargetRoot {src_q}')
        lines.append(f'$dst = Join-Path $TargetRoot {dst_q}')
        lines.append('if ($DryRun) { Write-Host "[DRY-RUN] $src -> $dst" }')
        lines.append('elseif ((Test-Path -LiteralPath $src) -and -not (Test-Path -LiteralPath $dst)) { Move-Item -LiteralPath $src -Destination $dst }')
    return "\n".join(lines) + "\n"