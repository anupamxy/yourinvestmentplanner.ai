import { Link, useNavigate, useLocation } from 'react-router-dom';
import { TrendingUp, LogOut, User, BarChart2, Clock, Sun, Moon, Play } from 'lucide-react';
import useAuthStore from '../../store/useAuthStore';
import useDarkMode from '../../store/useDarkMode';

const NAV = [
  { to: '/dashboard',    label: 'Dashboard',    Icon: BarChart2 },
  { to: '/preferences',  label: 'Preferences',  Icon: User      },
  { to: '/history',      label: 'History',       Icon: Clock     },
];

export default function Navbar() {
  const { logout } = useAuthStore();
  const { dark, toggle } = useDarkMode();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <nav className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur
                    border-b border-gray-200 dark:border-slate-700/60 px-6 py-3
                    flex items-center justify-between shadow-sm">
      {/* Logo */}
      <Link to="/dashboard" className="flex items-center gap-2 font-bold text-lg
                                       text-blue-600 dark:text-blue-400">
        <TrendingUp size={22} />
        InvestAI
      </Link>

      {/* Nav links */}
      <div className="hidden sm:flex items-center gap-1">
        {NAV.map(({ to, label, Icon }) => {
          const active = pathname === to;
          return (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all
                ${active
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                  : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50 dark:text-slate-400 dark:hover:text-blue-400 dark:hover:bg-slate-800'
                }`}
            >
              <Icon size={15} /> {label}
            </Link>
          );
        })}
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-2">
        <Link to="/run"
          className="btn-primary text-sm py-1.5 px-3 flex items-center gap-1.5">
          <Play size={14} /> Run Analysis
        </Link>

        {/* Dark mode toggle */}
        <button
          onClick={toggle}
          className="p-2 rounded-lg text-gray-500 hover:text-gray-800 hover:bg-gray-100
                     dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800
                     transition-all"
          title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {dark ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <button
          onClick={() => { logout(); navigate('/login'); }}
          className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50
                     dark:hover:text-red-400 dark:hover:bg-red-950 transition-all"
          title="Log out"
        >
          <LogOut size={18} />
        </button>
      </div>
    </nav>
  );
}
