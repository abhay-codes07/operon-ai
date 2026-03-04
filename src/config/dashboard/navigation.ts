export const dashboardNav = [
  {
    href: "/dashboard",
    label: "Overview",
    description: "Workspace health",
  },
  {
    href: "/dashboard/agents",
    label: "Agents",
    description: "Manage autonomous agents",
  },
  {
    href: "/dashboard/activity",
    label: "Activity",
    description: "Execution timeline",
  },
  {
    href: "/dashboard/workflows",
    label: "Workflows",
    description: "Builder and schedules",
  },
  {
    href: "/dashboard/billing",
    label: "Billing",
    description: "Plans and quota",
  },
  {
    href: "/dashboard/security",
    label: "Security",
    description: "Operational guardrails",
  },
] as const;
