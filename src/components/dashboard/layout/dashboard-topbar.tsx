import { SignOutButton } from "@/components/auth/sign-out-button";
import { EmergencyStopButton } from "@/components/dashboard/control-plane/emergency-stop-button";

type DashboardTopbarProps = {
  organizationName?: string;
};

export function DashboardTopbar({ organizationName }: DashboardTopbarProps): JSX.Element {
  return (
    <header className="flex items-center justify-between rounded-2xl border border-slate-200/80 bg-gradient-to-r from-white to-slate-50 px-5 py-4 shadow-[0_22px_36px_-30px_rgba(15,23,42,0.6)]">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Organization</p>
        <p className="text-sm font-semibold text-slate-900">{organizationName ?? "Unassigned workspace"}</p>
      </div>
      <div className="flex items-center gap-2">
        <EmergencyStopButton />
        <SignOutButton />
      </div>
    </header>
  );
}
