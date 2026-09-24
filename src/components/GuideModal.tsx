import React from "react";
import { 
  X, 
  BookOpen, 
  FolderUp, 
  FileText, 
  Sparkles, 
  Play, 
  Download, 
  Terminal, 
  ShieldCheck, 
  HardDrive, 
  ChevronRight, 
  HelpCircle, 
  CheckCircle2, 
  Layers 
} from "lucide-react";

interface GuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLaunchDemoPreset?: (presetId: string) => void;
  onSelectFilesClick?: () => void;
  onSelectFolderClick?: () => void;
}

export const GuideModal: React.FC<GuideModalProps> = ({
  isOpen,
  onClose,
  onLaunchDemoPreset,
  onSelectFilesClick,
  onSelectFolderClick,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden transition-colors">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-indigo-50/70 via-white to-slate-50 dark:from-slate-900 dark:via-slate-850 dark:to-slate-900">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-200 dark:shadow-none">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">How to Use AI File Sorter</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Quick 3-step walkthrough & automated sorting guide</p>
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
          {/* Quick Demo Banner */}
          <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-850 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-indigo-950 dark:text-indigo-200 text-xs uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Want to see it in action instantly?</span>
              </div>
              <p className="text-xs text-indigo-900 dark:text-indigo-300">
                Load a pre-packaged messy downloads folder without selecting any local files.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                onLaunchDemoPreset?.("cluttered_downloads");
                onClose();
              }}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm shadow-indigo-200 dark:shadow-none transition flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              Run 1-Click Demo
            </button>
          </div>

          {/* 3 Step Guide */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Workflow Overview
            </h3>

            {/* Step 1 */}
            <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50 flex items-start gap-3.5">
              <div className="w-7 h-7 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center shrink-0 shadow-xs">
                1
              </div>
              <div className="space-y-1.5 flex-1">
                <div className="font-bold text-slate-900 dark:text-slate-100 text-sm flex items-center justify-between">
                  <span>Feed Messy Files or Folders</span>
                  <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">Step 1</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Choose any of the following 3 easy methods:
                </p>
                <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-1 pl-4 list-disc marker:text-indigo-500">
                  <li><strong>Drag & Drop:</strong> Drag any folder or files directly into the dashed box.</li>
                  <li><strong>Select Files / Folder:</strong> Click <em>Select Files</em> or <em>Select Target Folder</em>.</li>
                  <li><strong>Instant Demo Datasets:</strong> Click any of the sample presets below the dropzone to test instantly.</li>
                </ul>
              </div>
            </div>

            {/* Step 2 */}
            <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50 flex items-start gap-3.5">
              <div className="w-7 h-7 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center shrink-0 shadow-xs">
                2
              </div>
              <div className="space-y-1.5 flex-1">
                <div className="font-bold text-slate-900 dark:text-slate-100 text-sm flex items-center justify-between">
                  <span>Review AI Organization Plan & Deduplicate</span>
                  <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">Step 2</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  The local engine analyzes file contents, magic bytes, and keywords to propose standardized paths (e.g., <code className="bg-slate-200 dark:bg-slate-700 px-1 py-0.5 rounded text-[11px] text-slate-800 dark:text-slate-200">Finance/Invoices/2024-03-14_Invoice_Stripe.pdf</code>).
                </p>
                <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1 pl-4 list-disc marker:text-indigo-500">
                  <div><strong>Table & Tree Views:</strong> Toggle views to inspect before-and-after paths.</div>
                  <div><strong>Inline Edits:</strong> Click the edit icon on any row to customize target folders or filenames.</div>
                  <div><strong>Duplicates:</strong> One-click isolate redundant copies to a <code className="bg-slate-200 dark:bg-slate-700 px-1 py-0.5 rounded text-[11px] text-slate-800 dark:text-slate-200">_duplicates/</code> folder.</div>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50 flex items-start gap-3.5">
              <div className="w-7 h-7 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center shrink-0 shadow-xs">
                3
              </div>
              <div className="space-y-1.5 flex-1">
                <div className="font-bold text-slate-900 dark:text-slate-100 text-sm flex items-center justify-between">
                  <span>Export & Organize Files</span>
                  <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">Step 3</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Export your newly organized structure safely:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <div className="font-semibold text-xs text-indigo-900 dark:text-indigo-300 flex items-center gap-1.5">
                      <Download className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                      <span>Download Organized ZIP</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Packages all files into their clean folder hierarchy ready to extract anywhere.
                    </p>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <div className="font-semibold text-xs text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                      <Terminal className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>Shell / PowerShell Script</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Downloads an <code className="text-emerald-700 dark:text-emerald-400 font-mono">organize.sh</code> or <code className="text-blue-700 dark:text-blue-400 font-mono">organize.ps1</code> script with dry-run protection to reorganize files directly on disk.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Browser Sandbox Note */}
          <div className="p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-850 space-y-1.5 text-xs text-amber-900 dark:text-amber-200">
            <div className="font-semibold flex items-center gap-1.5 text-amber-800 dark:text-amber-300">
              <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>Browser Sandbox Security Note</span>
            </div>
            <p className="leading-relaxed text-amber-800/90 dark:text-amber-300/90 text-[11px]">
              Web browsers run in a secure sandbox and do not allow web apps to directly overwrite your disk without user permission. That is why AI File Sorter gives you two safe options: <strong>Download Organized ZIP</strong> or run the verified <strong>Terminal Script</strong> in your folder.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-850/80 flex items-center justify-between">
          <div className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Click any demo preset on the scanner to try instantly</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-semibold bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 dark:hover:bg-slate-600 text-white shadow-xs transition cursor-pointer"
          >
            Got it, Let's Go!
          </button>
        </div>
      </div>
    </div>
  );
};
