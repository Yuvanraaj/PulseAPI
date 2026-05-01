import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Activity, AlertTriangle, TrendingUp, Clock, ArrowRight, CheckCircle } from 'lucide-react';
import { getAnalyticsOverview, getMonitors, getIncidents } from '../api/client';
import StatusBadge from '../components/StatusBadge';

function StatCard({
  icon: Icon,
  label,
  value,
  sublabel,
  accent,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sublabel?: string;
  accent: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <p className="text-sm font-medium text-gray-500">{label}</p>
        <div className={`p-2 rounded-xl ${accent}`}>
          <Icon size={16} className="text-white" />
        </div>
      </div>
      <p className="text-3xl font-bold text-gray-900 tracking-tight">{value}</p>
      {sublabel && <p className="text-xs text-gray-400 mt-1">{sublabel}</p>}
    </div>
  );
}

export default function Dashboard() {
  const { data: overview } = useQuery({
    queryKey: ['analytics-overview'],
    queryFn: () => getAnalyticsOverview().then((r) => r.data),
    refetchInterval: 30_000,
  });

  const { data: monitorsData } = useQuery({
    queryKey: ['monitors', 'dashboard'],
    queryFn: () => getMonitors({ limit: '10' }).then((r) => r.data),
    refetchInterval: 30_000,
  });

  const { data: incidentsData } = useQuery({
    queryKey: ['incidents', 'active'],
    queryFn: () => getIncidents({ limit: '5' }).then((r) => r.data),
    refetchInterval: 30_000,
  });

  const monitors = monitorsData?.monitors ?? [];
  const incidents = (incidentsData?.incidents ?? []).filter(
    (i: { status: string }) => i.status !== 'resolved'
  );

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{greeting} 👋</h1>
          <p className="text-gray-400 text-sm mt-1">Here's what's happening with your APIs</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400 bg-white border border-gray-100 rounded-xl px-3 py-2 shadow-sm">
          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          Live · refreshes every 30s
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Activity}
          label="Total Monitors"
          value={overview?.total_monitors ?? '—'}
          sublabel="Configured endpoints"
          accent="bg-blue-500"
        />
        <StatCard
          icon={TrendingUp}
          label="Uptime (24h)"
          value={overview ? `${overview.uptime_24h}%` : '—'}
          sublabel="Across all monitors"
          accent="bg-emerald-500"
        />
        <StatCard
          icon={AlertTriangle}
          label="Active Incidents"
          value={overview?.active_incidents ?? '—'}
          sublabel={overview?.active_incidents > 0 ? 'Needs attention' : 'All clear'}
          accent={overview?.active_incidents > 0 ? 'bg-red-500' : 'bg-gray-400'}
        />
        <StatCard
          icon={Clock}
          label="Avg Response"
          value={overview ? `${overview.avg_response_time_24h} ms` : '—'}
          sublabel="Last 24 hours"
          accent="bg-violet-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monitor list */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
            <div className="flex items-center gap-2">
              <Activity size={16} className="text-gray-400" />
              <h2 className="font-semibold text-gray-900">Monitors</h2>
            </div>
            <Link
              to="/app/monitors"
              className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
            >
              View all <ArrowRight size={12} />
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {monitors.length === 0 && (
              <div className="text-center py-12">
                <Activity size={28} className="text-gray-200 mx-auto mb-3" />
                <p className="text-gray-400 text-sm">No monitors yet</p>
                <Link to="/app/monitors" className="text-blue-600 text-sm hover:underline mt-1 inline-block">
                  Add your first monitor →
                </Link>
              </div>
            )}
            {monitors.map((m: {
              id: string;
              name: string;
              url: string;
              current_status: string;
              uptime_percentage: number;
              avg_response_time: number;
              is_active: boolean;
            }) => (
              <Link
                key={m.id}
                to={`/app/monitors/${m.id}`}
                className="flex items-center justify-between px-6 py-3.5 hover:bg-gray-50/80 transition-colors"
              >
                <div className="min-w-0 flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${
                    !m.is_active ? 'bg-gray-300' :
                    m.current_status === 'up' ? 'bg-emerald-400 shadow-sm shadow-emerald-400/50' :
                    m.current_status === 'down' ? 'bg-red-500 shadow-sm shadow-red-500/50 animate-pulse' :
                    'bg-gray-300'
                  }`} />
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 text-sm truncate">{m.name}</p>
                    <p className="text-xs text-gray-400 truncate">{m.url}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 shrink-0 ml-4">
                  <span className="text-xs text-gray-500 hidden sm:block">{m.uptime_percentage ?? 0}%</span>
                  <span className="text-xs text-gray-400 hidden md:block">{m.avg_response_time ?? 0}ms</span>
                  <StatusBadge status={m.is_active ? m.current_status : 'unknown'} />
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Active Incidents */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
            <div className="flex items-center gap-2">
              <AlertTriangle size={16} className="text-gray-400" />
              <h2 className="font-semibold text-gray-900">Incidents</h2>
            </div>
            <Link
              to="/app/incidents"
              className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
            >
              View all <ArrowRight size={12} />
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {incidents.length === 0 && (
              <div className="text-center py-12">
                <CheckCircle size={28} className="text-emerald-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm font-medium">All systems operational</p>
                <p className="text-gray-400 text-xs mt-1">No active incidents</p>
              </div>
            )}
            {incidents.map((inc: {
              id: string;
              title: string;
              status: string;
              severity: string;
              monitor_name: string;
              started_at: string;
            }) => (
              <div key={inc.id} className="px-6 py-3.5">
                <div className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-red-500 rounded-full mt-1.5 shrink-0 animate-pulse" />
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 text-sm truncate">{inc.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{inc.monitor_name}</p>
                    <div className="flex gap-2 mt-1.5">
                      <StatusBadge status={inc.status} />
                      <span className="text-xs text-gray-400 capitalize">{inc.severity}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
