"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { cn } from "@/lib/utils/cn";

type StatusFilterOption = {
  label: string;
  value: string;
};

type StatusFilterProps = {
  options: StatusFilterOption[];
  queryKey?: string;
};

export function StatusFilter({ options, queryKey = "status" }: StatusFilterProps): JSX.Element {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeValue = searchParams.get(queryKey) ?? "ALL";

  function onSelect(value: string) {
    const next = new URLSearchParams(searchParams.toString());

    if (value === "ALL") {
      next.delete(queryKey);
    } else {
      next.set(queryKey, value);
    }

    router.push(`${pathname}?${next.toString()}`);
  }

  return (
    <div className="inline-flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white p-2">
      {options.map((option) => {
        const isActive = activeValue === option.value;

        return (
          <button
            type="button"
            key={option.value}
            onClick={() => onSelect(option.value)}
            aria-pressed={isActive}
            className={cn(
              "rounded-md px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition-colors",
              isActive
                ? "bg-slate-900 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
