import { DashboardCard } from "@/components/dashboard/layout/dashboard-card";
import { PulseDashboard } from "@/components/dashboard/pulse/pulse-dashboard";
import { requireOrganizationRole } from "@/server/auth/authorization";
import { prisma } from "@/server/db/client";

export default async function DashboardPulsePage(): Promise<JSX.Element> {
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
          Competitive Intelligence
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-white md:text-3xl">
          Competitive Pulse
        </h1>
        <p className="max-w-2xl text-sm text-slate-400 md:text-base">
          Deploy agents to continuously monitor competitor pricing, hiring signals,
          and feature launches. Get AI battle cards automatically.
        </p>
      </header>

      <DashboardCard
        title="Intelligence Engine"
        description="Add a competitor domain. Three agents will scan pricing, jobs, and feature signals simultaneously."
      >
        <PulseDashboard agents={agents} />
      </DashboardCard>
    </div>
  );
}
