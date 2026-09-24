import React, { useState } from "react";
import { 
  Download, 
  Terminal, 
  FileCode2, 
  FolderCheck, 
  Cpu, 
  Zap, 
  RotateCcw, 
  CheckCircle2, 
  Layers, 
  Sparkles, 
  HardDrive, 
  Gauge 
} from "lucide-react";
import { 
  OrganizationPlanItem, 
  EngineSettings, 
  SafetySettings, 
  ProcessingTelemetry 
} from "../types";
import { createOrganizedZip, triggerDownload } from "../services/zipService";
import { generateBashScript, generatePowerShellScript } from "../services/scriptGenerator";
import { formatBytes } from "../services/fileScanner";

interface ExecutionPanelProps {
  items: OrganizationPlanItem[];
  telemetry: ProcessingTelemetry;
  engineSettings: EngineSettings;
  safety: SafetySettings;
  onReclassify: () => void;
  onSaveHistory: () => void;
}

export const ExecutionPanel: React.FC<ExecutionPanelProps> = ({
  items,
  telemetry,
  engineSettings,
  safety,
  onReclassify,
  onSaveHistory,
}) => {
  const [isZipping, setIsZipping] = useState(false);
  const [zipProgress, setZipProgress] = useState(0);
  const [zipStatus, setZipStatus] = useState("");

  const activeItems = items.filter(i => i.status !== "excluded");
  const totalBytes = activeItems.reduce((acc, i) => acc + i.file.size, 0);

  const handleDownloadZip = async () => {
    try {
      setIsZipping(true);
      const zipBlob = await createOrganizedZip(items, (percent, status) => {
        setZipProgress(percent);
        setZipStatus(status);
      });
      triggerDownload(zipBlob, `organized_files_${Date.now()}.zip`);
      onSaveHistory();
      setIsZipping(false);
    } catch (err) {
      setIsZipping(false);
      console.error(err);
    }
  };

  const handleDownloadBashScript = () => {
    const script = generateBashScript(items, safety);
    const blob = new Blob([script], { type: "text/x-shellscript" });
    triggerDownload(blob, "organize.sh");
    onSaveHistory();
  };

  const handleDownloadPowerShellScript = () => {
    const script = generatePowerShellScript(items, safety);
    const blob = new Blob([script], { type: "text/plain" });
    triggerDownload(blob, "organize.ps1");
    onSaveHistory();
  };

  return (
    <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-6 transition-colors">
      {/* Telemetry & Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-1">
          <div className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
            <FolderCheck className="w-3.5 h-3.5 text-indigo-500" />
            <span>Files to Organize</span>
          </div>
          <div className="text-lg font-bold text-slate-900 dark:text-white">
            {activeItems.length} <span className="text-xs text-slate-400 dark:text-slate-500 font-normal">/ {items.length}</span>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-1">
          <div className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
            <HardDrive className="w-3.5 h-3.5 text-blue-500" />
            <span>Total Volume</span>
          </div>
          <div className="text-lg font-bold text-slate-900 dark:text-white">
            {formatBytes(totalBytes)}
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-1">
          <div className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
            <Gauge className="w-3.5 h-3.5 text-emerald-500" />
            <span>Hardware Engine</span>
          </div>
          <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
            {engineSettings.engine === "local_cpu" && `CPU (${engineSettings.cpuThreads} Cores)`}
            {engineSettings.engine === "local_webgpu" && "WebGPU Shader"}
            {engineSettings.engine === "local_ollama_cuda" && `CUDA (${engineSettings.ollamaModel})`}
            {engineSettings.engine === "cloud_gemini" && "Gemini 3.8 Flash"}
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-1">
          <div className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-amber-500" />
            <span>Buffer Protection</span>
          </div>
          <div className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
            {engineSettings.chunkSizeKb}KB Stream Safe
          </div>
        </div>
      </div>

      {/* Progress Bar if Zipping or Sorting */}
      {isZipping && (
        <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 space-y-2 animate-fade-in">
          <div className="flex items-center justify-between text-xs font-semibold text-indigo-900 dark:text-indigo-200">
            <span>{zipStatus || "Packaging organized directory structure..."}</span>
            <span>{zipProgress}%</span>
          </div>
          <div className="w-full h-2 bg-indigo-200 dark:bg-indigo-900 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-600 rounded-full transition-all duration-300"
              style={{ width: `${zipProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Execution Actions */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onReclassify}
            disabled={telemetry.isProcessing}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold shadow-xs transition cursor-pointer"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${telemetry.isProcessing ? "animate-spin" : ""}`} />
            Re-run Classification
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Download Bash script for local Linux / macOS execution */}
          <button
            type="button"
            id="download-bash-btn"
            onClick={handleDownloadBashScript}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-700 dark:border-slate-600 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
            title="Download organize.sh shell script for native terminal execution"
          >
            <Terminal className="w-3.5 h-3.5 text-emerald-400" />
            <span>Download organize.sh</span>
          </button>

          {/* Download PowerShell script for Windows execution */}
          <button
            type="button"
            id="download-ps1-btn"
            onClick={handleDownloadPowerShellScript}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-blue-800 dark:border-blue-700 bg-blue-900 hover:bg-blue-800 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
            title="Download organize.ps1 PowerShell script for Windows execution"
          >
            <FileCode2 className="w-3.5 h-3.5 text-blue-300" />
            <span>Download organize.ps1</span>
          </button>

          {/* Download complete organized ZIP package */}
          <button
            type="button"
            id="download-zip-btn"
            onClick={handleDownloadZip}
            disabled={isZipping || activeItems.length === 0}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-md shadow-indigo-200 dark:shadow-none transition active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Download Organized ZIP</span>
          </button>
        </div>
      </div>
    </div>
  );
};
