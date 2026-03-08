type TrendItem = {
  signalType: string;
  count: number;
};

type IntelligenceTrendBarsProps = {
  items: TrendItem[];
};

export function IntelligenceTrendBars({ items }: IntelligenceTrendBarsProps): JSX.Element {
  const max = Math.max(1, ...items.map((item) => item.count));
  return (
    <div className="space-y-2">
      {items.map((item) => (
        <article key={item.signalType}>
          <div className="mb-1 flex items-center justify-between text-xs text-slate-700">
            <span>{item.signalType}</span>
            <span>{item.count}</span>
          </div>
          <div className="h-2 rounded bg-slate-200">
            <div
              className="h-2 rounded bg-slate-700"
              style={{ width: `${Math.max(5, Math.round((item.count / max) * 100))}%` }}
            />
          </div>
        </article>
      ))}
    </div>
  );
}
