import { cn } from "@/lib/utils/cn";
import type { ReactNode } from "react";

type DashboardCardProps = {
  title?: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function DashboardCard({ title, description, action, children, className }: DashboardCardProps) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-slate-700/60 bg-gradient-to-b from-slate-800/80 to-slate-900/80 p-5 shadow-[0_24px_40px_-20px_rgba(0,0,0,0.5)] backdrop-blur",
        className,
      )}
    >
      {title || action ? (
        <div className="flex items-start justify-between gap-3">
          {title ? <h2 className="text-base font-semibold tracking-tight text-white">{title}</h2> : <div />}
          {action ? <div>{action}</div> : null}
        </div>
      ) : null}
      {description ? <p className="mt-1 text-sm text-slate-400">{description}</p> : null}
      <div className={cn(title || description ? "mt-5" : "")}>{children}</div>
    </section>
  );
}
