export type ClassifiedContextChunk = {
  source: "trusted_workflow" | "untrusted_web";
  content: string;
};

export function classifyContext(input: {
  workflowInstructions: string;
  webContent: string;
}): ClassifiedContextChunk[] {
  const chunks: ClassifiedContextChunk[] = [];

  if (input.workflowInstructions.trim().length > 0) {
    chunks.push({
      source: "trusted_workflow",
      content: input.workflowInstructions,
    });
  }

  if (input.webContent.trim().length > 0) {
    chunks.push({
      source: "untrusted_web",
      content: input.webContent,
    });
  }

  return chunks;
}

export function splitTrustedAndUntrusted(chunks: ClassifiedContextChunk[]) {
  return {
    trusted: chunks.filter((chunk) => chunk.source === "trusted_workflow"),
    untrusted: chunks.filter((chunk) => chunk.source === "untrusted_web"),
  };
}
