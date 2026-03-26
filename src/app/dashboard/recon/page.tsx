import { DashboardCard } from "@/components/dashboard/layout/dashboard-card";
import { ReconLauncher } from "@/components/dashboard/recon/recon-launcher";
import { requireOrganizationRole } from "@/server/auth/authorization";
import { prisma } from "@/server/db/client";

export default async function DashboardReconPage(): Promise<JSX.Element> {
  const user = await requireOrganizationRole("MEMBER");

  const agents = await prisma.agent.findMany({
    where: { organizationId: user.organizationId! },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
          Autonomous Security
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-white md:text-3xl">
          Security Recon
        </h1>
        <p className="max-w-2xl text-sm text-slate-400 md:text-base">
          Deploy a swarm of agents to autonomously discover security vulnerabilities
          across your domain in minutes.
        </p>
      </header>

      <DashboardCard
        title="Recon Launcher"
        description="Enter a domain and select an agent. Six parallel security checks will run simultaneously."
      >
        <ReconLauncher agents={agents} />
      </DashboardCard>
    </div>
  );
}
