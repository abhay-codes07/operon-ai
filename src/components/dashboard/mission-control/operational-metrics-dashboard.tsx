import { MetricCard } from "@/components/dashboard/metric-card";

type OperationalMetrics = {
  runsPerHour: number;
  successRate: number;
  incidentCount: number;
  averageExecutionSeconds: number;
};

export function OperationalMetricsDashboard({ metrics }: { metrics: OperationalMetrics }): JSX.Element {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      <MetricCard
        title="Runs / Hour"
        value={metrics.runsPerHour.toFixed(2)}
        detail="Average throughput in the active window"
        icon={<span>R</span>}
      />
      <MetricCard
        title="Success Rate"
        value={`${metrics.successRate.toFixed(2)}%`}
        detail="Execution outcome reliability"
        icon={<span>S</span>}
      />
      <MetricCard
        title="Incident Count"
        value={`${metrics.incidentCount}`}
        detail="Detected operational anomalies"
        icon={<span>I</span>}
      />
      <MetricCard
        title="Avg Runtime"
        value={`${metrics.averageExecutionSeconds.toFixed(1)}s`}
        detail="Execution time across completed runs"
        icon={<span>T</span>}
      />
    </div>
  );
}
