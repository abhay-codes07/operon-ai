"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";

const statusOptions = ["ALL", "RUNNING", "PAUSED", "FAILED", "COMPLETED"] as const;

export function PipelineFilters(): JSX.Element {
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialQuery = useMemo(() => searchParams.get("query") ?? "", [searchParams]);
  const initialStatus = useMemo(() => searchParams.get("status") ?? "ALL", [searchParams]);
  const [query, setQuery] = useState(initialQuery);
  const [status, setStatus] = useState(initialStatus);

  function applyFilters() {
    const params = new URLSearchParams();
    if (query.trim()) {
      params.set("query", query.trim());
    }
    if (status !== "ALL") {
      params.set("status", status);
    }
    const serialized = params.toString();
    router.push(serialized ? `/pipelines?${serialized}` : "/pipelines");
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex flex-col gap-2 md:flex-row">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search pipelines"
          className="h-9 flex-1 rounded-md border border-slate-300 px-3 text-sm"
        />
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          className="h-9 rounded-md border border-slate-300 px-3 text-sm"
        >
          {statusOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <Button type="button" variant="secondary" onClick={applyFilters}>
          Apply
        </Button>
      </div>
    </section>
  );
}
