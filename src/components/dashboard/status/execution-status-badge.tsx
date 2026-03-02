import { StatusBadge } from "@/components/ui/status-badge";

const executionStatusVariant = {
  QUEUED: "neutral",
  RUNNING: "warning",
  SUCCEEDED: "success",
  FAILED: "danger",
  CANCELED: "neutral",
} as const;

type ExecutionStatusBadgeProps = {
  status: keyof typeof executionStatusVariant;
};

export function ExecutionStatusBadge({ status }: ExecutionStatusBadgeProps): JSX.Element {
  return <StatusBadge label={status} variant={executionStatusVariant[status]} />;
}
