import { OrganizationPlanItem } from "../types";
import { formatBytes } from "./fileScanner";

/**
 * Escapes a single CSV cell according to RFC 4180
 */
function escapeCsvCell(value: any): string {
  if (value === null || value === undefined) {
    return '""';
  }
  const str = String(value);
  // If the cell contains quotes, commas, newlines, or carriage returns, wrap in quotes and escape internal quotes
  if (str.includes('"') || str.includes(",") || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return `"${str}"`;
}

/**
 * Generates an RFC 4180 compliant CSV string from an organization plan
 */
export function generateCsvManifest(
  items: OrganizationPlanItem[],
  sourceName?: string
): string {
  const headers = [
    "Original Filename",
    "Original Path",
    "File Type",
    "Extension",
    "File Size (Bytes)",
    "Formatted Size",
    "Proposed Category",
    "Proposed Subcategory",
    "Proposed Folder Path",
    "Proposed Filename",
    "Full Target Path",
    "Reasoning",
    "Confidence (%)",
    "Review Status",
    "Manually Modified",
    "Last Modified Date",
  ];

  const rows: string[] = [];
  rows.push(headers.map(escapeCsvCell).join(","));

  for (const item of items) {
    const originalFile = item.file;
    const formattedSize = originalFile ? formatBytes(originalFile.size) : "";
    const sizeBytes = originalFile ? originalFile.size : "";
    const extension = originalFile ? originalFile.extension : "";
    const fileType = originalFile ? originalFile.type : "";
    const lastModified = originalFile?.lastModified
      ? new Date(originalFile.lastModified).toISOString()
      : "";
    const confidencePct = Math.round(item.confidence * 100);

    const row = [
      item.originalName,
      item.originalPath,
      fileType,
      extension,
      sizeBytes,
      formattedSize,
      item.proposedCategory,
      item.proposedSubcategory || "",
      item.proposedFolderPath,
      item.proposedFilename,
      item.fullDestinationPath,
      item.reasoning,
      `${confidencePct}%`,
      item.status,
      item.isModifiedManually ? "Yes" : "No",
      lastModified,
    ];

    rows.push(row.map(escapeCsvCell).join(","));
  }

  // Prepend UTF-8 BOM so Excel, Google Sheets, and Numbers open characters accurately
  return "\uFEFF" + rows.join("\r\n");
}

/**
 * Triggers a client-side download of the CSV report manifest
 */
export function downloadCsvManifest(
  items: OrganizationPlanItem[],
  sourceName: string = "workspace"
): { rowCount: number; filename: string } {
  const csvContent = generateCsvManifest(items, sourceName);
  const now = new Date();
  const timestamp = now
    .toISOString()
    .replace(/[:T]/g, "-")
    .replace(/\..+/, "");
  
  const sanitizedSource = sourceName.replace(/[^a-zA-Z0-9_-]/g, "_") || "files";
  const filename = `manifest_${sanitizedSource}_${timestamp}.csv`;

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return { rowCount: items.length, filename };
}
