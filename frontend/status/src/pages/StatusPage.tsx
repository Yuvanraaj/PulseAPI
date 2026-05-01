import { useQuery } from '@tanstack/react-query';
import { Activity, RefreshCw, CheckCircle, AlertTriangle, AlertOctagon, Wrench } from 'lucide-react';
import { getStatus, getUptimeHistory, getPublicIncidents } from '../api/client';
import UptimeChart from '../components/UptimeChart';
import IncidentTimeline from '../components/IncidentTimeline';

const STATUS_CONFIG: Record<string, {
  bg: string; border: string; text: string; subtext: string;
  icon: React.ElementType; iconColor: string; label: string;
}> = {
  operational: {
    bg: 'from-emerald-950 via-slate-900 to-slate-900',
    border: 'border-emerald-500/20',
    text: 'text-emerald-400',
    subtext: 'text-emerald-300/70',
    icon: CheckCircle,
    iconColor: 'text-emerald-400',
    label: 'All Systems Operational',
  },
  degraded: {
    bg: 'from-amber-950 via-slate-900 to-slate-900',
    border: 'border-amber-500/20',
    text: 'text-amber-400',
    subtext: 'text-amber-300/70',
    icon: AlertTriangle,
    iconColor: 'text-amber-400',
    label: 'Some Systems Degraded',
  },
  down: {
    bg: 'from-red-950 via-slate-900 to-slate-900',
    border: 'border-red-500/20',
    text: 'text-red-400',
    subtext: 'text-red-300/70',
    icon: AlertOctagon,
    iconColor: 'text-red-400',
    label: 'Major Outage Detected',
  },
  maintenance: {
    bg: 'from-blue-950 via-slate-900 to-slate-900',
    border: 'border-blue-500/20',
    text: 'text-blue-400',
    subtext: 'text-blue-300/70',
    icon: Wrench,
    iconColor: 'text-blue-400',
    label: 'Scheduled Maintenance',
  },
};

