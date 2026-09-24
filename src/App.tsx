/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { 
  ScannedFile, 
  OrganizationPlanItem, 
  DuplicateGroup, 
  EngineSettings, 
  SafetySettings, 
  CategoryWhitelistItem, 
  NamingPatternType, 
  ProcessingTelemetry, 
  HistoryRecord,
  NicheProfileId,
  SuggestedDirectory
} from "./types";
import { DEFAULT_CATEGORY_WHITELIST } from "./data/defaultTaxonomy";
import { NICHE_PROFILES, getCombinedCategories } from "./data/nicheProfiles";
import { discoverSuggestedDirectories, applySuggestedDirectory } from "./services/suggestedDirectoryService";
import { localEngine } from "./services/localInferenceEngine";
import { sortFilesWithGemini } from "./services/geminiService";
import { sortFilesWithOllama } from "./services/ollamaService";
import { detectDuplicates } from "./services/fileScanner";
import { generateRollbackBashScript } from "./services/scriptGenerator";

// Components
import { Navbar } from "./components/Navbar";
import { FileScanner } from "./components/FileScanner";
import { ReviewWorkspace } from "./components/ReviewWorkspace";
import { ExecutionPanel } from "./components/ExecutionPanel";
import { EngineSettingsModal } from "./components/EngineSettingsModal";
import { TaxonomyEditor } from "./components/TaxonomyEditor";
import { HistoryRollbackModal } from "./components/HistoryRollbackModal";
import { FilePreviewModal } from "./components/FilePreviewModal";
import { GuideModal } from "./components/GuideModal";
import { SuggestedDirectoriesModal } from "./components/SuggestedDirectoriesModal";
import { SAMPLE_PRESETS } from "./services/sampleFiles";
import { downloadCsvManifest } from "./services/csvExportService";
import { 
  FolderTree, 
  Sparkles, 
  Cpu, 
  Zap, 
  AlertCircle, 
  RotateCcw, 
  Layers,
  FileSpreadsheet,
  CheckCircle2,
  Lightbulb,
  BrainCircuit
} from "lucide-react";

