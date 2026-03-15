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
      <AppShell className="grid gap-6 lg:grid-cols-[300px,1fr]">
        <aside className="space-y-3 lg:sticky lg:top-24 lg:h-[calc(100vh-7rem)] lg:overflow-y-auto lg:pr-1">
          <div className="rounded-2xl border border-slate-200/80 bg-gradient-to-b from-white to-slate-50 p-4 shadow-[0_20px_34px_-28px_rgba(15,23,42,0.7)]">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Operon Console</p>
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

