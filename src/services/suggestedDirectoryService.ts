import { 
  OrganizationPlanItem, 
  CategoryWhitelistItem, 
  SuggestedDirectory,
  ScannedFile 
} from "../types";

// Common stop words to ignore when extracting directory themes
const STOP_WORDS = new Set([
  "and", "the", "for", "with", "this", "that", "from", "copy", "final", 
  "draft", "temp", "test", "file", "untitled", "new", "item", "misc", 
  "export", "download", "document", "screen", "shot", "capture", "version",
  "folder", "sample", "data", "date", "year", "month", "today", "yesterday",
  "backup", "first", "last", "true", "false", "null", "none"
]);

/**
 * Tokenize a filename and snippet into distinct semantic terms
 */
function extractThematicTokens(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[._\-–—()[\]{}+@!#$%^&*~`=<>/?;:'",|\\]+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2") // camelCase to words
    .toLowerCase()
    .split(/\s+/)
    .filter(token => token.length >= 3 && !STOP_WORDS.has(token) && isNaN(Number(token)));
}

/**
 * Analyzes scanned files and current organization plan to discover emerging thematic clusters
 * and suggest high-value new directories tailored for scattered polymath projects.
 */
export function discoverSuggestedDirectories(
  items: OrganizationPlanItem[],
  existingCategories: CategoryWhitelistItem[]
): SuggestedDirectory[] {
  if (items.length < 2) return [];

  const existingFolderSet = new Set(
    existingCategories.map(c => c.targetFolder.toLowerCase().replace(/[\/\\]+/g, "/"))
  );
  const existingCategoryNames = new Set(
    existingCategories.map(c => c.name.toLowerCase())
  );

  // Map tokens to items that contain them
  const tokenToItemsMap = new Map<string, OrganizationPlanItem[]>();
  const extensionToItemsMap = new Map<string, OrganizationPlanItem[]>();

  for (const item of items) {
    const rawTokens = [
      ...extractThematicTokens(item.originalName),
      ...extractThematicTokens(item.proposedFilename),
      ...(item.file.contentSnippet ? extractThematicTokens(item.file.contentSnippet.slice(0, 300)) : []),
    ];

    const uniqueTokens = Array.from(new Set(rawTokens));
    for (const token of uniqueTokens) {
      if (!tokenToItemsMap.has(token)) {
        tokenToItemsMap.set(token, []);
      }
      tokenToItemsMap.get(token)!.push(item);
    }

    const ext = item.file.extension.toLowerCase();
    if (ext) {
      if (!extensionToItemsMap.has(ext)) {
        extensionToItemsMap.set(ext, []);
      }
      extensionToItemsMap.get(ext)!.push(item);
    }
  }

  const suggestions: SuggestedDirectory[] = [];
  const processedSignatures = new Set<string>();

  // 1. High-value Domain Clusters (Specialized Polymath / Interdisciplinary patterns)
  const SPECIALIZED_THEMES = [
    {
      keywords: ["quantum", "annealing", "qubit", "superposition", "entanglement"],
      categoryName: "Quantum Information & Computing",
      folderPath: "Research/Quantum_Information & Physics",
      reason: "Detected multiple documents on quantum mechanics and algorithmic entanglement.",
    },
    {
      keywords: ["solarpunk", "greenhouse", "ecology", "botany", "hydroponics", "permaculture", "mycology"],
      categoryName: "Ecological Engineering & Solarpunk",
      folderPath: "Inventions/Solarpunk & Ecological_Systems",
      reason: "Clustered biological, botanical, and sustainable habitat notes.",
    },
    {
      keywords: ["gerber", "kicad", "pcb", "schematic", "breadboard", "esp32", "microcontroller", "circuit"],
      categoryName: "Hardware Lab & PCB Schematics",
      folderPath: "Lab/Hardware_Prototypes & Circuit_Boards",
      reason: "Grouped embedded electronics, schematics, and manufacturing Gerber files.",
    },
    {
      keywords: ["ontology", "dialectic", "epistemology", "phenomenology", "cybernetics", "metaphysics"],
      categoryName: "Epistemology & Cognitive Theory",
      folderPath: "Philosophy/Epistemology & Cognitive_Theory",
      reason: "Identified interdisciplinary philosophical manuscripts and epistemic inquiries.",
    },
    {
      keywords: ["modular", "synth", "patch", "eurorack", "soundscape", "binaural", "oscillator"],
      categoryName: "Modular Acoustics & Sonic Lab",
      folderPath: "Sonic_Lab/Modular_Patches & Experiments",
      reason: "Clustered modular synthesizer patches, recordings, and generative audio.",
    },
    {
      keywords: ["zettel", "slipbox", "fleeting", "atomic_notes", "permanent_note", "concept_map"],
      categoryName: "Zettelkasten Knowledge Nodes",
      folderPath: "Knowledge_Base/Zettelkasten_SlipBox",
      reason: "Recognized linked atomic note system and slip-box research cards.",
    },
    {
      keywords: ["shader", "glsl", "frag", "vert", "procedural", "raymarching"],
      categoryName: "Generative Shaders & Visual Computing",
      folderPath: "Visual_Lab/GLSL_Shaders & Generative_Art",
      reason: "Detected procedural compute shaders and visual mathematics code.",
    },
    {
      keywords: ["lore", "worldbuilding", "pantheon", "faction", "mythos", "screenplay"],
      categoryName: "Speculative Worldbuilding & Lore",
      folderPath: "Worldbuilding/Canon_Lore & Factions",
      reason: "Clustered creative fiction, world lore, and narrative worldbuilding.",
    },
    {
      keywords: ["manifesto", "grant", "fellowship", "patron", "patronage", "thesis_defense"],
      categoryName: "Manifestos & Grant Proposals",
      folderPath: "Ventures/Manifestos & Patron_Grants",
      reason: "Grouped grant applications, research fellowships, and manifestos.",
    },
    {
      keywords: ["stem", "multitrack", "vocal_lead", "bass_di", "overhead", "drum_bus"],
      categoryName: "Session Stems & Multitracks",
      folderPath: "Music_Production/Stems_&_Multitracks",
      reason: "Detected raw studio audio stems and multi-track recording passes.",
    },
    {
      keywords: ["808", "drumkit", "one_shot", "hihat", "kick", "snare", "sample_pack"],
      categoryName: "Sample Kits & 808 Drums",
      folderPath: "Audio_Library/Samples_&_One_Shots",
      reason: "Clustered drum samples, 808 bass hits, and rhythm soundbanks.",
    },
    {
      keywords: ["split_sheet", "ascap", "bmi", "isrc", "sync_license", "distrokid"],
      categoryName: "Music Licensing & Split Sheets",
      folderPath: "Business/Licensing_&_Split_Sheets",
      reason: "Grouped songwriter split sheets, royalty data, and sync agreements.",
    },
  ];

  for (const theme of SPECIALIZED_THEMES) {
    const matchedItems: OrganizationPlanItem[] = [];
    const matchedKeywords: string[] = [];

    for (const kw of theme.keywords) {
      const itemsWithKw = tokenToItemsMap.get(kw);
      if (itemsWithKw) {
        matchedKeywords.push(kw);
        for (const item of itemsWithKw) {
          if (!matchedItems.some(m => m.id === item.id)) {
            matchedItems.push(item);
          }
        }
      }
    }

    if (matchedItems.length >= 2) {
      const sig = theme.folderPath.toLowerCase();
      if (!existingFolderSet.has(sig) && !processedSignatures.has(sig)) {
        processedSignatures.add(sig);
        suggestions.push({
          id: `sug_${theme.categoryName.toLowerCase().replace(/[^a-z0-9]/g, "_")}`,
          categoryName: theme.categoryName,
          folderPath: theme.folderPath,
          matchedFileIds: matchedItems.map(i => i.id),
          confidence: 0.94,
          reasoning: `${theme.reason} (${matchedItems.length} files matched: ${matchedKeywords.join(", ")})`,
          commonKeywords: matchedKeywords,
          recommendedExtensions: Array.from(new Set(matchedItems.map(i => i.file.extension))),
        });
      }
    }
  }

  // 2. Discover emergent keyword clusters from the actual scattered files
  // Find tokens that appear in 2 to 12 files (not universal, but a strong local cluster)
  const tokenCandidates: Array<{ token: string; count: number; items: OrganizationPlanItem[] }> = [];

  for (const [token, matched] of tokenToItemsMap.entries()) {
    if (matched.length >= 2 && matched.length <= Math.max(3, Math.ceil(items.length * 0.6))) {
      // Check if this token is already closely tied to an existing folder
      const alreadyCovered = Array.from(existingCategoryNames).some(cat => cat.includes(token));
      if (!alreadyCovered && token.length >= 4) {
        tokenCandidates.push({ token, count: matched.length, items: matched });
      }
    }
  }

  // Sort by cluster frequency
  tokenCandidates.sort((a, b) => b.count - a.count);

  for (const candidate of tokenCandidates) {
    if (suggestions.length >= 6) break;

    const capitalizedToken = candidate.token.charAt(0).toUpperCase() + candidate.token.slice(1);
    const suggestedFolder = `Projects/${capitalizedToken}_Workspace`;
    const folderKey = suggestedFolder.toLowerCase();

    if (!existingFolderSet.has(folderKey) && !processedSignatures.has(folderKey)) {
      processedSignatures.add(folderKey);
      
      const fileNamesSample = candidate.items.slice(0, 3).map(i => i.originalName).join(", ");
      suggestions.push({
        id: `sug_cluster_${candidate.token}`,
        categoryName: `${capitalizedToken} Project Hub`,
        folderPath: suggestedFolder,
        matchedFileIds: candidate.items.map(i => i.id),
        confidence: 0.88,
        reasoning: `Found ${candidate.count} files consistently sharing the '${candidate.token}' theme (e.g. ${fileNamesSample}).`,
        commonKeywords: [candidate.token],
        recommendedExtensions: Array.from(new Set(candidate.items.map(i => i.file.extension))),
      });
    }
  }

  // 3. Fallback cluster for low-confidence or generic files
  const lowConfidenceOrGeneric = items.filter(i => 
    i.confidence < 0.65 || 
    i.proposedFolderPath.includes("Reports & Work") ||
    i.proposedFolderPath.includes("Other")
  );

  if (lowConfidenceOrGeneric.length >= 3 && suggestions.length < 5) {
    const folderPath = "Unsorted & Stash/Needs_Review";
    if (!existingFolderSet.has(folderPath.toLowerCase()) && !processedSignatures.has(folderPath.toLowerCase())) {
      processedSignatures.add(folderPath.toLowerCase());
      suggestions.push({
        id: "sug_generic_stash",
        categoryName: "Unsorted & Deep Stash",
        folderPath,
        matchedFileIds: lowConfidenceOrGeneric.map(i => i.id),
        confidence: 0.78,
        reasoning: `${lowConfidenceOrGeneric.length} files have non-standard extensions or mixed topics that warrant an isolated staging workspace.`,
        commonKeywords: ["stash", "unsorted"],
      });
    }
  }

  return suggestions;
}

/**
 * Applies a suggested directory into the active taxonomy whitelist, and relocates matching files.
 */
export function applySuggestedDirectory(
  suggestion: SuggestedDirectory,
  currentPlan: OrganizationPlanItem[],
  currentCategories: CategoryWhitelistItem[]
): { 
  updatedPlan: OrganizationPlanItem[]; 
  updatedCategories: CategoryWhitelistItem[];
  countMoved: number;
} {
  // 1. Add to categories if not already present
  const exists = currentCategories.some(c => 
    c.targetFolder.toLowerCase() === suggestion.folderPath.toLowerCase() ||
    c.name.toLowerCase() === suggestion.categoryName.toLowerCase()
  );

  let updatedCategories = [...currentCategories];
  if (!exists) {
    const newCategory: CategoryWhitelistItem = {
      id: suggestion.id,
      name: suggestion.categoryName,
      targetFolder: suggestion.folderPath,
      keywords: suggestion.commonKeywords.length > 0 ? suggestion.commonKeywords : [suggestion.categoryName.toLowerCase()],
      extensions: suggestion.recommendedExtensions || [".pdf", ".md", ".txt"],
      subcategories: ["General", "Active"],
      isCustom: true,
    };
    updatedCategories.push(newCategory);
  }

  // 2. Relocate matching files
  const matchedSet = new Set(suggestion.matchedFileIds);
  let countMoved = 0;

  const updatedPlan = currentPlan.map(item => {
    if (matchedSet.has(item.id)) {
      countMoved++;
      const fullPath = `${suggestion.folderPath.replace(/\/+$/, "")}/${item.proposedFilename.replace(/^\/+/, "")}`;
      return {
        ...item,
        proposedCategory: suggestion.categoryName,
        proposedFolderPath: suggestion.folderPath,
        fullDestinationPath: fullPath,
        reasoning: `Relocated to suggested directory [${suggestion.folderPath}]: ${suggestion.reasoning}`,
        confidence: Math.max(item.confidence, suggestion.confidence),
        isModifiedManually: true,
      };
    }
    return item;
  });

  return { updatedPlan, updatedCategories, countMoved };
}
