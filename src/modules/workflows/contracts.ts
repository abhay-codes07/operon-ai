import type { WorkflowStatus } from "@prisma/client";

export type WorkflowListItem = {
  id: string;
  organizationId: string;
  agentId: string;
  name: string;
  status: WorkflowStatus;
  scheduleCron?: string | null;
  createdAt: Date;
};
