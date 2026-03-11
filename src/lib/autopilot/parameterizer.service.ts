import type { CompiledWorkflowDefinition } from "@/lib/autopilot/types";

const emailRegex = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
const accountIdRegex = /\b(?:acct|account|customer)[-_ ]?[a-z0-9]{4,}\b/i;
const longTokenRegex = /\b[a-z0-9]{8,}\b/i;

type ParameterSchema = {
  parameters: Array<{
    key: string;
    label: string;
    sourceStep: number;
  }>;
};

export function detectWorkflowParameters(definition: CompiledWorkflowDefinition): {
  definition: CompiledWorkflowDefinition;
  schema: ParameterSchema;
} {
  const parameters: ParameterSchema["parameters"] = [];
  let parameterIndex = 1;

  const updatedSteps = definition.steps.map((step) => {
    const value = step.value ?? "";
    const normalized = value.trim();

    let key: string | undefined;
    let label: string | undefined;

    if (normalized && emailRegex.test(normalized)) {
      key = "email";
      label = "Email";
    } else if (normalized && accountIdRegex.test(normalized)) {
      key = "account_id";
      label = "Account ID";
    } else if (normalized.length >= 8 && longTokenRegex.test(normalized)) {
      key = `param_${parameterIndex++}`;
      label = `Input ${parameterIndex - 1}`;
    }

    if (!key || !label) {
      return step;
    }

    const dedupedKey = parameters.some((parameter) => parameter.key === key)
      ? `${key}_${step.order}`
      : key;

    parameters.push({
      key: dedupedKey,
      label,
      sourceStep: step.order,
    });

    return {
      ...step,
      parameterKey: dedupedKey,
      value: `{{${dedupedKey}}}`,
    };
  });

  return {
    definition: {
      ...definition,
      steps: updatedSteps,
    },
    schema: {
      parameters,
    },
  };
}
