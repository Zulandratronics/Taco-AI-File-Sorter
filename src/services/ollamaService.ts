import { ScannedFile, OrganizationPlanItem, CategoryWhitelistItem, NamingPatternType } from "../types";

export interface OllamaModelInfo {
  name: string;
  size?: number;
  details?: {
    parameter_size?: string;
    quantization_level?: string;
  };
}

export async function checkOllamaAvailability(endpoint: string = "http://localhost:11434"): Promise<{
  available: boolean;
  models: OllamaModelInfo[];
  error?: string;
  tip?: string;
}> {
  try {
    const res = await fetch("/api/ollama-check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ endpoint }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err: unknown) {
    return {
      available: false,
      models: [],
      error: err instanceof Error ? err.message : "Failed to connect",
    };
  }
}

export async function sortFilesWithOllama(
  files: ScannedFile[],
  categories: CategoryWhitelistItem[],
  namingPattern: NamingPatternType,
  endpoint: string,
  model: string = "llama3.2"
): Promise<OrganizationPlanItem[]> {
  const prompt = `You are a file taxonomist and organizer.
Organize the following files into sensible categories and clean standard filenames.
Return a valid JSON array of objects with keys: "id", "category", "targetFolderPath", "proposedName", "reasoning", "confidence".

Category Whitelist options: ${categories.map(c => `${c.name} -> ${c.targetFolder}`).join(", ")}
Naming style: ${namingPattern}

Files:
${JSON.stringify(
  files.map(f => ({
    id: f.id,
    name: f.name,
    extension: f.extension,
    size: f.size,
    contentSnippet: f.contentSnippet ? f.contentSnippet.slice(0, 300) : undefined,
  })),
  null,
  2
)}`;

  const res = await fetch("/api/ollama-generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      endpoint,
      model,
      prompt,
      system: "Output only valid raw JSON array of suggestions. No markdown code blocks.",
    }),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({ error: "Ollama call failed" }));
    throw new Error(errData.error || `Ollama server error ${res.status}`);
  }

  const data = await res.json();
  const rawText = data.result || "[]";
  let cleaned = rawText.trim();
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.replace(/^```json/, "").replace(/```$/, "").trim();
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```/, "").replace(/```$/, "").trim();
  }

  const parsed = JSON.parse(cleaned);
  const fileMap = new Map<string, ScannedFile>(files.map(f => [f.id, f]));
  const results: OrganizationPlanItem[] = [];

  for (const item of parsed) {
    const f = fileMap.get(item.id);
    if (!f) continue;
    const folder = item.targetFolderPath || item.category || "Unsorted";
    const name = item.proposedName || f.name;
    results.push({
      id: f.id,
      file: f,
      originalPath: f.path || f.name,
      originalName: f.name,
      proposedCategory: item.category || "Other",
      proposedFolderPath: folder,
      proposedFilename: name,
      fullDestinationPath: `${folder.replace(/\/+$/, "")}/${name.replace(/^\/+/, "")}`,
      reasoning: item.reasoning || `Classified via local Ollama (${model})`,
      confidence: typeof item.confidence === "number" ? item.confidence : 0.88,
      status: "pending",
    });
  }

  return results;
}
