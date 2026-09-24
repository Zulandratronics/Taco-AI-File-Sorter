import React, { useState, useEffect } from "react";
import { 
  X, 
  Cpu, 
  Zap, 
  Sparkles, 
  Server, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Sliders, 
  Layers, 
  ShieldAlert 
} from "lucide-react";
import { EngineSettings, BackendEngineType } from "../types";
import { checkOllamaAvailability, OllamaModelInfo } from "../services/ollamaService";

interface EngineSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: EngineSettings;
  onSaveSettings: (newSettings: EngineSettings) => void;
}

export const EngineSettingsModal: React.FC<EngineSettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
}) => {
  const [formData, setFormData] = useState<EngineSettings>(settings);
  const [checkingOllama, setCheckingOllama] = useState(false);
  const [ollamaStatus, setOllamaStatus] = useState<{
    tested: boolean;
    available: boolean;
    models: OllamaModelInfo[];
    error?: string;
  }>({ tested: false, available: false, models: [] });

  useEffect(() => {
    setFormData(settings);
  }, [settings, isOpen]);

  if (!isOpen) return null;

  const handleTestOllama = async () => {
    setCheckingOllama(true);
    const res = await checkOllamaAvailability(formData.ollamaEndpoint);
    setOllamaStatus({
      tested: true,
      available: res.available,
      models: res.models,
      error: res.error,
    });
    if (res.available && res.models.length > 0 && !res.models.some(m => m.name === formData.ollamaModel)) {
      setFormData(prev => ({ ...prev, ollamaModel: res.models[0].name }));
    }
    setCheckingOllama(false);
  };

  const handleSave = () => {
    onSaveSettings(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden transition-colors">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-850/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Inference & Hardware Settings</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Configure Local CPU threads, CUDA GPU acceleration & streaming chunk size</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm text-slate-700 dark:text-slate-300">
          {/* Engine Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
              Primary Inference Engine
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Local CPU */}
              <div
                onClick={() => setFormData(p => ({ ...p, engine: "local_cpu" }))}
                className={`p-3.5 rounded-xl border-2 cursor-pointer transition flex flex-col justify-between ${
                  formData.engine === "local_cpu"
                    ? "border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 text-slate-900 dark:text-slate-100"
                    : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-850 text-slate-700 dark:text-slate-300"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-md bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300">
                      <Cpu className="w-4 h-4" />
                    </div>
                    <span className="font-semibold text-sm">Local CPU Engine</span>
                  </div>
                  {formData.engine === "local_cpu" && (
                    <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                  Fast local token analysis, rule heuristics & chunked streaming. Zero latency.
                </p>
              </div>

              {/* WebGPU Hardware */}
              <div
                onClick={() => setFormData(p => ({ ...p, engine: "local_webgpu" }))}
                className={`p-3.5 rounded-xl border-2 cursor-pointer transition flex flex-col justify-between ${
                  formData.engine === "local_webgpu"
                    ? "border-amber-500 bg-amber-50/50 dark:bg-amber-950/40 text-slate-900 dark:text-slate-100"
                    : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-850 text-slate-700 dark:text-slate-300"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-md bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300">
                      <Zap className="w-4 h-4" />
                    </div>
                    <span className="font-semibold text-sm">WebGPU Compute</span>
                  </div>
                  {formData.engine === "local_webgpu" && (
                    <CheckCircle2 className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                  In-browser GPU hardware shaders for fast vector taxonomy matching.
                </p>
              </div>

              {/* Local CUDA / Ollama */}
              <div
                onClick={() => setFormData(p => ({ ...p, engine: "local_ollama_cuda" }))}
                className={`p-3.5 rounded-xl border-2 cursor-pointer transition flex flex-col justify-between ${
                  formData.engine === "local_ollama_cuda"
                    ? "border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/40 text-slate-900 dark:text-slate-100"
                    : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-850 text-slate-700 dark:text-slate-300"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-md bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300">
                      <Server className="w-4 h-4" />
                    </div>
                    <span className="font-semibold text-sm">CUDA / Ollama (Local)</span>
                  </div>
                  {formData.engine === "local_ollama_cuda" && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                  Connects to your local NVIDIA GPU (Ollama / vLLM / LM Studio).
                </p>
              </div>

              {/* Cloud Gemini */}
              <div
                onClick={() => setFormData(p => ({ ...p, engine: "cloud_gemini" }))}
                className={`p-3.5 rounded-xl border-2 cursor-pointer transition flex flex-col justify-between ${
                  formData.engine === "cloud_gemini"
                    ? "border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 text-slate-900 dark:text-slate-100"
                    : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-850 text-slate-700 dark:text-slate-300"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-md bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <span className="font-semibold text-sm">Gemini 3.8 Flash</span>
                  </div>
                  {formData.engine === "cloud_gemini" && (
                    <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                  Full multimodal visual content analysis and deep contextual reasoning.
                </p>
              </div>
            </div>
          </div>

          {/* Local CPU Thread Concurrency */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-750 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                <span className="font-semibold text-slate-800 dark:text-slate-200">CPU Thread Concurrency</span>
              </div>
              <span className="px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 font-mono text-xs font-bold">
                {formData.cpuThreads} Threads
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Allocates CPU worker tasks to prevent UI locking during large batch sorting.
            </p>
            <input
              type="range"
              min={1}
              max={16}
              step={1}
              value={formData.cpuThreads}
              onChange={(e) => setFormData(p => ({ ...p, cpuThreads: Number(e.target.value) }))}
              className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="flex justify-between text-[10px] text-slate-400 dark:text-slate-500 font-mono">
              <span>1 Core (Power Save)</span>
              <span>4 Cores (Balanced)</span>
              <span>8 Cores (Fast)</span>
              <span>16 Cores (Max SIMD)</span>
            </div>
          </div>

          {/* Large File Stream Buffer Settings */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-750 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                <span className="font-semibold text-slate-800 dark:text-slate-200">Large-File Streaming Chunk Size</span>
              </div>
              <span className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-750 text-slate-800 dark:text-slate-200 font-mono text-xs font-bold">
                {formData.chunkSizeKb} KB
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Files are processed via rolling byte samples (head/middle/tail). Prevents out-of-memory errors on files &gt; 1GB.
            </p>
            <div className="grid grid-cols-3 gap-2">
              {[16, 64, 256].map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => setFormData(p => ({ ...p, chunkSizeKb: size }))}
                  className={`py-1.5 px-3 rounded-lg border text-xs font-medium transition cursor-pointer ${
                    formData.chunkSizeKb === size
                      ? "border-blue-600 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-semibold"
                      : "border-slate-200 dark:border-slate-750 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-750"
                  }`}
                >
                  {size} KB Sample
                </button>
              ))}
            </div>
          </div>

          {/* Local CUDA / Ollama Settings */}
          {formData.engine === "local_ollama_cuda" && (
            <div className="p-4 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Server className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                  <span className="font-semibold text-emerald-900 dark:text-emerald-300">CUDA / Ollama Endpoint</span>
                </div>
                <button
                  type="button"
                  onClick={handleTestOllama}
                  disabled={checkingOllama}
                  className="flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300 hover:text-emerald-800 px-2 py-1 rounded bg-emerald-100 dark:bg-emerald-900/60 hover:bg-emerald-200 transition cursor-pointer"
                >
                  <RefreshCw className={`w-3 h-3 ${checkingOllama ? "animate-spin" : ""}`} />
                  Test Connection
                </button>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-emerald-800 dark:text-emerald-300">Endpoint URL</label>
                <input
                  type="text"
                  value={formData.ollamaEndpoint}
                  onChange={(e) => setFormData(p => ({ ...p, ollamaEndpoint: e.target.value }))}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-emerald-300 dark:border-emerald-800 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="http://localhost:11434"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-emerald-800 dark:text-emerald-300">Selected Model</label>
                <input
                  type="text"
                  value={formData.ollamaModel}
                  onChange={(e) => setFormData(p => ({ ...p, ollamaModel: e.target.value }))}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-emerald-300 dark:border-emerald-800 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="llama3.2, mistral, gemma2, llava"
                />
              </div>

              {ollamaStatus.tested && (
                <div className={`p-2.5 rounded-lg text-xs flex items-start gap-2 ${
                  ollamaStatus.available
                    ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800"
                    : "bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-200 border border-rose-200 dark:border-rose-900"
                }`}>
                  {ollamaStatus.available ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold">CUDA GPU Local Server Connected!</span>
                        <div className="text-[11px] text-emerald-700 dark:text-emerald-300 mt-0.5">
                          Found {ollamaStatus.models.length} local model(s): {ollamaStatus.models.map(m => m.name).join(", ") || "None"}
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold">Connection Notice:</span>
                        <p className="text-[11px] text-rose-700 dark:text-rose-300 mt-0.5">
                          {ollamaStatus.error || "Could not connect to Ollama. Ensure Ollama is running (`ollama serve`). Fallback will use local CPU engine."}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-850/80 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-750 transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            id="save-settings-btn"
            onClick={handleSave}
            className="px-5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-200 dark:shadow-none transition cursor-pointer"
          >
            Apply Engine Configuration
          </button>
        </div>
      </div>
    </div>
  );
};
