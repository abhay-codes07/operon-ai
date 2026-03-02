import { StatusBadge } from "@/components/ui/status-badge";

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
  return <StatusBadge label={status} variant={agentStatusToVariant[status]} />;
}
