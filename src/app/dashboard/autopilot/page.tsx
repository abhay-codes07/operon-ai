import Link from "next/link";

import { AutopilotDashboardPanel } from "@/components/dashboard/autopilot/autopilot-dashboard-panel";
import { DashboardCard } from "@/components/dashboard/layout/dashboard-card";
import { SectionHeading } from "@/components/ui/section-heading";
import {
  listAutopilotRepairEvents,
  listDomainMemories,
  listRecentAutopilotSessions,
} from "@/lib/autopilot/dashboard.service";
import { requireOrganizationRole } from "@/server/auth/authorization";

function toStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === "string") : [];
}

export default async function DashboardAutopilotPage(): Promise<JSX.Element> {
  const user = await requireOrganizationRole("MEMBER");
  const [sessions, memories, repairs] = await Promise.all([
    listRecentAutopilotSessions(user.organizationId!, 30),
    listDomainMemories(user.organizationId!, 30),
    listAutopilotRepairEvents(user.organizationId!, 60),
  ]);

  return (
    <div className="space-y-5">
      <SectionHeading
        eyebrow="Operon Autopilot"
        title="Learning and Self-Repair Control"
        description="Monitor captured sessions, memory quality, and auto-repair activity."
      />

      <DashboardCard
        title="Learn Mode"
        description="Capture a workflow from live interactions and compile it into a reusable, editable runbook."
        action={
          <Link href="/autopilot/learn" className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white">
            Open Learn Mode
          </Link>
        }
      >
        <AutopilotDashboardPanel
          sessions={sessions.map((session) => ({
            id: session.id,
            domain: session.domain,
            status: session.status,
            startedAt: session.startedAt.toISOString(),
            actions: session.actions.length,
            userLabel: session.user.name || session.user.email || session.user.id,
          }))}
          memories={memories.map((memory) => ({
            id: memory.id,
            domain: memory.domain,
            reliabilityScore: memory.reliabilityScore,
            selectorCount: toStringArray(memory.selectorPatterns).length,
            pathCount: toStringArray(memory.navigationPatterns).length,
            updatedAt: memory.updatedAt.toISOString(),
          }))}
          repairs={repairs.map((repair) => {
            const metadata =
              repair.metadata && typeof repair.metadata === "object"
                ? (repair.metadata as Record<string, unknown>)
                : {};

            return {
              id: repair.id,
              runId: repair.runId,
              occurredAt: repair.occurredAt.toISOString(),
              workflowName: repair.workflow?.name ?? null,
              strategy: typeof metadata.strategy === "string" ? metadata.strategy : null,
              failedSelector: typeof metadata.failedSelector === "string" ? metadata.failedSelector : null,
              repairedSelector: typeof metadata.repairedSelector === "string" ? metadata.repairedSelector : null,
            };
          })}
        />
      </DashboardCard>
    </div>
  );
}
