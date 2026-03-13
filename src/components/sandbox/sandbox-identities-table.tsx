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
      {rows.length === 0 ? <p className="text-sm text-slate-600">No sandbox identities provisioned.</p> : null}
      {rows.map((row) => (
        <article key={row.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-slate-900">{row.workflow.name}</p>
              <p className="text-xs text-slate-600">
                {row.email} • {row.status}
              </p>
              <p className="text-xs text-slate-500">
                Fingerprint {row.fingerprintId} • Proxy {row.proxyId}
              </p>
            </div>
            <button
              type="button"
              onClick={() => void revoke(row.id)}
              className="rounded-md border border-rose-300 px-2 py-1 text-xs font-semibold text-rose-700"
            >
              Revoke
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}
