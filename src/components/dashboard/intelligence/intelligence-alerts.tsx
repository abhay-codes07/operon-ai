type AlertItem = {
  id: string;
  competitorName: string;
  signalType: string;
  details: string;
  createdAt: string;
};

type IntelligenceAlertsProps = {
  items: AlertItem[];
};

export function IntelligenceAlerts({ items }: IntelligenceAlertsProps): JSX.Element {
  if (items.length === 0) {
    return <p className="text-sm text-slate-600">No active competitive alerts.</p>;
  }

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <article key={item.id} className="rounded-lg border border-amber-200 bg-amber-50 p-3">
          <p className="text-sm font-semibold text-amber-900">⚠ {item.competitorName} — {item.signalType}</p>
          <p className="text-xs text-amber-800">{item.details}</p>
          <p className="text-xs text-amber-800">{new Date(item.createdAt).toLocaleString()}</p>
        </article>
      ))}
    </div>
  );
}
