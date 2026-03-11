import type { CompiledWorkflowDefinition, CompiledWorkflowStep } from "@/lib/autopilot/types";

type RecordedAction = {
  actionType: "NAVIGATE" | "CLICK" | "INPUT" | "EXTRACT" | "WAIT" | "CUSTOM";
  selector: string | null;
  value: string | null;
  metadata: unknown;
};

function mapActionType(actionType: RecordedAction["actionType"]): CompiledWorkflowStep["type"] {
  if (actionType === "NAVIGATE") return "navigate";
  if (actionType === "CLICK") return "click";
  if (actionType === "INPUT") return "input";
  if (actionType === "EXTRACT") return "extract";
  if (actionType === "WAIT") return "wait";
  return "custom";
}

export function compileWorkflowFromActions(domain: string, actions: RecordedAction[]): CompiledWorkflowDefinition {
  const steps = actions.map<CompiledWorkflowStep>((action, index) => {
    const metadata =
      action.metadata && typeof action.metadata === "object"
        ? (action.metadata as Record<string, unknown>)
        : undefined;

    const url = typeof metadata?.url === "string" ? metadata.url : undefined;

    return {
      order: index + 1,
      type: mapActionType(action.actionType),
      selector: action.selector ?? undefined,
      value: action.value ?? undefined,
      url,
    };
  });

  return {
    domain,
    generatedAt: new Date().toISOString(),
    steps,
  };
}
