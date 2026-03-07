"use client";

import { useState } from "react";

export function InstallModal({ slug }: { slug: string }): JSX.Element {
  const [state, setState] = useState<{ loading: boolean; error?: string; success?: string }>({
    loading: false,
  });

  async function install() {
    setState({ loading: true });
    const response = await fetch(`/api/marketplace/templates/${slug}/install`, {
      method: "POST",
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as
        | { error?: { message?: string } }
        | null;
      setState({
        loading: false,
        error: payload?.error?.message ?? "Install failed",
      });
      return;
    }

    setState({ loading: false, success: "Installed" });
  }

  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={install}
        disabled={state.loading}
        className="inline-flex h-9 items-center rounded-md bg-slate-900 px-3 text-sm font-medium text-white"
      >
        {state.loading ? "Installing..." : "Install"}
      </button>
      {state.error ? <p className="text-xs text-rose-700">{state.error}</p> : null}
      {state.success ? <p className="text-xs text-emerald-700">{state.success}</p> : null}
    </div>
  );
}
