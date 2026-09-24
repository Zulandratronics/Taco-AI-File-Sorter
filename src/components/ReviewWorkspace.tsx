import React, { useState, useMemo } from "react";
import { 
  FolderTree, 
  Table, 
  Search, 
  Filter, 
  CheckSquare, 
  Square, 
  Edit3, 
  Eye, 
  Sparkles, 
  AlertTriangle, 
  FileText, 
  Image as ImageIcon, 
  Music, 
  Video, 
  Code2, 
  Archive, 
  ArrowRight, 
  Copy, 
  FolderInput, 
  ChevronRight, 
  ChevronDown, 
  Check, 
  XCircle, 
  RotateCcw,
  FileSpreadsheet,
  BrainCircuit,
  Lightbulb,
  FolderPlus
} from "lucide-react";
import { 
  OrganizationPlanItem, 
  DuplicateGroup, 
  CategoryWhitelistItem, 
  NicheProfileId, 
  SuggestedDirectory 
} from "../types";
import { formatBytes } from "../services/fileScanner";
import { downloadCsvManifest } from "../services/csvExportService";
import { NICHE_PROFILES } from "../data/nicheProfiles";

interface ReviewWorkspaceProps {
  items: OrganizationPlanItem[];
  duplicates: DuplicateGroup[];
  categories: CategoryWhitelistItem[];
  activeNiches: NicheProfileId[];
  onToggleNiche: (nicheId: NicheProfileId) => void;
  onOpenTaxonomy?: () => void;
  suggestedDirectories: SuggestedDirectory[];
  onOpenSuggestedDirectories: () => void;
  onApplySuggestedDirectory: (suggestion: SuggestedDirectory) => void;
  onUpdateItem: (updated: OrganizationPlanItem) => void;
  onBatchUpdateStatus: (ids: string[], status: OrganizationPlanItem["status"]) => void;
  onResolveDuplicates: (action: "isolate" | "rename" | "exclude") => void;
  onPreviewItem: (item: OrganizationPlanItem) => void;
  onReclassify: () => void;
  isProcessing: boolean;
}

