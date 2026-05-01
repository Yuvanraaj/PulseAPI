interface DayBar {
  date: string;
  uptime_percentage: number;
}

interface Props {
  history: DayBar[];
  days?: number;
}

function getColor(uptime: number | undefined): string {
  if (uptime === undefined) return 'bg-gray-200';
  if (uptime >= 99) return 'bg-green-500';
  if (uptime >= 95) return 'bg-yellow-400';
  return 'bg-red-500';
}

export default function UptimeChart({ history, days = 90 }: Props) {
  // Fill gaps with empty placeholders so we always show `days` bars
  const today = new Date();
  const bars: (DayBar | null)[] = [];

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const entry = history.find((h) => h.date === dateStr) ?? null;
    bars.push(entry ? entry : null);
  }

  return (
    <div>
      <div className="flex items-end gap-0.5 h-8">
        {bars.map((bar, i) => (
          <div
            key={i}
            className={`flex-1 rounded-sm h-full ${getColor(bar?.uptime_percentage)} transition-colors`}
            title={bar ? `${bar.date}: ${bar.uptime_percentage}%` : 'No data'}
          />
        ))}
      </div>
      <div className="flex justify-between text-xs text-slate-600 mt-1">
        <span>{days} days ago</span>
        <span>Today</span>
      </div>
    </div>
  );
}
