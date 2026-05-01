interface Props {
  status: string;
  size?: 'sm' | 'lg';
}

const CONFIG: Record<string, { dot: string; label: string; bg: string; text: string }> = {
  operational: { dot: 'bg-green-500', label: 'Operational', bg: 'bg-green-50', text: 'text-green-700' },
  up: { dot: 'bg-green-500', label: 'Operational', bg: 'bg-green-50', text: 'text-green-700' },
  degraded: { dot: 'bg-yellow-400', label: 'Degraded Performance', bg: 'bg-yellow-50', text: 'text-yellow-700' },
  down: { dot: 'bg-red-500', label: 'Outage', bg: 'bg-red-50', text: 'text-red-700' },
  maintenance: { dot: 'bg-blue-500', label: 'Maintenance', bg: 'bg-blue-50', text: 'text-blue-700' },
  unknown: { dot: 'bg-gray-400', label: 'Unknown', bg: 'bg-gray-100', text: 'text-gray-600' },
};

export default function StatusIndicator({ status, size = 'sm' }: Props) {
  const cfg = CONFIG[status] ?? CONFIG.unknown;

  if (size === 'lg') {
    return (
      <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-base ${cfg.bg} ${cfg.text}`}>
        <span className={`w-3 h-3 rounded-full ${cfg.dot} animate-pulse`} />
        {cfg.label}
      </span>
    );
  }

  return (
    <span className="flex items-center gap-2">
      <span className={`w-2.5 h-2.5 rounded-full ${cfg.dot}`} />
      <span className={`text-sm font-medium ${cfg.text}`}>{cfg.label}</span>
    </span>
  );
}
