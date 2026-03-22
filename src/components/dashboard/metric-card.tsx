import type { ReactNode } from "react";

type MetricCardProps = {
  title: string;
  value: string;
  detail: string;
  icon: ReactNode;
};

export function MetricCard({ title, value, detail, icon }: MetricCardProps): JSX.Element {
  return (
    <article className="rounded-xl border border-slate-700/60 bg-slate-900 p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm font-medium text-slate-400">{title}</p>
        <div className="text-slate-500">{icon}</div>
      </div>
      <p className="text-2xl font-semibold tracking-tight text-white">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{detail}</p>
    </article>
  );
}
