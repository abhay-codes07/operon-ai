import { StatusBadge } from "@/components/ui/status-badge";

import { formatStatusLabel } from "./status-utils";

const workflowStatusToVariant = {
  DRAFT: "neutral",
  ACTIVE: "success",
  PAUSED: "warning",
  ARCHIVED: "danger",
} as const;

type WorkflowStatusBadgeProps = {
  status: keyof typeof workflowStatusToVariant;
};

export function WorkflowStatusBadge({ status }: WorkflowStatusBadgeProps): JSX.Element {
  return <StatusBadge label={formatStatusLabel(status)} variant={workflowStatusToVariant[status]} />;
}
