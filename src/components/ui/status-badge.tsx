import { cn } from "@/lib/utils/cn";

type BadgeVariant = "success" | "warning" | "danger" | "neutral";

type StatusBadgeProps = {
  label: string;
  variant?: BadgeVariant;
  className?: string;
};

function getVariantClass(variant: BadgeVariant): string {
  switch (variant) {
    case "success":
      return "bg-emerald-100 text-emerald-700";
    case "warning":
      return "bg-amber-100 text-amber-700";
    case "danger":
      return "bg-rose-100 text-rose-700";
    case "neutral":
    default:
      return "bg-slate-100 text-slate-700";
  }
}

export function StatusBadge({ label, variant = "neutral", className }: StatusBadgeProps): JSX.Element {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wide",
        getVariantClass(variant),
        className,
      )}
    >
      {label}
    </span>
  );
}
