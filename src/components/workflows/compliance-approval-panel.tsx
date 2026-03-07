"use client";

import { useState } from "react";

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
  const [notes, setNotes] = useState("");
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

    setState({
      loading: false,
      success: "Workflow approved for production execution.",
    });
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

    setState({
      loading: false,
      success: "Approval revoked.",
    });
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="space-y-1">
        <h2 className="text-sm font-semibold text-slate-900">Workflow Approval</h2>
        <p className="text-xs text-slate-600">
          Production runs require approval tied to the current workflow version.
        </p>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Button type="button" variant="secondary" disabled={state.loading} onClick={requestApproval}>
          Request Approval
        </Button>
        {canApprove ? (
          <>
            <Button type="button" disabled={state.loading} onClick={approve}>
              Approve
            </Button>
            <Button type="button" variant="ghost" disabled={state.loading} onClick={rejectOrRevoke}>
              {isApproved ? "Revoke" : "Reject"}
            </Button>
          </>
        ) : null}
      </div>
      {canApprove ? (
        <label className="mt-3 block space-y-1">
          <span className="text-xs font-medium text-slate-700">Approval Notes</span>
          <textarea
            rows={3}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            placeholder="Why this workflow is approved for production"
          />
        </label>
      ) : null}
      {state.error ? <p className="mt-3 text-xs text-rose-700">{state.error}</p> : null}
      {state.success ? <p className="mt-3 text-xs text-emerald-700">{state.success}</p> : null}
    </section>
  );
}
