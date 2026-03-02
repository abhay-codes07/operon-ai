"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";

type CreateAgentModalProps = {
  organizationName?: string;
};

export function CreateAgentModal({ organizationName }: CreateAgentModalProps): JSX.Element {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onCreateAgent(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Agent name is required.");
      return;
    }

    setIsSubmitting(true);
    const response = await fetch("/api/internal/agents", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: name.trim(),
        description: description.trim() || undefined,
      }),
    });

    setIsSubmitting(false);

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(payload?.error ?? "Unable to create agent.");
      return;
    }

    setName("");
    setDescription("");
    setIsOpen(false);
    router.refresh();
  }

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>Create Agent</Button>

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/30 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Agent Setup</p>
              <h2 className="text-xl font-semibold text-slate-900">Create New Agent</h2>
              <p className="text-sm text-slate-600">
                Deploy a new autonomous agent in {organizationName ?? "your workspace"}.
              </p>
            </div>

            <form className="mt-6 space-y-4" onSubmit={onCreateAgent}>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700" htmlFor="agent-name">
                  Agent Name
                </label>
                <input
                  id="agent-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none ring-slate-900/20 focus:ring-2"
                  placeholder="Invoice Reconciler"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700" htmlFor="agent-description">
                  Description
                </label>
                <textarea
                  id="agent-description"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  className="min-h-24 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none ring-slate-900/20 focus:ring-2"
                  placeholder="Handles B2B invoice reconciliation across billing portals."
                />
              </div>

              {error ? <p className="text-sm font-medium text-rose-700">{error}</p> : null}

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="ghost" onClick={() => setIsOpen(false)} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Creating..." : "Create Agent"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
