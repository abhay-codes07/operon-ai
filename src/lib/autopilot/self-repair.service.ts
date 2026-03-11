import { notifySelfRepairEvent } from "@/lib/autopilot/alert.service";
import { getDomainMemory } from "@/lib/autopilot/domain-memory.service";
import {
  findAlternativeSelector,
  testSelector,
  validateRepair,
} from "@/lib/autopilot/selector-repair.service";
import type { SelfRepairResult } from "@/lib/autopilot/types";
import { prisma } from "@/server/db/client";

export async function attemptSelfRepair(input: {
  orgId: string;
  runId: string;
  workflowId?: string;
  domain: string;
  failedSelector: string;
  candidateSelectors: string[];
}): Promise<SelfRepairResult> {
  const domainMemory = await getDomainMemory(input.orgId, input.domain);
  const memorySelectors = domainMemory?.selectorPatterns ?? [];

  const mergedCandidates = [...new Set([...input.candidateSelectors, ...memorySelectors])];
  const similarityRepair = findAlternativeSelector({
    failedSelector: input.failedSelector,
    candidates: mergedCandidates,
  });

  if (validateRepair(similarityRepair, mergedCandidates)) {
    await prisma.executionLog.create({
      data: {
        executionId: input.runId,
        organizationId: input.orgId,
        level: "WARN",
        message: "Autopilot selector repaired",
        metadata: {
          source: "autopilot_self_repair",
          domain: input.domain,
          failedSelector: input.failedSelector,
          repairedSelector: similarityRepair.selector,
          strategy: similarityRepair.strategy,
          confidence: similarityRepair.confidence,
        },
      },
    });
    await notifySelfRepairEvent({
      orgId: input.orgId,
      runId: input.runId,
      workflowId: input.workflowId,
      message: "Autopilot repair applied",
      metadata: {
        domain: input.domain,
        repairedSelector: similarityRepair.selector,
        strategy: similarityRepair.strategy,
      },
    });

    return similarityRepair;
  }

  const textMatch = mergedCandidates.find((candidate) =>
    candidate.toLowerCase().includes(input.failedSelector.toLowerCase().replace(/[#.]/g, "")),
  );

  if (textMatch && testSelector(textMatch, mergedCandidates)) {
    const repaired: SelfRepairResult = {
      repaired: true,
      selector: textMatch,
      strategy: "text_match",
      confidence: 0.5,
    };

    await prisma.executionLog.create({
      data: {
        executionId: input.runId,
        organizationId: input.orgId,
        level: "WARN",
        message: "Autopilot selector repaired",
        metadata: {
          source: "autopilot_self_repair",
          domain: input.domain,
          failedSelector: input.failedSelector,
          repairedSelector: repaired.selector,
          strategy: repaired.strategy,
          confidence: repaired.confidence,
        },
      },
    });
    await notifySelfRepairEvent({
      orgId: input.orgId,
      runId: input.runId,
      workflowId: input.workflowId,
      message: "Autopilot repair applied",
      metadata: {
        domain: input.domain,
        repairedSelector: repaired.selector,
        strategy: repaired.strategy,
      },
    });

    return repaired;
  }

  return {
    repaired: false,
    reason: "repair_failed",
  };
}
