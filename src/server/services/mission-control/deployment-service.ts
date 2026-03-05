import { upsertAgentDeployment, listAgentDeployments, updateAgentDeploymentActualRuns } from "@/server/repositories/mission-control/deployment-repository";
import { recordAgentFleetStatus } from "@/server/services/mission-control/fleet-service";

export async function deployAgent(input: {
  organizationId: string;
  agentId: string;
  desiredRuns: number;
  notes?: string;
}) {
  const deployment = await upsertAgentDeployment({
    organizationId: input.organizationId,
    agentId: input.agentId,
    desiredRuns: Math.max(1, input.desiredRuns),
    status: "RUNNING",
    notes: input.notes,
  });

  await updateAgentDeploymentActualRuns({
    organizationId: input.organizationId,
    agentId: input.agentId,
    actualRuns: Math.max(1, input.desiredRuns),
    status: "RUNNING",
  });

  await recordAgentFleetStatus({
    organizationId: input.organizationId,
    agentId: input.agentId,
    status: "RUNNING",
    reason: "Agent deployment initiated",
    metadata: {
      desiredRuns: deployment.desiredRuns,
    },
  });

  return deployment;
}

export async function fetchAgentDeploymentState(organizationId: string) {
  return listAgentDeployments(organizationId);
}
