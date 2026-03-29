"use client";

import { AlertTriangle, CheckCircle, X, Shield } from "lucide-react";

type ComplianceApprovalModalProps = {
  title: string;
  agentName?: string;
  task: string;
  targetUrls?: string[];
  onApprove: () => void;
  onCancel: () => void;
};

export function ComplianceApprovalModal({
  title,
  agentName,
  task,
  targetUrls,
  onApprove,
  onCancel,
}: ComplianceApprovalModalProps): JSX.Element {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-700/60 bg-slate-900 shadow-2xl shadow-black/50">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-700/60 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/15 border border-amber-500/30">
              <Shield className="h-4 w-4 text-amber-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">{title}</p>
              <p className="text-xs text-slate-500">Review before authorizing autonomous execution</p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-800 hover:text-slate-300"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-4 px-6 py-5">
          {/* Warning banner */}
          <div className="flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
            <p className="text-xs leading-relaxed text-amber-300">
              You are authorizing an autonomous AI agent to browse the web and perform the task below.
              This cannot be undone once started. Confirm you have reviewed the task scope.
            </p>
          </div>

          {/* Details */}
          <div className="space-y-3">
            {agentName && (
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-slate-500">Agent</p>
                <p className="text-sm font-medium text-slate-200">{agentName}</p>
              </div>
            )}
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-slate-500">Task</p>
              <p className="text-sm leading-relaxed text-slate-300">{task}</p>
            </div>
            {targetUrls && targetUrls.length > 0 && (
              <div>
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-widest text-slate-500">
                  Target URLs ({targetUrls.length})
                </p>
                <ul className="space-y-1">
                  {targetUrls.map((url, i) => (
                    <li key={i} className="flex items-center gap-2 rounded-md bg-slate-800/60 px-3 py-1.5">
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-500" />
                      <span className="font-mono text-xs text-slate-300">{url}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-700/60 px-6 py-4">
          <button
            onClick={onCancel}
            className="rounded-lg border border-slate-700/60 bg-slate-800/60 px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:border-slate-600 hover:text-white"
          >
            Cancel
          </button>
          <button
            onClick={onApprove}
            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 transition-all hover:from-cyan-400 hover:to-blue-500"
          >
            <CheckCircle className="h-4 w-4" />
            Approve &amp; Execute
          </button>
        </div>
      </div>
    </div>
  );
}
