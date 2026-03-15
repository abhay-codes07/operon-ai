"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { dashboardNav } from "@/config/dashboard/navigation";
import { cn } from "@/lib/utils/cn";

export function DashboardSidebarNav(): JSX.Element {
  const pathname = usePathname();

  return (
    <nav className="space-y-2">
      {dashboardNav.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
        const mark = item.label.slice(0, 1).toUpperCase();

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "block rounded-2xl border px-4 py-3 transition-all duration-200",
              isActive
                ? "border-slate-900 bg-gradient-to-r from-slate-900 to-slate-800 text-white shadow-[0_10px_24px_-14px_rgba(15,23,42,0.8)]"
                : "border-slate-200/90 bg-white/90 text-slate-700 hover:border-slate-300 hover:bg-white",
            )}
          >
            <div className="flex items-start gap-3">
              <span
                className={cn(
                  "inline-flex h-6 w-6 items-center justify-center rounded-md text-[10px] font-bold",
                  isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600",
                )}
              >
                {mark}
              </span>
              <div>
                <p className="text-sm font-semibold">{item.label}</p>
                <p className={cn("text-xs", isActive ? "text-slate-300" : "text-slate-500")}>{item.description}</p>
              </div>
            </div>
          </Link>
        );
      })}
    </nav>
  );
}