const SERVICE_STATUS: Record<string, { dot: string; label: string; badge: string }> = {
  up: { dot: 'bg-emerald-400', label: 'Operational', badge: 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20' },
  operational: { dot: 'bg-emerald-400', label: 'Operational', badge: 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20' },
  degraded: { dot: 'bg-amber-400', label: 'Degraded', badge: 'bg-amber-400/10 text-amber-400 border-amber-400/20' },
  down: { dot: 'bg-red-500 animate-pulse', label: 'Outage', badge: 'bg-red-500/10 text-red-400 border-red-500/20' },
  maintenance: { dot: 'bg-blue-400', label: 'Maintenance', badge: 'bg-blue-400/10 text-blue-400 border-blue-400/20' },
  unknown: { dot: 'bg-slate-500', label: 'Unknown', badge: 'bg-slate-500/10 text-slate-400 border-slate-500/20' },
};

export default function StatusPage() {
  const { data: statusData, isLoading, dataUpdatedAt, refetch } = useQuery({
    queryKey: ['public-status'],
    queryFn: () => getStatus().then((r) => r.data),
    refetchInterval: 60_000,
  });

  const { data: historyData } = useQuery({
    queryKey: ['public-uptime-history'],
    queryFn: () => getUptimeHistory(90).then((r) => r.data),
    refetchInterval: 300_000,
  });

  const { data: incidentsData } = useQuery({
    queryKey: ['public-incidents'],
    queryFn: () => getPublicIncidents(20).then((r) => r.data),
    refetchInterval: 60_000,
  });

  const config = statusData?.config ?? {};
  const monitors = statusData?.monitors ?? [];
  const activeIncidents = statusData?.active_incidents ?? [];
  const overallStatus = statusData?.overall_status ?? 'operational';
  const statusCfg = STATUS_CONFIG[overallStatus] ?? STATUS_CONFIG.operational;
  const StatusIcon = statusCfg.icon;
  const allIncidents = incidentsData?.incidents ?? [];

  const historyByMonitor: Record<string, Array<{ date: string; uptime_percentage: number }>> = {};
  if (historyData?.history) {
    for (const day of historyData.history) {
      for (const m of day.monitors) {
        if (!historyByMonitor[m.monitor_id]) historyByMonitor[m.monitor_id] = [];
        historyByMonitor[m.monitor_id].push({ date: day.date, uptime_percentage: m.uptime_percentage });
      }
    }
  }

  const companyName = config.company_name || 'Service';
  const lastUpdated = dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString() : '';

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#080d1a' }}>
      {/* ── Hero Header ── */}
      <div className={`bg-gradient-to-b ${statusCfg.bg} pb-16 pt-0`}>
        {/* Top bar */}
        <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              {config.logo_url ? (
                <img src={config.logo_url} alt="logo" className="h-7 w-auto" />
              ) : (
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: '#3b82f6' }}
                >
                  <Activity size={14} className="text-white" />
                </div>
              )}
              <span className="text-white font-semibold text-sm">{companyName}</span>
            </div>
            <button
              onClick={() => refetch()}
              className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors"
              title="Refresh"
            >
              <RefreshCw size={13} />
              {lastUpdated && <span>Updated {lastUpdated}</span>}
            </button>
          </div>
        </div>

        {/* Hero status */}
        <div className="max-w-4xl mx-auto px-6 pt-16 pb-4 text-center">
          {isLoading ? (
            <div className="flex items-center justify-center gap-3 mb-4">
              <span className="w-4 h-4 border-2 border-slate-600 border-t-slate-400 rounded-full animate-spin" />
              <span className="text-slate-400 text-sm">Loading status...</span>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-center mb-5">
                <div
                  className={`w-20 h-20 rounded-full flex items-center justify-center ${statusCfg.border} border-2`}
                  style={{ backgroundColor: 'rgba(255,255,255,0.04)' }}
                >
                  <StatusIcon size={36} className={statusCfg.iconColor} />
                </div>
              </div>
              <h1 className={`text-3xl md:text-4xl font-bold mb-3 ${statusCfg.text}`}>
                {statusCfg.label}
              </h1>
              <p className={`text-sm ${statusCfg.subtext}`}>
                {companyName} Status Page · {monitors.length} service{monitors.length !== 1 ? 's' : ''} monitored
              </p>
            </>
          )}
        </div>
      </div>

      {/* ── Content ── */}
      <div className="max-w-4xl mx-auto px-6 py-10 space-y-10">
        {config.header_text && (
          <p className="text-slate-400 text-sm text-center">{config.header_text}</p>
        )}

        {/* Active incidents banner */}
        {activeIncidents.length > 0 && (
          <section>
            <div
              className="rounded-2xl p-5 space-y-3"
              style={{ backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}
            >
              <div className="flex items-center gap-2 mb-1">
                <AlertOctagon size={16} className="text-red-400" />
                <h2 className="text-red-400 font-semibold text-sm">Active Incidents</h2>
              </div>
              {activeIncidents.map((inc: {
                id: string;
                title: string;
                status: string;
                severity: string;
                monitor_name: string | null;
                started_at: string;
              }) => (
                <div key={inc.id} className="flex items-start gap-3">
                  <span className="w-2 h-2 bg-red-500 rounded-full mt-1.5 shrink-0 animate-pulse" />
                  <div>
                    <p className="text-red-300 font-medium text-sm">{inc.title}</p>
                    {inc.monitor_name && (
                      <p className="text-red-400/60 text-xs mt-0.5">{inc.monitor_name} · {inc.status}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Services */}
        {monitors.length > 0 && (
          <section>
            <h2 className="text-slate-200 font-semibold mb-4 flex items-center gap-2">
              <Activity size={16} className="text-slate-500" />
              Current Status
            </h2>
            <div
              className="rounded-2xl overflow-hidden divide-y"
              style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              {monitors.map((m: {
                id: string;
                name: string;
                status: string;
                uptime_percentage: number;
                description: string | null;
              }, idx: number) => {
                const sc = SERVICE_STATUS[m.status] ?? SERVICE_STATUS.unknown;
                return (
                  <div
                    key={m.id}
                    className="px-6 py-4"
                    style={idx > 0 ? { borderTop: '1px solid rgba(255,255,255,0.05)' } : {}}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className={`w-2.5 h-2.5 rounded-full ${sc.dot} shrink-0`} />
                        <div>
                          <p className="text-slate-200 font-medium text-sm">{m.name}</p>
                          {m.description && (
                            <p className="text-slate-500 text-xs mt-0.5">{m.description}</p>
                          )}
                        </div>
                      </div>
                      <span
                        className={`text-xs font-medium px-2.5 py-1 rounded-full border ${sc.badge}`}
                      >
                        {sc.label}
                      </span>
                    </div>

                    {historyByMonitor[m.id] && (
                      <div className="ml-5">
                        <UptimeChart history={historyByMonitor[m.id]} days={90} />
                        <p className="text-xs text-slate-600 mt-1">
                          {m.uptime_percentage.toFixed(2)}% uptime · last 24h
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Incident history */}
        <section>
          <h2 className="text-slate-200 font-semibold mb-4 flex items-center gap-2">
            <AlertTriangle size={16} className="text-slate-500" />
            Incident History
          </h2>
          {allIncidents.length === 0 ? (
            <div
              className="rounded-2xl px-6 py-10 text-center"
              style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <CheckCircle size={28} className="text-emerald-500/40 mx-auto mb-3" />
              <p className="text-slate-400 text-sm">No incidents in the past 30 days</p>
            </div>
          ) : (
            <div
              className="rounded-2xl overflow-hidden"
              style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <IncidentTimeline incidents={allIncidents} />
            </div>
          )}
        </section>

        {config.footer_text && (
          <p className="text-slate-600 text-xs text-center">{config.footer_text}</p>
        )}

        <div className="flex items-center justify-center gap-2 pb-4">
          <div className="w-5 h-5 bg-blue-500/80 rounded-md flex items-center justify-center">
            <Activity size={11} className="text-white" />
          </div>
          <p className="text-slate-600 text-xs">
            Powered by <span className="text-slate-500 font-medium">PulseAPI</span>
          </p>
        </div>
      </div>
    </div>
  );
}
