import { SignOutButton } from "@/components/auth/sign-out-button";
import { AppShell } from "@/components/layout/app-shell";
import { SectionHeading } from "@/components/ui/section-heading";
import { StatusBadge } from "@/components/ui/status-badge";
import { requireAuthenticatedUser } from "@/server/auth/authorization";

export default async function DashboardPage(): Promise<JSX.Element> {
  const user = await requireAuthenticatedUser();

  return (
    <main className="py-10 md:py-14">
      <AppShell className="space-y-8">
        <SectionHeading
          eyebrow="Workspace"
          title={`Welcome back, ${user.name ?? "Operator"}`}
          description="Authentication and tenancy scaffolding is active. Next phases will attach agents, workflows, and execution systems."
          actions={<SignOutButton />}
        />

        <section className="grid gap-4 md:grid-cols-3">
          <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Organization</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">
              {user.organizationName ?? "Unassigned"}
            </p>
          </article>
          <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Role</p>
            <div className="mt-2">
              <StatusBadge label={user.role ?? "MEMBER"} variant="neutral" />
            </div>
          </article>
          <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Session</p>
            <p className="mt-2 text-sm font-medium text-slate-900">Secure JWT session active</p>
          </article>
        </section>
      </AppShell>
    </main>
  );
}
