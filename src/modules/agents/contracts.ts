import type { AgentStatus } from "@prisma/client";

export type AgentListItem = {
  id: string;
  organizationId: string;
  name: string;
  description?: string | null;
  status: AgentStatus;
  reliabilityScore?: number | null;
  createdAt: Date;
  updatedAt: Date;
};
