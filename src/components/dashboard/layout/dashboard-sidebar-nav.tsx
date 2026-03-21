"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  AlertTriangle,
  Bot,
  Brain,
  ClipboardCheck,
  CpuIcon,
  CreditCard,
  DollarSign,
  FlaskConical,
  GitBranch,
  LayoutDashboard,
  Lock,
  Network,
  Radar,
  Rocket,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
  Store,
  TrendingUp,
  Users,
  Wrench,
  Zap,
} from "lucide-react";

import { dashboardNav } from "@/config/dashboard/navigation";
import { cn } from "@/lib/utils/cn";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  Bot,
  Activity,
  GitBranch,
  Rocket,
  Wrench,
  ShieldCheck,
  TrendingUp,
  Brain,
  Zap,
  SlidersHorizontal,
  Users,
  Radar,
  Store,
  Network,
  Cpu: CpuIcon,
  CreditCard,
  DollarSign,
  Lock,
  FlaskConical,
  ShieldAlert,
  ClipboardCheck,
  AlertTriangle,
};

export function DashboardSidebarNav(): JSX.Element {
  const pathname = usePathname();

  return (
    <nav className="space-y-1">
      {dashboardNav.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = iconMap[item.icon];

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-all duration-150",
              isActive
                ? "border-cyan-500/40 bg-gradient-to-r from-cyan-500/15 to-blue-600/10 text-white shadow-[0_0_20px_-8px_rgba(34,211,238,0.4)]"
                : "border-transparent text-slate-400 hover:border-slate-700/60 hover:bg-slate-800/60 hover:text-slate-200",
            )}
          >
            {Icon ? (
              <span
                className={cn(
                  "flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg",
                  isActive
                    ? "bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-md"
                    : "bg-slate-800 text-slate-500 group-hover:text-slate-300",
                )}
              >
                <Icon className="h-3.5 w-3.5" />
              </span>
            ) : null}
            <div className="min-w-0">
              <p className={cn("text-sm font-medium leading-none", isActive ? "text-white" : "text-slate-300")}>
                {item.label}
              </p>
              <p className={cn("mt-0.5 truncate text-[11px]", isActive ? "text-cyan-300/70" : "text-slate-600")}>
                {item.description}
              </p>
            </div>
            {isActive ? (
              <span className="ml-auto h-1.5 w-1.5 flex-shrink-0 rounded-full bg-cyan-400" />
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
