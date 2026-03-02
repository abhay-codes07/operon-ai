import { cn } from "@/lib/utils/cn";
import type { ReactNode } from "react";

type DashboardCardProps = {
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
};

export function DashboardCard({ title, description, children, className }: DashboardCardProps) {
  return (
    <section className={cn("rounded-2xl border border-slate-200 bg-white p-5 shadow-sm", className)}>
      {title ? <h2 className="text-base font-semibold tracking-tight text-slate-900">{title}</h2> : null}
      {description ? <p className="mt-1 text-sm text-slate-600">{description}</p> : null}
      <div className={cn(title || description ? "mt-5" : "")}>{children}</div>
    </section>
  );
}
