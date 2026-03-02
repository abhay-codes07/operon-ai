import { DashboardCard } from "@/components/dashboard/layout/dashboard-card";
import { Skeleton } from "@/components/ui/feedback/skeleton";

export default function DashboardAgentsLoading(): JSX.Element {
  return (
    <DashboardCard>
      <div className="space-y-3">
        <Skeleton className="h-12" />
        <Skeleton className="h-12" />
        <Skeleton className="h-12" />
        <Skeleton className="h-12" />
        <Skeleton className="h-12" />
      </div>
    </DashboardCard>
  );
}
