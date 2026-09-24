import React from "react";
import { 
  X, 
  History, 
  RotateCcw, 
  Terminal, 
  FileText, 
  CheckCircle, 
  Trash2 
} from "lucide-react";
import { HistoryRecord } from "../types";
import { triggerDownload } from "../services/zipService";

interface HistoryRollbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: HistoryRecord[];
  onClearHistory: () => void;
}

export const HistoryRollbackModal: React.FC<HistoryRollbackModalProps> = ({
  isOpen,
  onClose,
  history,
  onClearHistory,
}) => {
  if (!isOpen) return null;

  const handleDownloadRollbackBash = (record: HistoryRecord) => {
    const blob = new Blob([record.rollbackScriptBash], { type: "text/x-shellscript" });
    triggerDownload(blob, `rollback_${record.id}.sh`);
  };

  const handleDownloadRollbackPS = (record: HistoryRecord) => {
    const blob = new Blob([record.rollbackScriptPowerShell], { type: "text/plain" });
    triggerDownload(blob, `rollback_${record.id}.ps1`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden transition-colors">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-850/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Audit History & Rollback Logs</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">View past organization runs and generate 1-click restore scripts</p>
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
        <div className="p-6 overflow-y-auto space-y-4 flex-1 text-xs text-slate-700 dark:text-slate-300">
          {history.length === 0 ? (
            <div className="text-center py-12 space-y-2">
              <History className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
              <p className="font-semibold text-slate-600 dark:text-slate-400">No session history yet</p>
              <p className="text-slate-400 dark:text-slate-500 max-w-xs mx-auto">
                Once you export or execute a file organization task, audit records and rollback restore scripts will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px]">
                  Recent Organization Sessions ({history.length})
                </span>
                <button
                  onClick={onClearHistory}
                  className="text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 font-semibold text-[11px] flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Clear All
                </button>
              </div>

              {history.map((record) => (
                <div key={record.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
                        {record.summary}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        {new Date(record.timestamp).toLocaleString()} • {record.totalFiles} files affected
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-semibold text-[10px]">
                      Completed
                    </span>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => handleDownloadRollbackBash(record)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-900 dark:bg-slate-800 text-white font-medium hover:bg-slate-800 dark:hover:bg-slate-700 transition cursor-pointer"
                    >
                      <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                      Download rollback.sh
                    </button>
                    <button
                      onClick={() => handleDownloadRollbackPS(record)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-900 dark:bg-blue-950 text-white font-medium hover:bg-blue-800 dark:hover:bg-blue-900 border border-transparent dark:border-blue-800 transition cursor-pointer"
                    >
                      <Terminal className="w-3.5 h-3.5 text-blue-300" />
                      Download rollback.ps1
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-850/80 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 dark:hover:bg-slate-600 text-white transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
