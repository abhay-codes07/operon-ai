import type { SelfRepairResult } from "@/lib/autopilot/types";

type Candidate = {
  selector: string;
  similarity: number;
};

function tokenize(value: string): string[] {
  return value
    .toLowerCase()
    .split(/[^a-z0-9_-]+/)
    .filter(Boolean);
}

function similarityScore(left: string, right: string): number {
  const leftTokens = new Set(tokenize(left));
  const rightTokens = new Set(tokenize(right));

  if (leftTokens.size === 0 || rightTokens.size === 0) {
    return 0;
  }

  let overlap = 0;
  for (const token of leftTokens) {
    if (rightTokens.has(token)) {
      overlap += 1;
    }
  }

  const unionSize = new Set([...leftTokens, ...rightTokens]).size;
  return overlap / unionSize;
}

function rankSelectors(failedSelector: string, candidates: string[]): Candidate[] {
  return candidates
    .map((selector) => ({
      selector,
      similarity: similarityScore(failedSelector, selector),
    }))
    .sort((a, b) => b.similarity - a.similarity);
}

export function findAlternativeSelector(input: {
  failedSelector: string;
  candidates: string[];
  threshold?: number;
}): SelfRepairResult {
  const threshold = input.threshold ?? 0.45;
  const ranked = rankSelectors(input.failedSelector, input.candidates);
  const best = ranked[0];

  if (!best || best.similarity < threshold) {
    return {
      repaired: false,
      reason: "no_candidate_above_threshold",
    };
  }

  return {
    repaired: true,
    selector: best.selector,
    strategy: "selector_similarity",
    confidence: Number(best.similarity.toFixed(3)),
  };
}

export function testSelector(selector: string, availableSelectors: string[]) {
  return availableSelectors.includes(selector);
}

export function validateRepair(repair: SelfRepairResult, availableSelectors: string[]) {
  if (!repair.repaired || !repair.selector) {
    return false;
  }

  return testSelector(repair.selector, availableSelectors);
}
