"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { cn } from "@/lib/utils/cn";
import { ComplianceApprovalModal } from "@/components/dashboard/shared/compliance-approval-modal";

type Agent = {
  id: string;
  name: string;
};

type SwarmLaunchFormProps = {
  agents: Agent[];
};

export function SwarmLaunchForm({ agents }: SwarmLaunchFormProps) {
  const router = useRouter();
  const [agentId, setAgentId] = useState(agents[0]?.id ?? "");
  const [taskDescription, setTaskDescription] = useState("");
  const [urlsText, setUrlsText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showApproval, setShowApproval] = useState(false);
  const [successInfo, setSuccessInfo] = useState<{
    swarmId: string;
    count: number;
  } | null>(null);

  const inputClass = cn(
    "w-full rounded-lg border border-slate-700/60 bg-slate-900/60 text-slate-200",
    "px-3 py-2 text-sm placeholder-slate-500",
    "focus:border-cyan-500/60 focus:outline-none focus:ring-1 focus:ring-cyan-500/30",
    "transition-colors",
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccessInfo(null);

    const targetUrls = urlsText
      .split("\n")
      .map((u) => {
        const t = u.trim();
        if (!t) return "";
        return t.startsWith("http://") || t.startsWith("https://") ? t : "https://" + t;
      })
      .filter(Boolean);

    if (targetUrls.length === 0) {
      setError("Enter at least one target URL.");
      return;
    }

    if (!agentId) {
      setError("Select an agent.");
      return;
    }

    // Show compliance approval modal before executing
    setShowApproval(true);
  }

  async function executeLaunch() {
    setShowApproval(false);
    setIsLoading(true);

    const targetUrls = urlsText
      .split("\n")
      .map((u) => {
        const t = u.trim();
        if (!t) return "";
        return t.startsWith("http://") || t.startsWith("https://") ? t : "https://" + t;
      })
      .filter(Boolean);

    try {
      const res = await fetch("/api/internal/swarm/launch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId,
          targetUrls,
          taskOverride: taskDescription.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? `Request failed with status ${res.status}`);
      }

      const result = await res.json();
      setSuccessInfo({ swarmId: result.swarmId, count: result.executions.length });
      setTaskDescription("");
      setUrlsText("");

      // Trigger one worker per execution in parallel — each targets its specific execution
      const executionIds: string[] = (result.executions as Array<{ executionId: string }>).map((e) => e.executionId);
      void Promise.all(
        executionIds.map((id) => fetch(`/api/worker/run?executionId=${id}`).catch(() => null)),
      );

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Agent selector */}
      <div className="space-y-1.5">
        <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500">
          Agent
        </label>
        {agents.length === 0 ? (
          <p className="text-sm text-slate-500 italic">
            No agents available. Provision an agent first.
          </p>
        ) : (
          <select
            value={agentId}
            onChange={(e) => setAgentId(e.target.value)}
            disabled={isLoading}
            className={cn(
              inputClass,
              "cursor-pointer",
              "disabled:cursor-not-allowed disabled:opacity-50",
            )}
          >
            {agents.map((a) => (
              <option key={a.id} value={a.id} className="bg-slate-900">
                {a.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Task description */}
      <div className="space-y-1.5">
        <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500">
          Task Description{" "}
          <span className="normal-case font-normal text-slate-600">(optional)</span>
        </label>
        <textarea
          value={taskDescription}
          onChange={(e) => setTaskDescription(e.target.value)}
          disabled={isLoading}
          rows={3}
          placeholder="Describe what the swarm should do on each target URL..."
          className={cn(inputClass, "resize-none disabled:opacity-50")}
        />
      </div>

      {/* Target URLs */}
      <div className="space-y-1.5">
        <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500">
          Target URLs{" "}
          <span className="normal-case font-normal text-slate-600">(one per line)</span>
        </label>
        <textarea
          value={urlsText}
          onChange={(e) => setUrlsText(e.target.value)}
          disabled={isLoading}
          rows={5}
          placeholder={"https://example.com/page1\nhttps://example.com/page2"}
          className={cn(inputClass, "resize-none font-mono text-xs disabled:opacity-50")}
        />
        <p className="text-[11px] text-slate-600">
          {urlsText.split("\n").filter((u) => u.trim()).length} URL(s) entered
        </p>
      </div>

      {/* Error feedback */}
      {error ? (
        <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
          {error}
        </div>
      ) : null}

      {/* Success feedback */}
      {successInfo ? (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 space-y-0.5">
          <p className="text-sm font-semibold text-emerald-300">
            Swarm launched — {successInfo.count} execution{successInfo.count !== 1 ? "s" : ""} queued
          </p>
          <p className="text-[11px] text-emerald-600 font-mono">
            Swarm ID: {successInfo.swarmId}
          </p>
        </div>
      ) : null}

      {/* Submit */}
      <button
        type="submit"
        disabled={isLoading || agents.length === 0}
        className={cn(
          "inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition-all",
          "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20",
          "hover:from-cyan-400 hover:to-blue-500 hover:shadow-cyan-500/30",
          "disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none",
          "focus:outline-none focus:ring-2 focus:ring-cyan-500/50",
        )}
      >
        {isLoading ? (
          <>
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            Launching swarm...
          </>
        ) : (
          "Launch Swarm"
        )}
      </button>

      {/* Compliance approval modal */}
      {showApproval && (
        <ComplianceApprovalModal
          title="Compliance Approval Required"
          agentName={agents.find((a) => a.id === agentId)?.name}
          task={taskDescription.trim() || "Extract information from target websites"}
          targetUrls={urlsText.split("\n").map((u) => u.trim()).filter(Boolean)}
          onApprove={executeLaunch}
          onCancel={() => setShowApproval(false)}
        />
      )}
    </form>
  );
}
