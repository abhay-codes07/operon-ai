import Link from "next/link";
import { notFound } from "next/navigation";

import { DashboardCard } from "@/components/dashboard/layout/dashboard-card";
import { ShieldEventsTable } from "@/components/dashboard/shield/shield-events-table";
import { getBehaviorBaseline, latestShieldPolicy } from "@/lib/shield/policy.service";
import { requireOrganizationRole } from "@/server/auth/authorization";
import { prisma } from "@/server/db/client";

type WorkflowShieldPageProps = {
  params: {
    id: string;
  };
};

export default async function WorkflowShieldPage({ params }: WorkflowShieldPageProps): Promise<JSX.Element> {
  const user = await requireOrganizationRole("MEMBER");

  const workflow = await prisma.workflow.findFirst({
    where: {
      id: params.id,
      organizationId: user.organizationId!,
    },
    select: {
      id: true,
      name: true,
      definition: true,
    },
  });

  if (!workflow) {
    notFound();
  }

  const [events, policy, baseline] = await Promise.all([
    prisma.promptInjectionEvent.findMany({
      where: {
        workflowId: workflow.id,
      },
      orderBy: {
        detectedAt: "desc",
      },
      take: 20,
      include: {
        workflow: {
          select: {
            id: true,
            name: true,
          },
        },
        run: {
          select: {
            id: true,
            status: true,
          },
        },
      },
    }),
    latestShieldPolicy(user.organizationId!),
    getBehaviorBaseline(workflow.id),
  ]);

  const definition = workflow.definition as {
    naturalLanguageTask?: string;
    steps?: Array<{ action?: string; target?: string }>;
  };

  const trustedInstructions = definition.naturalLanguageTask ?? "";
  const untrustedStepTargets = (definition.steps ?? [])
    .map((step) => `${step.action ?? ""} ${step.target ?? ""}`.trim())
    .filter((value) => value.length > 0)
    .slice(0, 12);

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Workflow Security</p>
        <h1 className="text-2xl font-semibold text-slate-900">{workflow.name}</h1>
        <p className="text-sm text-slate-600">
          Trusted instruction boundaries, threat history, and enforcement posture.
        </p>
      </div>

      <DashboardCard title="Trusted vs Untrusted Context">
        <div className="grid gap-4 md:grid-cols-2">
          <article className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800">
              Trusted Workflow Instructions
            </p>
            <p className="mt-2 whitespace-pre-wrap text-sm text-emerald-900">
              {trustedInstructions || "No explicit natural language task configured."}
            </p>
          </article>
          <article className="rounded-lg border border-amber-200 bg-amber-50 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-800">Untrusted Web Data Inputs</p>
            <ul className="mt-2 space-y-1 text-sm text-amber-900">
              {untrustedStepTargets.length === 0 ? (
                <li>No target selectors configured.</li>
              ) : (
                untrustedStepTargets.map((item) => <li key={item}>{item}</li>)
              )}
            </ul>
          </article>
        </div>
      </DashboardCard>

      <DashboardCard title="Policy Enforcement">
        <div className="space-y-2 text-sm text-slate-700">
          <p>
            <span className="font-semibold text-slate-900">Allowed domains:</span>{" "}
            {Array.isArray(policy?.allowedDomains) && policy.allowedDomains.length > 0
              ? (policy.allowedDomains as string[]).join(", ")
              : "No domain allowlist configured"}
          </p>
          <p>
            <span className="font-semibold text-slate-900">Blocked actions:</span>{" "}
            {Array.isArray(policy?.blockedActions) && policy.blockedActions.length > 0
              ? (policy.blockedActions as string[]).join(", ")
              : "No blocked actions configured"}
          </p>
          <p>
            <span className="font-semibold text-slate-900">Behavior baseline:</span>{" "}
            {baseline ? "Active" : "Not configured"}
          </p>
          <Link href="/dashboard/shield" className="text-xs font-semibold text-slate-700 underline">
            Manage Shield policy
          </Link>
        </div>
      </DashboardCard>

      <DashboardCard title="Recent Threats">
        <ShieldEventsTable
          items={events.map((event) => ({
            id: event.id,
            url: event.url,
            domLocation: event.domLocation,
            severity: event.severity,
            riskScore: event.riskScore,
            detectedAt: event.detectedAt.toISOString(),
            workflow: {
              id: event.workflow.id,
              name: event.workflow.name,
            },
            run: {
              id: event.run.id,
              status: event.run.status,
            },
          }))}
        />
      </DashboardCard>
    </div>
  );
}
