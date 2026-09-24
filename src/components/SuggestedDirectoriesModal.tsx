import React, { useState } from "react";
import { 
  FolderPlus, 
  Sparkles, 
  X, 
  Check, 
  FolderTree, 
  ArrowRight, 
  Layers, 
  Plus, 
  FileText,
  Tag,
  CheckCircle2,
  Lightbulb,
  ExternalLink
} from "lucide-react";
import { SuggestedDirectory, OrganizationPlanItem, CategoryWhitelistItem } from "../types";
import { formatBytes } from "../services/fileScanner";

interface SuggestedDirectoriesModalProps {
  isOpen: boolean;
  onClose: () => void;
  suggestions: SuggestedDirectory[];
  items: OrganizationPlanItem[];
  currentCategories: CategoryWhitelistItem[];
  onApplySuggestion: (suggestion: SuggestedDirectory) => void;
  onAddCustomCategory: (category: CategoryWhitelistItem) => void;
}

export const SuggestedDirectoriesModal: React.FC<SuggestedDirectoriesModalProps> = ({
  isOpen,
  onClose,
  suggestions,
  items,
  currentCategories,
  onApplySuggestion,
  onAddCustomCategory,
}) => {
  const [activeTab, setActiveTab] = useState<"ai_suggestions" | "custom_directory">("ai_suggestions");
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set());

  // Custom directory form state
  const [customFolder, setCustomFolder] = useState("");
  const [customName, setCustomName] = useState("");
  const [customKeywords, setCustomKeywords] = useState("");
  const [customExtensions, setCustomExtensions] = useState("");
  const [customSubcategories, setCustomSubcategories] = useState("");

  if (!isOpen) return null;

  const handleApply = (suggestion: SuggestedDirectory) => {
    onApplySuggestion(suggestion);
    setAppliedIds(prev => new Set([...prev, suggestion.id]));
  };

  const handleCreateCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customFolder.trim() || !customName.trim()) return;

    const keywords = customKeywords
      .split(/[,;\s]+/)
      .map(k => k.trim().toLowerCase())
      .filter(Boolean);

    const extensions = customExtensions
      .split(/[,;\s]+/)
      .map(ext => ext.trim().toLowerCase())
      .filter(Boolean)
      .map(ext => ext.startsWith(".") ? ext : `.${ext}`);

    const subcategories = customSubcategories
      .split(/[,;]+/)
      .map(s => s.trim())
      .filter(Boolean);

    const newCategory: CategoryWhitelistItem = {
      id: `custom_${Date.now()}`,
      name: customName.trim(),
      targetFolder: customFolder.trim(),
      keywords: keywords.length > 0 ? keywords : [customName.trim().toLowerCase()],
      extensions: extensions.length > 0 ? extensions : [".pdf", ".md", ".txt"],
      subcategories: subcategories.length > 0 ? subcategories : ["General"],
      isCustom: true,
    };

    onAddCustomCategory(newCategory);
    setCustomFolder("");
    setCustomName("");
    setCustomKeywords("");
    setCustomExtensions("");
    setCustomSubcategories("");
    setActiveTab("ai_suggestions");
  };

  // Get item references for a suggestion
  const getMatchedItems = (matchedIds: string[]) => {
    const idSet = new Set(matchedIds);
    return items.filter(item => idSet.has(item.id));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden transition-colors">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-amber-50/70 via-white to-slate-50 dark:from-slate-900 dark:via-slate-850 dark:to-slate-900">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500 text-white shadow-md shadow-amber-200 dark:shadow-none">
              <Lightbulb className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  Suggested New Directories
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-mono text-[10px] font-bold border border-amber-200 dark:border-amber-800">
                  Smart Semantic Discovery
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Discovered thematic clusters for scattered polymath inquiries and unclassified files
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="px-6 pt-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3 bg-slate-50/50 dark:bg-slate-850/50">
          <button
            type="button"
            onClick={() => setActiveTab("ai_suggestions")}
            className={`pb-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition cursor-pointer ${
              activeTab === "ai_suggestions"
                ? "border-amber-500 text-amber-600 dark:text-amber-400"
                : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Discovered Directory Recommendations ({suggestions.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("custom_directory")}
            className={`pb-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition cursor-pointer ${
              activeTab === "custom_directory"
                ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <FolderPlus className="w-3.5 h-3.5" />
            <span>Create New Custom Directory</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1 text-sm text-slate-700 dark:text-slate-300">
          {activeTab === "ai_suggestions" ? (
            suggestions.length === 0 ? (
              <div className="text-center py-16 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
                  <Lightbulb className="w-6 h-6" />
                </div>
                <div className="font-bold text-slate-800 dark:text-slate-200">
                  All Files Cleanly Categorized
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                  No unclassified scattered clusters were detected with the active taxonomy. All files matched your rules with high confidence. You can also switch your Niche profile or create a custom directory at any time!
                </p>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab("custom_directory")}
                    className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-200 text-xs font-semibold transition cursor-pointer"
                  >
                    + Define a Custom Target Directory
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-3.5 rounded-2xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 text-xs text-amber-900 dark:text-amber-200 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                    <span>
                      Our semantic clustering engine identified <strong>{suggestions.length} emerging topic directories</strong> from your scattered files. Click <em>Adopt Directory</em> to auto-create the taxonomy rule and relocate the matching files!
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3.5">
                  {suggestions.map((suggestion) => {
                    const matchedItems = getMatchedItems(suggestion.matchedFileIds);
                    const isApplied = appliedIds.has(suggestion.id);

                    return (
                      <div
                        key={suggestion.id}
                        className={`p-4 rounded-2xl border transition-all ${
                          isApplied
                            ? "bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800/60"
                            : "bg-white dark:bg-slate-850 border-slate-200 dark:border-slate-750 hover:border-amber-300 dark:hover:border-amber-600/50 shadow-xs"
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                          <div className="space-y-1.5 flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                                {suggestion.categoryName}
                              </span>
                              <span className="px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-mono text-[11px] font-semibold">
                                {suggestion.folderPath}
                              </span>
                              <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-750 text-slate-600 dark:text-slate-300 text-[10px]">
                                {matchedItems.length} scattered file(s)
                              </span>
                            </div>

                            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                              {suggestion.reasoning}
                            </p>

                            {/* Matched files preview chips */}
                            <div className="pt-1.5 flex flex-wrap gap-1.5">
                              {matchedItems.slice(0, 4).map(item => (
                                <span
                                  key={item.id}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[11px] text-slate-700 dark:text-slate-300 font-mono truncate max-w-[200px]"
                                  title={item.originalName}
                                >
                                  <FileText className="w-3 h-3 text-slate-400 shrink-0" />
                                  <span className="truncate">{item.originalName}</span>
                                </span>
                              ))}
                              {matchedItems.length > 4 && (
                                <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[11px] text-slate-500 font-mono">
                                  +{matchedItems.length - 4} more
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="sm:shrink-0 pt-1">
                            {isApplied ? (
                              <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-xs font-semibold">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                <span>Adopted & Relocated!</span>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleApply(suggestion)}
                                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Adopt Directory & Relocate</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )
          ) : (
            /* Custom Directory Form */
            <form onSubmit={handleCreateCustom} className="space-y-4">
              <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-xs text-indigo-900 dark:text-indigo-200 leading-relaxed">
                Add a specialized directory and classification rule tailored to your niche. Any incoming files matching these keywords or extensions will be routed directly to this destination.
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Category Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={customName}
                    onChange={e => setCustomName(e.target.value)}
                    placeholder="e.g. Epistemic Manuscripts or 3D Prototypes"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Target Folder Path *
                  </label>
                  <input
                    type="text"
                    required
                    value={customFolder}
                    onChange={e => setCustomFolder(e.target.value)}
                    placeholder="e.g. Research/Epistemology or Lab/Hardware"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Keywords (comma separated)
                </label>
                <input
                  type="text"
                  value={customKeywords}
                  onChange={e => setCustomKeywords(e.target.value)}
                  placeholder="e.g. quantum, qubit, hamiltonian, simulation, zettel, solarpunk"
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <span className="text-[11px] text-slate-400">
                  Matches file names, metadata tags, and content snippets.
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Extensions (optional)
                  </label>
                  <input
                    type="text"
                    value={customExtensions}
                    onChange={e => setCustomExtensions(e.target.value)}
                    placeholder="e.g. .ipynb, .stl, .step, .glsl, .ino"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Subcategories (optional)
                  </label>
                  <input
                    type="text"
                    value={customSubcategories}
                    onChange={e => setCustomSubcategories(e.target.value)}
                    placeholder="e.g. Drafts, Active, Archive"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Directory & Add to Taxonomy</span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-850/80 flex items-center justify-between">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {appliedIds.size > 0 && (
              <span>Successfully added {appliedIds.size} new directory taxonomy rule(s).</span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-semibold bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 dark:hover:bg-slate-600 text-white transition cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
