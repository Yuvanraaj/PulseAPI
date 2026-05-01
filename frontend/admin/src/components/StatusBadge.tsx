interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

const STATUS_CONFIG: Record<string, { label: string; classes: string; dot: string }> = {
  up: { label: 'Up', classes: 'bg-green-100 text-green-800', dot: 'bg-green-500' },
  down: { label: 'Down', classes: 'bg-red-100 text-red-800', dot: 'bg-red-500' },
  degraded: { label: 'Degraded', classes: 'bg-yellow-100 text-yellow-800', dot: 'bg-yellow-500' },
  unknown: { label: 'Unknown', classes: 'bg-gray-100 text-gray-600', dot: 'bg-gray-400' },
  operational: { label: 'Operational', classes: 'bg-green-100 text-green-800', dot: 'bg-green-500' },
  investigating: { label: 'Investigating', classes: 'bg-red-100 text-red-800', dot: 'bg-red-500' },
  identified: { label: 'Identified', classes: 'bg-orange-100 text-orange-800', dot: 'bg-orange-500' },
  monitoring: { label: 'Monitoring', classes: 'bg-blue-100 text-blue-700', dot: 'bg-blue-500' },
  resolved: { label: 'Resolved', classes: 'bg-green-100 text-green-800', dot: 'bg-green-500' },
};

export default function StatusBadge({ status, size = 'sm' }: StatusBadgeProps) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, classes: 'bg-gray-100 text-gray-600', dot: 'bg-gray-400' };
  const padding = size === 'md' ? 'px-3 py-1 text-sm' : 'px-2 py-0.5 text-xs';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-medium ${cfg.classes} ${padding}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}
