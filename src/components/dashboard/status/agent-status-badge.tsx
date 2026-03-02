import { StatusBadge } from "@/components/ui/status-badge";

import { formatStatusLabel } from "./status-utils";

const agentStatusToVariant = {
  DRAFT: "neutral",
  ACTIVE: "success",
  PAUSED: "warning",
  ARCHIVED: "danger",
} as const;

type AgentStatusBadgeProps = {
  status: keyof typeof agentStatusToVariant;
};

export function AgentStatusBadge({ status }: AgentStatusBadgeProps): JSX.Element {
  return <StatusBadge label={formatStatusLabel(status)} variant={agentStatusToVariant[status]} />;
}
