import type { CoPilotActionCandidate, CoPilotConfidenceResult } from "@/lib/copilot/types";

const confidenceWeights = {
  missingTargetPenalty: 0.25,
  destructiveActionPenalty: 0.2,
  ambiguousActionPenalty: 0.15,
  unknownOutcomePenalty: 0.1,
};

function normalizeAction(action: string) {
  return action.trim().toLowerCase();
}

export function calculateActionConfidence(step: CoPilotActionCandidate): CoPilotConfidenceResult {
  let confidence = 0.95;
  const reasons: string[] = [];
  const action = normalizeAction(step.action);

  if (!step.target || step.target.trim().length === 0) {
    confidence -= confidenceWeights.missingTargetPenalty;
    reasons.push("missing_target_selector");
  }

  if (action.includes("submit") || action.includes("delete") || action.includes("payment")) {
    confidence -= confidenceWeights.destructiveActionPenalty;
    reasons.push("potentially_destructive_action");
  }

  if (action.includes("click") && (!step.target || step.target.includes("button"))) {
    confidence -= confidenceWeights.ambiguousActionPenalty;
    reasons.push("ambiguous_click_target");
  }

  if (!step.expectedOutcome || step.expectedOutcome.trim().length < 3) {
    confidence -= confidenceWeights.unknownOutcomePenalty;
    reasons.push("weak_expected_outcome");
  }

  const bounded = Math.max(0, Math.min(1, Number(confidence.toFixed(3))));

  return {
    confidence: bounded,
    risk: bounded >= 0.8 ? "LOW" : bounded >= 0.6 ? "MEDIUM" : "HIGH",
    reasons,
  };
}

export function evaluateStepRisk(step: CoPilotActionCandidate, threshold = 0.65) {
  const score = calculateActionConfidence(step);
  return {
    ...score,
    requiresHumanIntervention: score.confidence < threshold,
  };
}
