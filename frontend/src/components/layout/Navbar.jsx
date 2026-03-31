import { Link, useNavigate } from 'react-router-dom';
import { TrendingUp, LogOut, User, BarChart2 } from 'lucide-react';
import useAuthStore from '../../store/useAuthStore';

export default function Navbar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shadow-sm">
      <Link to="/dashboard" className="flex items-center gap-2 text-blue-600 font-bold text-lg">
        <TrendingUp size={22} />
        InvestAI
      </Link>

      <div className="flex items-center gap-6 text-sm">
        <Link to="/dashboard" className="text-gray-600 hover:text-blue-600 transition-colors flex items-center gap-1">
          <BarChart2 size={16} /> Dashboard
        </Link>
        <Link to="/preferences" className="text-gray-600 hover:text-blue-600 transition-colors flex items-center gap-1">
          <User size={16} /> Preferences
        </Link>
        <Link to="/run" className="btn-primary text-sm py-1.5 px-3">
          Run Analysis
        </Link>
        <button onClick={handleLogout} className="text-gray-400 hover:text-red-500 transition-colors">
          <LogOut size={18} />
        </button>
      </div>
    </nav>
  );
}
