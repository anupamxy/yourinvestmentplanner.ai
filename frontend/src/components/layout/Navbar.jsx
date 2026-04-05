import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  TrendingUp, LogOut, BarChart2, Clock, Sun, Moon,
  Sparkles, Settings2, Wallet, MessageSquare, Zap, Menu, X,
} from 'lucide-react';
import useAuthStore from '../../store/useAuthStore';
import useDarkMode from '../../store/useDarkMode';

const NAV = [
  { to: '/dashboard',    label: 'Dashboard',    Icon: BarChart2     },
  { to: '/portfolio',    label: 'Portfolio',    Icon: Wallet        },
  { to: '/history',      label: 'History',      Icon: Clock         },
  { to: '/life-advisor', label: 'Life Advisor', Icon: Sparkles      },
  { to: '/discussions',  label: 'Community',    Icon: MessageSquare },
  { to: '/preferences',  label: 'Settings',     Icon: Settings2     },
];

export default function Navbar() {
  const { user, logout }  = useAuthStore();
  const { dark, toggle }  = useDarkMode();
  const navigate          = useNavigate();
  const { pathname }      = useLocation();
  const [open, setOpen]   = useState(false);

  const initial = (user?.username?.[0] || '?').toUpperCase();

  return (
    <>
      {/* ══ Top bar ══ */}
      <nav
        className="sticky top-0 z-50 h-14
                   backdrop-blur-2xl
                   border-b border-white/[0.07]
                   flex items-center gap-4 px-4 sm:px-6"
        style={{ background: 'rgba(8,12,20,0.92)', boxShadow: '0 1px 0 rgba(255,255,255,0.05)' }}
      >
        {/* ── Logo ── */}
        <Link
          to="/dashboard"
          className="flex items-center gap-2 shrink-0 group select-none"
        >
          <div
            className="w-7 h-7 rounded-[8px]
                       bg-gradient-to-br from-indigo-500 to-violet-600
                       flex items-center justify-center
                       shadow-[0_0_16px_rgba(99,102,241,0.4)]
                       group-hover:shadow-[0_0_22px_rgba(99,102,241,0.6)]
                       transition-shadow duration-300"
          >
            <TrendingUp size={14} className="text-white" strokeWidth={2.5} />
          </div>
          <span className="hidden sm:block font-black text-[15px] tracking-tight text-white">
            Invest<span className="text-indigo-400">AI</span>
          </span>
        </Link>

        {/* ── Divider ── */}
        <div className="hidden sm:block w-px h-4 bg-white/10 shrink-0" />

        {/* ── Nav tabs ── */}
        <div className="hidden sm:flex items-center flex-1 overflow-x-auto
                        scrollbar-none gap-0.5">
          {NAV.map(({ to, label, Icon }) => {
            const active = pathname === to || pathname.startsWith(to + '/');
            return (
              <Link
                key={to}
                to={to}
                className={`
                  relative flex items-center gap-1.5 px-3 py-2
                  text-[13px] font-medium whitespace-nowrap rounded-lg
                  transition-all duration-200 group
                  ${active
                    ? 'text-white'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-white/[0.04]'}
                `}
              >
                <Icon
                  size={13}
                  strokeWidth={active ? 2.5 : 2}
                  className={`shrink-0 transition-colors duration-200
                    ${active ? 'text-indigo-400' : 'group-hover:text-[var(--text-secondary)]'}`}
                />
                {label}

                {/* Active indicator */}
                {active && (
                  <span
                    className="absolute bottom-0.5 left-3 right-3 h-0.5
                               bg-gradient-to-r from-indigo-500 to-violet-500
                               rounded-full animate-scale-in"
                  />
                )}
              </Link>
            );
          })}
        </div>

        {/* ── Right actions ── */}
        <div className="flex items-center gap-1 ml-auto sm:ml-0 shrink-0">
          {/* Run Analysis CTA */}
          <Link
            to="/run"
            className="hidden sm:flex items-center gap-1.5
                       text-[12px] font-bold px-3 py-1.5 rounded-lg
                       bg-indigo-600 hover:bg-indigo-500
                       text-white shadow-md shadow-indigo-600/30
                       hover:shadow-indigo-500/40
                       transition-all duration-200 active:scale-95"
          >
            <Zap size={11} strokeWidth={2.5} />
            Analyze
          </Link>

          {/* Theme toggle */}
          <button
            onClick={toggle}
            title={dark ? 'Light mode' : 'Dark mode'}
            className="w-8 h-8 rounded-lg flex items-center justify-center
                       text-[var(--text-muted)] hover:text-[var(--text-primary)]
                       hover:bg-white/[0.06] transition-all duration-200"
          >
            {dark ? <Sun size={14} /> : <Moon size={14} />}
          </button>

          {/* User avatar + logout */}
          <button
            onClick={() => { logout(); navigate('/login'); }}
            title={`${user?.username || ''} · Log out`}
            className="w-8 h-8 rounded-lg flex items-center justify-center
                       bg-[var(--bg-raised)] hover:bg-red-950/60
                       border border-white/[0.1]/60 hover:border-red-800/60
                       text-[var(--text-secondary)] hover:text-red-400
                       font-bold text-[11px] transition-all duration-200 group"
          >
            <span className="group-hover:hidden">{initial}</span>
            <LogOut size={13} className="hidden group-hover:block" />
          </button>

          {/* Mobile hamburger */}
          <button
            onClick={() => setOpen((v) => !v)}
            className="sm:hidden w-8 h-8 rounded-lg flex items-center justify-center
                       text-[var(--text-secondary)] hover:text-white hover:bg-white/[0.06] transition-all"
          >
            {open ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>
      </nav>

      {/* ══ Mobile slide-down menu ══ */}
      <div
        className={`sm:hidden fixed inset-x-0 top-14 z-40
                    backdrop-blur-2xl
                    border-b border-white/[0.07]
                    transition-all duration-300 origin-top
                    ${open ? 'opacity-100 scale-y-100 pointer-events-auto' : 'opacity-0 scale-y-95 pointer-events-none'}`}
      >
        <div className="py-2">
          {NAV.map(({ to, label, Icon }) => {
            const active = pathname === to || pathname.startsWith(to + '/');
            return (
              <Link
                key={to}
                to={to}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-5 py-3 text-sm font-medium
                           transition-colors duration-150
                           ${active
                             ? 'text-white bg-white/[0.05] border-l-2 border-indigo-500'
                             : 'text-[var(--text-secondary)] hover:text-white hover:bg-white/[0.03] border-l-2 border-transparent'
                           }`}
              >
                <Icon size={15} className={active ? 'text-indigo-400' : ''} />
                {label}
              </Link>
            );
          })}
        </div>
        <div className="px-4 py-3 border-t border-white/[0.05]">
          <Link
            to="/run"
            onClick={() => setOpen(false)}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl
                       bg-gradient-to-r from-indigo-600 to-violet-600
                       hover:from-indigo-500 hover:to-violet-500
                       text-white text-sm font-bold shadow-lg shadow-indigo-600/25
                       transition-all active:scale-95"
          >
            <Zap size={14} /> Run Analysis
          </Link>
        </div>
      </div>

      {/* Backdrop */}
      {open && (
        <div
          className="sm:hidden fixed inset-0 top-14 z-30 bg-black/40 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}
    </>
  );
}
