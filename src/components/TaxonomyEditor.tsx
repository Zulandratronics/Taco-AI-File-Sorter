import React, { useState, useEffect } from "react";
import { 
  X, 
  FolderPlus, 
  Trash2, 
  Plus, 
  FolderTree, 
  Check, 
  FileText, 
  HelpCircle, 
  Edit2,
  Sparkles,
  Lightbulb,
  BrainCircuit,
  Music,
  FolderKanban,
  GraduationCap,
  Palette,
  Zap,
  CheckSquare,
  Square,
  Layers
} from "lucide-react";
import { CategoryWhitelistItem, NamingPatternType, NicheProfileId } from "../types";
import { DEFAULT_CATEGORY_WHITELIST } from "../data/defaultTaxonomy";
import { NICHE_PROFILES, getCombinedCategories } from "../data/nicheProfiles";

interface TaxonomyEditorProps {
  isOpen: boolean;
  onClose: () => void;
  categories: CategoryWhitelistItem[];
  onSaveCategories: (categories: CategoryWhitelistItem[]) => void;
  namingPattern: NamingPatternType;
  onChangeNamingPattern: (pattern: NamingPatternType) => void;
  activeNiches: NicheProfileId[];
  onToggleNiche: (nicheId: NicheProfileId) => void;
  onSetAllNiches?: (niches: NicheProfileId[]) => void;
  onOpenSuggestedDirectories?: () => void;
}

