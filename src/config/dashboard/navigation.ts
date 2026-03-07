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
    href: "/dashboard/releases",
    label: "Releases",
    description: "Canary rollout control",
  },
  {
    href: "/dashboard/tools",
    label: "Tools",
    description: "Marketplace and installs",
  },
  {
    href: "/dashboard/reliability",
    label: "Reliability",
    description: "Agent trust scorecards",
  },
  {
    href: "/dashboard/impact",
    label: "Impact",
    description: "Business value metrics",
  },
  {
    href: "/dashboard/knowledge",
    label: "Knowledge",
    description: "Cross-agent learning graph",
  },
  {
    href: "/dashboard/control-plane",
    label: "Control Plane",
    description: "Approvals and live controls",
  },
  {
    href: "/dashboard/mission-control",
    label: "Mission Control",
    description: "Fleet ops and incidents",
  },
  {
    href: "/marketplace",
    label: "OperonHub",
    description: "Workflow marketplace",
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
  {
    href: "/dashboard/incidents",
    label: "Incidents",
    description: "SLA breach response",
  },
] as const;
