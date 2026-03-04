import {
  createSelfHealingRecord,
  listSelfHealingRecords,
} from "@/server/repositories/executions/self-healing-repository";

type SelectorCandidate = {
  selector: string;
  semanticLabel?: string;
};

function normalizeForSimilarity(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, " ");
}

export function scoreSelectorSimilarity(selector: string, semanticHint: string) {
  const selectorTokens = new Set(normalizeForSimilarity(selector).split(/\s+/).filter(Boolean));
  const hintTokens = new Set(normalizeForSimilarity(semanticHint).split(/\s+/).filter(Boolean));

  if (hintTokens.size === 0) {
    return 0;
  }

  let overlap = 0;
  for (const token of hintTokens) {
    if (selectorTokens.has(token)) {
      overlap += 1;
    }
  }

  return overlap / hintTokens.size;
}

export function resolveSelectorWithFallback(input: {
  requestedSelector: string;
  semanticHint: string;
  candidates: SelectorCandidate[];
  retryLimit: number;
}) {
  const ranked = input.candidates
    .map((candidate) => {
      const selectorScore = scoreSelectorSimilarity(candidate.selector, input.semanticHint);
      const labelScore = candidate.semanticLabel
        ? scoreSelectorSimilarity(candidate.semanticLabel, input.semanticHint)
        : 0;
      return {
        ...candidate,
        score: Number((selectorScore * 0.7 + labelScore * 0.3).toFixed(4)),
      };
    })
    .sort((a, b) => b.score - a.score);

  const attempts = ranked.slice(0, Math.max(1, input.retryLimit + 1));
  const best = attempts[0];

  return {
    resolvedSelector: best?.selector ?? input.requestedSelector,
    strategy: best ? "semantic-fallback" : "selector-default",
    similarityScore: best?.score ?? 0,
    attempts: attempts.map((item, index) => ({
      attempt: index + 1,
      selector: item.selector,
      score: item.score,
    })),
  };
}

export async function recordSelfHealingResolution(input: {
  organizationId: string;
  executionId: string;
  executionStepId?: string;
  originalSelector?: string;
  resolvedSelector: string;
  strategy: string;
  similarityScore: number;
  success?: boolean;
  metadata?: Record<string, unknown>;
}) {
  return createSelfHealingRecord(input);
}

export async function fetchSelfHealingTimeline(input: { organizationId: string; executionId: string }) {
  return listSelfHealingRecords(input.organizationId, input.executionId);
}
