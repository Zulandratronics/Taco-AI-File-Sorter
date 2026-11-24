/* Taco AI File Sorter — Zero-Dependency Browser & Node Classifier + Safe Script Generator
 * Mirrors tacosort/engine.py with exact profile taxonomy and single-quote shell escaping.
 */
(function (scope) {
  "use strict";

  const PROTECTED_DIRS = new Set([
    ".git", ".github", "node_modules", ".venv", "venv", "__pycache__",
    "dist", "build", "target", ".next", ".out", "Intermediate", "Saved",
  ]);
  const IGNORED_NAMES = new Set([".ds_store", "thumbs.db", "desktop.ini"]);
  const INVALID_CHARS = /[<>:"/\\|?*\x00-\x1f]/g;

  function shouldIgnorePath(relPath, ignoreHidden = true) {
    const norm = String(relPath || "").replace(/\\/g, "/");
    const parts = norm.split("/").filter(Boolean);
    if (!parts.length) return true;
    const filename = parts[parts.length - 1];
    if (IGNORED_NAMES.has(filename.toLowerCase())) return true;
    if (filename.startsWith(".tacosort-manifest-") && filename.endsWith(".json")) return true;
    for (let i = 0; i < parts.length - 1; i++) {
      if (PROTECTED_DIRS.has(parts[i])) return true;
      if (ignoreHidden && parts[i].startsWith(".")) return true;
    }
    if (ignoreHidden && filename.startsWith(".")) return true;
    return false;
  }

  function sanitizeFilename(name, fallback = "untitled") {
    const cleaned = String(name || "").trim().replace(INVALID_CHARS, "_").replace(/\.\./g, "_").replace(/^[ .]+|[ .]+$/g, "");
    return cleaned || fallback;
  }

  function sanitizeRelFolder(folder) {
    const parts = [];
    for (const raw of String(folder || "").replace(/\\/g, "/").split("/")) {
      const p = raw.trim();
      if (!p || p === "." || p === "..") continue;
      const clean = p.replace(INVALID_CHARS, "_").replace(/^[ .]+|[ .]+$/g, "");
      if (clean) parts.push(clean);
    }
    return parts.length ? parts.join("/") : "Unsorted";
  }

  function splitNameExt(filename) {
    const idx = filename.lastIndexOf(".");
    if (idx <= 0) return { stem: filename, ext: "" };
    return { stem: filename.slice(0, idx), ext: filename.slice(idx).toLowerCase() };
  }

  function slugifyStem(stem) {
    const s = String(stem || "")
      .replace(INVALID_CHARS, " ")
      .replace(/[^A-Za-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .toLowerCase();
    return s.slice(0, 64) || "file";
  }

  function formatFilename(originalName, categoryName, lastModifiedMs, pattern) {
    const { stem, ext } = splitNameExt(originalName);
    if (pattern === "keep_original") return sanitizeFilename(originalName);

    const dt = new Date(lastModifiedMs || Date.now());
    const dateStr = dt.toISOString().slice(0, 10);
    const catSlug = slugifyStem(String(categoryName || "unsorted").split("&")[0].split("/")[0]).slice(0, 24);
    const cleanStem = slugifyStem(stem);

    if (pattern === "kebab_case") return `${cleanStem.replace(/_/g, "-")}${ext}`;
    if (pattern === "original_clean") return `${cleanStem}${ext}`;
    if (pattern === "category_date_name") return `${catSlug}_${dateStr}_${cleanStem}${ext}`;
    return `${dateStr}_${catSlug}_${cleanStem}${ext}`;
  }

  function classifyFiles(files, profile, namingPatternOverride = null) {
    const categories = profile.categories || [];
    const pattern = namingPatternOverride || profile.defaultNamingPattern || "date_category_name";

    // Detect duplicates by (fast_hash, size)
    const hashCounts = new Map();
    const dupSet = new Set();
    for (const f of files) {
      if (!f.fast_hash) continue;
      const key = `${f.fast_hash}:${f.size}`;
      const seen = hashCounts.get(key) || 0;
      if (seen > 0) dupSet.add(f.id);
      hashCounts.set(key, seen + 1);
    }

    const items = files.map((f) => {
      const { ext } = splitNameExt(f.name);
      const nameLow = f.name.toLowerCase();
      const combined = `${(f.rel_path || f.name).toLowerCase()} ${(f.snippet || "").toLowerCase()}`;
      let bestCat = null;
      let bestScore = 0;
      let matchedKw = [];
      let extMatched = false;

      for (const cat of categories) {
        let score = 0;
        const hits = [];
        const exts = (cat.extensions || []).map((e) => e.toLowerCase());
        const isExt = Boolean(ext && exts.includes(ext));
        if (isExt) score += 4;
        for (const kw of cat.keywords || []) {
          const kwLow = kw.toLowerCase();
          if (nameLow.includes(kwLow)) {
            score += 12;
            hits.push(kw);
          } else if (combined.includes(kwLow)) {
            score += 6;
            hits.push(kw);
          }
        }
        if (score > bestScore) {
          bestScore = score;
          bestCat = cat;
          matchedKw = hits.slice(0, 3);
          extMatched = isExt;
        }
      }

      let folder = "Unsorted";
      let catName = "Unsorted";
      let reason = `No taxonomy match for extension ${ext || "(none)"}`;
      let conf = 0.4;

      if (bestCat && bestScore > 0) {
        folder = sanitizeRelFolder(bestCat.targetFolder || bestCat.name);
        catName = bestCat.name;
        if (matchedKw.length) {
          reason = `Matched ${catName} keywords (${matchedKw.join(", ")})`;
          conf = Math.min(0.96, 0.68 + 0.08 * matchedKw.length + (extMatched ? 0.06 : 0));
        } else {
          reason = `Matched ${catName} by file extension (${ext})`;
          conf = 0.72;
        }
      }

      const proposed = formatFilename(f.name, catName, f.mtime_ms, pattern);
      const destRel = folder ? `${folder}/${proposed}` : proposed;

      return {
        id: f.id,
        source_rel: f.rel_path || f.name,
        original_name: f.name,
        size: f.size || 0,
        fast_hash: f.fast_hash || "",
        category: catName,
        target_folder: folder,
        proposed_filename: proposed,
        dest_rel: destRel,
        reasoning: reason,
        confidence: Math.round(conf * 100) / 100,
        engine: "heuristic",
        is_duplicate: dupSet.has(f.id),
        excluded: false,
      };
    });

    resolveCollisions(items);
    return items;
  }

  function resolveCollisions(items) {
    const claimed = new Set();
    for (const item of items) {
      let candidate = item.dest_rel;
      const slash = candidate.lastIndexOf("/");
      const parent = slash >= 0 ? candidate.slice(0, slash) : "";
      const base = slash >= 0 ? candidate.slice(slash + 1) : candidate;
      const { stem, ext } = splitNameExt(base);
      let n = 2;
      while (claimed.has(candidate)) {
        const nextName = `${stem}_${n}${ext}`;
        candidate = parent ? `${parent}/${nextName}` : nextName;
        n += 1;
      }
      claimed.add(candidate);
      item.dest_rel = candidate;
      item.proposed_filename = candidate.includes("/") ? candidate.slice(candidate.lastIndexOf("/") + 1) : candidate;
    }
  }

  function bashSq(s) {
    return "'" + String(s).replace(/'/g, "'\"'\"'") + "'";
  }

  function psSq(s) {
    return "'" + String(s).replace(/'/g, "''") + "'";
  }

  function generateBashScript(items, profileId = "general_productivity") {
    const active = items.filter((i) => !i.excluded && i.source_rel !== i.dest_rel);
    const lines = [
      "#!/usr/bin/env bash",
      "# Taco AI File Sorter — Safe Escaped Organizer Script",
      `# Profile: ${profileId} | Generated: ${new Date().toISOString()}`,
      "set -euo pipefail",
      "",
      "DRY_RUN=false",
      'if [[ "${1:-}" == "--dry-run" || "${1:-}" == "-d" ]]; then DRY_RUN=true; fi',
      'TARGET_ROOT="${TARGET_ROOT:-.}"',
      "",
    ];
    const folders = [...new Set(active.map((i) => i.target_folder).filter(Boolean))].sort();
    for (const f of folders) {
      lines.push(`if [ "$DRY_RUN" = false ]; then mkdir -p "\${TARGET_ROOT}/"${bashSq(f)}; fi`);
    }
    lines.push("");
    for (const it of active) {
      const sq = bashSq(it.source_rel);
      const dq = bashSq(it.dest_rel);
      lines.push('if [ "$DRY_RUN" = true ]; then');
      lines.push(`  printf "[DRY-RUN] %s -> %s\\n" ${sq} ${dq}`);
      lines.push(`elif [ -f "\${TARGET_ROOT}/"${sq} ]; then`);
      lines.push(`  mv -n "\${TARGET_ROOT}/"${sq} "\${TARGET_ROOT}/"${dq}`);
      lines.push("fi");
    }
    return lines.join("\n") + "\n";
  }

  function generatePowerShellScript(items, profileId = "general_productivity") {
    const active = items.filter((i) => !i.excluded && i.source_rel !== i.dest_rel);
    const lines = [
      "# Taco AI File Sorter — Safe Escaped PowerShell Organizer Script",
      `# Profile: ${profileId} | Generated: ${new Date().toISOString()}`,
      "param([switch]$DryRun)",
      '$TargetRoot = if ($PSScriptRoot) { $PSScriptRoot } else { "." }',
      "",
    ];
    const folders = [...new Set(active.map((i) => i.target_folder).filter(Boolean))].sort();
    for (const f of folders) {
      lines.push(`if (-not $DryRun) { New-Item -ItemType Directory -Force -Path (Join-Path $TargetRoot ${psSq(f)}) | Out-Null }`);
    }
    lines.push("");
    for (const it of active) {
      lines.push(`$src = Join-Path $TargetRoot ${psSq(it.source_rel)}`);
      lines.push(`$dst = Join-Path $TargetRoot ${psSq(it.dest_rel)}`);
      lines.push('if ($DryRun) { Write-Host "[DRY-RUN] $src -> $dst" }');
      lines.push('elseif ((Test-Path -LiteralPath $src) -and -not (Test-Path -LiteralPath $dst)) { Move-Item -LiteralPath $src -Destination $dst }');
    }
    return lines.join("\n") + "\n";
  }

  function generateCsv(items) {
    const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const rows = [["Source", "Destination", "Category", "Confidence", "Engine", "Duplicate", "Reasoning"].map(esc).join(",")];
    for (const it of items.filter((i) => !i.excluded)) {
      rows.push([it.source_rel, it.dest_rel, it.category, it.confidence, it.engine, it.is_duplicate ? "yes" : "no", it.reasoning].map(esc).join(","));
    }
    return rows.join("\n") + "\n";
  }

  const api = {
    shouldIgnorePath,
    sanitizeFilename,
    sanitizeRelFolder,
    formatFilename,
    classifyFiles,
    resolveCollisions,
    generateBashScript,
    generatePowerShellScript,
    generateCsv,
  };

  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else scope.TacoSortEngine = api;
})(typeof globalThis !== "undefined" ? globalThis : window);