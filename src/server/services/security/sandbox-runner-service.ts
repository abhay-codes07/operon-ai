function createSandboxId() {
  return `sandbox-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function runSandboxedAction(input: {
  action: string;
  target?: string;
  payload?: Record<string, unknown>;
}) {
  const sandboxId = createSandboxId();
  const startedAt = Date.now();
  const logs: string[] = [
    `sandbox.create:${sandboxId}`,
    `sandbox.action:${input.action}`,
  ];

  if (input.target) {
    logs.push(`sandbox.target:${input.target}`);
  }

  await new Promise((resolve) => setTimeout(resolve, 5));

  const succeeded = !input.action.toLowerCase().includes("forbidden");
  const result = succeeded ? "SUCCEEDED" : "FAILED";
  logs.push(`sandbox.result:${result}`);
  logs.push(`sandbox.destroy:${sandboxId}`);

  return {
    sandboxId,
    result,
    durationMs: Date.now() - startedAt,
    logs,
    output: {
      accepted: succeeded,
      payloadSize: input.payload ? Object.keys(input.payload).length : 0,
    },
  } as const;
}
