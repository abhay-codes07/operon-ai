"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

type ComplianceApprovalPanelProps = {
  workflowId: string;
  canApprove: boolean;
  isApproved: boolean;
};

export function ComplianceApprovalPanel({
  workflowId,
  canApprove,
  isApproved,
}: ComplianceApprovalPanelProps): JSX.Element {
  const router = useRouter();
  const [notes, setNotes] = useState("");
  const [localApproved, setLocalApproved] = useState(isApproved);
  const [state, setState] = useState<{
    loading: boolean;
    error?: string;
    success?: string;
  }>({ loading: false });

  async function requestApproval() {
    setState({ loading: true });
    const response = await fetch(`/api/compliance/workflows/${workflowId}/request`, {
      method: "POST",
    });
    const payload = (await response.json().catch(() => null)) as
      | { error?: { message?: string } }
      | null;
    if (!response.ok) {
      setState({ loading: false, error: payload?.error?.message ?? "Failed to request approval" });
      return;
    }

    setState({
      loading: false,
      success: "Approval request recorded.",
    });
  }

  async function approve() {
    setState({ loading: true });
    const response = await fetch(`/api/compliance/workflows/${workflowId}/approve`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        notes: notes.trim() || undefined,
      }),
    });
    const payload = (await response.json().catch(() => null)) as
      | { error?: { message?: string } }
      | null;
    if (!response.ok) {
      setState({ loading: false, error: payload?.error?.message ?? "Failed to approve workflow" });
      return;
    }

    setLocalApproved(true);
    setState({
      loading: false,
      success: "Workflow approved for production execution.",
    });
    router.refresh();
  }

  async function rejectOrRevoke() {
    setState({ loading: true });
    const response = await fetch(`/api/compliance/workflows/${workflowId}/revoke`, {
      method: "POST",
    });
    const payload = (await response.json().catch(() => null)) as
      | { error?: { message?: string } }
      | null;
    if (!response.ok) {
      setState({ loading: false, error: payload?.error?.message ?? "Failed to revoke approval" });
      return;
    }

    setLocalApproved(false);
    setState({
      loading: false,
      success: "Approval revoked.",
    });
    router.refresh();
  }

  return (
    <section className="rounded-xl border border-[#1e2d5a]/60 bg-[#0d1428]/80 p-4 backdrop-blur-sm">
      <div className="space-y-1">
        <h2 className="text-sm font-semibold text-white">Workflow Approval</h2>
        <p className="text-xs text-slate-400">
          Production runs require approval tied to the current workflow version.
        </p>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {!localApproved && (
          <Button type="button" variant="secondary" disabled={state.loading} onClick={requestApproval}>
            Request Approval
          </Button>
        )}
        {canApprove ? (
          <>
            {!localApproved && (
              <Button type="button" disabled={state.loading} onClick={approve}>
                Approve
              </Button>
            )}
            {localApproved && (
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-sm font-semibold text-emerald-400">
                ✓ Approved for production
              </span>
            )}
            <Button type="button" variant="ghost" disabled={state.loading} onClick={rejectOrRevoke}>
              {localApproved ? "Revoke" : "Reject"}
            </Button>
          </>
        ) : null}
      </div>
      {canApprove ? (
        <label className="mt-3 block space-y-1">
          <span className="text-xs font-medium text-slate-300">Approval Notes</span>
          <textarea
            rows={3}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            className="w-full rounded-md border border-[#1e2d5a]/60 bg-[#060b18] px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-cyan-500/60 focus:outline-none"
            placeholder="Why this workflow is approved for production"
          />
        </label>
      ) : null}
      {state.error ? <p className="mt-3 text-xs text-rose-400">{state.error}</p> : null}
      {state.success ? <p className="mt-3 text-xs text-emerald-400">{state.success}</p> : null}
    </section>
  );
}
