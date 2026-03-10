const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?previous\s+instructions?/i,
  /ignore\s+(the\s+)?(system|safety)\s+prompt/i,
  /send\s+data\s+to/i,
  /exfiltrat(e|ion|ing)/i,
  /email\s+this\s+data/i,
  /paste\s+all\s+secrets/i,
  /override\s+guardrails?/i,
  /bypass\s+policy/i,
] as const;

export type InjectionMatch = {
  pattern: string;
  excerpt: string;
};

export type InjectionScanResult = {
  riskScore: number;
  detected: boolean;
  matches: InjectionMatch[];
};

export function detectInstructionPatterns(domText: string): InjectionMatch[] {
  const normalized = domText.slice(0, 50_000);
  const matches: InjectionMatch[] = [];

  for (const pattern of INJECTION_PATTERNS) {
    const found = normalized.match(pattern);
    if (!found) {
      continue;
    }
    matches.push({
      pattern: pattern.source,
      excerpt: found[0],
    });
  }

  return matches;
}

export function scanDomContent(domText: string): InjectionScanResult {
  const matches = detectInstructionPatterns(domText);
  const uniquePatternCount = new Set(matches.map((match) => match.pattern)).size;
  const hasCredentialKeywords = /(password|token|secret|api key|cookie)/i.test(domText);

  let riskScore = Math.min(100, uniquePatternCount * 20 + (hasCredentialKeywords ? 20 : 0));
  if (riskScore === 0 && domText.length > 0 && /(ignore|override|bypass)/i.test(domText)) {
    riskScore = 15;
  }

  return {
    riskScore,
    detected: matches.length > 0,
    matches,
  };
}
