export function isCronExpressionValid(value: string): boolean {
  const cronSegment = "(\\*|\\d+|\\d+-\\d+|\\*/\\d+)";
  const cronRegex = new RegExp(`^${cronSegment}(\\s+${cronSegment}){4}$`);

  return cronRegex.test(value.trim());
}

export function normalizeCronExpression(value: string | undefined): string | undefined {
  if (!value) {
    return undefined;
  }

  const normalized = value.trim().replace(/\s+/g, " ");
  return normalized.length > 0 ? normalized : undefined;
}
