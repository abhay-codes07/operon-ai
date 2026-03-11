export type CompiledWorkflowStepType = "navigate" | "click" | "input" | "extract" | "wait" | "custom";

export type CompiledWorkflowStep = {
  order: number;
  type: CompiledWorkflowStepType;
  selector?: string;
  value?: string;
  url?: string;
  parameterKey?: string;
};

export type CompiledWorkflowDefinition = {
  domain: string;
  generatedAt: string;
  steps: CompiledWorkflowStep[];
};

export type DomainMemorySnapshot = {
  selectorPatterns: string[];
  navigationPatterns: string[];
  reliabilityScore: number;
};

export type SelfRepairResult = {
  repaired: boolean;
  selector?: string;
  strategy?: string;
  confidence?: number;
  reason?: string;
};
