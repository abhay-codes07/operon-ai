import { notFound } from "next/navigation";

import { SLAConfigForm } from "@/components/workflows/sla-config-form";
import { requireOrganizationRole } from "@/server/auth/authorization";
import { prisma } from "@/server/db/client";

type WorkflowSLAConfigPageProps = {
  params: {
    id: string;
  };
};

export default async function WorkflowSLAConfigPage({
  params,
}: WorkflowSLAConfigPageProps): Promise<JSX.Element> {
  const user = await requireOrganizationRole("MEMBER");
  const workflow = await prisma.workflow.findFirst({
    where: {
      id: params.id,
      organizationId: user.organizationId!,
    },
    include: {
      workflowSLA: true,
    },
  });

  if (!workflow) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5 px-4 py-8">
      <header className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Workflow SLA Contract</p>
        <h1 className="text-2xl font-semibold text-slate-900">{workflow.name}</h1>
        <p className="text-sm text-slate-600">Define failure, schedule, timeout, and escalation thresholds.</p>
      </header>
      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <SLAConfigForm
          workflowId={workflow.id}
          initial={{
            expectedSchedule: workflow.workflowSLA?.expectedSchedule ?? workflow.scheduleCron ?? "*/15 * * * *",
            maxFailureRate: workflow.workflowSLA?.maxFailureRate ?? 0.2,
            maxExecutionTimeSeconds: workflow.workflowSLA?.maxExecutionTimeSeconds ?? 180,
            rollingWindowDays: workflow.workflowSLA?.rollingWindowDays ?? 7,
            notificationSlackChannel: workflow.workflowSLA?.notificationSlackChannel ?? "",
            notificationEmail: workflow.workflowSLA?.notificationEmail ?? "",
            escalationAfterBreaches: workflow.workflowSLA?.escalationAfterBreaches ?? 3,
          }}
        />
      </section>
    </div>
  );
}
