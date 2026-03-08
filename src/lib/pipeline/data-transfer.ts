export type JsonRecord = Record<string, unknown>;

type InputMapping = {
  inject?: Record<string, string>;
};

type OutputMapping = {
  expose?: Record<string, string>;
};

function getByPath(source: JsonRecord, path: string): unknown {
  return path.split(".").reduce<unknown>((current, part) => {
    if (current && typeof current === "object" && part in (current as JsonRecord)) {
      return (current as JsonRecord)[part];
    }
    return undefined;
  }, source);
}

export function serializeAgentOutput(output: unknown): JsonRecord {
  if (!output || typeof output !== "object") {
    return { value: output ?? null };
  }
  return output as JsonRecord;
}

export function mergeStepOutputIntoContext(
  currentContext: JsonRecord,
  stepOutput: JsonRecord,
  outputMapping: OutputMapping,
): JsonRecord {
  const nextContext: JsonRecord = { ...currentContext };
  const expose = outputMapping.expose ?? {};

  for (const [contextKey, outputPath] of Object.entries(expose)) {
    nextContext[contextKey] = getByPath(stepOutput, outputPath);
  }

  if (Object.keys(expose).length === 0) {
    nextContext.lastStepOutput = stepOutput;
  }

  return nextContext;
}

export function buildStepInputFromContext(
  baseInput: JsonRecord,
  context: JsonRecord,
  inputMapping: InputMapping,
): JsonRecord {
  const injected = inputMapping.inject ?? {};
  const nextInput: JsonRecord = { ...baseInput };

  for (const [targetKey, contextPath] of Object.entries(injected)) {
    nextInput[targetKey] = getByPath(context, contextPath);
  }

  return nextInput;
}
