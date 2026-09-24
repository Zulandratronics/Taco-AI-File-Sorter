import React, { useRef, useState } from "react";
import { 
  FolderUp, 
  UploadCloud, 
  Sparkles, 
  ShieldCheck, 
  HardDrive, 
  Play, 
  Layers, 
  AlertTriangle, 
  BookOpen, 
  HelpCircle, 
  Info 
} from "lucide-react";
import { ScannedFile, SafetySettings, EngineSettings } from "../types";
import { parseUploadedFiles } from "../services/fileScanner";
import { SAMPLE_PRESETS } from "../services/sampleFiles";

interface FileScannerProps {
  onFilesLoaded: (files: ScannedFile[], sourceName: string) => void;
  safety: SafetySettings;
  onUpdateSafety: (safety: SafetySettings) => void;
  engineSettings: EngineSettings;
  onOpenTutorial: () => void;
}

export const FileScanner: React.FC<FileScannerProps> = ({
  onFilesLoaded,
  safety,
  onUpdateSafety,
  engineSettings,
  onOpenTutorial,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState("");
  const [pickerNotice, setPickerNotice] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setIsScanning(true);
      setScanStatus(`Reading ${e.dataTransfer.files.length} items...`);
      const parsed = await parseUploadedFiles(e.dataTransfer.files, safety, (count, current) => {
        setScanStatus(`Scanning (${count} files): ${current}`);
      });
      setIsScanning(false);
      onFilesLoaded(parsed, "Dropped Files");
    }
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setIsScanning(true);
      const parsed = await parseUploadedFiles(e.target.files, safety, (count, current) => {
        setScanStatus(`Scanning (${count} files): ${current}`);
      });
      setIsScanning(false);
      onFilesLoaded(parsed, "Selected Files");
    }
  };

  const handleFolderInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setIsScanning(true);
      const firstPath = (e.target.files[0] as any).webkitRelativePath || "";
      const folderName = firstPath.split("/")[0] || "Selected Folder";
      const parsed = await parseUploadedFiles(e.target.files, safety, (count, current) => {
        setScanStatus(`Scanning (${count} files): ${current}`);
      });
      setIsScanning(false);
      onFilesLoaded(parsed, folderName);
    }
  };

  const handleLoadSample = (presetId: string) => {
    const preset = SAMPLE_PRESETS.find(p => p.id === presetId);
    if (preset) {
      onFilesLoaded(preset.files, preset.name);
    }
  };

  // HTML5 File System Access API & standard webkitdirectory fallback
  const handleNativeFolderPicker = async () => {
    setPickerNotice(null);
    try {
      if (folderInputRef.current) {
        folderInputRef.current.click();
        return;
      }

      if ("showDirectoryPicker" in window) {
        const dirHandle = await (window as any).showDirectoryPicker({ mode: "read" });
        setIsScanning(true);
        setScanStatus(`Scanning directory: ${dirHandle.name}...`);
        
        const files: File[] = [];
        async function readDir(entry: any, path = "") {
          for await (const [, handle] of entry.entries()) {
            if (handle.kind === "file") {
              const file = await handle.getFile();
              Object.defineProperty(file, "webkitRelativePath", {
                value: path ? `${path}/${file.name}` : file.name,
                writable: true,
              });
              files.push(file);
            } else if (handle.kind === "directory") {
              const subPath = path ? `${path}/${handle.name}` : handle.name;
              if (!handle.name.startsWith(".") && handle.name !== "node_modules") {
                await readDir(handle, subPath);
              }
            }
          }
        }
        await readDir(dirHandle);
        const parsed = await parseUploadedFiles(files, safety);
        setIsScanning(false);
        onFilesLoaded(parsed, dirHandle.name);
      }
    } catch (err: any) {
      setIsScanning(false);
      if (err?.name !== "AbortError") {
        console.warn("Folder picker error:", err);
        setPickerNotice("Tip: In some sandboxed browsers, choose 'Select Files' (Ctrl+A / Cmd+A in any folder) or drag and drop your folder directly!");
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Quick Tutorial Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-850 dark:to-slate-900 border border-indigo-100 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs transition-colors">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-indigo-600 text-white shadow-sm shadow-indigo-200 dark:shadow-none">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-xs text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span>First time organizing files?</span>
              <span className="text-[10px] uppercase font-semibold px-2 py-0.2 rounded bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">
                Easy Guide
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Learn how AI File Sorter categorizes documents, detects duplicate copies, and exports clean folder structures.
            </p>
          </div>
        </div>

        <button
          type="button"
          id="open-tutorial-banner-btn"
          onClick={onOpenTutorial}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 text-indigo-600 dark:text-indigo-400 text-xs font-semibold shadow-xs transition shrink-0 cursor-pointer"
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Open Tutorial & Walkthrough</span>
        </button>
      </div>

      {/* Hero / Upload Dropzone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center transition-all bg-gradient-to-b ${
          isDragging
            ? "border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30 scale-[1.005] shadow-lg shadow-indigo-100 dark:shadow-none"
            : "border-slate-300 dark:border-slate-750 hover:border-indigo-400 bg-white/70 dark:bg-slate-900/70 hover:bg-slate-50/50 dark:hover:bg-slate-850/50 shadow-sm"
        }`}
      >
        <input
          type="file"
          multiple
          ref={fileInputRef}
          onChange={handleFileInputChange}
          className="hidden"
        />
        <input
          type="file"
          // @ts-ignore
          webkitdirectory=""
          // @ts-ignore
          directory=""
          multiple
          ref={folderInputRef}
          onChange={handleFolderInputChange}
          className="hidden"
        />

        <div className="max-w-md mx-auto space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto shadow-inner">
            <UploadCloud className="w-8 h-8 animate-pulse" />
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              Drag & drop unorganized files or folders here
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Supports documents, images, code, receipts, invoices, videos, and multi-gigabyte archives.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              id="choose-folder-btn"
              type="button"
              onClick={handleNativeFolderPicker}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-md shadow-indigo-200 dark:shadow-none transition active:scale-95 cursor-pointer"
            >
              <FolderUp className="w-4 h-4" />
              Select Target Folder
            </button>

            <button
              id="choose-files-btn"
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-semibold border border-slate-200 dark:border-slate-700 shadow-sm transition active:scale-95 cursor-pointer"
            >
              <HardDrive className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              Select Files
            </button>
          </div>

          {pickerNotice && (
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-850 text-amber-800 dark:text-amber-300 text-xs text-left animate-fade-in flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>{pickerNotice}</div>
            </div>
          )}

          {isScanning && (
            <div className="pt-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-xs font-medium border border-blue-200 dark:border-blue-800 animate-pulse">
                <div className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
                {scanStatus || "Scanning file contents & calculating hashes..."}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Preset Clutter Sandboxes for Instant Testing */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 transition-colors">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Instant 1-Click Demo Sandboxes (Automated Test)
            </span>
          </div>
          <span className="text-xs text-slate-400 dark:text-slate-500">Click any preset to see the sorting pipeline in action instantly</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {SAMPLE_PRESETS.map((preset) => (
            <div
              key={preset.id}
              onClick={() => handleLoadSample(preset.id)}
              className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-600 hover:bg-indigo-50/40 dark:hover:bg-slate-800 bg-slate-50/50 dark:bg-slate-850/40 cursor-pointer transition flex items-start justify-between gap-3 group"
            >
              <div className="space-y-1">
                <div className="font-semibold text-sm text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 flex items-center gap-1.5">
                  <span>{preset.name}</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  {preset.description}
                </p>
              </div>
              <button
                type="button"
                className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600 transition shrink-0"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Safeguards & Safety Toggles */}
      <div className="p-5 rounded-2xl bg-slate-50/80 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 text-xs transition-colors">
        <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-bold uppercase tracking-wider">
          <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>Safety Safeguards & Recursive Scan Rules</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-1">
          <label className="flex items-center gap-2 text-slate-700 dark:text-slate-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={safety.ignoreGit}
              onChange={(e) => onUpdateSafety({ ...safety, ignoreGit: e.target.checked })}
              className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
            />
            <span>Protect .git / .github repos</span>
          </label>

          <label className="flex items-center gap-2 text-slate-700 dark:text-slate-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={safety.ignoreNodeModules}
              onChange={(e) => onUpdateSafety({ ...safety, ignoreNodeModules: e.target.checked })}
              className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
            />
            <span>Skip node_modules & vendor</span>
          </label>

          <label className="flex items-center gap-2 text-slate-700 dark:text-slate-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={safety.ignoreGameEngines}
              onChange={(e) => onUpdateSafety({ ...safety, ignoreGameEngines: e.target.checked })}
              className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
            />
            <span>Protect Unity & Unreal assets</span>
          </label>

          <label className="flex items-center gap-2 text-slate-700 dark:text-slate-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={safety.ignoreBuildArtifacts}
              onChange={(e) => onUpdateSafety({ ...safety, ignoreBuildArtifacts: e.target.checked })}
              className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
            />
            <span>Skip build / dist / target outputs</span>
          </label>

          <label className="flex items-center gap-2 text-slate-700 dark:text-slate-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={safety.ignoreHiddenFiles}
              onChange={(e) => onUpdateSafety({ ...safety, ignoreHiddenFiles: e.target.checked })}
              className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
            />
            <span>Ignore hidden files & .DS_Store</span>
          </label>

          <label className="flex items-center gap-2 text-slate-700 dark:text-slate-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={safety.dryRunFirst}
              onChange={(e) => onUpdateSafety({ ...safety, dryRunFirst: e.target.checked })}
              className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
            />
            <span>Require Dry-Run Review First</span>
          </label>
        </div>
      </div>
    </div>
  );
};
