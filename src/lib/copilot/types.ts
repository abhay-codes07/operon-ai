export type CoPilotRiskLevel = "LOW" | "MEDIUM" | "HIGH";

export type CoPilotActionCandidate = {
  stepId: string;
  action: string;
  target?: string;
  expectedOutcome?: string;
};

export type CoPilotConfidenceResult = {
  confidence: number;
  risk: CoPilotRiskLevel;
  reasons: string[];
};

export type CoPilotInterventionInput = {
  sessionId: string;
  stepId: string;
  agentConfidence: number;
  agentSuggestedAction: string;
  humanAction: string;
  interventionType?: "CONFIRM" | "OVERRIDE_CLICK" | "OVERRIDE_INPUT";
  metadata?: Record<string, unknown>;
};
