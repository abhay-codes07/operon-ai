"use client";

import { useCallback, useState } from "react";

import { usePolling } from "@/lib/hooks/use-polling";

type AuditItem = {
  id: string;
  agent: { id: string; name: string };
  action: string;
  targetDomain?: string | null;
  policyDecision: "ALLOW" | "DENY";
  result: "APPROVED" | "BLOCKED" | "FAILED";
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  riskScore: number;
  riskReason?: string | null;
  occurredAt: string;
  events: Array<{ id: string; eventType: string; message: string; occurredAt: string }>;
};

export function AuditLogViewer({ initialItems }: { initialItems: AuditItem[] }): JSX.Element {
  const [items, setItems] = useState(initialItems);

  const refresh = useCallback(async () => {
    const response = await fetch("/api/internal/security/audits?limit=50", {
      cache: "no-store",
    });
    if (!response.ok) {
      return;
    }

    const payload = (await response.json()) as { items: AuditItem[] };
    setItems(payload.items);
  }, []);

  usePolling(refresh, 7000, true);

  if (items.length === 0) {
    return <p className="text-sm text-slate-600">No audit records yet.</p>;
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <article key={item.id} className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-slate-900">
              {item.agent.name} • {item.action}
            </p>
            <p className="text-xs text-slate-500">{new Date(item.occurredAt).toLocaleString()}</p>
          </div>
          <p className="mt-1 text-xs text-slate-600">
            Result {item.result} • Policy {item.policyDecision} • Risk {item.riskLevel} ({item.riskScore})
          </p>
          {item.targetDomain ? <p className="mt-1 text-xs text-slate-600">Target: {item.targetDomain}</p> : null}
          {item.riskReason ? <p className="mt-1 text-xs text-slate-500">{item.riskReason}</p> : null}
        </article>
      ))}
    </div>
  );
}
