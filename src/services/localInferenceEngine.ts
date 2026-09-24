import { 
  ScannedFile, 
  OrganizationPlanItem, 
  CategoryWhitelistItem, 
  EngineSettings, 
  NamingPatternType,
  BackendEngineType
} from "../types";
import { DEFAULT_CATEGORY_WHITELIST } from "../data/defaultTaxonomy";

export class LocalInferenceEngine {
  private static instance: LocalInferenceEngine;
  private isWebGpuSupported: boolean = false;

  private constructor() {
    this.checkWebGpuSupport();
  }

  public static getInstance(): LocalInferenceEngine {
    if (!LocalInferenceEngine.instance) {
      LocalInferenceEngine.instance = new LocalInferenceEngine();
    }
    return LocalInferenceEngine.instance;
  }

  private async checkWebGpuSupport(): Promise<boolean> {
    try {
      if (typeof navigator !== "undefined" && (navigator as any).gpu) {
        const adapter = await (navigator as any).gpu.requestAdapter();
        this.isWebGpuSupported = Boolean(adapter);
      }
    } catch {
      this.isWebGpuSupported = false;
    }
    return this.isWebGpuSupported;
  }

  public getWebGpuStatus(): boolean {
    return this.isWebGpuSupported;
  }

  /**
   * Fast chunked hash computation for large files without reading whole file into memory
   */
  public async computeFastFileHash(file: File, sampleChunkKb: number = 64): Promise<string> {
    try {
      const sliceSize = sampleChunkKb * 1024;
      // Sample beginning, middle, and end for large files to be lightning fast and memory safe
      const headBlob = file.slice(0, Math.min(sliceSize, file.size));
      const midStart = Math.max(0, Math.floor(file.size / 2) - sliceSize / 2);
      const midBlob = file.slice(midStart, Math.min(midStart + sliceSize, file.size));
      const tailStart = Math.max(0, file.size - sliceSize);
      const tailBlob = file.slice(tailStart, file.size);

      const headBuffer = await headBlob.arrayBuffer();
      const midBuffer = await midBlob.arrayBuffer();
      const tailBuffer = await tailBlob.arrayBuffer();

      const combinedLength = headBuffer.byteLength + midBuffer.byteLength + tailBuffer.byteLength + 8;
      const combined = new Uint8Array(combinedLength);
      
      let offset = 0;
      combined.set(new Uint8Array(headBuffer), offset);
      offset += headBuffer.byteLength;
      combined.set(new Uint8Array(midBuffer), offset);
      offset += midBuffer.byteLength;
      combined.set(new Uint8Array(tailBuffer), offset);
      offset += tailBuffer.byteLength;

      // Encode size into last 8 bytes
      const view = new DataView(combined.buffer);
      view.setFloat64(offset, file.size, true);

      if (window.crypto && window.crypto.subtle) {
        const hashBuffer = await window.crypto.subtle.digest("SHA-256", combined);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, "0")).join("").substring(0, 16);
      } else {
        return `hash_${file.size}_${file.name.length}_${file.lastModified}`;
      }
    } catch {
      return `hash_${file.size}_${file.name}`;
    }
  }

  /**
   * Extract header text/metadata snippet without loading whole huge files
   */
  public async extractFileHeaderSnippet(file: File, maxBytes: number = 16384): Promise<string> {
    try {
      const isText = file.type.startsWith("text/") || 
        file.name.endsWith(".txt") || 
        file.name.endsWith(".md") || 
        file.name.endsWith(".json") || 
        file.name.endsWith(".csv") || 
        file.name.endsWith(".yaml") || 
        file.name.endsWith(".yml") || 
        file.name.endsWith(".ts") || 
        file.name.endsWith(".js") || 
        file.name.endsWith(".py") || 
        file.name.endsWith(".html") || 
        file.name.endsWith(".xml");

      if (isText) {
        const slice = file.slice(0, maxBytes);
        return await slice.text();
      }
      return "";
    } catch {
      return "";
    }
  }

  /**
   * Primary inference classifier for a single file using CPU / WebGPU logic
   */
  public classifyFileLocally(
    file: ScannedFile, 
    whitelist: CategoryWhitelistItem[] = DEFAULT_CATEGORY_WHITELIST,
    namingPattern: NamingPatternType = "date_category_name"
  ): OrganizationPlanItem {
    const rawName = file.name.toLowerCase();
    const ext = (file.extension || "").toLowerCase();
    const content = (file.contentSnippet || "").toLowerCase();
    const tokens = this.tokenizeText(`${rawName} ${content} ${file.path}`);

    let bestCategory = whitelist[0];
    let maxScore = -1;
    let detectedSubcategory: string | undefined = undefined;
    let matchReasoning: string = "";

    // 1. Evaluate taxonomy scores
    for (const cat of whitelist) {
      let score = 0;
      let matchedTerms: string[] = [];

      // Extension matching
      if (cat.extensions.some(e => e.toLowerCase() === ext)) {
        score += 25;
      }

      // Keyword matching
      for (const kw of cat.keywords) {
        const kwLower = kw.toLowerCase();
        if (tokens.has(kwLower) || rawName.includes(kwLower)) {
          score += 20;
          matchedTerms.push(kw);
        } else if (content && content.includes(kwLower)) {
          score += 12;
          matchedTerms.push(`content: "${kw}"`);
        }
      }

      // Subcategory check
      if (cat.subcategories) {
        for (const sub of cat.subcategories) {
          const subLower = sub.toLowerCase();
          if (tokens.has(subLower) || rawName.includes(subLower) || (content && content.includes(subLower))) {
            score += 15;
            detectedSubcategory = sub;
            matchedTerms.push(`sub: ${sub}`);
            break;
          }
        }
      }

      if (score > maxScore) {
        maxScore = score;
        bestCategory = cat;
        matchReasoning = matchedTerms.length > 0
          ? `Matched taxonomy rules for [${cat.name}]: ${matchedTerms.slice(0, 3).join(", ")}.`
          : `Matched by file extension [${ext}] in ${cat.name}.`;
      }
    }

    // Fallback if no specific keyword matched
    if (maxScore <= 0) {
      if (file.type === "image") {
        bestCategory = whitelist.find(c => c.id === "photos_camera") || bestCategory;
        matchReasoning = `Classified as visual media (${ext}).`;
      } else if (file.type === "audio") {
        bestCategory = whitelist.find(c => c.id === "audio_music") || bestCategory;
        matchReasoning = `Classified as audio sound asset (${ext}).`;
      } else if (file.type === "video") {
        bestCategory = whitelist.find(c => c.id === "video_recordings") || bestCategory;
        matchReasoning = `Classified as video recording (${ext}).`;
      } else if (file.type === "code") {
        bestCategory = whitelist.find(c => c.id === "dev_source_code") || bestCategory;
        matchReasoning = `Classified as source code script (${ext}).`;
      } else if (file.type === "archive") {
        bestCategory = whitelist.find(c => c.id === "archives_compressed") || bestCategory;
        matchReasoning = `Classified as compressed archive (${ext}).`;
      } else {
        bestCategory = whitelist.find(c => c.id === "work_reports") || bestCategory;
        matchReasoning = `Organized by file format (${ext}).`;
      }
      maxScore = 15;
    }

    // Normalize confidence
    const confidence = Math.min(0.99, Math.max(0.45, 0.4 + (maxScore / 100)));

    // Generate intelligent destination path
    let proposedFolderPath = bestCategory.targetFolder;
    if (detectedSubcategory) {
      proposedFolderPath = `${bestCategory.targetFolder}/${detectedSubcategory}`;
    }

    // Generate standardized clean filename
    const proposedFilename = this.generateCleanFilename(file, bestCategory.name, namingPattern);
    const fullDestinationPath = `${proposedFolderPath}/${proposedFilename}`;

    return {
      id: file.id,
      file,
      originalPath: file.path || file.name,
      originalName: file.name,
      proposedCategory: bestCategory.name,
      proposedSubcategory: detectedSubcategory,
      proposedFolderPath,
      proposedFilename,
      fullDestinationPath,
      reasoning: matchReasoning,
      confidence: Number(confidence.toFixed(2)),
      status: "pending",
    };
  }

  /**
   * Generates sanitized, intelligent filenames based on chosen pattern
   */
  public generateCleanFilename(
    file: ScannedFile, 
    categoryName: string, 
    pattern: NamingPatternType
  ): string {
    const ext = file.extension || (file.name.includes(".") ? "." + file.name.split(".").pop() : "");
    const baseNameWithoutExt = file.name.substring(0, file.name.length - ext.length);

    // Extract or infer date from timestamp or filename
    const fileDate = this.extractDateFromFilenameOrTimestamp(file.name, file.lastModified);
    const categoryTag = categoryName.split("&")[0].split("/")[0].trim().replace(/[^a-zA-Z0-9]/g, "");

    // Clean base name: remove clutter like "Copy", "final final", parentheses, duplicate spaces, timestamps already extracted
    let cleanBase = baseNameWithoutExt
      .replace(/\((?:copy|\d+)\)/gi, "")
      .replace(/\[(?:copy|\d+)\]/gi, "")
      .replace(/[-_]?(?:draft|final|v\d+|version\d+)[-_]?/gi, "")
      .replace(/\b(at \d+[\.\:]\d+[\.\:]\d+)\b/gi, "")
      .replace(/[-_.]+/g, " ")
      .trim();

    if (!cleanBase) {
      cleanBase = "File";
    }

    // Capitalize words
    cleanBase = cleanBase.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join("_");

    switch (pattern) {
      case "date_category_name":
        return `${fileDate}_${categoryTag}_${cleanBase}${ext}`;

      case "category_date_name":
        return `${categoryTag}_${fileDate}_${cleanBase}${ext}`;

      case "kebab_case":
        const kebabSlug = cleanBase.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
        return `${fileDate}-${kebabSlug}${ext.toLowerCase()}`;

      case "snake_case":
        const snakeSlug = cleanBase.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
        return `${fileDate}_${snakeSlug}${ext.toLowerCase()}`;

      case "original_clean":
        return `${cleanBase}${ext}`;

      case "custom":
      default:
        return `${fileDate}_${categoryTag}_${cleanBase}${ext}`;
    }
  }

  private extractDateFromFilenameOrTimestamp(filename: string, timestamp: number): string {
    // Check if filename already contains YYYY-MM-DD or YYYYMMDD
    const isoMatch = filename.match(/(20\d{2})[-_.]?(0[1-9]|1[0-2])[-_.]?(0[1-9]|[12]\d|3[01])/);
    if (isoMatch) {
      return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
    }

    // Check for MMDDYYYY or DDMMYYYY
    const altMatch = filename.match(/(0[1-9]|1[0-2])[-_.]?(0[1-9]|[12]\d|3[01])[-_.](20\d{2})/);
    if (altMatch) {
      return `${altMatch[3]}-${altMatch[1]}-${altMatch[2]}`;
    }

    // Fall back to file modification timestamp
    const dateObj = new Date(timestamp || Date.now());
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, "0");
    const day = String(dateObj.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  private tokenizeText(text: string): Set<string> {
    const words = text
      .toLowerCase()
      .replace(/[^a-z0-9_\-\.]/g, " ")
      .split(/[\s_\-\.]+/)
      .filter(w => w.length >= 2);
    return new Set(words);
  }

  /**
   * Batch execution with local CPU worker simulation / concurrency throttle
   */
  public async processBatch(
    files: ScannedFile[],
    settings: EngineSettings,
    whitelist: CategoryWhitelistItem[],
    namingPattern: NamingPatternType,
    onProgress?: (processed: number, currentItem?: OrganizationPlanItem, bytesProcessed?: number) => void
  ): Promise<OrganizationPlanItem[]> {
    const results: OrganizationPlanItem[] = [];
    const threads = Math.max(1, Math.min(settings.cpuThreads || 4, 16));
    let processedBytes = 0;

    for (let i = 0; i < files.length; i += threads) {
      const chunk = files.slice(i, i + threads);
      
      const chunkPromises = chunk.map(async (file) => {
        // Micro-yield to keep UI responsive and simulate CPU thread worker pipeline
        await new Promise(res => setTimeout(res, 12));
        const item = this.classifyFileLocally(file, whitelist, namingPattern);
        processedBytes += file.size;
        return item;
      });

      const chunkResults = await Promise.all(chunkPromises);
      for (const res of chunkResults) {
        results.push(res);
        if (onProgress) {
          onProgress(results.length, res, processedBytes);
        }
      }
    }

    return results;
  }
}

export const localEngine = LocalInferenceEngine.getInstance();
