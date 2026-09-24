import React from "react";
import { 
  X, 
  FileText, 
  Image as ImageIcon, 
  Music, 
  Video, 
  Code2, 
  FolderTree, 
  Tag, 
  CheckCircle, 
  Calendar, 
  HardDrive 
} from "lucide-react";
import { OrganizationPlanItem } from "../types";
import { formatBytes } from "../services/fileScanner";

interface FilePreviewModalProps {
  item: OrganizationPlanItem | null;
  onClose: () => void;
}

export const FilePreviewModal: React.FC<FilePreviewModalProps> = ({
  item,
  onClose,
}) => {
  if (!item) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden transition-colors">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 truncate max-w-md">
                {item.originalName}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">File Inspection & Proposed AI Transformations</p>
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
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-700 dark:text-slate-300">
          {/* Visual Diff: Before vs After */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Original Location & Name
              </span>
              <div className="font-mono text-xs text-slate-700 dark:text-slate-300 break-all">
                {item.originalPath}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                Proposed Destination & Clean Name
              </span>
              <div className="font-mono text-xs text-indigo-900 dark:text-indigo-200 font-semibold break-all">
                {item.fullDestinationPath}
              </div>
            </div>
          </div>

          {/* AI Taxonomy Reasoning */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-200">
                <Tag className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Classification Reasoning</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold font-mono text-[10px]">
                {Math.round(item.confidence * 100)}% Confidence
              </span>
            </div>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-xs">
              {item.reasoning}
            </p>
          </div>

          {/* Image Thumbnail Preview if available */}
          {item.file.thumbnailUrl && (
            <div className="space-y-2">
              <span className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px]">
                Visual Image Preview
              </span>
              <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 max-h-56 bg-slate-900 flex items-center justify-center">
                <img
                  src={item.file.thumbnailUrl}
                  alt={item.originalName}
                  className="max-h-56 w-auto object-contain"
                />
              </div>
            </div>
          )}

          {/* Content Header Snippet if available */}
          {item.file.contentSnippet && (
            <div className="space-y-2">
              <span className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px]">
                Extracted Header / Text Sample (First 16KB)
              </span>
              <pre className="p-3 rounded-xl bg-slate-900 text-slate-200 font-mono text-[11px] overflow-x-auto max-h-40 whitespace-pre-wrap">
                {item.file.contentSnippet}
              </pre>
            </div>
          )}

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <div className="text-[10px] text-slate-400 dark:text-slate-500">File Size</div>
              <div className="font-semibold text-slate-800 dark:text-slate-200">{formatBytes(item.file.size)}</div>
            </div>

            <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <div className="text-[10px] text-slate-400 dark:text-slate-500">Format</div>
              <div className="font-semibold text-slate-800 dark:text-slate-200 uppercase">{item.file.extension || "N/A"}</div>
            </div>

            <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <div className="text-[10px] text-slate-400 dark:text-slate-500">Hash (Sampled)</div>
              <div className="font-mono text-[10px] text-slate-800 dark:text-slate-200 truncate" title={item.file.hash}>
                {item.file.hash?.substring(0, 12) || "N/A"}...
              </div>
            </div>

            <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <div className="text-[10px] text-slate-400 dark:text-slate-500">Modified</div>
              <div className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                {new Date(item.file.lastModified).toISOString().split("T")[0]}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/80 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 dark:hover:bg-slate-600 text-white transition cursor-pointer"
          >
            Close Preview
          </button>
        </div>
      </div>
    </div>
  );
};
