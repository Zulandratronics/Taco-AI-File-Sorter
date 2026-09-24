import JSZip from "jszip";
import { OrganizationPlanItem } from "../types";

export async function createOrganizedZip(
  items: OrganizationPlanItem[],
  onProgress?: (percent: number, currentFile: string) => void
): Promise<Blob> {
  const zip = new JSZip();

  // Create manifest report
  const manifest = {
    generatedAt: new Date().toISOString(),
    totalFiles: items.length,
    files: items.map(i => ({
      originalPath: i.originalPath,
      newPath: i.fullDestinationPath,
      category: i.proposedCategory,
      confidence: i.confidence,
      reasoning: i.reasoning,
    })),
  };

  zip.file("organization_manifest.json", JSON.stringify(manifest, null, 2));

  let processed = 0;
  for (const item of items) {
    if (item.status === "excluded") continue;

    if (onProgress) {
      onProgress(Math.round((processed / items.length) * 100), item.proposedFilename);
    }

    if (item.file.fileRef) {
      // Real File object uploaded by user
      const arrayBuffer = await item.file.fileRef.arrayBuffer();
      zip.file(item.fullDestinationPath, arrayBuffer);
    } else {
      // Simulated sample file content
      const content = item.file.contentSnippet || 
        `[Organized by AI File Sorter]\nOriginal Name: ${item.originalName}\nCategory: ${item.proposedCategory}\nReason: ${item.reasoning}`;
      zip.file(item.fullDestinationPath, content);
    }

    processed++;
  }

  if (onProgress) {
    onProgress(100, "Finalizing compressed archive...");
  }

  return await zip.generateAsync(
    { type: "blob", compression: "DEFLATE", compressionOptions: { level: 6 } },
    (metadata) => {
      if (onProgress) {
        onProgress(Math.round(metadata.percent), "Compressing archive...");
      }
    }
  );
}

export function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
