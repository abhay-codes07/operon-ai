export const finopsRates = {
  llm: {
    "gpt-4o": 0.00001,
    "gpt-4o-mini": 0.000003,
    defaultPerTokenUsd: 0.000004,
  },
  browserRuntimePerSecondUsd: 0.00002,
  retryFlatUsd: 0.0025,
  selfHealingFlatUsd: 0.0015,
} as const;

export function getModelCostPerToken(model: string): number {
  const key = model.trim().toLowerCase();
  if (key in finopsRates.llm) {
    return finopsRates.llm[key as keyof typeof finopsRates.llm];
  }
  return finopsRates.llm.defaultPerTokenUsd;
}
