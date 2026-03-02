export type AgentStatus = "draft" | "active" | "paused";

export type Agent = {
  id: string;
  name: string;
  status: AgentStatus;
  createdAt: Date;
};
