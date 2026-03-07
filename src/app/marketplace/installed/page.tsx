import Link from "next/link";

import { listInstallationsByOrganization } from "@/lib/marketplace/marketplace.service";
import { requireOrganizationRole } from "@/server/auth/authorization";

export default async function MarketplaceInstalledPage(): Promise<JSX.Element> {
  const user = await requireOrganizationRole("MEMBER");
  const installations = await listInstallationsByOrganization(user.organizationId!);

  return (
    <div className="mx-auto max-w-5xl space-y-5 px-4 py-8">
      <header className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">OperonHub</p>
        <h1 className="text-2xl font-semibold text-slate-900">Installed Templates</h1>
      </header>

      {installations.length === 0 ? (
        <p className="text-sm text-slate-600">
          No template installed yet.{" "}
          <Link href="/marketplace" className="font-medium text-slate-900 underline">
            Browse OperonHub
          </Link>
        </p>
      ) : (
        <div className="space-y-2">
          {installations.map((item) => (
            <article key={item.id} className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-sm font-semibold text-slate-900">{item.template.title}</p>
              <p className="mt-1 text-xs text-slate-600">
                Version {item.installedVersion} • Status {item.status} • Installed{" "}
                {new Date(item.installedAt).toLocaleString()}
              </p>
              <p className="mt-1 text-xs text-slate-600">
                Reliability {item.template.reliabilityScore.toFixed(1)} • Installs {item.template.installCount}
              </p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
