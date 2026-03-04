import { getSystemFlag, upsertSystemFlag } from "@/server/repositories/control-plane/system-flag-repository";

const AGENT_EXECUTION_FLAG_KEY = "agentExecutionEnabled";

export async function isAgentExecutionEnabled() {
  const globalFlag = await getSystemFlag({
    key: AGENT_EXECUTION_FLAG_KEY,
    organizationId: null,
  });

  if (!globalFlag) {
    return true;
  }

  return globalFlag.enabled;
}

export async function setGlobalAgentExecutionEnabled(input: {
  enabled: boolean;
  metadata?: Record<string, unknown>;
}) {
  return upsertSystemFlag({
    key: AGENT_EXECUTION_FLAG_KEY,
    organizationId: null,
    enabled: input.enabled,
    metadata: input.metadata,
  });
}
