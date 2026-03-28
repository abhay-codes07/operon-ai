"use client";

import { useState } from "react";

export function PublishTemplateForm(): JSX.Element {
  const [form, setForm] = useState({
    slug: "",
    title: "",
    description: "",
    category: "",
    pricingModel: "FREE",
    priceUsd: "0",
    version: "1.0.0",
    workflowDefinition: JSON.stringify(
      {
        naturalLanguageTask: "Describe the automation task",
        steps: [
          { id: "step-1", action: "navigate", target: "https://example.com", expectedOutcome: "Page loaded" },
        ],
        guardrails: [],
        timeoutSeconds: 120,
        retryLimit: 2,
      },
      null,
      2,
    ),
    changelog: "",
  });
  const [state, setState] = useState<{ loading: boolean; error?: string; success?: string }>({
    loading: false,
  });

  async function publish() {
    setState({ loading: true });
    let parsedDefinition: Record<string, unknown>;
    try {
      parsedDefinition = JSON.parse(form.workflowDefinition) as Record<string, unknown>;
    } catch {
      setState({ loading: false, error: "Workflow definition must be valid JSON" });
      return;
    }

    const response = await fetch("/api/marketplace/templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slug: form.slug,
        title: form.title,
        description: form.description,
        category: form.category,
        pricingModel: form.pricingModel,
        priceUsd: Number(form.priceUsd),
        version: form.version,
        workflowDefinition: parsedDefinition,
        changelog: form.changelog || undefined,
      }),
    });
    const payload = (await response.json().catch(() => null)) as { error?: { message?: string } } | null;

    if (!response.ok) {
      setState({ loading: false, error: payload?.error?.message ?? "Publish failed" });
      return;
    }

    setState({ loading: false, success: "Template published to OperonHub" });
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-3 md:grid-cols-2">
        <input
          className="h-10 rounded-md border border-[#1e2d5a]/60 bg-[#060b18] px-3 text-sm text-white placeholder-slate-500 focus:border-cyan-500/60 focus:outline-none"
          placeholder="Slug"
          value={form.slug}
          onChange={(event) => setForm((current) => ({ ...current, slug: event.target.value }))}
        />
        <input
          className="h-10 rounded-md border border-[#1e2d5a]/60 bg-[#060b18] px-3 text-sm text-white placeholder-slate-500 focus:border-cyan-500/60 focus:outline-none"
          placeholder="Title"
          value={form.title}
          onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
        />
        <input
          className="h-10 rounded-md border border-[#1e2d5a]/60 bg-[#060b18] px-3 text-sm text-white placeholder-slate-500 focus:border-cyan-500/60 focus:outline-none"
          placeholder="Category"
          value={form.category}
          onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}
        />
        <input
          className="h-10 rounded-md border border-[#1e2d5a]/60 bg-[#060b18] px-3 text-sm text-white placeholder-slate-500 focus:border-cyan-500/60 focus:outline-none"
          placeholder="Version"
          value={form.version}
          onChange={(event) => setForm((current) => ({ ...current, version: event.target.value }))}
        />
      </div>
      <textarea
        className="min-h-24 w-full rounded-md border border-[#1e2d5a]/60 bg-[#060b18] px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-cyan-500/60 focus:outline-none"
        placeholder="Description"
        value={form.description}
        onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
      />
      <textarea
        className="min-h-56 w-full rounded-md border border-[#1e2d5a]/60 bg-[#060b18] px-3 py-2 font-mono text-xs text-white focus:border-cyan-500/60 focus:outline-none"
        value={form.workflowDefinition}
        onChange={(event) => setForm((current) => ({ ...current, workflowDefinition: event.target.value }))}
      />
      <button
        type="button"
        onClick={publish}
        disabled={state.loading}
        className="inline-flex h-10 items-center rounded-md bg-gradient-to-r from-cyan-500 to-blue-600 px-4 text-sm font-medium text-white disabled:opacity-50"
      >
        {state.loading ? "Publishing..." : "Publish Template"}
      </button>
      {state.error ? <p className="text-sm text-rose-400">{state.error}</p> : null}
      {state.success ? <p className="text-sm text-emerald-400">{state.success}</p> : null}
    </div>
  );
}
