"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

type CompetitorItem = {
  id: string;
  name: string;
  website: string;
};

type CompetitorManagerProps = {
  initialItems: CompetitorItem[];
};

export function CompetitorManager({ initialItems }: CompetitorManagerProps): JSX.Element {
  const [items, setItems] = useState(initialItems);
  const [name, setName] = useState("");
  const [website, setWebsite] = useState("");
  const [state, setState] = useState<{ loading: boolean; error?: string }>({ loading: false });

  async function create() {
    setState({ loading: true });
    const response = await fetch("/api/intelligence/competitors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, website }),
    });
    const payload = (await response.json().catch(() => null)) as
      | { competitor?: CompetitorItem; error?: { message?: string } }
      | null;
    if (!response.ok || !payload?.competitor) {
      setState({ loading: false, error: payload?.error?.message ?? "Failed to create competitor" });
      return;
    }

    const competitor = payload.competitor;
    setItems((current) => [competitor, ...current]);
    setName("");
    setWebsite("");
    setState({ loading: false });
  }

  async function remove(id: string) {
    const response = await fetch(`/api/intelligence/competitors/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      return;
    }
    setItems((current) => current.filter((item) => item.id !== id));
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-2 md:grid-cols-[1fr,1fr,auto]">
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Competitor name"
          className="h-9 rounded-md border border-slate-700/60 bg-slate-800/60 text-white placeholder-slate-500 focus:border-cyan-500/60 focus:ring-cyan-500/30 px-3 text-sm"
        />
        <input
          value={website}
          onChange={(event) => setWebsite(event.target.value)}
          placeholder="https://competitor.com"
          className="h-9 rounded-md border border-slate-700/60 bg-slate-800/60 text-white placeholder-slate-500 focus:border-cyan-500/60 focus:ring-cyan-500/30 px-3 text-sm"
        />
        <Button type="button" onClick={create} disabled={state.loading}>
          Add
        </Button>
      </div>
      {state.error ? <p className="text-xs text-rose-700">{state.error}</p> : null}
      <div className="space-y-2">
        {items.map((item) => (
          <article key={item.id} className="flex items-center justify-between rounded-lg border border-slate-700/60 bg-slate-900/60 p-3">
            <div>
              <p className="text-sm font-semibold text-white">{item.name}</p>
              <p className="text-xs text-slate-400">{item.website}</p>
            </div>
            <Button type="button" variant="ghost" className="h-8 px-2 text-xs" onClick={() => remove(item.id)}>
              Remove
            </Button>
          </article>
        ))}
      </div>
    </div>
  );
}
