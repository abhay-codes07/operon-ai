import { cn } from "@/lib/utils/cn";

type ErrorPanelProps = {
  title: string;
  description: string;
  className?: string;
};

export function ErrorPanel({ title, description, className }: ErrorPanelProps): JSX.Element {
  return (
    <div className={cn("rounded-xl border border-rose-200 bg-rose-50 p-4", className)} role="alert">
      <p className="text-sm font-semibold text-rose-800">{title}</p>
      <p className="mt-1 text-sm text-rose-700">{description}</p>
    </div>
  );
}
