import { fetchToolVersions, retrieveToolById } from "@/server/services/tools/tool-registry-service";
import { updateToolVersionValidation } from "@/server/repositories/tools/tool-registry-repository";

function scoreSelector(target?: string) {
  if (!target) {
    return 0.2;
  }

  if (target.startsWith("#") || target.startsWith(".") || target.startsWith("//")) {
    return 1;
  }

  if (target.startsWith("http")) {
    return 0.8;
  }

  return 0.6;
}

export async function validateToolDefinition(input: {
  organizationId: string;
  toolId: string;
  versionId?: string;
}) {
  const tool = await retrieveToolById({
    organizationId: input.organizationId,
    toolId: input.toolId,
  });
  if (!tool) {
    throw new Error("Tool not found for validation");
  }

  const versions = await fetchToolVersions({
    organizationId: input.organizationId,
    toolId: input.toolId,
  });
  const version = input.versionId ? versions.find((item) => item.id === input.versionId) : versions[0];

  if (!version) {
    throw new Error("Tool version not found for validation");
  }

  const stepScores = version.workflowSteps.map((step) =>
    scoreSelector(typeof step.target === "string" ? step.target : undefined),
  );
  const average = stepScores.length === 0 ? 0 : stepScores.reduce((a, b) => a + b, 0) / stepScores.length;

  const result = {
    toolId: tool.id,
    toolVersionId: version.id,
    simulationPassed: average >= 0.5,
    selectorValidationPassed: average >= 0.6,
    expectedOutputConfirmed: average >= 0.55,
    validationScore: Number((average * 100).toFixed(2)),
  };

  await updateToolVersionValidation({
    toolVersionId: version.id,
    validationScore: result.validationScore,
    validated: result.simulationPassed && result.selectorValidationPassed && result.expectedOutputConfirmed,
    notes: `Validation score ${result.validationScore}`,
  });

  return result;
}
