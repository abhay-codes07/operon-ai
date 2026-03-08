import type { CompetitorSignalType } from "@prisma/client";

import { detectMeaningfulSignals } from "@/lib/intelligence/signal.service";

type Insight = {
  title: string;
  signalType: CompetitorSignalType;
  competitorId: string;
  competitorName: string;
  createdAt: Date;
  details: string;
};

function buildInsightFromSignal(signal: {
  signalType: CompetitorSignalType;
  competitor: { id: string; name: string };
  createdAt: Date;
  payload: Record<string, unknown>;
}): Insight {
  switch (signal.signalType) {
    case "PRICING_CHANGE":
      return {
        title: "Competitor lowered or changed pricing",
        signalType: signal.signalType,
        competitorId: signal.competitor.id,
        competitorName: signal.competitor.name,
        createdAt: signal.createdAt,
        details: "Pricing structure changed on public pricing page.",
      };
    case "FEATURE_CHANGE":
      return {
        title: "Competitor added or changed feature surface",
        signalType: signal.signalType,
        competitorId: signal.competitor.id,
        competitorName: signal.competitor.name,
        createdAt: signal.createdAt,
        details: "Feature page DOM fingerprint changed.",
      };
    case "JOB_POSTING":
      return {
        title: "Competitor hiring velocity changed",
        signalType: signal.signalType,
        competitorId: signal.competitor.id,
        competitorName: signal.competitor.name,
        createdAt: signal.createdAt,
        details: "Jobs board posting count shifted materially.",
      };
    case "HEADCOUNT_CHANGE":
      return {
        title: "Competitor headcount movement detected",
        signalType: signal.signalType,
        competitorId: signal.competitor.id,
        competitorName: signal.competitor.name,
        createdAt: signal.createdAt,
        details: "Estimated headcount and hiring velocity changed.",
      };
    case "REVIEW_SENTIMENT":
    default:
      return {
        title: "Competitor review sentiment changed",
        signalType: signal.signalType,
        competitorId: signal.competitor.id,
        competitorName: signal.competitor.name,
        createdAt: signal.createdAt,
        details: "Recent public review narratives changed.",
      };
  }
}

export async function generateInsights(orgId: string) {
  const signals = await detectMeaningfulSignals(orgId);
  return signals.slice(0, 100).map((signal) =>
    buildInsightFromSignal({
      signalType: signal.signalType,
      competitor: signal.competitor,
      createdAt: signal.createdAt,
      payload: signal.payload as Record<string, unknown>,
    }),
  );
}
