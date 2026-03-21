"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";

// ─── Types ───────────────────────────────────────────────────────────────────

type AddSentinelModalProps = {
  agents?: Array<{ id: string; name: string }>;
};

const INTERVAL_OPTIONS = [
  { label: "Every hour", value: "0 * * * *" },
  { label: "Every 6 hours", value: "0 */6 * * *" },
  { label: "Every day", value: "0 0 * * *" },
  { label: "Every week", value: "0 0 * * 0" },
];

// ─── Component ───────────────────────────────────────────────────────────────

export function AddSentinelButton({
  agents = [],
}: AddSentinelModalProps): JSX.Element {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [watchUrl, setWatchUrl] = useState("");
  const [checkInterval, setCheckInterval] = useState(INTERVAL_OPTIONS[1]?.value ?? "0 */6 * * *");
  const [agentId, setAgentId] = useState(agents[0]?.id ?? "");
  const [agentIdText, setAgentIdText] = useState("");

  function resetForm() {
    setName("");
    setWatchUrl("");
    setCheckInterval(INTERVAL_OPTIONS[1]?.value ?? "0 */6 * * *");
    setAgentId(agents[0]?.id ?? "");
    setAgentIdText("");
    setError(null);
  }

  function onOpen() {
    resetForm();
    setIsOpen(true);
  }

  function onClose() {
    setIsOpen(false);
  }

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;

    function onKeydown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeydown);
    return () => window.removeEventListener("keydown", onKeydown);
  }, [isOpen]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const resolvedAgentId = agents.length > 0 ? agentId : agentIdText.trim();

    if (!name.trim()) {
      setError("Name is required.");
      return;
    }
    if (!watchUrl.trim()) {
      setError("URL to watch is required.");
      return;
    }
    if (!resolvedAgentId) {
      setError("Agent ID is required.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/internal/sentinels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          watchUrl: watchUrl.trim(),
          checkInterval,
          agentId: resolvedAgentId,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        setError(payload?.error ?? "Failed to create sentinel.");
        return;
      }

      setIsOpen(false);
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <Button onClick={onOpen} variant="primary">
        <Plus className="mr-1.5 h-4 w-4" />
        Add Sentinel
      </Button>

      {isOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-sentinel-title"
          onMouseDown={onClose}
        >
          <div
            className="w-full max-w-lg rounded-2xl border border-slate-700/60 bg-slate-900 p-6 shadow-2xl shadow-slate-950/60"
            onMouseDown={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-400">
                Web Intelligence
              </p>
              <h2
                id="add-sentinel-title"
                className="text-xl font-semibold text-white"
              >
                Add Sentinel
              </h2>
              <p className="text-sm text-slate-400">
                Configure an always-on AI agent to watch a URL for meaningful
                changes.
              </p>
            </div>

            <form className="mt-6 space-y-4" onSubmit={onSubmit}>
              {/* Name */}
              <div className="space-y-1.5">
                <label
                  htmlFor="sentinel-name"
                  className="block text-sm font-medium text-slate-300"
                >
                  Sentinel Name
                </label>
                <input
                  id="sentinel-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Competitor Pricing Watch"
                  required
                  className="h-10 w-full rounded-lg border border-slate-700/60 bg-slate-800/60 px-3 text-sm text-white placeholder-slate-500 outline-none transition focus:border-cyan-500/60 focus:ring-2 focus:ring-cyan-500/20"
                />
              </div>

              {/* URL */}
              <div className="space-y-1.5">
                <label
                  htmlFor="sentinel-url"
                  className="block text-sm font-medium text-slate-300"
                >
                  URL to Watch
                </label>
                <input
                  id="sentinel-url"
                  type="url"
                  value={watchUrl}
                  onChange={(e) => setWatchUrl(e.target.value)}
                  placeholder="https://competitor.com/pricing"
                  required
                  className="h-10 w-full rounded-lg border border-slate-700/60 bg-slate-800/60 px-3 text-sm text-white placeholder-slate-500 outline-none transition focus:border-cyan-500/60 focus:ring-2 focus:ring-cyan-500/20"
                />
              </div>

              {/* Check Interval */}
              <div className="space-y-1.5">
                <label
                  htmlFor="sentinel-interval"
                  className="block text-sm font-medium text-slate-300"
                >
                  Check Interval
                </label>
                <select
                  id="sentinel-interval"
                  value={checkInterval}
                  onChange={(e) => setCheckInterval(e.target.value)}
                  className="h-10 w-full rounded-lg border border-slate-700/60 bg-slate-800/60 px-3 text-sm text-white outline-none transition focus:border-cyan-500/60 focus:ring-2 focus:ring-cyan-500/20"
                >
                  {INTERVAL_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Agent selector */}
              <div className="space-y-1.5">
                <label
                  htmlFor="sentinel-agent"
                  className="block text-sm font-medium text-slate-300"
                >
                  Agent
                </label>
                {agents.length > 0 ? (
                  <select
                    id="sentinel-agent"
                    value={agentId}
                    onChange={(e) => setAgentId(e.target.value)}
                    className="h-10 w-full rounded-lg border border-slate-700/60 bg-slate-800/60 px-3 text-sm text-white outline-none transition focus:border-cyan-500/60 focus:ring-2 focus:ring-cyan-500/20"
                  >
                    {agents.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    id="sentinel-agent"
                    type="text"
                    value={agentIdText}
                    onChange={(e) => setAgentIdText(e.target.value)}
                    placeholder="Agent ID"
                    required
                    className="h-10 w-full rounded-lg border border-slate-700/60 bg-slate-800/60 px-3 text-sm text-white placeholder-slate-500 outline-none transition focus:border-cyan-500/60 focus:ring-2 focus:ring-cyan-500/20"
                  />
                )}
              </div>

              {/* Error */}
              {error ? (
                <p className="rounded-lg border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-sm text-rose-400">
                  {error}
                </p>
              ) : null}

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={onClose}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" disabled={isSubmitting}>
                  {isSubmitting ? "Creating..." : "Create Sentinel"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
