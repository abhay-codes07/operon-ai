import {
  createAgentInsight,
  fetchKnowledgeGraph,
  upsertDomainKnowledge,
  upsertSharedSignal,
} from "@/server/repositories/knowledge/knowledge-repository";

function extractDomainFromTarget(target?: string | null) {
  if (!target) {
    return null;
  }

  try {
    return new URL(target).hostname.toLowerCase();
  } catch {
    return null;
  }
}

export async function ingestExecutionKnowledge(input: {
  organizationId: string;
  agentId: string;
  executionId: string;
  workflowId?: string | null;
  status: "SUCCEEDED" | "FAILED";
  stepTargets: Array<string | null | undefined>;
  failureCategory?: string;
}) {
  const domains = new Set(input.stepTargets.map((target) => extractDomainFromTarget(target)).filter(Boolean) as string[]);

  for (const domain of domains) {
    const knowledge = await upsertDomainKnowledge({
      organizationId: input.organizationId,
      domain,
      issueDelta: input.status === "FAILED" ? 1 : 0,
      stabilityScore: input.status === "FAILED" ? 0.45 : 0.92,
      metadata: {
        sourceExecutionId: input.executionId,
      },
    });

    await upsertSharedSignal({
      organizationId: input.organizationId,
      domainKnowledgeId: knowledge.id,
      signalType: "execution-status",
      signalKey: `${domain}:${input.status.toLowerCase()}`,
      signalValue: {
        executionId: input.executionId,
        workflowId: input.workflowId ?? null,
        status: input.status,
      },
    });

    await createAgentInsight({
      organizationId: input.organizationId,
      agentId: input.agentId,
      domainKnowledgeId: knowledge.id,
      insightType: input.status === "FAILED" ? "risk" : "stability",
      insightKey: `${domain}:${input.failureCategory ?? "none"}`,
      insightValue: {
        domain,
        failureCategory: input.failureCategory ?? null,
        status: input.status,
      },
      confidence: input.status === "FAILED" ? 0.84 : 0.66,
    });
  }
}

export async function fetchKnowledgeGraphSnapshot(organizationId: string) {
  return fetchKnowledgeGraph(organizationId);
}

export async function fetchKnowledgeContextForExecution(input: {
  organizationId: string;
  stepTargets: Array<string | null | undefined>;
}) {
  const graph = await fetchKnowledgeGraph(input.organizationId);
  const targetDomains = new Set(
    input.stepTargets
      .map((target) => extractDomainFromTarget(target))
      .filter(Boolean) as string[],
  );

  return {
    domains: graph.domains.filter((domain) => targetDomains.has(domain.domain)).slice(0, 10),
    signals: graph.signals
      .filter((signal) => {
        const [domainPrefix] = signal.signalKey.split(":");
        return domainPrefix ? targetDomains.has(domainPrefix) : false;
      })
      .slice(0, 20),
  };
}
