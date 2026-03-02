import type { ReactNode } from "react";

import { AppShell } from "@/components/layout/app-shell";
import { DashboardSidebarNav } from "@/components/dashboard/layout/dashboard-sidebar-nav";
import { DashboardTopbar } from "@/components/dashboard/layout/dashboard-topbar";
import { requireAuthenticatedUser } from "@/server/auth/authorization";

type DashboardLayoutProps = {
  children: ReactNode;
};

export default async function DashboardLayout({ children }: DashboardLayoutProps): Promise<JSX.Element> {
  const user = await requireAuthenticatedUser();

  return (
    <main className="py-8 md:py-10">
      <AppShell className="grid gap-5 lg:grid-cols-[280px,1fr]">
        <aside className="space-y-3 lg:sticky lg:top-24 lg:h-fit">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">WebOps Console</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">{user.name ?? user.email}</p>
            <p className="text-xs text-slate-500">{user.role ?? "MEMBER"}</p>
          </div>
          <DashboardSidebarNav />
        </aside>

        <section className="space-y-5">
          <DashboardTopbar organizationName={user.organizationName} />
          {children}
        </section>
      </AppShell>
    </main>
  );
}
