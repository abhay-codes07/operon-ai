import { Suspense } from "react";
import { StatusFilter } from "@/components/dashboard/layout/status-filter";
import { CreateWorkflowModal } from "@/components/dashboard/workflows/create-workflow-modal";
import { WorkflowsTable } from "@/components/dashboard/workflows/workflows-table";
import { requireOrganizationRole } from "@/server/auth/authorization";
import { fetchAgentCatalog } from "@/server/services/agents/agent-service";
import { prisma } from "@/server/db/client";
import { fetchWorkflowCatalog } from "@/server/services/workflows/workflow-service";

type DashboardWorkflowsPageProps = {
  searchParams?: {
    status?: string;
    query?: string;
  };
};

export default async function DashboardWorkflowsPage({
  searchParams,
}: DashboardWorkflowsPageProps): Promise<JSX.Element> {
  const user = await requireOrganizationRole("MEMBER");
  const queryFilter = searchParams?.query?.trim();
  const statusFilter =
    searchParams?.status === "DRAFT" ||
    searchParams?.status === "ACTIVE" ||
    searchParams?.status === "PAUSED" ||
    searchParams?.status === "ARCHIVED"
      ? searchParams.status
      : undefined;
  const agents = await fetchAgentCatalog({
    organizationId: user.organizationId!,
    page: 1,
    pageSize: 100,
  });
  const workflows = await fetchWorkflowCatalog({
    organizationId: user.organizationId!,
    status: statusFilter,
    query: queryFilter,
    page: 1,
    pageSize: 25,
  });
  const workflowIds = workflows.items.map((item) => item.id);
  const [slaRows, incidentRows, blastRadiusRows] = workflowIds.length
    ? await Promise.all([
        prisma.workflowSLA.findMany({
          where: { workflowId: { in: workflowIds } },
          select: {
            workflowId: true,
            maxFailureRate: true,
          },
        }),
        prisma.sLABreachIncident.findMany({
          where: {
            workflowId: { in: workflowIds },
            resolvedAt: null,
          },
          select: {
            workflowId: true,
            detectedAt: true,
          },
        }),
        prisma.blastRadiusScore.findMany({
          where: {
            workflowId: { in: workflowIds },
          },
          select: {
            workflowId: true,
            score: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
        }),
      ])
    : [[], [], []];
  const activeApprovals = workflowIds.length
    ? await prisma.workflowComplianceApproval.findMany({
        where: {
          organizationId: user.organizationId!,
          workflowId: { in: workflowIds },
          revokedAt: null,
        },
        select: {
          workflowId: true,
        },
      })
    : [];
  const approvedWorkflowIds = new Set(activeApprovals.map((item) => item.workflowId));
  const unapprovedCount = workflowIds.filter((id) => !approvedWorkflowIds.has(id)).length;
  const slaMap = new Map<string, { workflowId: string; maxFailureRate: number }>(
    slaRows.map((row) => [
      row.workflowId,
      {
        workflowId: row.workflowId,
        maxFailureRate: Number(row.maxFailureRate),
      },
    ]),
  );
  const incidentCountMap = new Map<string, number>();
  for (const incident of incidentRows) {
    incidentCountMap.set(incident.workflowId, (incidentCountMap.get(incident.workflowId) ?? 0) + 1);
  }
  const blastRadiusMap = new Map<string, number>();
  for (const row of blastRadiusRows) {
    if (!blastRadiusMap.has(row.workflowId)) {
      blastRadiusMap.set(row.workflowId, row.score);
    }
  }
  const openBreachCount = incidentRows.length;

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl p-8 text-white">
        <h1 className="text-4xl font-bold mb-2">Workflow Library</h1>
        <p className="text-blue-100 text-lg">Design, schedule, and deploy deterministic multi-step browser operations.</p>
      </div>

      {/* Alerts */}
      <div className="space-y-3">
        {openBreachCount > 0 ? (
          <div className="bg-gradient-to-r from-red-950 to-red-900 border border-red-700/50 rounded-lg p-4 text-red-100">
            <p className="font-semibold">🚨 {openBreachCount} active SLA breach incident{openBreachCount === 1 ? "" : "s"} detected</p>
            <p className="text-red-200 text-sm mt-1">Please review affected workflows to ensure compliance.</p>
          </div>
        ) : null}
        {unapprovedCount > 0 ? (
          <div className="bg-gradient-to-r from-amber-950 to-amber-900 border border-amber-700/50 rounded-lg p-4 text-amber-100">
            <p className="font-semibold">⚠️ {unapprovedCount} workflow{unapprovedCount === 1 ? "" : "s"} missing compliance approval</p>
            <p className="text-amber-200 text-sm mt-1">Request approval to deploy these workflows.</p>
          </div>
        ) : null}
      </div>

      {/* Main Card */}
      <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl border border-slate-700/50 backdrop-blur-sm p-6 space-y-6">
        {/* Search and Filter Bar */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <form method="GET" className="flex-1">
            <label htmlFor="workflow-query" className="sr-only">
              Search workflows
            </label>
            <input
              id="workflow-query"
              name="query"
              defaultValue={queryFilter}
              placeholder="🔍 Search workflow by name or description..."
              className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700/50 rounded-lg text-white placeholder-slate-500 focus:border-cyan-500/50 focus:outline-none transition-colors"
            />
          </form>
          <div className="flex gap-3">
            <Suspense fallback={null}>
              <StatusFilter
                options={[
                  { label: "All", value: "ALL" },
                  { label: "Draft", value: "DRAFT" },
                  { label: "Active", value: "ACTIVE" },
                  { label: "Paused", value: "PAUSED" },
                  { label: "Archived", value: "ARCHIVED" },
                ]}
              />
            </Suspense>
            <CreateWorkflowModal
              agents={agents.items
                .filter((agent) => agent.status !== "ARCHIVED")
                .map((agent) => ({ id: agent.id, name: agent.name }))}
            />
          </div>
        </div>

        {/* Workflows Table */}
        <WorkflowsTable
          items={workflows.items.map((item) => {
            const hasSla = slaMap.has(item.id);
            const breaches = incidentCountMap.get(item.id) ?? 0;
            const sla = slaMap.get(item.id);
            const warning = hasSla && breaches === 0 && Number(sla?.maxFailureRate ?? 0) <= 0.1;
            return {
              ...item,
              hasSla,
              complianceApproved: approvedWorkflowIds.has(item.id),
              slaState: breaches > 0 ? "BREACHED" : warning ? "WARNING" : "HEALTHY",
              blastRadiusScore: blastRadiusMap.get(item.id) ?? null,
            };
          })}
        />
      </div>
    </div>
  );
}
