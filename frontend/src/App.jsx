import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './store/useAuthStore';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import PreferencesPage from './pages/PreferencesPage';
import AgentRunPage from './pages/AgentRunPage';
import ReportPage from './pages/ReportPage';
import HistoryPage from './pages/HistoryPage';
import ProtectedRoute from './components/common/ProtectedRoute';

function App() {
  const { isAuthenticated, fetchMe } = useAuthStore();
  useEffect(() => { if (isAuthenticated) fetchMe(); }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login"    element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/dashboard"   element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/preferences" element={<ProtectedRoute><PreferencesPage /></ProtectedRoute>} />
        <Route path="/run"         element={<ProtectedRoute><AgentRunPage /></ProtectedRoute>} />
        <Route path="/reports/:id" element={<ProtectedRoute><ReportPage /></ProtectedRoute>} />
        <Route path="/history"     element={<ProtectedRoute><HistoryPage /></ProtectedRoute>} />
        <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