export const TaxonomyEditor: React.FC<TaxonomyEditorProps> = ({
  isOpen,
  onClose,
  categories,
  onSaveCategories,
  namingPattern,
  onChangeNamingPattern,
  activeNiches,
  onToggleNiche,
  onSetAllNiches,
  onOpenSuggestedDirectories,
}) => {
  const [list, setList] = useState<CategoryWhitelistItem[]>(categories);
  const [newCatName, setNewCatName] = useState("");
  const [newCatFolder, setNewCatFolder] = useState("");
  const [newCatKeywords, setNewCatKeywords] = useState("");
  const [newCatExts, setNewCatExts] = useState("");

  // Sync internal list whenever prop categories changes
  useEffect(() => {
    setList(categories);
  }, [categories]);

  if (!isOpen) return null;

  const handleToggleCard = (nicheId: NicheProfileId) => {
    onToggleNiche(nicheId);
  };

  const handleSelectSolo = (nicheId: NicheProfileId) => {
    if (onSetAllNiches) {
      onSetAllNiches([nicheId]);
    } else {
      // Toggle all off except this one
      for (const id of activeNiches) {
        if (id !== nicheId) onToggleNiche(id);
      }
      if (!activeNiches.includes(nicheId)) {
        onToggleNiche(nicheId);
      }
    }
    const profile = NICHE_PROFILES[nicheId];
    if (profile) {
      onChangeNamingPattern(profile.defaultNamingPattern);
    }
  };

  const handleSelectAllNiches = () => {
    const all = Object.keys(NICHE_PROFILES) as NicheProfileId[];
    if (onSetAllNiches) {
      onSetAllNiches(all);
    } else {
      for (const id of all) {
        if (!activeNiches.includes(id)) onToggleNiche(id);
      }
    }
  };

  const handleAddCategory = () => {
    if (!newCatName.trim() || !newCatFolder.trim()) return;

    const newItem: CategoryWhitelistItem = {
      id: `custom_${Date.now()}`,
      name: newCatName.trim(),
      targetFolder: newCatFolder.trim(),
      keywords: newCatKeywords.split(",").map(k => k.trim()).filter(Boolean),
      extensions: newCatExts.split(",").map(e => e.trim().startsWith(".") ? e.trim() : `.${e.trim()}`).filter(Boolean),
      isCustom: true,
    };

    setList([...list, newItem]);
    setNewCatName("");
    setNewCatFolder("");
    setNewCatKeywords("");
    setNewCatExts("");
  };

  const handleDeleteCategory = (id: string) => {
    setList(list.filter(c => c.id !== id));
  };

  const handleResetDefaults = () => {
    const customCats = list.filter(c => c.isCustom);
    const combined = getCombinedCategories(activeNiches, customCats);
    setList(combined);
  };

  const handleSave = () => {
    onSaveCategories(list);
    onClose();
  };

  const getNicheIcon = (iconName: string) => {
    switch (iconName) {
      case "BrainCircuit": return <BrainCircuit className="w-4 h-4 text-purple-500" />;
      case "Music": return <Music className="w-4 h-4 text-rose-500" />;
      case "FolderKanban": return <FolderKanban className="w-4 h-4 text-blue-500" />;
      case "Zap": return <Zap className="w-4 h-4 text-amber-500" />;
      case "GraduationCap": return <GraduationCap className="w-4 h-4 text-emerald-500" />;
      case "Palette": return <Palette className="w-4 h-4 text-violet-500" />;
      default: return <BrainCircuit className="w-4 h-4 text-indigo-500" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden transition-colors">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-850/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900">
              <FolderTree className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>Taxonomy Whitelist & Niche Archetypes</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 font-semibold border border-purple-200 dark:border-purple-800">
                  {activeNiches.length} Active {activeNiches.length === 1 ? "Niche" : "Niches"}
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Activate multiple archetypes simultaneously to combine their rules into a unified filing system
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

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm text-slate-700 dark:text-slate-300">
          {/* Niche Archetype Multi-Toggle Selector */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50/60 via-purple-50/30 to-slate-50/60 dark:from-slate-850 dark:via-indigo-950/20 dark:to-slate-850 border border-indigo-100 dark:border-slate-800 space-y-3.5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <BrainCircuit className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <label className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                  Niche Mindset & Taxonomy Archetypes (Multi-Toggle)
                </label>
              </div>

              {/* Quick Select Presets */}
              <div className="flex items-center gap-1.5 text-[11px]">
                <span className="text-slate-400 hidden md:inline">Quick Combos:</span>
                <button
                  type="button"
                  onClick={() => {
                    if (onSetAllNiches) {
                      onSetAllNiches(["unconventional_polymath", "independent_musician"]);
                    } else {
                      handleSelectSolo("unconventional_polymath");
                      onToggleNiche("independent_musician");
                    }
                  }}
                  className="px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-900/60 hover:bg-purple-200 dark:hover:bg-purple-800/80 text-purple-900 dark:text-purple-200 font-medium transition cursor-pointer border border-purple-200 dark:border-purple-800"
                >
                  🧠 + 🎸 Polymath & Musician
                </button>
                <button
                  type="button"
                  onClick={handleSelectAllNiches}
                  className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium transition cursor-pointer border border-slate-200 dark:border-slate-700"
                >
                  Select All
                </button>
              </div>
            </div>

            {/* Grid of 6 Niche Cards with Interactive Toggle Switches */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {Object.values(NICHE_PROFILES).map((profile) => {
                const isActive = activeNiches.includes(profile.id);
                return (
                  <div
                    key={profile.id}
                    className={`p-3 rounded-xl border text-left transition relative flex flex-col justify-between ${
                      isActive
                        ? "border-purple-500/80 dark:border-purple-500 bg-white dark:bg-slate-800 shadow-sm ring-2 ring-purple-500/20"
                        : "border-slate-200 dark:border-slate-750 bg-white/70 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-lg ${isActive ? "bg-purple-50 dark:bg-purple-950/60" : "bg-slate-100 dark:bg-slate-750"}`}>
                          {getNicheIcon(profile.iconName)}
                        </div>
                        <div>
                          <div className="text-xs font-bold leading-tight text-slate-900 dark:text-slate-100">
                            {profile.name}
                          </div>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                            {profile.categories.length} categories
                          </span>
                        </div>
                      </div>

                      {/* Toggle Checkbox Button */}
                      <button
                        type="button"
                        onClick={() => handleToggleCard(profile.id)}
                        className={`p-1 rounded-md transition cursor-pointer shrink-0 ${
                          isActive
                            ? "text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100"
                            : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                        }`}
                        title={isActive ? "Deactivate archetype" : "Activate archetype"}
                      >
                        {isActive ? (
                          <CheckSquare className="w-4 h-4" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                    </div>

                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed mb-2.5">
                      {profile.description}
                    </p>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-750/70 text-[10px]">
                      <button
                        type="button"
                        onClick={() => handleToggleCard(profile.id)}
                        className={`font-semibold cursor-pointer ${
                          isActive ? "text-purple-600 dark:text-purple-400" : "text-slate-500 hover:text-purple-600"
                        }`}
                      >
                        {isActive ? "● Active in Taxonomy" : "○ Inactive (Click to activate)"}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSelectSolo(profile.id)}
                        className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 underline cursor-pointer"
                        title="Deactivate other archetypes and activate only this one"
                      >
                        Solo
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Multi-Niche Summary Banner */}
            <div className="p-3 rounded-xl bg-white/90 dark:bg-slate-800/90 border border-purple-100/70 dark:border-slate-750 text-xs text-slate-600 dark:text-slate-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-bold text-slate-900 dark:text-slate-100">
                    Combined Active Taxonomy:
                  </span>
                  {activeNiches.map(id => (
                    <span 
                      key={id}
                      className="px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-semibold border border-purple-200 dark:border-purple-800 text-[10px] flex items-center gap-1"
                    >
                      <span>{NICHE_PROFILES[id]?.name.split("&")[0].trim()}</span>
                      {activeNiches.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleToggleCard(id)}
                          className="hover:text-purple-900 dark:hover:text-white cursor-pointer ml-0.5"
                          title="Remove this niche"
                        >
                          ×
                        </button>
                      )}
                    </span>
                  ))}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {list.length} categories merged seamlessly. Files will be sorted across all activated disciplines with zero conflict.
                </p>
              </div>

              {onOpenSuggestedDirectories && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenSuggestedDirectories();
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-semibold transition shrink-0 cursor-pointer shadow-xs"
                >
                  <Lightbulb className="w-3.5 h-3.5" />
                  <span>Discover New Directories</span>
                </button>
              )}
            </div>
          </div>

          {/* Naming Pattern Selector */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-750 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Standard Filename Pattern
              </label>
              <span className="text-xs text-indigo-600 dark:text-indigo-400 font-mono">
                {namingPattern === "date_category_name" && "2024-03-14_Invoice_Stripe_Receipt.pdf"}
                {namingPattern === "category_date_name" && "Invoice_2024-03-14_Stripe_Receipt.pdf"}
                {namingPattern === "kebab_case" && "2024-03-14-stripe-receipt.pdf"}
                {namingPattern === "snake_case" && "2024_03_14_stripe_receipt.pdf"}
                {namingPattern === "original_clean" && "Stripe_Receipt.pdf"}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {[
                { id: "date_category_name", label: "[Date]_[Category]_[Name]", sub: "ISO standard date prefix" },
                { id: "category_date_name", label: "[Category]_[Date]_[Name]", sub: "Category folder alignment" },
                { id: "kebab_case", label: "kebab-case-clean.ext", sub: "Web & developer clean" },
                { id: "snake_case", label: "snake_case_clean.ext", sub: "Python & data engineering" },
                { id: "original_clean", label: "Original_Name_Cleaned.ext", sub: "Keeps base title without date" },
              ].map(pat => (
                <button
                  key={pat.id}
                  type="button"
                  onClick={() => onChangeNamingPattern(pat.id as NamingPatternType)}
                  className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                    namingPattern === pat.id
                      ? "border-indigo-600 bg-white dark:bg-slate-800 shadow-xs ring-2 ring-indigo-500/20 text-slate-900 dark:text-slate-100"
                      : "border-slate-200 dark:border-slate-750 bg-white/70 dark:bg-slate-800/60 hover:bg-white dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-semibold">{pat.label}</span>
                    {namingPattern === pat.id && <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />}
                  </div>
                  <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{pat.sub}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Active Categories List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Active Categories & Target Directory Folders ({list.length})
              </label>
              <button
                type="button"
                onClick={handleResetDefaults}
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
              >
                Reset to Combined Archetype Defaults
              </button>
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {list.map((cat) => (
                <div
                  key={cat.id}
                  className="p-3 rounded-xl border border-slate-200 dark:border-slate-750 bg-slate-50/70 dark:bg-slate-850/70 hover:bg-white dark:hover:bg-slate-800 transition flex items-start justify-between gap-3"
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-slate-900 dark:text-slate-100 text-xs">{cat.name}</span>
                      <span className="text-[11px] font-mono text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-md border border-indigo-100 dark:border-indigo-900">
                        📁 {cat.targetFolder}/
                      </span>
                      {cat.isCustom && (
                        <span className="text-[10px] bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 px-1.5 py-0.2 rounded border border-amber-200 dark:border-amber-800">
                          Custom
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-3 flex-wrap">
                      <div>
                        <span className="font-semibold text-slate-600 dark:text-slate-300">Keywords:</span> {cat.keywords.slice(0, 6).join(", ")}
                        {cat.keywords.length > 6 && ` (+${cat.keywords.length - 6} more)`}
                      </div>
                      <div>
                        <span className="font-semibold text-slate-600 dark:text-slate-300">Exts:</span> {cat.extensions.join(", ")}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteCategory(cat.id)}
                    className="p-1 text-slate-400 hover:text-rose-500 rounded transition cursor-pointer"
                    title="Remove category"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Add Custom Category Row */}
          <div className="p-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-850/50 space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200">
              <Plus className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Define New Target Directory & Matching Rule</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <input
                type="text"
                value={newCatName}
                onChange={e => setNewCatName(e.target.value)}
                placeholder="Category Name (e.g., Live Performance Stems)"
                className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
              <input
                type="text"
                value={newCatFolder}
                onChange={e => setNewCatFolder(e.target.value)}
                placeholder="Target Directory (e.g., Audio/Live_Stems)"
                className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono"
              />
              <input
                type="text"
                value={newCatKeywords}
                onChange={e => setNewCatKeywords(e.target.value)}
                placeholder="Keywords comma-separated (e.g., live, stage, playback)"
                className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newCatExts}
                  onChange={e => setNewCatExts(e.target.value)}
                  placeholder="Extensions (e.g., .wav, .als)"
                  className="flex-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono"
                />
                <button
                  type="button"
                  onClick={handleAddCategory}
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition cursor-pointer"
                >
                  Add Rule
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50 flex items-center justify-between">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Changes apply to newly organized files immediately.
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-200 dark:shadow-none transition cursor-pointer"
            >
              Apply Taxonomy & Save Rules
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
