import { listAgentMemory, upsertAgentMemory } from "@/server/repositories/agents/memory-repository";

export async function rememberExecutionPattern(input: {
  organizationId: string;
  agentId: string;
  workflowId?: string;
  executionId: string;
  status: "SUCCEEDED" | "FAILED";
  summary?: string;
  resolvedFailures?: string[];
}) {
  const now = new Date().toISOString();

  await upsertAgentMemory({
    organizationId: input.organizationId,
    agentId: input.agentId,
    workflowId: input.workflowId,
    sourceExecutionId: input.executionId,
    kind: "RUN_METADATA",
    memoryKey: "last-run-metadata",
    memoryValue: {
      status: input.status,
      summary: input.summary ?? null,
      timestamp: now,
    },
    confidence: 0.95,
  });

  if (input.status === "FAILED") {
    await upsertAgentMemory({
      organizationId: input.organizationId,
      agentId: input.agentId,
      workflowId: input.workflowId,
      sourceExecutionId: input.executionId,
      kind: "FAILURE_RESOLUTION",
      memoryKey: "recent-failure-resolution",
      memoryValue: {
        resolvedFailures: input.resolvedFailures ?? [],
        timestamp: now,
      },
      confidence: 0.8,
    });
  }
}

export async function fetchAgentMemoryContext(input: {
  organizationId: string;
  agentId: string;
  workflowId?: string;
}) {
  return listAgentMemory(input);
}
