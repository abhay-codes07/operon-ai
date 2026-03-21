import { SignOutButton } from "@/components/auth/sign-out-button";
import { EmergencyStopButton } from "@/components/dashboard/control-plane/emergency-stop-button";

type DashboardTopbarProps = {
  organizationName?: string;
};

export function DashboardTopbar({ organizationName }: DashboardTopbarProps): JSX.Element {
  return (
    <header className="flex items-center justify-between rounded-2xl border border-slate-700/60 bg-gradient-to-r from-slate-800 to-slate-900 px-5 py-3.5 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.4)]">
      <div className="flex items-center gap-3">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600">
          <svg className="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
          </svg>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Workspace</p>
          <p className="text-sm font-semibold text-white">{organizationName ?? "Unassigned workspace"}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <EmergencyStopButton />
        <SignOutButton />
      </div>
    </header>
  );
}
