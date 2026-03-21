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
    <main className="min-h-screen bg-slate-950 py-6 md:py-8">
      <AppShell className="grid gap-6 lg:grid-cols-[280px,1fr]">
        <aside className="space-y-3 lg:sticky lg:top-20 lg:h-[calc(100vh-6rem)] lg:overflow-y-auto lg:pr-1 scrollbar-thin scrollbar-track-slate-900 scrollbar-thumb-slate-700">
          <div className="rounded-2xl border border-slate-700/60 bg-gradient-to-b from-slate-800 to-slate-900 p-4 shadow-[0_20px_34px_-20px_rgba(0,0,0,0.6)]">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-sm font-bold text-white shadow-lg">
                {(user.name ?? user.email ?? "U").slice(0, 1).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{user.name ?? user.email}</p>
                <span className="inline-flex items-center rounded-full bg-cyan-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-cyan-400 border border-cyan-500/30">
                  {user.role ?? "MEMBER"}
                </span>
              </div>
            </div>
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

