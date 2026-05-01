import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Activity,
  Zap,
  BarChart2,
  Globe,
  Shield,
  Bell,
  CheckCircle,
  ArrowRight,
} from 'lucide-react';

const features = [
  {
    icon: Zap,
    title: 'Instant Alerts',
    desc: 'Get notified via Email, Slack, Discord, or webhook the moment an endpoint goes down.',
    color: 'text-yellow-400',
    bg: 'bg-yellow-400/10',
    border: 'border-yellow-400/20',
  },
  {
    icon: BarChart2,
    title: 'Response Time Trends',
    desc: 'Track latency charts over 90 days. Spot slowdowns before users complain.',
    color: 'text-blue-400',
    bg: 'bg-blue-400/10',
    border: 'border-blue-400/20',
  },
  {
    icon: Globe,
    title: 'Public Status Page',
    desc: 'A branded, real-time status page your users can check — zero code required.',
    color: 'text-emerald-400',
    bg: 'bg-emerald-400/10',
    border: 'border-emerald-400/20',
  },
  {
    icon: Shield,
    title: 'SSL Monitoring',
    desc: 'Alerts before SSL certificates expire and break your site for users.',
    color: 'text-purple-400',
    bg: 'bg-purple-400/10',
    border: 'border-purple-400/20',
  },
  {
    icon: Bell,
    title: 'Incident Management',
    desc: 'Auto-detect outages and manage a full incident timeline from the dashboard.',
    color: 'text-rose-400',
    bg: 'bg-rose-400/10',
    border: 'border-rose-400/20',
  },
  {
    icon: CheckCircle,
    title: '3-Strike Retry Logic',
    desc: 'No false alarms. Alerts only fire after 3 consecutive failures.',
    color: 'text-cyan-400',
    bg: 'bg-cyan-400/10',
    border: 'border-cyan-400/20',
  },
];

const steps = [
  {
    step: '01',
    title: 'Add your endpoints',
    desc: 'Paste any API URL. Configure method, headers, body, and expected status code.',
  },
  {
    step: '02',
    title: 'Worker checks every minute',
    desc: 'Background worker pings each endpoint, records response time, and evaluates health.',
  },
  {
    step: '03',
    title: 'Get alerted instantly',
    desc: 'On failure after 3 retries, alerts fire to your chosen channels and the status page updates.',
  },
];

