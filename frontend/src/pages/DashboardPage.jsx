import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp, Settings2, Play, Clock, FileText,
  ArrowRight, Sparkles, BarChart3, Zap, ChevronRight,
  Wallet, MessageSquare, TrendingDown, Activity,
} from 'lucide-react';
import Layout from '../components/layout/Layout';
import ReportCard from '../components/reports/ReportCard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import useAuthStore from '../store/useAuthStore';
import usePreferencesStore from '../store/usePreferencesStore';
import { reportApi } from '../api/reportApi';

/* ─── Animated count-up number ─── */
function CountUp({ target, prefix = '', suffix = '', duration = 1200 }) {
  const [value, setValue] = useState(0);
  const started = useRef(false);
  useEffect(() => {
    if (started.current || target === 0) return;
    started.current = true;
    const steps = 50;
    const inc = target / steps;
    let cur = 0;
    const timer = setInterval(() => {
      cur = Math.min(cur + inc, target);
      setValue(Math.floor(cur));
      if (cur >= target) clearInterval(timer);
    }, duration / steps);
    return () => clearInterval(timer);
  }, [target, duration]);
  return <>{prefix}{value.toLocaleString()}{suffix}</>;
}

/* ─── Stat card ─── */
function StatCard({ icon: Icon, label, value, sub, accentColor, delay = 0 }) {
  const [show, setShow] = useState(false);
  useEffect(() => { const t = setTimeout(() => setShow(true), delay); return () => clearTimeout(t); }, [delay]);

  return (
    <div
      className={`card relative overflow-hidden transition-all duration-500
                  ${show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}
    >
      {/* Ambient glow */}
      <div className={`absolute -top-8 -right-8 w-28 h-28 rounded-full blur-3xl opacity-[0.12] ${accentColor}`} />

      <div className="relative flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-widest mb-2">{label}</p>
          <p className="text-2xl font-black text-white leading-none mb-1.5">{value}</p>
          {sub && <p className="text-[12px] text-[var(--text-muted)]">{sub}</p>}
        </div>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${accentColor} bg-opacity-20`}
             style={{ background: 'rgba(99,102,241,0.12)' }}>
          <Icon size={16} className="text-indigo-400" />
        </div>
      </div>
    </div>
  );
}

