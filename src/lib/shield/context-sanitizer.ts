const SANITIZE_PATTERNS = [
  /ignore\s+(all\s+)?previous\s+instructions?/gi,
  /ignore\s+(the\s+)?(system|safety)\s+prompt/gi,
  /send\s+data\s+to/gi,
  /exfiltrat(e|ion|ing)/gi,
  /email\s+this\s+data/gi,
  /bypass\s+policy/gi,
  /override\s+guardrails?/gi,
] as const;

function escapeRiskyTokens(text: string): string {
  return text
    .replace(/<script/gi, "&lt;script")
    .replace(/<\/script>/gi, "&lt;/script&gt;")
    .replace(/javascript:/gi, "blocked-protocol:")
    .replace(/onerror\s*=/gi, "blocked-event=")
    .replace(/onload\s*=/gi, "blocked-event=");
}

export function stripInjectionPhrases(text: string): string {
  let sanitized = text;
  for (const pattern of SANITIZE_PATTERNS) {
    sanitized = sanitized.replace(pattern, "[REDACTED_INJECTION_PATTERN]");
  }
  return sanitized;
}

export function sanitizeUntrustedWebContent(content: string): string {
  const stripped = stripInjectionPhrases(content);
  const escaped = escapeRiskyTokens(stripped);
  return `[UNTRUSTED_WEB_CONTENT]\n${escaped}`;
}

export function sanitizeContextWindow(input: {
  trustedInstructions: string;
  untrustedWebContent: string;
}): string {
  return [
    "[TRUSTED_WORKFLOW_INSTRUCTIONS]",
    input.trustedInstructions,
    sanitizeUntrustedWebContent(input.untrustedWebContent),
  ]
    .filter((section) => section.trim().length > 0)
    .join("\n\n");
}