export const ReviewWorkspace: React.FC<ReviewWorkspaceProps> = ({
  items,
  duplicates,
  categories,
  activeNiches,
  onToggleNiche,
  onOpenTaxonomy,
  suggestedDirectories,
  onOpenSuggestedDirectories,
  onApplySuggestedDirectory,
  onUpdateItem,
  onBatchUpdateStatus,
  onResolveDuplicates,
  onPreviewItem,
  onReclassify,
  isProcessing,
}) => {
  const [viewMode, setViewMode] = useState<"table" | "tree">("table");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>("all");
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>("all");
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editFolder, setEditFolder] = useState("");
  const [editName, setEditName] = useState("");

  // Filter items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch = 
        item.originalName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.proposedFilename.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.proposedFolderPath.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.reasoning.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCat = selectedCategoryFilter === "all" || item.proposedCategory === selectedCategoryFilter;
      const matchesType = selectedTypeFilter === "all" || item.file.type === selectedTypeFilter;

      return matchesSearch && matchesCat && matchesType;
    });
  }, [items, searchQuery, selectedCategoryFilter, selectedTypeFilter]);

  // Unique categories in plan
  const activeCategories = useMemo(() => {
    return Array.from(new Set(items.map(i => i.proposedCategory)));
  }, [items]);

  // Select all / Deselect all
  const handleToggleSelectAll = () => {
    if (selectedItemIds.size === filteredItems.length) {
      setSelectedItemIds(new Set());
    } else {
      setSelectedItemIds(new Set(filteredItems.map(i => i.id)));
    }
  };

  const handleToggleSelectItem = (id: string) => {
    const next = new Set(selectedItemIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedItemIds(next);
  };

  const startEditing = (item: OrganizationPlanItem) => {
    setEditingItemId(item.id);
    setEditFolder(item.proposedFolderPath);
    setEditName(item.proposedFilename);
  };

  const saveEditing = (item: OrganizationPlanItem) => {
    const updatedFolder = editFolder.trim() || item.proposedFolderPath;
    const updatedName = editName.trim() || item.proposedFilename;
    const fullPath = `${updatedFolder.replace(/\/+$/, "")}/${updatedName.replace(/^\/+/, "")}`;

    onUpdateItem({
      ...item,
      proposedFolderPath: updatedFolder,
      proposedFilename: updatedName,
      fullDestinationPath: fullPath,
      isModifiedManually: true,
    });
    setEditingItemId(null);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "image": return <ImageIcon className="w-3.5 h-3.5 text-blue-500" />;
      case "audio": return <Music className="w-3.5 h-3.5 text-amber-500" />;
      case "video": return <Video className="w-3.5 h-3.5 text-rose-500" />;
      case "code": return <Code2 className="w-3.5 h-3.5 text-emerald-500" />;
      case "archive": return <Archive className="w-3.5 h-3.5 text-purple-500" />;
      default: return <FileText className="w-3.5 h-3.5 text-slate-500" />;
    }
  };

  // Build Tree for Proposed Structure
  const treeData = useMemo(() => {
    const tree: Record<string, OrganizationPlanItem[]> = {};
    for (const item of filteredItems) {
      const folder = item.proposedFolderPath || "Root";
      if (!tree[folder]) tree[folder] = [];
      tree[folder].push(item);
    }
    return tree;
  }, [filteredItems]);

  // Quick folders for inline edit
  const quickFolderOptions = useMemo(() => {
    const options = new Set<string>();
    for (const sug of suggestedDirectories) {
      options.add(sug.folderPath);
    }
    for (const cat of categories) {
      options.add(cat.targetFolder);
    }
    return Array.from(options).slice(0, 6);
  }, [suggestedDirectories, categories]);

  return (
    <div className="space-y-4">
      {/* Duplicate Warning Banner */}
      {duplicates.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-amber-900 dark:text-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm transition-colors">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300">
              <Copy className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-sm">
                Detected {duplicates.length} duplicate file group(s) ({duplicates.reduce((acc, d) => acc + d.files.length - 1, 0)} redundant copies)
              </div>
              <p className="text-xs text-amber-700 dark:text-amber-400">
                Exact binary matches discovered via streaming cryptographic hash sampling.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onResolveDuplicates("isolate")}
              className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-sm transition cursor-pointer"
            >
              Move Copies to _duplicates/
            </button>
            <button
              onClick={() => onResolveDuplicates("exclude")}
              className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-slate-700 text-xs font-semibold transition cursor-pointer"
            >
              Exclude Copies
            </button>
          </div>
        </div>
      )}

      {/* Suggested New Directories Banner */}
      {suggestedDirectories.length > 0 && (
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-50 via-amber-50/60 to-white dark:from-amber-950/40 dark:via-slate-900 dark:to-slate-900 border border-amber-200/90 dark:border-amber-800/60 text-amber-950 dark:text-amber-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-xs transition-colors">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 shrink-0">
              <Lightbulb className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-xs flex items-center gap-1.5 flex-wrap">
                <span>Discovered {suggestedDirectories.length} Emerging Directory Recommendation{suggestedDirectories.length > 1 ? "s" : ""}</span>
                <span className="text-[10px] px-2 py-0.2 rounded-full bg-amber-200/70 dark:bg-amber-900/80 text-amber-900 dark:text-amber-300 font-semibold">
                  Polymath Thematic Clustering
                </span>
              </div>
              <p className="text-[11px] text-amber-800 dark:text-amber-400">
                Found scattered files that cluster into new specialized folders. 1-click adopt to route them cleanly!
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {suggestedDirectories.slice(0, 2).map((sug) => (
              <button
                key={sug.id}
                type="button"
                onClick={() => onApplySuggestedDirectory(sug)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-slate-700 text-[11px] font-semibold transition cursor-pointer shadow-2xs"
                title={sug.reasoning}
              >
                <FolderPlus className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                <span>+ Adopt "{sug.categoryName.split("&")[0].trim()}" ({sug.matchedFileIds.length})</span>
              </button>
            ))}
            <button
              type="button"
              onClick={onOpenSuggestedDirectories}
              className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-semibold transition cursor-pointer shadow-xs"
            >
              Explore All ({suggestedDirectories.length})
            </button>
          </div>
        </div>
      )}

      {/* Control Bar: Filters, Search & Views */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 transition-colors">
        {/* Multi-Niche Toggle Cluster & Search */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-2.5 flex-1">
          {/* Multi-Niche Toggle Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1 mr-0.5">
              <BrainCircuit className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
              <span className="hidden sm:inline">Niches:</span>
            </span>

            {Object.values(NICHE_PROFILES).map((p) => {
              const isActive = activeNiches.includes(p.id);
              const icon = 
                p.id === "unconventional_polymath" ? "🧠" : 
                p.id === "independent_musician" ? "🎸" : 
                p.id === "digital_creator" ? "💼" : 
                p.id === "academic_scholar" ? "🔬" : 
                p.id === "studio_artist" ? "🎨" : "📁";
              
              const shortLabel = 
                p.id === "unconventional_polymath" ? "Polymath" :
                p.id === "independent_musician" ? "Musician" :
                p.id === "digital_creator" ? "Creator" :
                p.id === "academic_scholar" ? "Scholar" :
                p.id === "studio_artist" ? "Artist" : "Office";

              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onToggleNiche(p.id)}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer shadow-2xs ${
                    isActive
                      ? "bg-purple-100 dark:bg-purple-950/80 text-purple-950 dark:text-purple-200 border border-purple-300 dark:border-purple-700 ring-1 ring-purple-400/30"
                      : "bg-slate-100/80 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 opacity-60 hover:opacity-100"
                  }`}
                  title={`${isActive ? "Active (click to deactivate)" : "Inactive (click to activate)"}: ${p.name}`}
                >
                  <span>{icon}</span>
                  <span>{shortLabel}</span>
                  {isActive && <Check className="w-3 h-3 text-purple-700 dark:text-purple-300 ml-0.5" />}
                </button>
              );
            })}

            {onOpenTaxonomy && (
              <button
                type="button"
                onClick={onOpenTaxonomy}
                className="text-[11px] text-purple-600 dark:text-purple-400 hover:underline px-1 py-0.5 ml-0.5 cursor-pointer font-medium"
                title="View & Edit Combined Taxonomy Rules"
              >
                Rules...
              </button>
            )}
          </div>

          {/* Search */}
          <div className="relative flex-1 min-w-[180px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Filter by filename, folder, or keyword reasoning..."
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Filters & Actions */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Category Dropdown */}
          <select
            value={selectedCategoryFilter}
            onChange={e => setSelectedCategoryFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Categories ({items.length})</option>
            {activeCategories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          {/* Type Dropdown */}
          <select
            value={selectedTypeFilter}
            onChange={e => setSelectedTypeFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All File Types</option>
            <option value="document">Documents & Papers</option>
            <option value="image">Images & 3D Renders</option>
            <option value="audio">Audio & Synthesizers</option>
            <option value="video">Videos & Footage</option>
            <option value="code">Source Code & Notebooks</option>
            <option value="archive">Archives & Hardware PCBs</option>
            <option value="data">Data & Measurements</option>
          </select>

          {/* Suggested Directories modal button */}
          <button
            type="button"
            onClick={onOpenSuggestedDirectories}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-amber-300 dark:border-amber-700/60 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/60 font-semibold transition cursor-pointer shadow-xs"
            title="Discover AI Suggested New Directories for scattered files"
          >
            <Lightbulb className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span className="hidden sm:inline">Suggested Directories</span>
            <span className="px-1.5 py-0.2 rounded-full bg-amber-200/80 dark:bg-amber-900/80 text-amber-900 dark:text-amber-200 font-mono text-[10px]">
              {suggestedDirectories.length}
            </span>
          </button>

          {/* Export View CSV button */}
          <button
            type="button"
            onClick={() => {
              const toExport = selectedItemIds.size > 0 
                ? items.filter(i => selectedItemIds.has(i.id))
                : filteredItems;
              downloadCsvManifest(toExport, "manifest_export");
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-emerald-300 dark:border-emerald-700/60 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 font-medium transition cursor-pointer shadow-xs"
            title="Download CSV report manifest"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>

          {/* View Mode Toggle */}
          <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded-lg transition cursor-pointer ${
                viewMode === "table" ? "bg-white dark:bg-slate-700 shadow-xs text-indigo-600 dark:text-indigo-400 font-bold" : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
              title="Table Grid View"
            >
              <Table className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("tree")}
              className={`p-1.5 rounded-lg transition cursor-pointer ${
                viewMode === "tree" ? "bg-white dark:bg-slate-700 shadow-xs text-indigo-600 dark:text-indigo-400 font-bold" : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
              title="Folder Hierarchy Tree View"
            >
              <FolderTree className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Batch Selection Action Bar if items selected */}
      {selectedItemIds.size > 0 && (
        <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200 flex items-center justify-between text-xs animate-fade-in transition-colors">
          <div className="font-semibold flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px]">
              {selectedItemIds.size}
            </span>
            <span>Items Selected</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onBatchUpdateStatus(Array.from(selectedItemIds), "approved")}
              className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition cursor-pointer"
            >
              Approve All Selected
            </button>
            <button
              onClick={() => onBatchUpdateStatus(Array.from(selectedItemIds), "excluded")}
              className="px-3 py-1 rounded-lg bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 font-medium transition cursor-pointer"
            >
              Exclude Selected
            </button>
            <button
              onClick={() => setSelectedItemIds(new Set())}
              className="px-2 py-1 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Main Workspace Display */}
      {viewMode === "table" ? (
        /* TABLE VIEW */
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm transition-colors">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-3 w-10 text-center">
                    <button onClick={handleToggleSelectAll} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer">
                      {selectedItemIds.size === filteredItems.length && filteredItems.length > 0 ? (
                        <CheckSquare className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </th>
                  <th className="p-3">Original File</th>
                  <th className="p-3">Proposed Destination & Clean Name</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Reasoning & Confidence</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-200">
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400 dark:text-slate-500">
                      No files match the search or filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item) => {
                    const isEditing = editingItemId === item.id;
                    const isSelected = selectedItemIds.has(item.id);

                    return (
                      <tr
                        key={item.id}
                        className={`hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition ${
                          item.status === "excluded" ? "opacity-40 bg-slate-50 dark:bg-slate-800/20" : ""
                        } ${isSelected ? "bg-indigo-50/30 dark:bg-indigo-950/30" : ""}`}
                      >
                        {/* Checkbox */}
                        <td className="p-3 text-center">
                          <button
                            onClick={() => handleToggleSelectItem(item.id)}
                            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                          >
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                            ) : (
                              <Square className="w-4 h-4" />
                            )}
                          </button>
                        </td>

                        {/* Original File */}
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800">
                              {getTypeIcon(item.file.type)}
                            </div>
                            <div className="max-w-[200px]">
                              <div className="font-semibold text-slate-900 dark:text-slate-100 truncate" title={item.originalName}>
                                {item.originalName}
                              </div>
                              <div className="text-[10px] text-slate-400 dark:text-slate-500 flex items-center gap-1 font-mono">
                                <span>{formatBytes(item.file.size)}</span>
                                <span>•</span>
                                <span>{item.file.extension}</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Proposed Destination */}
                        <td className="p-3">
                          {isEditing ? (
                            <div className="space-y-1.5 min-w-[280px]">
                              <input
                                type="text"
                                value={editFolder}
                                onChange={e => setEditFolder(e.target.value)}
                                className="w-full px-2 py-1 text-xs rounded border border-indigo-300 dark:border-indigo-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono"
                                placeholder="Target Folder (e.g. Research/Quantum_Physics)"
                              />
                              {quickFolderOptions.length > 0 && (
                                <div className="flex items-center gap-1 flex-wrap">
                                  <span className="text-[10px] text-slate-400">Quick:</span>
                                  {quickFolderOptions.slice(0, 4).map(qf => (
                                    <button
                                      key={qf}
                                      type="button"
                                      onClick={() => setEditFolder(qf)}
                                      className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-750 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-slate-600 dark:text-slate-300 hover:text-indigo-700 dark:hover:text-indigo-300 text-[10px] font-mono cursor-pointer truncate max-w-[130px]"
                                      title={qf}
                                    >
                                      {qf}
                                    </button>
                                  ))}
                                </div>
                              )}
                              <input
                                type="text"
                                value={editName}
                                onChange={e => setEditName(e.target.value)}
                                className="w-full px-2 py-1 text-xs rounded border border-indigo-300 dark:border-indigo-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono"
                                placeholder="Target Filename"
                              />
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => saveEditing(item)}
                                  className="px-2 py-0.5 rounded bg-indigo-600 text-white font-medium text-[10px] cursor-pointer"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={() => setEditingItemId(null)}
                                  className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-[10px] cursor-pointer"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-0.5 max-w-[280px]">
                              <div className="flex items-center gap-1 text-[11px] font-semibold text-indigo-900 dark:text-indigo-300 truncate" title={item.fullDestinationPath}>
                                <span className="text-slate-400 dark:text-slate-500 font-normal">📁 {item.proposedFolderPath}/</span>
                                <span className="font-bold">{item.proposedFilename}</span>
                              </div>
                              {item.isModifiedManually && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-medium">
                                  Manually edited
                                </span>
                              )}
                            </div>
                          )}
                        </td>

                        {/* Category */}
                        <td className="p-3">
                          <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-medium text-[11px] whitespace-nowrap">
                            {item.proposedCategory}
                          </span>
                        </td>

                        {/* Reasoning & Confidence */}
                        <td className="p-3 max-w-[220px]">
                          <div className="space-y-1">
                            <div className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2" title={item.reasoning}>
                              {item.reasoning}
                            </div>
                            <div className="flex items-center gap-1.5 text-[10px]">
                              <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-emerald-500 rounded-full"
                                  style={{ width: `${Math.round(item.confidence * 100)}%` }}
                                />
                              </div>
                              <span className="font-mono text-slate-500 dark:text-slate-400">
                                {Math.round(item.confidence * 100)}%
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => onPreviewItem(item)}
                              className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-800 rounded-lg transition cursor-pointer"
                              title="Preview Content & Diff"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            <button
                              type="button"
                              onClick={() => startEditing(item)}
                              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition cursor-pointer"
                              title="Edit Path & Name"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>

                            <button
                              type="button"
                              onClick={() => onBatchUpdateStatus([item.id], item.status === "excluded" ? "pending" : "excluded")}
                              className={`p-1.5 rounded-lg transition cursor-pointer ${
                                item.status === "excluded"
                                  ? "text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-slate-800"
                                  : "text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800"
                              }`}
                              title={item.status === "excluded" ? "Include File" : "Exclude File"}
                            >
                              {item.status === "excluded" ? (
                                <RotateCcw className="w-4 h-4" />
                              ) : (
                                <XCircle className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* FOLDER TREE VIEW */
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-4 transition-colors">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <span className="font-bold text-slate-800 dark:text-slate-200 text-sm flex items-center gap-2">
              <FolderTree className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              Proposed Destination Directory Layout ({Object.keys(treeData).length} folders)
            </span>
            <span className="text-xs text-slate-400 dark:text-slate-500">
              Showing structure as it will be created on disk or inside the ZIP
            </span>
          </div>

          <div className="space-y-4">
            {(Object.entries(treeData) as [string, OrganizationPlanItem[]][]).map(([folderPath, files]) => (
              <div key={folderPath} className="border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-50/50 dark:bg-slate-800/40">
                <div className="px-4 py-2.5 bg-slate-100/80 dark:bg-slate-800/80 border-b border-slate-200/60 dark:border-slate-700/60 font-semibold text-slate-800 dark:text-slate-200 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FolderInput className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span className="font-mono text-indigo-950 dark:text-indigo-300 font-bold">{folderPath}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-mono text-[10px] border border-slate-200 dark:border-slate-600">
                    {files.length} file{files.length > 1 ? "s" : ""}
                  </span>
                </div>

                <div className="p-3 divide-y divide-slate-100 dark:divide-slate-800">
                  {files.map((f) => (
                    <div key={f.id} className="py-2 px-2 hover:bg-white dark:hover:bg-slate-800/70 rounded-lg flex items-center justify-between text-xs transition">
                      <div className="flex items-center gap-2">
                        {getTypeIcon(f.file.type)}
                        <span className="font-mono font-medium text-slate-900 dark:text-slate-100">{f.proposedFilename}</span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500">({formatBytes(f.file.size)})</span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px]">
                        <span className="text-slate-400 dark:text-slate-500 truncate max-w-xs">orig: {f.originalName}</span>
                        <button
                          onClick={() => onPreviewItem(f)}
                          className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 hover:bg-indigo-50 dark:hover:bg-slate-600 hover:text-indigo-600 dark:hover:text-indigo-300 text-slate-600 dark:text-slate-300 transition cursor-pointer"
                        >
                          Inspect
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
