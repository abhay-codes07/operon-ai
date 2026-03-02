import { SignOutButton } from "@/components/auth/sign-out-button";

type DashboardTopbarProps = {
  organizationName?: string;
};

export function DashboardTopbar({ organizationName }: DashboardTopbarProps): JSX.Element {
  return (
    <header className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Organization</p>
        <p className="text-sm font-semibold text-slate-900">{organizationName ?? "Unassigned workspace"}</p>
      </div>
      <SignOutButton />
    </header>
  );
}
