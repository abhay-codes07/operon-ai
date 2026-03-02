import { DashboardCard } from "@/components/dashboard/layout/dashboard-card";
import { Skeleton } from "@/components/ui/feedback/skeleton";

export default function DashboardActivityLoading(): JSX.Element {
  return (
    <div className="grid gap-5 xl:grid-cols-[1.2fr,1fr]">
      <DashboardCard>
        <div className="space-y-3">
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
        </div>
      </DashboardCard>
      <DashboardCard>
        <div className="space-y-3">
          <Skeleton className="h-14" />
          <Skeleton className="h-14" />
          <Skeleton className="h-14" />
          <Skeleton className="h-14" />
        </div>
      </DashboardCard>
    </div>
  );
}
