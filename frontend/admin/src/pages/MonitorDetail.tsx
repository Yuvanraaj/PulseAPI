import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { getMonitor, getMonitorChecks, getMonitorUptimeHistory } from '../api/client';
import StatusBadge from '../components/StatusBadge';

export default function MonitorDetail() {
  const { id } = useParams<{ id: string }>();

  const { data: monitorData, isLoading } = useQuery({
    queryKey: ['monitor', id],
    queryFn: () => getMonitor(id!).then((r) => r.data),
    refetchInterval: 30_000,
    enabled: !!id,
  });

  const { data: checksData } = useQuery({
    queryKey: ['monitor-checks', id],
    queryFn: () => getMonitorChecks(id!, { limit: '100' }).then((r) => r.data),
    refetchInterval: 30_000,
    enabled: !!id,
  });

  const { data: historyData } = useQuery({
    queryKey: ['monitor-history', id],
    queryFn: () => getMonitorUptimeHistory(id!, 30).then((r) => r.data),
    enabled: !!id,
  });

  const monitor = monitorData?.monitor;
  const checks = (checksData?.checks ?? []).slice().reverse();
  const history = historyData?.history ?? [];

  if (isLoading) {
    return <p className="text-gray-400 text-center py-20">Loading...</p>;
  }

  if (!monitor) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-400">Monitor not found</p>
        <Link to="/app/monitors" className="text-blue-600 hover:underline text-sm mt-2 block">
          Back to monitors
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link to="/app/monitors" className="text-gray-400 hover:text-gray-700 mt-0.5">
          <ArrowLeft size={20} />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-gray-900">{monitor.name}</h1>
            <StatusBadge status={monitor.current_status} size="md" />
          </div>
          <div className="flex items-center gap-2 mt-1">
            <a
              href={monitor.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-500 hover:underline flex items-center gap-1"
            >
              {monitor.url}
              <ExternalLink size={12} />
            </a>
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Uptime (24h)', value: `${monitor.uptime_percentage_24h}%` },
          { label: 'Uptime (7d)', value: `${monitor.uptime_percentage_7d}%` },
          { label: 'Uptime (30d)', value: `${monitor.uptime_percentage_30d}%` },
          { label: 'Avg Response (24h)', value: `${monitor.avg_response_time_24h} ms` },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-sm text-gray-500">{s.label}</p>
            <p className="text-xl font-bold text-gray-900 mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Response time chart */}
      {checks.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Response Time (last 100 checks)</h2>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={checks} margin={{ left: -20, right: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis
                dataKey="checked_at"
                tickFormatter={(v) => format(parseISO(v), 'HH:mm')}
                tick={{ fontSize: 11, fill: '#9ca3af' }}
              />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} unit=" ms" />
              <Tooltip
                labelFormatter={(v) => format(parseISO(String(v)), 'MMM d, HH:mm')}
                formatter={(v: number) => [`${v} ms`, 'Response time']}
              />
              <Line
                type="monotone"
                dataKey="response_time_ms"
                stroke="#3B82F6"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Daily uptime history */}
      {history.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Daily Uptime (last 30 days)</h2>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={history} margin={{ left: -20, right: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis
                dataKey="date"
                tickFormatter={(v) => format(parseISO(v), 'MMM d')}
                tick={{ fontSize: 11, fill: '#9ca3af' }}
              />
              <YAxis domain={[90, 100]} tick={{ fontSize: 11, fill: '#9ca3af' }} unit="%" />
              <Tooltip
                labelFormatter={(v) => format(parseISO(String(v)), 'MMM d, yyyy')}
                formatter={(v: number) => [`${v}%`, 'Uptime']}
              />
              <Line
                type="monotone"
                dataKey="uptime_percentage"
                stroke="#10B981"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Recent checks table */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Recent Checks</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-5 py-2.5 text-gray-500 font-medium">Time</th>
                <th className="text-left px-4 py-2.5 text-gray-500 font-medium">Status</th>
                <th className="text-left px-4 py-2.5 text-gray-500 font-medium">HTTP</th>
                <th className="text-left px-4 py-2.5 text-gray-500 font-medium">Response</th>
                <th className="text-left px-4 py-2.5 text-gray-500 font-medium">Error</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {[...checks].reverse().slice(0, 50).map((c: {
                id: string;
                checked_at: string;
                is_up: boolean;
                status_code: number | null;
                response_time_ms: number | null;
                error_message: string | null;
              }) => (
                <tr key={c.id}>
                  <td className="px-5 py-2.5 text-gray-600 whitespace-nowrap">
                    {format(parseISO(c.checked_at), 'MMM d, HH:mm:ss')}
                  </td>
                  <td className="px-4 py-2.5">
                    <StatusBadge status={c.is_up ? 'up' : 'down'} />
                  </td>
                  <td className="px-4 py-2.5 text-gray-700">{c.status_code ?? '—'}</td>
                  <td className="px-4 py-2.5 text-gray-700">
                    {c.response_time_ms != null ? `${c.response_time_ms} ms` : '—'}
                  </td>
                  <td className="px-4 py-2.5 text-red-500 text-xs max-w-xs truncate">
                    {c.error_message ?? ''}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