/* ─── Quick action row ─── */
function ActionCard({ to, icon: Icon, label, desc, iconColor, delay = 0 }) {
  const [show, setShow] = useState(false);
  useEffect(() => { const t = setTimeout(() => setShow(true), delay); return () => clearTimeout(t); }, [delay]);

  return (
    <Link
      to={to}
      className={`group flex items-center gap-3 p-3 rounded-xl
                  border border-white/[0.06] hover:border-white/[0.12]
                  bg-black hover:bg-white/[0.04]
                  transition-all duration-200
                  ${show ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-3'}`}
    >
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${iconColor}`}>
        <Icon size={15} className="text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold text-[var(--text-primary)] group-hover:text-white transition-colors">{label}</p>
        <p className="text-[11px] text-[var(--text-muted)] truncate">{desc}</p>
      </div>
      <ChevronRight size={13} className="text-slate-700 group-hover:text-[var(--text-muted)] group-hover:translate-x-0.5 transition-all shrink-0" />
    </Link>
  );
}

/* ─── Mini market ticker item ─── */
function TickerItem({ name, value, change, positive }) {
  return (
    <span className="flex items-center gap-2 px-4 shrink-0">
      <span className="text-[var(--text-secondary)] text-[12px] font-medium">{name}</span>
      <span className="text-white text-[12px] font-semibold">{value}</span>
      <span className={`flex items-center gap-0.5 text-[11px] font-semibold ${positive ? 'text-emerald-400' : 'text-red-400'}`}>
        {positive ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
        {change}
      </span>
    </span>
  );
}

/* ═══════════════════════════════════════════════════════ */
export default function DashboardPage() {
  const { user }               = useAuthStore();
  const { profile, fetchProfile } = usePreferencesStore();
  const [reports, setReports]  = useState([]);
  const [loading, setLoading]  = useState(true);

  useEffect(() => {
    fetchProfile();
    reportApi.list().then(({ data }) => { setReports(data); setLoading(false); })
              .catch(() => setLoading(false));
  }, []);

  const sym   = profile?.currency === 'INR' ? '₹' : profile?.currency === 'EUR' ? '€' : profile?.currency === 'GBP' ? '£' : '$';
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

  return (
    <Layout>
      <div className="space-y-5">

        {/* ══ Market ticker strip ══ */}
        <div className="relative overflow-hidden rounded-xl border border-white/[0.06]"
             style={{ background: 'var(--bg-card)' }}>
          <div className="flex overflow-hidden">
            <div className="ticker-track flex py-2 border-r border-white/[0.06]">
              {[
                { name: 'NIFTY 50',   value: '22,147',  change: '+0.84%', positive: true  },
                { name: 'SENSEX',     value: '73,108',  change: '+0.76%', positive: true  },
                { name: 'NIFTY BANK', value: '47,832',  change: '-0.23%', positive: false },
                { name: 'GOLD',       value: '₹71,240', change: '+0.42%', positive: true  },
                { name: 'USD/INR',    value: '83.42',   change: '-0.05%', positive: false },
                { name: 'BTC',        value: '$67,420', change: '+2.14%', positive: true  },
                { name: 'S&P 500',    value: '5,254',   change: '+0.32%', positive: true  },
                { name: 'NIFTY 50',   value: '22,147',  change: '+0.84%', positive: true  },
                { name: 'SENSEX',     value: '73,108',  change: '+0.76%', positive: true  },
                { name: 'NIFTY BANK', value: '47,832',  change: '-0.23%', positive: false },
                { name: 'GOLD',       value: '₹71,240', change: '+0.42%', positive: true  },
                { name: 'USD/INR',    value: '83.42',   change: '-0.05%', positive: false },
                { name: 'BTC',        value: '$67,420', change: '+2.14%', positive: true  },
                { name: 'S&P 500',    value: '5,254',   change: '+0.32%', positive: true  },
              ].map((t, i) => <TickerItem key={i} {...t} />)}
            </div>
          </div>
        </div>

        {/* ══ Hero banner ══ */}
        <div
          className="relative overflow-hidden rounded-2xl p-6 sm:p-8 border border-white/[0.07]"
          style={{
            background: 'linear-gradient(135deg, #0f1022 0%, #110d2a 50%, #0a0f1f 100%)',
          }}
        >
          {/* Grid */}
          <div className="absolute inset-0 bg-grid opacity-60 pointer-events-none" />
          {/* Glow orbs */}
          <div className="absolute -top-24 -right-16 w-72 h-72 rounded-full
                          bg-indigo-600/10 blur-[80px] pointer-events-none" />
          <div className="absolute -bottom-12 left-1/3 w-48 h-48 rounded-full
                          bg-violet-600/08 blur-[60px] pointer-events-none" />

          <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-5">
            <div className="animate-slide-up">
              <div className="flex items-center gap-2 mb-3">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold
                                 text-indigo-300 bg-indigo-500/10 border border-indigo-500/20
                                 px-2.5 py-1 rounded-full">
                  <Activity size={10} className="animate-pulse" />
                  {today}
                </span>
              </div>
              <h1 className="text-2xl sm:text-[28px] font-black text-white mb-2 leading-tight tracking-tight">
                Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening'}
                {user?.username ? (
                  <span className="text-indigo-400">, {user.username}</span>
                ) : null}
              </h1>
              <p className="text-[var(--text-muted)] text-sm max-w-sm">
                Your AI advisor is ready with fresh market insights tailored to your portfolio goals.
              </p>
            </div>

            <div className="flex flex-wrap gap-2.5 animate-slide-up" style={{ animationDelay: '80ms' }}>
              <Link
                to="/run"
                className="flex items-center gap-2 font-bold py-2.5 px-5 rounded-xl text-sm
                           bg-indigo-600 hover:bg-indigo-500 text-white
                           shadow-[0_0_28px_rgba(99,102,241,0.35)]
                           hover:shadow-[0_0_36px_rgba(99,102,241,0.5)]
                           transition-all duration-200 active:scale-95"
              >
                <Zap size={14} strokeWidth={2.5} /> New Analysis
              </Link>
              <Link
                to="/life-advisor"
                className="flex items-center gap-2 font-semibold py-2.5 px-4 rounded-xl text-sm
                           border border-white/[0.1] hover:border-white/[0.2]
                           text-[var(--text-secondary)] hover:text-white
                           bg-black hover:bg-white/[0.06]
                           transition-all duration-200"
              >
                <Sparkles size={13} /> Life Plan
              </Link>
            </div>
          </div>
        </div>

        {/* ══ Stat cards ══ */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <StatCard
            icon={FileText}
            label="Total Analyses"
            accentColor="bg-indigo-500"
            value={<CountUp target={reports.length} />}
            sub={reports.length === 0 ? 'Run your first analysis' : `${reports.length} report${reports.length !== 1 ? 's' : ''} generated`}
            delay={0}
          />
          <StatCard
            icon={BarChart3}
            label="Portfolio Budget"
            accentColor="bg-emerald-500"
            value={profile?.budget ? `${sym}${Number(profile.budget).toLocaleString()}` : '—'}
            sub={profile?.currency ? `${profile.currency} · ${profile.risk_tolerance || '—'} risk` : 'Set up your profile first'}
            delay={80}
          />
          <StatCard
            icon={Clock}
            label="Time Horizon"
            accentColor="bg-amber-500"
            value={profile?.time_horizon
              ? profile.time_horizon.charAt(0).toUpperCase() + profile.time_horizon.slice(1) + '-term'
              : '—'}
            sub={profile?.sectors?.length
              ? `${profile.sectors.length} sector${profile.sectors.length !== 1 ? 's' : ''} tracked`
              : 'No sectors selected'}
            delay={160}
          />
        </div>

        {/* ══ Main content ══ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* Reports */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-[14px] font-bold text-white flex items-center gap-2">
                <TrendingUp size={14} className="text-indigo-400" />
                Recent Reports
              </h2>
              {reports.length > 0 && (
                <Link to="/history"
                  className="flex items-center gap-1 text-[12px] text-indigo-400 hover:text-indigo-300 transition-colors">
                  View all <ArrowRight size={11} />
                </Link>
              )}
            </div>

            {loading ? (
              <div className="py-16 flex justify-center"><LoadingSpinner /></div>
            ) : reports.length === 0 ? (
              <div className="card text-center py-14 animate-fade-in">
                <div className="w-14 h-14 rounded-2xl border border-indigo-900/40
                                bg-indigo-950/40 flex items-center justify-center mx-auto mb-4 animate-float">
                  <TrendingUp size={24} className="text-indigo-500" />
                </div>
                <p className="text-[var(--text-primary)] font-semibold mb-1 text-sm">No reports yet</p>
                <p className="text-[var(--text-muted)] text-xs mb-5 max-w-[260px] mx-auto">
                  Run your first AI analysis to get personalized investment insights
                </p>
                <Link to="/run" className="btn-primary text-sm">
                  <Play size={13} /> Start Analysis
                </Link>
              </div>
            ) : (
              <div className="space-y-2.5">
                {reports.slice(0, 5).map((r, i) => (
                  <div key={r.id} className="animate-slide-up" style={{ animationDelay: `${i * 50}ms` }}>
                    <ReportCard report={r} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">

            {/* Investment Profile */}
            <div className="card space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-[13px] font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                  <Settings2 size={13} className="text-[var(--text-muted)]" /> Profile
                </h3>
                <Link to="/preferences"
                  className="text-[11px] text-indigo-400 hover:text-indigo-300 transition-colors">
                  Edit
                </Link>
              </div>

              {profile ? (
                <>
                  {/* Risk indicator */}
                  <div className="flex items-center justify-between px-3 py-2.5 rounded-xl
                                  border border-white/[0.06]"
                       style={{ background: 'var(--bg-card)' }}>
                    <div>
                      <p className="text-[10px] text-[var(--text-muted)] mb-0.5">Risk Tolerance</p>
                      <p className="text-[13px] font-bold text-white capitalize">{profile.risk_tolerance}</p>
                    </div>
                    <div className={`w-2.5 h-2.5 rounded-full animate-glow-pulse ${
                      profile.risk_tolerance === 'aggressive' ? 'bg-red-400'
                      : profile.risk_tolerance === 'moderate'  ? 'bg-amber-400'
                      : 'bg-emerald-400'
                    }`} />
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {[
                      { label: 'Budget', val: `${sym}${Number(profile.budget).toLocaleString()}` },
                      { label: 'Horizon', val: profile.time_horizon },
                    ].map(({ label, val }) => (
                      <div key={label} className="p-2.5 rounded-xl border border-white/[0.05]"
                           style={{ background: 'var(--bg-card)' }}>
                        <p className="text-[10px] text-[var(--text-muted)] mb-0.5">{label}</p>
                        <p className="font-bold text-white capitalize">{val}</p>
                      </div>
                    ))}
                  </div>

                  {profile.sectors?.length > 0 && (
                    <div>
                      <p className="text-[10px] text-[var(--text-muted)] mb-1.5">Tracked Sectors</p>
                      <div className="flex flex-wrap gap-1">
                        {profile.sectors.map((s) => (
                          <span key={s}
                            className="text-[10px] font-medium bg-indigo-950/50 border border-indigo-900/40
                                       text-indigo-300 px-2 py-0.5 rounded-full capitalize">
                            {s.replace('_', ' ')}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-4">
                  <p className="text-[12px] text-[var(--text-muted)] mb-3">No profile configured yet</p>
                  <Link to="/preferences" className="btn-primary text-xs py-1.5 px-3">
                    Set Up Profile
                  </Link>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div>
              <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-widest px-0.5 mb-2">
                Quick Access
              </p>
              <div className="space-y-1.5">
                <ActionCard to="/run"          icon={Zap}          label="Run Analysis"     desc="Get AI-powered insights"    iconColor="bg-indigo-600"  delay={200} />
                <ActionCard to="/portfolio"    icon={Wallet}       label="Portfolio"        desc="Track your investments"     iconColor="bg-emerald-700" delay={260} />
                <ActionCard to="/discussions"  icon={MessageSquare} label="Community"       desc="Discuss with investors"     iconColor="bg-violet-700"  delay={320} />
                <ActionCard to="/life-advisor" icon={Sparkles}     label="Life Advisor"     desc="Personalized life plan"     iconColor="bg-rose-700"    delay={380} />
                <ActionCard to="/history"      icon={Clock}        label="Report History"   desc="View past analyses"         iconColor="bg-slate-600"   delay={440} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
