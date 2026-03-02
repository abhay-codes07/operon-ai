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

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "block rounded-xl border px-4 py-3 transition-colors",
              isActive
                ? "border-slate-900 bg-slate-900 text-white"
                : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50",
            )}
          >
            <p className="text-sm font-semibold">{item.label}</p>
            <p className={cn("text-xs", isActive ? "text-slate-300" : "text-slate-500")}>{item.description}</p>
          </Link>
        );
      })}
    </nav>
  );
}
