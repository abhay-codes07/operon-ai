type ReliabilityScoreBadgeProps = {
  score?: number | null;
};

function getVariant(score: number) {
  if (score >= 85) {
    return "bg-emerald-100 text-emerald-700";
  }
  if (score >= 70) {
    return "bg-amber-100 text-amber-700";
  }
  return "bg-rose-100 text-rose-700";
}

export function ReliabilityScoreBadge({ score }: ReliabilityScoreBadgeProps): JSX.Element {
  if (score === null || score === undefined) {
    return <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-500">No score</span>;
  }

  return (
    <span className={`rounded-full px-2 py-1 text-xs font-semibold ${getVariant(score)}`}>
      {score.toFixed(1)}
    </span>
  );
}
