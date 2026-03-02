import { MetricCard } from "@/components/dashboard/metric-card";
import { AppShell } from "@/components/layout/app-shell";
import { siteConfig } from "@/config/site";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/ui/section-heading";
import { StatusBadge } from "@/components/ui/status-badge";

const recentExecutions = [
  {
    id: "exec_9134",
    agentName: "Invoice Reconciler",
    workflow: "Portal login > export CSV > sync ERP",
    status: "Completed",
    timestamp: "2m ago",
  },
  {
    id: "exec_9133",
    agentName: "Inventory Watchdog",
    workflow: "Supplier site > stock check > Slack alert",
    status: "Running",
    timestamp: "8m ago",
  },
  {
    id: "exec_9132",
    agentName: "Refund Processor",
    workflow: "Gateway dashboard > verify > refund issue",
    status: "Failed",
    timestamp: "17m ago",
  },
] as const;

function toBadgeVariant(status: string): "success" | "warning" | "danger" {
  if (status === "Completed") {
    return "success";
  }

  if (status === "Running") {
    return "warning";
  }

  return "danger";
}

export default function Home(): JSX.Element {
  return (
    <main className="py-10 md:py-14">
      <AppShell className="space-y-10">
        <SectionHeading
          eyebrow="Operations Command"
          title="Autonomous web workflows, with full execution traceability"
          description={`${siteConfig.name} deploys deterministic AI agents that operate live browser workflows across your SaaS stack.`}
          actions={<Button>Create Agent</Button>}
        />

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            title="Active Agents"
            value="14"
            detail="3 added this week"
            icon={<span className="text-xs font-semibold uppercase">AGT</span>}
          />
          <MetricCard
            title="Executions Today"
            value="287"
            detail="+22% vs yesterday"
            icon={<span className="text-xs font-semibold uppercase">RUN</span>}
          />
          <MetricCard
            title="Success Rate"
            value="96.4%"
            detail="After automated retries"
            icon={<span className="text-xs font-semibold uppercase">SLA</span>}
          />
          <MetricCard
            title="Log Events"
            value="12,483"
            detail="Structured and searchable"
            icon={<span className="text-xs font-semibold uppercase">LOG</span>}
          />
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Recent Executions</h2>
          <p className="mt-1 text-sm text-slate-600">Live task history across all agent workflows</p>

          <div className="mt-6 space-y-3">
            {recentExecutions.map((execution) => (
              <article
                key={execution.id}
                className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-900">{execution.agentName}</p>
                  <p className="text-xs text-slate-600">{execution.workflow}</p>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge label={execution.status} variant={toBadgeVariant(execution.status)} />
                  <p className="text-xs font-medium text-slate-500">{execution.timestamp}</p>
                </div>
              </article>
            ))}
          </div>
        </section>
      </AppShell>
    </main>
  );
}
