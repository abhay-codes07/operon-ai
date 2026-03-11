import Link from "next/link";

import { SessionDetailPanel } from "@/components/autopilot/session/session-detail-panel";
import { SectionHeading } from "@/components/ui/section-heading";
import { getAutopilotSessionById } from "@/lib/autopilot/dashboard.service";
import { requireOrganizationRole } from "@/server/auth/authorization";

type PageProps = {
  params: {
    id: string;
  };
};

export default async function AutopilotSessionDetailPage({ params }: PageProps): Promise<JSX.Element> {
  const user = await requireOrganizationRole("MEMBER");
  const session = await getAutopilotSessionById({
    orgId: user.organizationId!,
    sessionId: params.id,
  });

  if (!session) {
    return (
      <div className="mx-auto max-w-5xl space-y-4 px-4 py-6 md:px-6">
        <SectionHeading
          eyebrow="Operon Autopilot"
          title="Session not found"
          description="The requested Autopilot session does not exist in this organization."
        />
        <Link href="/dashboard/autopilot" className="text-sm font-semibold text-slate-700 underline">
          Back to Autopilot dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-4 px-4 py-6 md:px-6">
      <SectionHeading
        eyebrow="Operon Autopilot"
        title={`Session ${session.id.slice(-8)}`}
        description="Recorded action stream, generated behavior, and repair telemetry."
      />
      <SessionDetailPanel
        domain={session.domain}
        status={session.status}
        workflowFingerprint={session.workflowFingerprint}
        startedAt={session.startedAt.toISOString()}
        completedAt={session.completedAt ? session.completedAt.toISOString() : null}
        actions={session.actions.map((action) => ({
          id: action.id,
          actionType: action.actionType,
          selector: action.selector,
          value: action.value,
          timestamp: action.timestamp.toISOString(),
        }))}
        repairs={session.repairEvents.map((repair) => ({
          id: repair.id,
          strategy: repair.strategy,
          failedSelector: repair.failedSelector,
          repairedSelector: repair.repairedSelector,
          confidence: repair.confidence,
          success: repair.success,
          createdAt: repair.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
