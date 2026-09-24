import { ScannedFile, SafetySettings, DuplicateGroup, OrganizationPlanItem } from "../types";
import { localEngine } from "./localInferenceEngine";
import { PROTECTED_FOLDERS } from "../data/defaultTaxonomy";

export async function parseUploadedFiles(
  fileList: FileList | File[],
  safety: SafetySettings,
  onProgress?: (count: number, currentName: string) => void
): Promise<ScannedFile[]> {
  const filesArray = Array.from(fileList);
  const scanned: ScannedFile[] = [];

  for (let i = 0; i < filesArray.length; i++) {
    const file = filesArray[i];
    const relativePath = (file as any).webkitRelativePath || file.name;

    // Safety checks
    if (shouldIgnorePath(relativePath, safety)) {
      continue;
    }

    if (onProgress) {
      onProgress(scanned.length + 1, file.name);
    }

    const ext = getFileExtension(file.name);
    const fileType = determineFileType(file.name, file.type);

    // Fast partial extraction for large files without loading entire file in memory
    const contentSnippet = await localEngine.extractFileHeaderSnippet(file, 16384);
    const fastHash = await localEngine.computeFastFileHash(file, 64);

    let thumbnailUrl: string | undefined = undefined;
    if (fileType === "image" && file.size < 25 * 1024 * 1024) {
      try {
        thumbnailUrl = URL.createObjectURL(file);
      } catch {
        // Ignore thumbnail failure
      }
    }

    scanned.push({
      id: `f_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 7)}`,
      name: file.name,
      path: relativePath,
      extension: ext,
      size: file.size,
      lastModified: file.lastModified,
      type: fileType,
      mimeType: file.type,
      fileRef: file,
      contentSnippet,
      hash: fastHash,
      thumbnailUrl,
      metadata: {
        dimensions: fileType === "image" ? "Preview ready" : undefined,
        lineCount: contentSnippet ? contentSnippet.split("\n").length : undefined,
      },
    });
  }

  return scanned;
}

export function shouldIgnorePath(filePath: string, safety: SafetySettings): boolean {
  const normalized = filePath.replace(/\\/g, "/");
  const parts = normalized.split("/");

  if (safety.ignoreHiddenFiles) {
    if (parts.some(p => p.startsWith(".") && p !== "." && p !== "..")) {
      return true;
    }
    if (normalized.endsWith(".DS_Store") || normalized.endsWith("Thumbs.db") || normalized.endsWith("desktop.ini")) {
      return true;
    }
  }

  if (safety.ignoreGit && (parts.includes(".git") || parts.includes(".github"))) {
    return true;
  }

  if (safety.ignoreNodeModules && parts.includes("node_modules")) {
    return true;
  }

  if (safety.ignoreBuildArtifacts && (parts.includes("dist") || parts.includes("build") || parts.includes("target") || parts.includes(".next") || parts.includes(".out"))) {
    return true;
  }

  if (safety.ignoreGameEngines && (parts.includes("Assets/Plugins") || parts.includes("Intermediate") || parts.includes("Saved"))) {
    return true;
  }

  // General protected folders
  for (const pf of PROTECTED_FOLDERS) {
    if (parts.includes(pf)) return true;
  }

  return false;
}

export function getFileExtension(filename: string): string {
  const lastDot = filename.lastIndexOf(".");
  if (lastDot === -1 || lastDot === 0) return "";
  return filename.substring(lastDot).toLowerCase();
}

export function determineFileType(filename: string, mime: string = ""): ScannedFile["type"] {
  const ext = getFileExtension(filename);
  
  if (mime.startsWith("image/") || [".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg", ".bmp", ".raw", ".cr2", ".nef", ".arw", ".heic"].includes(ext)) {
    return "image";
  }
  if (mime.startsWith("audio/") || [".mp3", ".wav", ".flac", ".m4a", ".aac", ".ogg", ".wma"].includes(ext)) {
    return "audio";
  }
  if (mime.startsWith("video/") || [".mp4", ".mov", ".mkv", ".avi", ".webm", ".flv", ".wmv"].includes(ext)) {
    return "video";
  }
  if ([".ts", ".tsx", ".js", ".jsx", ".py", ".rs", ".go", ".c", ".cpp", ".h", ".java", ".kt", ".swift", ".php", ".sh", ".sql", ".css", ".html", ".yaml", ".yml", ".json"].includes(ext)) {
    return "code";
  }
  if ([".zip", ".tar", ".gz", ".7z", ".rar", ".bz2", ".xz"].includes(ext)) {
    return "archive";
  }
  if ([".exe", ".msi", ".dmg", ".pkg", ".deb", ".rpm", ".appimage", ".apk"].includes(ext)) {
    return "executable";
  }
  if ([".csv", ".tsv", ".parquet", ".sqlite", ".db"].includes(ext)) {
    return "data";
  }
  if ([".pdf", ".docx", ".doc", ".pptx", ".ppt", ".xlsx", ".xls", ".txt", ".md", ".rtf", ".odt", ".epub"].includes(ext)) {
    return "document";
  }
  return "other";
}

export function detectDuplicates(items: OrganizationPlanItem[]): DuplicateGroup[] {
  const hashMap = new Map<string, OrganizationPlanItem[]>();

  for (const item of items) {
    const h = item.file.hash;
    if (!h) continue;
    if (!hashMap.has(h)) {
      hashMap.set(h, []);
    }
    hashMap.get(h)!.push(item);
  }

  const groups: DuplicateGroup[] = [];
  for (const [hash, groupItems] of hashMap.entries()) {
    if (groupItems.length > 1) {
      // Pick best file to keep (e.g. cleanest name or newest timestamp)
      const sorted = [...groupItems].sort((a, b) => b.file.lastModified - a.file.lastModified);
      const suggestedKeepId = sorted[0].id;

      groups.push({
        hash,
        size: groupItems[0].file.size,
        files: groupItems,
        suggestedKeepId,
      });
    }
  }

  return groups;
}

export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}
