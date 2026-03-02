import { DashboardCard } from "@/components/dashboard/layout/dashboard-card";
import { Skeleton } from "@/components/ui/feedback/skeleton";

export default function DashboardLoading(): JSX.Element {
  return (
    <div className="space-y-5">
      <DashboardCard>
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
      </DashboardCard>
      <DashboardCard>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
      </DashboardCard>
    </div>
  );
}
