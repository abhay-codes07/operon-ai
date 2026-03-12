function hashToUnit(value: string): number {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return (hash % 10_000) / 10_000;
}

export function estimateGhostCursorPosition(selector: string) {
  const x = Math.round(hashToUnit(`${selector}:x`) * 1280);
  const y = Math.round(hashToUnit(`${selector}:y`) * 720);
  return { x, y };
}

export function buildGhostActionPreview(input: {
  action: string;
  target?: string;
  value?: string;
}) {
  const position = estimateGhostCursorPosition(input.target ?? input.action);
  return {
    action: input.action,
    target: input.target ?? null,
    value: input.value ?? null,
    cursor: position,
    label: `${input.action.toUpperCase()} ${input.target ?? "target"}`,
  };
}
