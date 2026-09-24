import { ScannedFile, OrganizationPlanItem, CategoryWhitelistItem, NamingPatternType } from "../types";

export async function sortFilesWithGemini(
  files: ScannedFile[],
  categories: CategoryWhitelistItem[],
  namingPattern: NamingPatternType,
  customInstructions?: string
): Promise<OrganizationPlanItem[]> {
  const payload = {
    files: files.map(f => ({
      id: f.id,
      name: f.name,
      path: f.path,
      extension: f.extension,
      size: f.size,
      lastModified: f.lastModified,
      contentSnippet: f.contentSnippet,
      metadata: f.metadata,
    })),
    categories: categories.map(c => ({
      name: c.name,
      folder: c.targetFolder,
      keywords: c.keywords,
    })),
    namingPattern,
    customInstructions,
  };

  const res = await fetch("/api/sort-files-gemini", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: "Failed to communicate with AI server" }));
    let cleanMessage = errorData.error || `Server responded with ${res.status}`;
    try {
      // In case error was an ApiError JSON string
      const parsedObj = JSON.parse(cleanMessage);
      if (parsedObj?.error?.message) {
        cleanMessage = parsedObj.error.message;
      }
    } catch {
      // Not JSON string, keep as is
    }
    const err = new Error(cleanMessage);
    (err as any).isCapacityError = Boolean(errorData.isCapacityError);
    throw err;
  }

  const data = await res.json();
  if (!data.success || !Array.isArray(data.suggestions)) {
    throw new Error("Invalid response format from AI File Sorter server");
  }

  const fileMap = new Map<string, ScannedFile>(files.map(f => [f.id, f]));
  const results: OrganizationPlanItem[] = [];

  for (const sug of data.suggestions) {
    const original = fileMap.get(sug.id);
    if (!original) continue;

    const proposedFolder = sug.targetFolderPath || sug.category;
    const proposedName = sug.proposedName || original.name;
    const fullPath = `${proposedFolder.replace(/\/+$/, "")}/${proposedName.replace(/^\/+/, "")}`;

    results.push({
      id: original.id,
      file: original,
      originalPath: original.path || original.name,
      originalName: original.name,
      proposedCategory: sug.category,
      proposedSubcategory: sug.subcategory,
      proposedFolderPath: proposedFolder,
      proposedFilename: proposedName,
      fullDestinationPath: fullPath,
      reasoning: sug.reasoning || "Categorized by Gemini Vision & Semantic Analysis",
      confidence: typeof sug.confidence === "number" ? sug.confidence : 0.95,
      status: "pending",
    });
  }

  // Handle any files missing from the AI response
  for (const f of files) {
    if (!results.some(r => r.id === f.id)) {
      results.push({
        id: f.id,
        file: f,
        originalPath: f.path || f.name,
        originalName: f.name,
        proposedCategory: "Other",
        proposedFolderPath: "Other/Unsorted",
        proposedFilename: f.name,
        fullDestinationPath: `Other/Unsorted/${f.name}`,
        reasoning: "General sorting fallback",
        confidence: 0.5,
        status: "pending",
      });
    }
  }

  return results;
}
