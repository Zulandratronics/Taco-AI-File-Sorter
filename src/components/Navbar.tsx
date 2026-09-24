import React from "react";
import { 
  FolderTree, 
  Cpu, 
  Zap, 
  Settings, 
  History, 
  FolderSearch, 
  ShieldCheck, 
  Sparkles, 
  BookOpen, 
  HelpCircle,
  Sun,
  Moon,
  BrainCircuit
} from "lucide-react";
import { BackendEngineType, EngineSettings, NicheProfileId } from "../types";
import { NICHE_PROFILES } from "../data/nicheProfiles";

interface NavbarProps {
  engineSettings: EngineSettings;
  activeNiches: NicheProfileId[];
  onOpenSettings: () => void;
  onOpenTaxonomy: () => void;
  onOpenHistory: () => void;
  onOpenTutorial: () => void;
  onReset: () => void;
  activeFileCount: number;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  engineSettings,
  activeNiches,
  onOpenSettings,
  onOpenTaxonomy,
  onOpenHistory,
  onOpenTutorial,
  onReset,
  activeFileCount,
  isDarkMode,
  onToggleDarkMode,
}) => {
  const getEngineBadge = () => {
    switch (engineSettings.engine) {
      case "local_cpu":
        return {
          icon: <Cpu className="w-3.5 h-3.5 text-blue-500" />,
          label: `Local CPU (${engineSettings.cpuThreads} threads)`,
          sub: "Zero latency • High-throughput SIMD",
          color: "border-blue-200 dark:border-blue-900/60 bg-blue-50/80 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300",
        };
      case "local_webgpu":
        return {
          icon: <Zap className="w-3.5 h-3.5 text-amber-500" />,
          label: "WebGPU Shader Acceleration",
          sub: "Hardware GPU Compute Active",
          color: "border-amber-200 dark:border-amber-900/60 bg-amber-50/80 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300",
        };
      case "local_ollama_cuda":
        return {
          icon: <Zap className="w-3.5 h-3.5 text-emerald-500" />,
          label: `Local CUDA / Ollama (${engineSettings.ollamaModel})`,
          sub: "NVIDIA GPU Local Inference",
          color: "border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300",
        };
      case "cloud_gemini":
        return {
          icon: <Sparkles className="w-3.5 h-3.5 text-indigo-500" />,
          label: "Cloud Gemini 3.8 Flash",
          sub: "Multimodal Vision & Semantics",
          color: "border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/80 dark:bg-indigo-950/40 text-indigo-800 dark:text-indigo-300",
        };
    }
  };

  const badge = getEngineBadge();

  return (
    <header className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand & Title */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={onReset}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-200 dark:shadow-none">
            <FolderTree className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg text-slate-900 dark:text-white tracking-tight">AI File Sorter</span>
              <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                v2.0 Local & CUDA
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
              Content-aware file organization, intelligent renaming & deduplication
            </p>
          </div>
        </div>

        {/* Engine Status Pill */}
        <button
          onClick={onOpenSettings}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition hover:shadow-sm cursor-pointer ${badge.color}`}
          title="Click to configure Local CPU, WebGPU, or CUDA / Ollama hardware settings"
        >
          {badge.icon}
          <div className="text-left">
            <div className="font-semibold leading-none">{badge.label}</div>
            <div className="text-[10px] opacity-75 leading-tight hidden md:block">{badge.sub}</div>
          </div>
        </button>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Theme Toggle (Dark / Light) */}
          <button
            id="theme-toggle-btn"
            type="button"
            onClick={onToggleDarkMode}
            className="p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 transition cursor-pointer"
            title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            aria-label="Toggle Dark Mode"
          >
            {isDarkMode ? (
              <Sun className="w-4 h-4 text-amber-400 animate-fade-in" />
            ) : (
              <Moon className="w-4 h-4 text-slate-600 animate-fade-in" />
            )}
          </button>

          <button
            id="nav-guide-btn"
            onClick={onOpenTutorial}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 rounded-lg border border-indigo-200 dark:border-indigo-800 transition cursor-pointer"
            title="How to Use & Tutorial Walkthrough"
          >
            <BookOpen className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span className="hidden sm:inline">Guide & Tutorial</span>
          </button>

          <button
            id="nav-niche-btn"
            onClick={onOpenTaxonomy}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-purple-700 dark:text-purple-300 bg-purple-50/80 dark:bg-purple-950/60 hover:bg-purple-100 dark:hover:bg-purple-900/60 rounded-lg border border-purple-200 dark:border-purple-800 transition cursor-pointer shadow-2xs"
            title={`Active Archetypes: ${activeNiches.map(id => NICHE_PROFILES[id]?.name.split('&')[0].trim()).join(', ')}. Click to configure multi-niche taxonomy.`}
          >
            <BrainCircuit className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
            <span className="hidden lg:inline">{activeNiches.length > 1 ? `Niches (${activeNiches.length}):` : "Niche:"}</span>
            <span>
              {activeNiches.length === 0
                ? "Select Niche"
                : activeNiches.length === 1
                ? NICHE_PROFILES[activeNiches[0]]?.name.split("&")[0].trim()
                : activeNiches
                    .slice(0, 2)
                    .map(id => {
                      switch (id) {
                        case "unconventional_polymath": return "Polymath";
                        case "independent_musician": return "Musician";
                        case "digital_creator": return "Creator";
                        case "academic_scholar": return "Scholar";
                        case "studio_artist": return "Artist";
                        case "general_productivity": return "Office";
                        default: return "";
                      }
                    })
                    .join(" + ") + (activeNiches.length > 2 ? ` +${activeNiches.length - 2}` : "")}
            </span>
          </button>

          <button
            id="nav-taxonomy-btn"
            onClick={onOpenTaxonomy}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 transition cursor-pointer"
          >
            <FolderSearch className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <span className="hidden sm:inline">Taxonomy & Rules</span>
          </button>

          <button
            id="nav-history-btn"
            onClick={onOpenHistory}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 transition cursor-pointer"
          >
            <History className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <span className="hidden sm:inline">Audit Logs</span>
          </button>

          <button
            id="nav-settings-btn"
            onClick={onOpenSettings}
            className="p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 transition cursor-pointer"
            title="Hardware & Engine Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};

