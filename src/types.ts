export type NicheProfileId = 
  | "unconventional_polymath" 
  | "independent_musician"
  | "general_productivity" 
  | "digital_creator" 
  | "academic_scholar" 
  | "studio_artist";

export interface NicheProfile {
  id: NicheProfileId;
  name: string;
  tagline: string;
  description: string;
  iconName: string;
  defaultNamingPattern: NamingPatternType;
  categories: CategoryWhitelistItem[];
}

export interface SuggestedDirectory {
  id: string;
  folderPath: string;
  categoryName: string;
  matchedFileIds: string[];
  confidence: number;
  reasoning: string;
  commonKeywords: string[];
  recommendedExtensions?: string[];
}

export type BackendEngineType = 
  | "local_cpu" 
  | "local_webgpu" 
  | "local_ollama_cuda" 
  | "cloud_gemini";

export type NamingPatternType = 
  | "date_category_name" 
  | "category_date_name" 
  | "kebab_case" 
  | "snake_case" 
  | "original_clean" 
  | "custom";

export type ConflictResolution = "rename_numbered" | "skip" | "quarantine_duplicates" | "overwrite";

export interface CategoryWhitelistItem {
  id: string;
  name: string;
  targetFolder: string;
  keywords: string[];
  extensions: string[];
  subcategories?: string[];
  isCustom?: boolean;
}

export interface ScannedFile {
  id: string;
  name: string;
  path: string; // Relative path from root scan folder
  extension: string;
  size: number;
  lastModified: number;
  type: "document" | "image" | "audio" | "video" | "code" | "archive" | "executable" | "data" | "other";
  mimeType?: string;
  fileRef?: File; // Native browser File object when loaded via drag&drop or picker
  
  // High-efficiency partial inspection
  contentSnippet?: string;
  hash?: string; // High-speed chunked hash
  thumbnailUrl?: string;
  metadata?: {
    dimensions?: string;
    duration?: string;
    lineCount?: number;
    encoding?: string;
    author?: string;
    createdDate?: string;
    cameraModel?: string;
  };
}

export interface OrganizationPlanItem {
  id: string;
  file: ScannedFile;
  originalPath: string;
  originalName: string;
  proposedCategory: string;
  proposedSubcategory?: string;
  proposedFolderPath: string;
  proposedFilename: string;
  fullDestinationPath: string;
  reasoning: string;
  confidence: number; // 0 to 1
  isDuplicate?: boolean;
  duplicateOfId?: string;
  isModifiedManually?: boolean;
  status: "pending" | "approved" | "excluded" | "applied" | "error";
  error?: string;
}

export interface DuplicateGroup {
  hash: string;
  size: number;
  files: OrganizationPlanItem[];
  suggestedKeepId: string;
}

export interface EngineSettings {
  engine: BackendEngineType;
  cpuThreads: number;
  chunkSizeKb: number; // For large file stream analysis e.g. 64KB
  webGpuAvailable: boolean;
  ollamaEndpoint: string;
  ollamaModel: string;
  cudaAccelerated: boolean;
  temperature: number;
  maxFilesPerBatch: number;
  useContentInspection: boolean;
  maxInspectionFileSizeMb: number; // Default 500MB (reads headers chunked without RAM spike)
}

export interface SafetySettings {
  ignoreGit: boolean;
  ignoreNodeModules: boolean;
  ignoreBuildArtifacts: boolean; // dist, build, target, out
  ignoreGameEngines: boolean; // Unity, Unreal, Godot project internals
  ignoreHiddenFiles: boolean; // .DS_Store, Thumbs.db, .*
  protectSystemDirs: boolean;
  conflictStrategy: ConflictResolution;
  dryRunFirst: boolean;
}

export interface ProcessingTelemetry {
  isProcessing: boolean;
  processedCount: number;
  totalCount: number;
  currentFilename?: string;
  bytesProcessed: number;
  totalBytes: number;
  throughputMbps: number;
  elapsedMs: number;
  estimatedRemainingMs: number;
  activeEngine: BackendEngineType;
  gpuMemoryEstimateMb?: number;
  cpuCoreUsagePercent?: number;
}

export interface HistoryRecord {
  id: string;
  timestamp: number;
  summary: string;
  totalFiles: number;
  items: Array<{
    originalPath: string;
    destinationPath: string;
  }>;
  rollbackScriptBash: string;
  rollbackScriptPowerShell: string;
}
