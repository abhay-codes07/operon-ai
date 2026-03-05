import { createHash } from "crypto";

import { appendExecutionEvent } from "@/server/services/executions/execution-service";
import { evaluateAgentPolicy } from "@/server/services/security/policy-engine";
import { analyzeAgentActionRisk } from "@/server/services/security/risk-analysis-service";
import { runSandboxedAction } from "@/server/services/security/sandbox-runner-service";
import {
  appendAuditEvent,
  createExecutionAudit,
  updateExecutionAuditResult,
} from "@/server/repositories/security/audit-repository";

function buildIntentHash(input: { action: string; target?: string; payload?: Record<string, unknown> }) {
  const serial = JSON.stringify({
    action: input.action,
    target: input.target ?? null,
    payload: input.payload ?? null,
  });
  return createHash("sha256").update(serial).digest("hex");
}

export async function processAgentActionThroughGateway(input: {
  organizationId: string;
  executionId?: string;
  agentId: string;
  action: string;
  target?: string;
  payload?: Record<string, unknown>;
}) {
  const intentHash = buildIntentHash({
    action: input.action,
    target: input.target,
    payload: input.payload,
  });

  const policy = await evaluateAgentPolicy({
    organizationId: input.organizationId,
    agentId: input.agentId,
    action: input.action,
    target: input.target,
  });
  const risk = await analyzeAgentActionRisk({
    organizationId: input.organizationId,
    agentId: input.agentId,
    targetDomain: policy.targetDomain,
    policyDenied: !policy.allowed,
  });

  const audit = await createExecutionAudit({
    organizationId: input.organizationId,
    executionId: input.executionId,
    agentId: input.agentId,
    action: input.action,
    targetDomain: policy.targetDomain ?? undefined,
    intentHash,
    policyDecision: policy.allowed ? "ALLOW" : "DENY",
    result: policy.allowed ? "APPROVED" : "BLOCKED",
    riskLevel: risk.riskLevel,
    riskScore: risk.riskScore,
    riskReason: risk.riskReason,
    metadata: {
      policyReasons: policy.reasons,
      policyId: policy.policy?.id ?? null,
    },
  });

  await appendAuditEvent({
    organizationId: input.organizationId,
    executionAuditId: audit.id,
    eventType: "gateway.policy_evaluation",
    message: policy.allowed ? "Policy approved action" : "Policy blocked action",
    metadata: {
      reasons: policy.reasons,
    },
  });

  if (!policy.allowed) {
    if (input.executionId) {
      await appendExecutionEvent({
        organizationId: input.organizationId,
        executionId: input.executionId,
        level: "WARN",
        message: "Secure Agent Gateway blocked action",
        metadata: {
          action: input.action,
          target: input.target ?? null,
          reasons: policy.reasons,
          riskScore: risk.riskScore,
          auditId: audit.id,
        },
      });
    }

    return {
      allowed: false,
      auditId: audit.id,
      reasons: policy.reasons,
      risk,
      sandbox: null,
    } as const;
  }

  const sandbox = await runSandboxedAction({
    action: input.action,
    target: input.target,
    payload: input.payload,
  });

  await updateExecutionAuditResult({
    organizationId: input.organizationId,
    executionAuditId: audit.id,
    result: sandbox.result === "SUCCEEDED" ? "APPROVED" : "FAILED",
    metadata: {
      sandboxId: sandbox.sandboxId,
      durationMs: sandbox.durationMs,
      logs: sandbox.logs,
    },
  });

  await appendAuditEvent({
    organizationId: input.organizationId,
    executionAuditId: audit.id,
    eventType: "gateway.sandbox_execution",
    message:
      sandbox.result === "SUCCEEDED"
        ? "Sandbox execution approved action forwarding"
        : "Sandbox execution failed",
    metadata: {
      sandboxId: sandbox.sandboxId,
      durationMs: sandbox.durationMs,
      result: sandbox.result,
    },
  });

  if (input.executionId) {
    await appendExecutionEvent({
      organizationId: input.organizationId,
      executionId: input.executionId,
      level: sandbox.result === "SUCCEEDED" ? "INFO" : "ERROR",
      message:
        sandbox.result === "SUCCEEDED"
          ? "Secure Agent Gateway approved action"
          : "Secure Agent Gateway sandbox execution failed",
      metadata: {
        action: input.action,
        target: input.target ?? null,
        riskScore: risk.riskScore,
        sandboxId: sandbox.sandboxId,
        auditId: audit.id,
      },
    });
  }

  return {
    allowed: sandbox.result === "SUCCEEDED",
    auditId: audit.id,
    reasons: policy.reasons,
    risk,
    sandbox,
  } as const;
}