export default function LandingPage() {
  const navigate = useNavigate();

  useEffect(() => {
    if (localStorage.getItem('auth_token')) {
      navigate('/app');
    }
  }, [navigate]);

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#080d1a' }}>
      {/* ── Navbar ── */}
      <nav className="px-6 md:px-10 py-5 flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: '#3b82f6', boxShadow: '0 0 20px rgba(59,130,246,0.4)' }}
          >
            <Activity size={17} className="text-white" />
          </div>
          <span className="text-white font-bold text-lg tracking-tight">PulseAPI</span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="text-slate-400 hover:text-white text-sm transition-colors px-3 py-1.5"
          >
            Sign in
          </Link>
          <Link
            to="/login"
            className="flex items-center gap-1.5 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-all"
            style={{ backgroundColor: '#3b82f6', boxShadow: '0 4px 14px rgba(59,130,246,0.35)' }}
          >
            Get Started <ArrowRight size={14} />
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="max-w-7xl mx-auto px-6 md:px-10 pt-20 pb-28 text-center relative overflow-hidden">
        {/* Ambient glow */}
        <div
          className="absolute left-1/2 top-0 -translate-x-1/2 w-[700px] h-[400px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(ellipse, rgba(59,130,246,0.12) 0%, transparent 70%)' }}
        />

        <div className="relative">
          <div className="inline-flex items-center gap-2 border text-xs font-medium px-3.5 py-1.5 rounded-full mb-8"
            style={{ backgroundColor: 'rgba(59,130,246,0.08)', borderColor: 'rgba(59,130,246,0.25)', color: '#60a5fa' }}
          >
            <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
            Real-time API Health Monitoring
          </div>

          <h1 className="text-5xl md:text-7xl font-bold text-white leading-[1.08] tracking-tight mb-6">
            Know When Your APIs
            <br />
            <span
              className="text-transparent bg-clip-text"
              style={{ backgroundImage: 'linear-gradient(90deg, #60a5fa, #22d3ee, #60a5fa)' }}
            >
              Go Down First
            </span>
          </h1>

          <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            Monitor every endpoint, get instant alerts, and show your users a professional
            status page — all from one self-hosted dashboard.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/login"
              className="flex items-center gap-2 text-white font-semibold px-8 py-3.5 rounded-xl transition-all text-sm w-full sm:w-auto justify-center"
              style={{ backgroundColor: '#3b82f6', boxShadow: '0 8px 24px rgba(59,130,246,0.35)' }}
            >
              Open Dashboard <ArrowRight size={16} />
            </Link>
            <a
              href={import.meta.env.VITE_STATUS_URL || 'http://localhost:3000'}
              target="_blank"
              rel="noopener noreferrer"
              className="border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white font-medium px-8 py-3.5 rounded-xl transition-colors text-sm w-full sm:w-auto text-center"
            >
              View Status Page ↗
            </a>
          </div>
        </div>
      </section>

      {/* ── Stats bar ── */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)', backgroundColor: 'rgba(255,255,255,0.02)' }}>
        <div className="max-w-7xl mx-auto px-6 md:px-10 py-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { value: '60s', label: 'Check Interval' },
            { value: '3-Strike', label: 'False Alarm Prevention' },
            { value: '90 Days', label: 'History Retention' },
            { value: '4 Channels', label: 'Alert Methods' },
          ].map((s) => (
            <div key={s.label}>
              <p className="text-2xl md:text-3xl font-bold text-white">{s.value}</p>
              <p className="text-slate-500 text-xs mt-1.5 font-medium uppercase tracking-wider">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Features ── */}
      <section className="max-w-7xl mx-auto px-6 md:px-10 py-24">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Everything you need to stay reliable
          </h2>
          <p className="text-slate-400 max-w-xl mx-auto">
            A complete monitoring stack built for developers — from uptime checks to incident management.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f) => (
            <div
              key={f.title}
              className={`${f.bg} border ${f.border} rounded-2xl p-6 transition-colors hover:brightness-110`}
              style={{ backgroundColor: 'rgba(255,255,255,0.02)' }}
            >
              <div className={`w-10 h-10 ${f.bg} border ${f.border} rounded-xl flex items-center justify-center mb-4`}>
                <f.icon size={20} className={f.color} />
              </div>
              <h3 className="text-white font-semibold mb-2">{f.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="max-w-7xl mx-auto px-6 md:px-10 pb-24">
        <div
          className="rounded-3xl p-10 md:p-14"
          style={{
            background: 'linear-gradient(135deg, rgba(30,41,59,0.6) 0%, rgba(23,37,84,0.3) 100%)',
            border: '1px solid rgba(255,255,255,0.07)',
          }}
        >
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-3">How it works</h2>
            <p className="text-slate-400">Up and running in minutes</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {steps.map((s) => (
              <div key={s.step} className="flex gap-4">
                <div
                  className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-blue-400 font-bold text-sm"
                  style={{ backgroundColor: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)' }}
                >
                  {s.step}
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-1.5">{s.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="max-w-7xl mx-auto px-6 md:px-10 pb-24">
        <div
          className="text-center rounded-3xl py-16 px-8"
          style={{
            background: 'linear-gradient(135deg, rgba(59,130,246,0.1) 0%, rgba(6,182,212,0.08) 100%)',
            border: '1px solid rgba(59,130,246,0.2)',
          }}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Start monitoring in minutes
          </h2>
          <p className="text-slate-400 mb-8 text-lg">
            Self-hosted. No vendor lock-in. Full control of your data.
          </p>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-white font-semibold px-10 py-4 rounded-xl transition-all text-sm"
            style={{ backgroundColor: '#3b82f6', boxShadow: '0 8px 24px rgba(59,130,246,0.35)' }}
          >
            Open Dashboard <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }} className="py-8">
        <div className="max-w-7xl mx-auto px-6 md:px-10 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-blue-500 rounded-md flex items-center justify-center">
              <Activity size={13} className="text-white" />
            </div>
            <span className="text-slate-400 text-sm font-medium">PulseAPI</span>
          </div>
          <p className="text-slate-600 text-xs">Self-hosted API Monitoring Platform</p>
        </div>
      </footer>
    </div>
  );
}
