import { StatusBadge } from "@/components/ui/status-badge";

import { formatStatusLabel } from "./status-utils";

const executionStatusVariant = {
  QUEUED: "neutral",
  RUNNING: "accent",
  SUCCEEDED: "success",
  FAILED: "danger",
  CANCELED: "warning",
} as const;

type ExecutionStatusBadgeProps = {
  status: keyof typeof executionStatusVariant;
};

export function ExecutionStatusBadge({ status }: ExecutionStatusBadgeProps): JSX.Element {
  return <StatusBadge label={formatStatusLabel(status)} variant={executionStatusVariant[status]} />;
}
