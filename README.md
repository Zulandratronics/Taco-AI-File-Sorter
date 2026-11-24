# Taco AI File Sorter (`taco-sort`)

**Local-first, privacy-preserving file organizer & intelligent renamer with niche taxonomy profiles, chunked SHA-256 duplicate detection, optional local Ollama (CPU/GPU) classification, and 1-command rollback.**

- **Live Zero-Install Browser Preview & Script Generator:** [zulandratronics.github.io/Taco-AI-File-Sorter](https://zulandratronics.github.io/Taco-AI-File-Sorter/) *(100% offline, 0 telemetry)*
- **License:** MIT ([LICENSE](./LICENSE))

---

## Core Capabilities

1. **Instant Local Heuristic Taxonomy Engine (Zero-Latency, Zero API Keys):** Classifies files offline using filename, extension, and header text snippets across **6 tailored niche profiles**:
   - `general_productivity` — General Productivity & Office Suite (15 categories)
   - `unconventional_polymath` — Unconventional Polymath & Renaissance Synthesist (10 categories: Epistemology, Interdisciplinary Synthesis, Hardware/CAD, Notebooks, etc.)
   - `independent_musician` — Independent Musician & Home Studio Producer (8 categories)
   - `digital_creator` — Digital Creator & Indie Hacker (5 categories)
   - `academic_scholar` — Academic Scholar & University Researcher (5 categories)
   - `studio_artist` — Studio Artist & Game Designer (5 categories)
2. **Optional Local Ollama LLM Refinement (`--ollama`):** Connect to a local Ollama server (`http://localhost:11434`) for CPU/GPU semantic renaming and categorization—files never leave your machine.
3. **Fast Chunked SHA-256 Duplicate Detection:** Samples head, middle, and tail 64 KB chunks plus file size so multi-gigabyte media libraries hash quickly without exhausting RAM.
4. **Safety-First Execution & 1-Command Undo Rollback:**
   - Automatically skips `.git`, `.github`, `node_modules`, `.venv`, `dist`, `build`, `target`, `.next`, Unity/Unreal `Intermediate`/`Saved`, hidden dotfiles, and OS metadata.
   - Strict path sanitization (blocks `..` traversal and OS-illegal filename characters) + automatic collision suffixing (`_2`, `_3`) so existing files are **never overwritten**.
   - Every `taco-sort apply` run writes a timestamped `.tacosort-manifest-*.json` so `taco-sort undo` restores every moved file in reverse order and cleans up empty folders.
5. **Shell-Injection-Safe Script Export:** Export dry-run-capable PowerShell (`organize.ps1`) and Bash (`organize.sh`) scripts with strict single-quote escaping for filenames containing spaces, `$`, quotes, or parentheses.

---

## Quick Start (Python CLI — Pure Stdlib, Python 3.10+)

```bash
pip install -e .

# List all 6 niche taxonomy profiles
taco-sort profiles

# 1. Dry-run preview on your messy Downloads folder
taco-sort scan ~/Downloads --profile unconventional_polymath

# 2. Apply moves safely (writes .tacosort-manifest-*.json for rollback)
taco-sort apply ~/Downloads --profile unconventional_polymath

# 3. Optional: refine names & categories with local Ollama (CPU/GPU)
taco-sort apply ~/Downloads --profile general_productivity --ollama llama3.2

# 4. Roll back every move in one command
taco-sort undo ~/Downloads/.tacosort-manifest-YYYYMMDDTHHMMSSZ.json

# Export a standalone safe PowerShell or Bash script instead of moving directly
taco-sort script ~/Downloads --shell powershell -o organize.ps1
```

## Browser App (Zero Install, Zero Build)

Open [zulandratronics.github.io/Taco-AI-File-Sorter](https://zulandratronics.github.io/Taco-AI-File-Sorter/) or double-click `index.html` locally:
- Pick any local folder (stays 100% in your browser) or click **Load Sample Messy Folder (12 Files)** to preview all 6 profiles immediately.
- Toggle individual files on/off, optionally refine via local Ollama, and export escaped `organize.ps1`, `organize.sh`, CSV, or JSON plans.

---

## Running Tests

```bash
# Python tests (scanning, exclusions, duplicates, collisions, apply+undo round-trip, shell escaping)
pip install -e ".[dev]"
pytest

# JavaScript engine parity & shell-escaping tests (Node 20+, zero npm dependencies)
node --test tests/engine.test.mjs
```