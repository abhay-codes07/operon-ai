"use client";

import { useState } from "react";

type IdentityItem = {
  id: string;
  email: string;
  status: string;
  fingerprintId: string;
  proxyId: string;
  workflow: { id: string; name: string };
};

type SandboxIdentitiesTableProps = {
  items: IdentityItem[];
};

export function SandboxIdentitiesTable({ items }: SandboxIdentitiesTableProps) {
  const [rows, setRows] = useState(items);

  async function revoke(id: string) {
    const response = await fetch(`/api/sandbox/identities/${id}/revoke`, { method: "POST" });
    if (!response.ok) {
      return;
    }
    setRows((current) => current.map((row) => (row.id === id ? { ...row, status: "REVOKED" } : row)));
  }

  return (
    <div className="space-y-2">
      {rows.length === 0 ? <p className="text-sm text-slate-400">No sandbox identities provisioned.</p> : null}
      {rows.map((row) => (
        <article key={row.id} className="rounded-lg border border-[#1e2d5a]/60 bg-[#0d1428]/80 p-3 backdrop-blur-sm">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-white">{row.workflow.name}</p>
              <p className="text-xs text-slate-400">
                {row.email} • {row.status}
              </p>
              <p className="text-xs text-slate-500">
                Fingerprint {row.fingerprintId} • Proxy {row.proxyId}
              </p>
            </div>
            <button
              type="button"
              onClick={() => void revoke(row.id)}
              className="rounded-md border border-rose-500/30 bg-rose-500/10 px-2 py-1 text-xs font-semibold text-rose-400"
            >
              Revoke
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}
