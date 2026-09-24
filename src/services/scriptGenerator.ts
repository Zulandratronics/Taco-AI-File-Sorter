import { OrganizationPlanItem, SafetySettings } from "../types";

export function generateBashScript(
  items: OrganizationPlanItem[],
  safety: SafetySettings,
  sourceDirectoryName: string = "source_directory"
): string {
  const lines: string[] = [
    "#!/usr/bin/env bash",
    "# ====================================================================",
    "# AI File Sorter - Automated Safe Organizer Script",
    `# Generated: ${new Date().toISOString()}`,
    `# Total Files: ${items.length}`,
    "# ====================================================================",
    "set -euo pipefail",
    "",
    'DRY_RUN=false',
    'if [[ "${1:-}" == "--dry-run" || "${1:-}" == "-d" ]]; then',
    '  DRY_RUN=true',
    '  echo ">>> RUNNING IN DRY-RUN MODE (No files will be moved) <<<"',
    "fi",
    "",
    'TARGET_ROOT="${TARGET_ROOT:-.}"',
    'echo "Starting file organization in directory: ${TARGET_ROOT}"',
    'echo ""',
    "",
    "# 1. Create target folder structures",
  ];

  // Extract distinct folders
  const folders = Array.from(new Set(items.map(i => i.proposedFolderPath))).filter(Boolean);
  for (const f of folders) {
    lines.push(`mkdir -p "\${TARGET_ROOT}/${f}"`);
  }

  lines.push("");
  lines.push("# 2. Move and rename operations");

  for (const item of items) {
    if (item.status === "excluded") continue;

    const src = item.originalPath;
    const dest = item.fullDestinationPath;
    const comment = `# Reason: ${item.reasoning.replace(/"/g, "'")}`;

    lines.push(`echo "-> Moving: ${src} -> ${dest}"`);
    lines.push(comment);
    lines.push('if [ "$DRY_RUN" = true ]; then');
    lines.push(`  echo "   [DRY-RUN] mv \\"\${TARGET_ROOT}/${src}\\" \\"\${TARGET_ROOT}/${dest}\\""`);
    lines.push('else');
    lines.push(`  if [ -f "\${TARGET_ROOT}/${src}" ]; then`);
    lines.push(`    mv -n "\${TARGET_ROOT}/${src}" "\${TARGET_ROOT}/${dest}"`);
    lines.push('  else');
    lines.push(`    echo "   [WARNING] File not found: \${TARGET_ROOT}/${src}"`);
    lines.push('  fi');
    lines.push('fi');
    lines.push("");
  }

  lines.push('echo ""');
  lines.push('echo "File sorting completed successfully!"');
  return lines.join("\n");
}

export function generatePowerShellScript(
  items: OrganizationPlanItem[],
  safety: SafetySettings
): string {
  const lines: string[] = [
    "# ====================================================================",
    "# AI File Sorter - Automated Safe Organizer Script (PowerShell)",
    `# Generated: ${new Date().toISOString()}`,
    `# Total Files: ${items.length}`,
    "# ====================================================================",
    "param(",
    "    [switch]$DryRun",
    ")",
    "",
    "if ($DryRun) {",
    '    Write-Host ">>> RUNNING IN DRY-RUN MODE (No files will be moved) <<<" -ForegroundColor Yellow',
    "}",
    "",
    '$TargetRoot = $PSScriptRoot',
    'if (-not $TargetRoot) { $TargetRoot = "." }',
    'Write-Host "Target directory: $TargetRoot" -ForegroundColor Cyan',
    "",
    "# 1. Create target directories",
  ];

  const folders = Array.from(new Set(items.map(i => i.proposedFolderPath))).filter(Boolean);
  for (const f of folders) {
    const winFolder = f.replace(/\//g, "\\");
    lines.push(`New-Item -ItemType Directory -Force -Path (Join-Path $TargetRoot "${winFolder}") | Out-Null`);
  }

  lines.push("");
  lines.push("# 2. Move and rename operations");

  for (const item of items) {
    if (item.status === "excluded") continue;

    const winSrc = item.originalPath.replace(/\//g, "\\");
    const winDest = item.fullDestinationPath.replace(/\//g, "\\");

    lines.push(`Write-Host "Moving: ${winSrc} -> ${winDest}"`);
    lines.push("if ($DryRun) {");
    lines.push(`    Write-Host "  [DRY-RUN] Move-Item -Path '$TargetRoot\\${winSrc}' -Destination '$TargetRoot\\${winDest}'" -ForegroundColor Gray`);
    lines.push("} else {");
    lines.push(`    $SrcPath = Join-Path $TargetRoot "${winSrc}"`);
    lines.push(`    $DestPath = Join-Path $TargetRoot "${winDest}"`);
    lines.push("    if (Test-Path $SrcPath) {");
    lines.push("        Move-Item -Path $SrcPath -Destination $DestPath -Force");
    lines.push("    } else {");
    lines.push(`        Write-Warning "Source file missing: $SrcPath"`);
    lines.push("    }");
    lines.push("}");
    lines.push("");
  }

  lines.push('Write-Host "Organization finished successfully!" -ForegroundColor Green');
  return lines.join("\n");
}

export function generateRollbackBashScript(items: OrganizationPlanItem[]): string {
  const lines: string[] = [
    "#!/usr/bin/env bash",
    "# ====================================================================",
    "# AI File Sorter - ROLLBACK RESTORE SCRIPT",
    `# Reverts moves made on ${new Date().toISOString()}`,
    "# ====================================================================",
    "set -euo pipefail",
    'TARGET_ROOT="${TARGET_ROOT:-.}"',
    'echo "Reverting file moves back to original locations..."',
    "",
  ];

  for (const item of items) {
    if (item.status === "excluded") continue;
    const src = item.fullDestinationPath;
    const dest = item.originalPath;

    // Ensure original parent dir exists
    const origDir = dest.includes("/") ? dest.substring(0, dest.lastIndexOf("/")) : "";
    if (origDir) {
      lines.push(`mkdir -p "\${TARGET_ROOT}/${origDir}"`);
    }
    lines.push(`if [ -f "\${TARGET_ROOT}/${src}" ]; then`);
    lines.push(`  mv "\${TARGET_ROOT}/${src}" "\${TARGET_ROOT}/${dest}"`);
    lines.push(`  echo "Restored: ${dest}"`);
    lines.push(`fi`);
  }

  lines.push("");
  lines.push('echo "Rollback completed."');
  return lines.join("\n");
}