export default function App() {
  // Theme State (Dark / Light mode persistent)
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem("ai_file_sorter_theme");
      if (saved) return saved === "dark";
      return typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("ai_file_sorter_theme", isDarkMode ? "dark" : "light");
      if (isDarkMode) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    } catch {}
  }, [isDarkMode]);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Engine Configuration State
  const [engineSettings, setEngineSettings] = useState<EngineSettings>({
    engine: "local_cpu",
    cpuThreads: 4,
    chunkSizeKb: 64,
    webGpuAvailable: false,
    ollamaEndpoint: "http://localhost:11434",
    ollamaModel: "llama3.2",
    cudaAccelerated: true,
    temperature: 0.2,
    maxFilesPerBatch: 50,
    useContentInspection: true,
    maxInspectionFileSizeMb: 500,
  });

  // Safety & Recursion Rules
  const [safety, setSafety] = useState<SafetySettings>({
    ignoreGit: true,
    ignoreNodeModules: true,
    ignoreBuildArtifacts: true,
    ignoreGameEngines: true,
    ignoreHiddenFiles: true,
    protectSystemDirs: true,
    conflictStrategy: "rename_numbered",
    dryRunFirst: true,
  });

  // Multi-Niche & Taxonomy State
  // Default to Unconventional Polymath, allowing user to activate multiple personas (e.g. Polymath + Musician)
  const [activeNiches, setActiveNiches] = useState<NicheProfileId[]>(["unconventional_polymath"]);
  const [categories, setCategories] = useState<CategoryWhitelistItem[]>(() =>
    getCombinedCategories(["unconventional_polymath"])
  );
  const [namingPattern, setNamingPattern] = useState<NamingPatternType>(
    NICHE_PROFILES.unconventional_polymath.defaultNamingPattern
  );

  // Ingested Files & Organization Plan
  const [scannedFiles, setScannedFiles] = useState<ScannedFile[]>([]);
  const [sourceName, setSourceName] = useState<string>("");
  const [organizationPlan, setOrganizationPlan] = useState<OrganizationPlanItem[]>([]);
  const [duplicates, setDuplicates] = useState<DuplicateGroup[]>([]);

  // Telemetry & State
  const [telemetry, setTelemetry] = useState<ProcessingTelemetry>({
    isProcessing: false,
    processedCount: 0,
    totalCount: 0,
    bytesProcessed: 0,
    totalBytes: 0,
    throughputMbps: 0,
    elapsedMs: 0,
    estimatedRemainingMs: 0,
    activeEngine: "local_cpu",
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // History & Undo Records
  const [history, setHistory] = useState<HistoryRecord[]>(() => {
    try {
      const saved = localStorage.getItem("ai_file_sorter_history");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Modal Controls
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isTaxonomyOpen, setIsTaxonomyOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [isSuggestedDirectoriesOpen, setIsSuggestedDirectoriesOpen] = useState(false);
  const [previewItem, setPreviewItem] = useState<OrganizationPlanItem | null>(null);

  // Detect WebGPU hardware on mount
  useEffect(() => {
    const checkGpu = async () => {
      const isAvailable = localEngine.getWebGpuStatus();
      setEngineSettings(prev => ({
        ...prev,
        webGpuAvailable: isAvailable,
      }));
    };
    checkGpu();
  }, []);

  // Save history to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("ai_file_sorter_history", JSON.stringify(history));
    } catch {
      // Ignore storage error
    }
  }, [history]);

  // Discover emerging directory recommendations for scattered files
  const suggestedDirectories = useMemo(() => {
    if (organizationPlan.length === 0) return [];
    return discoverSuggestedDirectories(organizationPlan, categories);
  }, [organizationPlan, categories]);

  // Execute Classification Routine with optional explicit taxonomy config
  const runClassification = useCallback(async (
    filesToProcess: ScannedFile[],
    overrideCategories?: CategoryWhitelistItem[],
    overridePattern?: NamingPatternType
  ) => {
    if (filesToProcess.length === 0) return;

    const activeCats = overrideCategories || categories;
    const activePat = overridePattern || namingPattern;

    setErrorMessage(null);
    const startTime = performance.now();
    const totalBytes = filesToProcess.reduce((a, b) => a + b.size, 0);

    setTelemetry({
      isProcessing: true,
      processedCount: 0,
      totalCount: filesToProcess.length,
      bytesProcessed: 0,
      totalBytes,
      throughputMbps: 0,
      elapsedMs: 0,
      estimatedRemainingMs: 0,
      activeEngine: engineSettings.engine,
    });

    try {
      let results: OrganizationPlanItem[] = [];

      if (engineSettings.engine === "cloud_gemini") {
        // Cloud Gemini 3.8 Flash Backend with graceful Local CPU fallback if high demand / 503 occurs
        try {
          results = await sortFilesWithGemini(filesToProcess, activeCats, activePat);
        } catch (geminiErr: unknown) {
          console.warn("Cloud Gemini temporarily unavailable, falling back to Local Engine:", geminiErr);
          results = await localEngine.processBatch(
            filesToProcess,
            engineSettings,
            activeCats,
            activePat,
            (count, item, bytes) => {
              const elapsed = performance.now() - startTime;
              const mbps = bytes && elapsed > 0 ? (bytes / (1024 * 1024)) / (elapsed / 1000) : 0;
              setTelemetry(prev => ({
                ...prev,
                processedCount: count,
                bytesProcessed: bytes || 0,
                currentFilename: item?.proposedFilename,
                throughputMbps: Number(mbps.toFixed(1)),
                elapsedMs: Math.round(elapsed),
              }));
            }
          );
          const rawErrMsg = geminiErr instanceof Error ? geminiErr.message : String(geminiErr);
          setErrorMessage(
            `Cloud AI is temporarily experiencing high demand (${rawErrMsg}). Files were automatically organized using our High-Speed Local Engine so your workflow continues seamlessly.`
          );
        }
      } else if (engineSettings.engine === "local_ollama_cuda") {
        // Local CUDA Ollama Backend with graceful CPU fallback
        try {
          results = await sortFilesWithOllama(
            filesToProcess,
            activeCats,
            activePat,
            engineSettings.ollamaEndpoint,
            engineSettings.ollamaModel
          );
        } catch (ollamaErr: unknown) {
          console.warn("Ollama unavailable, falling back to Local CPU Engine:", ollamaErr);
          results = await localEngine.processBatch(
            filesToProcess,
            engineSettings,
            activeCats,
            activePat
          );
          setErrorMessage("Local CUDA Ollama was unreachable. Automatically sorted using High-Performance Local CPU Engine.");
        }
      } else {
        // Local CPU or WebGPU accelerated engine
        results = await localEngine.processBatch(
          filesToProcess,
          engineSettings,
          activeCats,
          activePat,
          (count, item, bytes) => {
            const elapsed = performance.now() - startTime;
            const mbps = bytes && elapsed > 0 ? (bytes / (1024 * 1024)) / (elapsed / 1000) : 0;
            setTelemetry(prev => ({
              ...prev,
              processedCount: count,
              bytesProcessed: bytes || 0,
              currentFilename: item?.proposedFilename,
              throughputMbps: Number(mbps.toFixed(1)),
              elapsedMs: Math.round(elapsed),
            }));
          }
        );
      }

      setOrganizationPlan(results);
      const detectedDups = detectDuplicates(results);
      setDuplicates(detectedDups);

      const totalElapsed = performance.now() - startTime;
      const finalMbps = (totalBytes / (1024 * 1024)) / (totalElapsed / 1000);

      setTelemetry(prev => ({
        ...prev,
        isProcessing: false,
        processedCount: filesToProcess.length,
        throughputMbps: Number(finalMbps.toFixed(1)),
        elapsedMs: Math.round(totalElapsed),
      }));
    } catch (err: unknown) {
      console.error("Classification error:", err);
      setErrorMessage(err instanceof Error ? err.message : "Failed to organize files");
      setTelemetry(prev => ({ ...prev, isProcessing: false }));
    }
  }, [engineSettings, categories, namingPattern]);

  // Handler when toggling a Niche Persona on/off (multi-selection)
  const handleToggleNiche = (nicheId: NicheProfileId) => {
    setActiveNiches(prev => {
      let next: NicheProfileId[];
      if (prev.includes(nicheId)) {
        if (prev.length === 1) {
          setToastMessage(`At least one niche archetype must remain active.`);
          setTimeout(() => setToastMessage(null), 3000);
          return prev;
        }
        next = prev.filter(id => id !== nicheId);
      } else {
        next = [...prev, nicheId];
      }

      // Combine categories across all active niches while preserving custom categories
      const customCats = categories.filter(c => c.isCustom);
      const combined = getCombinedCategories(next, customCats);
      setCategories(combined);

      const names = next.map(id => NICHE_PROFILES[id]?.name.split("&")[0].trim()).join(" + ");
      setToastMessage(`Active Archetypes: ${names} (${combined.length} rules). Re-classifying...`);
      setTimeout(() => setToastMessage(null), 4000);

      if (scannedFiles.length > 0) {
        runClassification(scannedFiles, combined, namingPattern);
      }

      return next;
    });
  };

  const handleSetAllNiches = (niches: NicheProfileId[]) => {
    const target = niches.length === 0 ? (["unconventional_polymath"] as NicheProfileId[]) : niches;
    setActiveNiches(target);
    const customCats = categories.filter(c => c.isCustom);
    const combined = getCombinedCategories(target, customCats);
    setCategories(combined);

    const names = target.map(id => NICHE_PROFILES[id]?.name.split("&")[0].trim()).join(" + ");
    setToastMessage(`Active Archetypes: ${names} (${combined.length} rules). Re-classifying...`);
    setTimeout(() => setToastMessage(null), 4000);

    if (scannedFiles.length > 0) {
      runClassification(scannedFiles, combined, namingPattern);
    }
  };

  // Handler to apply an AI Suggested Directory recommendation
  const handleApplySuggestedDirectory = (suggestion: SuggestedDirectory) => {
    const { updatedPlan, updatedCategories, countMoved } = applySuggestedDirectory(
      suggestion,
      organizationPlan,
      categories
    );
    setOrganizationPlan(updatedPlan);
    setCategories(updatedCategories);
    setToastMessage(`Adopted directory "${suggestion.folderPath}" and relocated ${countMoved} files!`);
    setTimeout(() => setToastMessage(null), 4500);
  };

  // Handler to add a custom category & directory rule
  const handleAddCustomCategory = (newCat: CategoryWhitelistItem) => {
    const updatedCats = [...categories, newCat];
    setCategories(updatedCats);
    setToastMessage(`Created new directory rule "${newCat.name}" (📁 ${newCat.targetFolder})`);
    setTimeout(() => setToastMessage(null), 4000);
    if (scannedFiles.length > 0) {
      runClassification(scannedFiles, updatedCats, namingPattern);
    }
  };

  // Handler when new files or folder ingested
  const handleFilesLoaded = (files: ScannedFile[], name: string) => {
    setScannedFiles(files);
    setSourceName(name);
    runClassification(files);
  };

  // Handler to update a single item's proposed path or name
  const handleUpdateItem = (updated: OrganizationPlanItem) => {
    setOrganizationPlan(prev => prev.map(item => item.id === updated.id ? updated : item));
  };

  // Batch status update
  const handleBatchUpdateStatus = (ids: string[], status: OrganizationPlanItem["status"]) => {
    const idSet = new Set(ids);
    setOrganizationPlan(prev =>
      prev.map(item => idSet.has(item.id) ? { ...item, status } : item)
    );
  };

  // Duplicate resolution actions
  const handleResolveDuplicates = (action: "isolate" | "rename" | "exclude") => {
    setOrganizationPlan(prev => {
      const copyMap = new Map<string, number>();

      return prev.map(item => {
        const hash = item.file.hash;
        if (!hash) return item;

        const group = duplicates.find(d => d.hash === hash);
        if (!group) return item;

        const isOriginal = item.id === group.suggestedKeepId;
        if (isOriginal) return item;

        if (action === "isolate") {
          return {
            ...item,
            proposedFolderPath: "_duplicates",
            fullDestinationPath: `_duplicates/${item.proposedFilename}`,
            reasoning: `Identical binary duplicate of ${group.suggestedKeepId}. Isolated to _duplicates/ folder.`,
            isDuplicate: true,
          };
        } else if (action === "exclude") {
          return {
            ...item,
            status: "excluded",
            reasoning: "Excluded as redundant duplicate copy.",
            isDuplicate: true,
          };
        } else {
          // Rename with copy counter
          const count = (copyMap.get(hash) || 0) + 1;
          copyMap.set(hash, count);
          const ext = item.file.extension;
          const baseName = item.proposedFilename.replace(new RegExp(`\\${ext}$`), "");
          const newName = `${baseName}_copy${count}${ext}`;
          return {
            ...item,
            proposedFilename: newName,
            fullDestinationPath: `${item.proposedFolderPath}/${newName}`,
            reasoning: `Duplicate copy #${count} of original file.`,
            isDuplicate: true,
          };
        }
      });
    });

    setDuplicates([]);
  };

  // Save to audit history
  const handleSaveHistory = () => {
    if (organizationPlan.length === 0) return;

    const rollbackBash = generateRollbackBashScript(organizationPlan);
    const nicheSummary = activeNiches.map(id => NICHE_PROFILES[id]?.name.split("&")[0].trim()).join(" + ");
    const newRecord: HistoryRecord = {
      id: `session_${Date.now()}`,
      timestamp: Date.now(),
      summary: `Organized ${organizationPlan.length} files from ${sourceName || "workspace"} (${nicheSummary})`,
      totalFiles: organizationPlan.filter(i => i.status !== "excluded").length,
      items: organizationPlan.map(i => ({
        originalPath: i.originalPath,
        destinationPath: i.fullDestinationPath,
      })),
      rollbackScriptBash: rollbackBash,
      rollbackScriptPowerShell: rollbackBash,
    };

    setHistory(prev => [newRecord, ...prev.slice(0, 20)]);
  };

  // Reset workspace
  const handleReset = () => {
    setScannedFiles([]);
    setOrganizationPlan([]);
    setDuplicates([]);
    setSourceName("");
    setErrorMessage(null);
  };

  // Export CSV Report Manifest
  const handleExportCsv = () => {
    if (organizationPlan.length === 0) return;
    try {
      const result = downloadCsvManifest(organizationPlan, sourceName || "workspace");
      setToastMessage(`Exported CSV manifest for ${result.rowCount} files (${result.filename})`);
      setTimeout(() => setToastMessage(null), 4500);
    } catch (err: unknown) {
      console.error("Export CSV error:", err);
      setErrorMessage("Failed to export CSV report manifest.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white transition-colors duration-200">
      {/* Top Navbar */}
      <Navbar
        engineSettings={engineSettings}
        activeNiches={activeNiches}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenTaxonomy={() => setIsTaxonomyOpen(true)}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenTutorial={() => setIsTutorialOpen(true)}
        onReset={handleReset}
        activeFileCount={organizationPlan.length}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode(prev => !prev)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Notification banner */}
        {errorMessage && (
          <div className={`p-4 rounded-2xl flex items-start justify-between gap-3 text-xs animate-fade-in ${
            organizationPlan.length > 0
              ? "bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-amber-900 dark:text-amber-200"
              : "bg-rose-50 dark:rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-900 dark:text-rose-200"
          }`}>
            <div className="flex items-start gap-2.5">
              <AlertCircle className={`w-4 h-4 shrink-0 mt-0.5 ${
                organizationPlan.length > 0 ? "text-amber-600 dark:text-amber-400" : "text-rose-600 dark:text-rose-400"
              }`} />
              <div>
                <span className="font-semibold">{organizationPlan.length > 0 ? "Engine Fallback Notice:" : "Notice:"}</span> {errorMessage}
              </div>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className={`font-medium transition cursor-pointer ${
                organizationPlan.length > 0 ? "text-amber-600 dark:text-amber-400 hover:text-amber-800" : "text-rose-500 dark:text-rose-400 hover:text-rose-700"
              }`}
            >
              Dismiss
            </button>
          </div>
        )}

        {/* View Switch: File Scanner Dropzone vs Review Workspace */}
        {scannedFiles.length === 0 ? (
          <FileScanner
            onFilesLoaded={handleFilesLoaded}
            safety={safety}
            onUpdateSafety={setSafety}
            engineSettings={engineSettings}
            onOpenTutorial={() => setIsTutorialOpen(true)}
          />
        ) : (
          <div className="space-y-6 animate-fade-in">
            {/* Top Workspace Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-base text-slate-900 dark:text-white">
                    Reviewing Organization Plan: {sourceName}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-mono text-xs font-semibold border border-indigo-100 dark:border-indigo-800">
                    {scannedFiles.length} files scanned
                  </span>
                  {activeNiches.map(id => (
                    <span key={id} className="px-2.5 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-sans text-xs font-semibold border border-purple-100 dark:border-purple-800 flex items-center gap-1">
                      <span>
                        {id === "unconventional_polymath" ? "🧠" : id === "independent_musician" ? "🎸" : id === "digital_creator" ? "💼" : id === "academic_scholar" ? "🔬" : id === "studio_artist" ? "🎨" : "📁"}
                      </span>
                      <span>{NICHE_PROFILES[id]?.name.split("&")[0].trim()}</span>
                    </span>
                  ))}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Inspect proposed destination folders, semantic reasoning, and suggested new directories before exporting.
                </p>
              </div>

              <div className="flex items-center gap-2.5">
                {/* Export CSV Report Button */}
                <div className="relative group">
                  <button
                    type="button"
                    id="export-csv-btn"
                    onClick={handleExportCsv}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-emerald-300 dark:border-emerald-700/70 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-xs font-semibold transition cursor-pointer shadow-xs"
                    title="Export CSV Report Manifest"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Export CSV Report</span>
                  </button>

                  {/* Floating Tooltip */}
                  <div className="pointer-events-none absolute right-0 top-full mt-2 z-50 hidden group-hover:flex flex-col items-center w-64 animate-fade-in">
                    <div className="w-2.5 h-2.5 bg-slate-900 rotate-45 -mb-1 shadow-xs" />
                    <div className="bg-slate-900 text-white text-xs rounded-xl py-2 px-3 shadow-xl border border-slate-800 text-center leading-relaxed">
                      <span className="font-semibold text-emerald-300 block mb-0.5">Export CSV Manifest</span>
                      Download an RFC 4180 spreadsheet report detailing all original filenames, target paths, categories, and AI reasoning.
                    </div>
                  </div>
                </div>

                {/* Load Different Folder Button */}
                <div className="relative group">
                  <button
                    type="button"
                    id="reset-scan-btn"
                    onClick={handleReset}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold transition cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Load Different Folder
                  </button>

                  {/* Floating Tooltip */}
                  <div className="pointer-events-none absolute right-0 top-full mt-2 z-50 hidden group-hover:flex flex-col items-center w-64 animate-fade-in">
                    <div className="w-2.5 h-2.5 bg-slate-900 rotate-45 -mb-1 shadow-xs" />
                    <div className="bg-slate-900 text-white text-xs rounded-xl py-2 px-3 shadow-xl border border-slate-800 text-center leading-relaxed">
                      <span className="font-semibold text-slate-200 block mb-0.5">Clear Workspace</span>
                      Clears the current organization plan and returns to the file scanner screen to select a new folder or files.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Interactive Review Workspace (Table / Tree, Multi-Niche Selector & Suggested Directories) */}
            <ReviewWorkspace
              items={organizationPlan}
              duplicates={duplicates}
              categories={categories}
              activeNiches={activeNiches}
              onToggleNiche={handleToggleNiche}
              onOpenTaxonomy={() => setIsTaxonomyOpen(true)}
              suggestedDirectories={suggestedDirectories}
              onOpenSuggestedDirectories={() => setIsSuggestedDirectoriesOpen(true)}
              onApplySuggestedDirectory={handleApplySuggestedDirectory}
              onUpdateItem={handleUpdateItem}
              onBatchUpdateStatus={handleBatchUpdateStatus}
              onResolveDuplicates={handleResolveDuplicates}
              onPreviewItem={(item) => setPreviewItem(item)}
              onReclassify={() => runClassification(scannedFiles)}
              isProcessing={telemetry.isProcessing}
            />

            {/* Execution & Multi-Platform Export Panel */}
            <ExecutionPanel
              items={organizationPlan}
              telemetry={telemetry}
              engineSettings={engineSettings}
              safety={safety}
              onReclassify={() => runClassification(scannedFiles)}
              onSaveHistory={handleSaveHistory}
            />
          </div>
        )}
      </main>

      {/* Modals */}
      <EngineSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={engineSettings}
        onSaveSettings={(newSettings) => {
          setEngineSettings(newSettings);
          if (scannedFiles.length > 0) {
            runClassification(scannedFiles);
          }
        }}
      />

      <TaxonomyEditor
        isOpen={isTaxonomyOpen}
        onClose={() => setIsTaxonomyOpen(false)}
        categories={categories}
        onSaveCategories={(newCats) => {
          setCategories(newCats);
          if (scannedFiles.length > 0) {
            runClassification(scannedFiles, newCats, namingPattern);
          }
        }}
        namingPattern={namingPattern}
        onChangeNamingPattern={(pat) => {
          setNamingPattern(pat);
          if (scannedFiles.length > 0) {
            runClassification(scannedFiles, categories, pat);
          }
        }}
        activeNiches={activeNiches}
        onToggleNiche={handleToggleNiche}
        onSetAllNiches={handleSetAllNiches}
        onOpenSuggestedDirectories={() => setIsSuggestedDirectoriesOpen(true)}
      />

      <SuggestedDirectoriesModal
        isOpen={isSuggestedDirectoriesOpen}
        onClose={() => setIsSuggestedDirectoriesOpen(false)}
        suggestions={suggestedDirectories}
        items={organizationPlan}
        currentCategories={categories}
        onApplySuggestion={handleApplySuggestedDirectory}
        onAddCustomCategory={handleAddCustomCategory}
      />

      <HistoryRollbackModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        onClearHistory={() => setHistory([])}
      />

      <FilePreviewModal
        item={previewItem}
        onClose={() => setPreviewItem(null)}
      />

      <GuideModal
        isOpen={isTutorialOpen}
        onClose={() => setIsTutorialOpen(false)}
        onLaunchDemoPreset={(presetId) => {
          const preset = SAMPLE_PRESETS.find(p => p.id === presetId);
          if (preset) {
            handleFilesLoaded(preset.files, preset.name);
          }
        }}
      />

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-slate-900/95 dark:bg-slate-800/95 text-white shadow-2xl border border-slate-700 dark:border-slate-600 flex items-center gap-3 text-xs backdrop-blur-md animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-medium">{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="ml-2 text-slate-400 hover:text-white cursor-pointer text-sm font-bold"
            title="Dismiss"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}
