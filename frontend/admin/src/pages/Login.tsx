import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login } from '../api/client';
import { Activity, Zap, BarChart2, Globe, Shield, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

const perks = [
  { icon: Zap, text: 'Alerts delivered in under 60 seconds', color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
  { icon: BarChart2, text: '90-day response time history', color: 'text-blue-400', bg: 'bg-blue-400/10' },
  { icon: Globe, text: 'Public status page for your users', color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
  { icon: Shield, text: 'SSL certificate expiry monitoring', color: 'text-purple-400', bg: 'bg-purple-400/10' },
];

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await login(email, password);
      localStorage.setItem('auth_token', res.data.token);
      navigate('/app');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      toast.error(error.response?.data?.error ?? 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* ── Left branding panel ── */}
      <div
        className="hidden lg:flex lg:w-[480px] xl:w-[520px] flex-col justify-between p-12 shrink-0"
        style={{ backgroundColor: '#080d1a' }}
      >
        <Link to="/" className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: '#3b82f6', boxShadow: '0 0 20px rgba(59,130,246,0.4)' }}
          >
            <Activity size={17} className="text-white" />
          </div>
          <span className="text-white font-bold text-lg">PulseAPI</span>
        </Link>

        <div>
          <h2 className="text-4xl font-bold text-white leading-tight mb-5">
            Monitor your APIs
            <br />
            with confidence.
          </h2>
          <p className="text-slate-400 text-base mb-10 leading-relaxed">
            Get instant alerts when your endpoints fail. Track uptime, response times,
            and incidents — all in one place.
          </p>
          <div className="space-y-3.5">
            {perks.map((item) => (
              <div key={item.text} className="flex items-center gap-3">
                <div className={`w-8 h-8 ${item.bg} rounded-lg flex items-center justify-center shrink-0`}>
                  <item.icon size={15} className={item.color} />
                </div>
                <span className="text-slate-300 text-sm">{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-slate-700 text-xs">Self-hosted · No vendor lock-in · Full data control</p>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex-1 flex items-center justify-center bg-gray-50 p-8">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8 justify-center">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
              <Activity size={17} className="text-white" />
            </div>
            <span className="font-bold text-gray-900 text-lg">PulseAPI</span>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Welcome back</h1>
            <p className="text-gray-500 text-sm">Sign in to your admin dashboard</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Email address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 pr-11 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full text-white rounded-xl py-3 text-sm font-semibold disabled:opacity-50 transition-colors mt-2"
              style={{ backgroundColor: '#3b82f6', boxShadow: '0 4px 14px rgba(59,130,246,0.3)' }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : (
                'Sign in to Dashboard'
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-100 text-center">
            <Link to="/" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
              ← Back to home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
