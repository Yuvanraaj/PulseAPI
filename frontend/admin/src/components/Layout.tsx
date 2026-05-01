import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Activity, BarChart2, AlertTriangle, Bell, LogOut, ExternalLink, Globe } from 'lucide-react';

export default function Layout() {
  const navigate = useNavigate();

  function handleLogout() {
    localStorage.removeItem('auth_token');
    navigate('/login');
  }

  const navClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
      isActive
        ? 'text-blue-400 border border-blue-500/25'
        : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
    }`;

  const activeStyle = { backgroundColor: 'rgba(59,130,246,0.12)' };

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* ── Sidebar ── */}
      <aside
        className="w-56 xl:w-60 flex flex-col fixed h-full z-20 shrink-0"
        style={{ backgroundColor: '#0b1120', borderRight: '1px solid rgba(255,255,255,0.05)' }}
      >
        {/* Logo */}
        <div
          className="px-4 py-5 flex items-center gap-2.5"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
        >
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: '#3b82f6', boxShadow: '0 0 12px rgba(59,130,246,0.4)' }}
          >
            <Activity size={14} className="text-white" />
          </div>
          <span className="text-white font-bold text-sm tracking-tight">PulseAPI</span>
          <span
            className="ml-auto text-[10px] px-1.5 py-0.5 rounded font-medium"
            style={{ backgroundColor: 'rgba(59,130,246,0.12)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.2)' }}
          >
            Admin
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          <p className="text-[10px] text-slate-600 font-semibold uppercase tracking-widest px-3 mb-2.5">
            Overview
          </p>
          <NavLink
            to="/app"
            end
            className={navClass}
            style={({ isActive }) => (isActive ? activeStyle : {})}
          >
            <BarChart2 size={15} />
            Dashboard
          </NavLink>

          <p className="text-[10px] text-slate-600 font-semibold uppercase tracking-widest px-3 mt-5 mb-2.5">
            Monitoring
          </p>
          <NavLink
            to="/app/monitors"
            className={navClass}
            style={({ isActive }) => (isActive ? activeStyle : {})}
          >
            <Activity size={15} />
            Monitors
          </NavLink>
          <NavLink
            to="/app/incidents"
            className={navClass}
            style={({ isActive }) => (isActive ? activeStyle : {})}
          >
            <AlertTriangle size={15} />
            Incidents
          </NavLink>
          <NavLink
            to="/app/alerts"
            className={navClass}
            style={({ isActive }) => (isActive ? activeStyle : {})}
          >
            <Bell size={15} />
            Alert Channels
          </NavLink>
        </nav>

        {/* Bottom */}
        <div
          className="px-3 pb-4 pt-3 space-y-0.5"
          style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
        >
          <a
            href={import.meta.env.VITE_STATUS_URL || 'http://localhost:3000'}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-white/5 text-xs transition-colors border border-transparent"
          >
            <Globe size={14} />
            Status Page
            <ExternalLink size={11} className="ml-auto" />
          </a>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-white/5 text-xs transition-colors border border-transparent"
          >
            <LogOut size={14} />
            Sign out
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <div className="ml-56 xl:ml-60 flex-1 flex flex-col min-w-0">
        <main className="flex-1 p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
