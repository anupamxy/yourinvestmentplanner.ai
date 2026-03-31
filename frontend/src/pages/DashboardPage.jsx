import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, Settings, Play, Clock } from 'lucide-react';
import Layout from '../components/layout/Layout';
import ReportCard from '../components/reports/ReportCard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import useAuthStore from '../store/useAuthStore';
import usePreferencesStore from '../store/usePreferencesStore';
import { reportApi } from '../api/reportApi';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { profile, fetchProfile } = usePreferencesStore();
  const [reports, setReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(true);

  useEffect(() => {
    fetchProfile();
    reportApi.list().then(({ data }) => {
      setReports(data);
      setLoadingReports(false);
    }).catch(() => setLoadingReports(false));
  }, []);

  return (
    <Layout>
      {/* Welcome banner */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl p-6 text-white mb-8">
        <h1 className="text-2xl font-bold mb-1">
          Welcome back{user?.username ? `, ${user.username}` : ''}!
        </h1>
        <p className="text-blue-100 text-sm mb-4">
          Your AI-powered investment advisor is ready to analyze the market for you.
        </p>
        <Link to="/run" className="inline-flex items-center gap-2 bg-white text-blue-700 font-semibold py-2 px-5 rounded-lg hover:bg-blue-50 transition-colors text-sm">
          <Play size={16} /> Run New Analysis
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Reports list */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800">Recent Reports</h2>
            {reports.length > 0 && (
              <span className="text-xs text-gray-400">{reports.length} total</span>
            )}
          </div>

          {loadingReports ? (
            <div className="py-12 flex justify-center"><LoadingSpinner /></div>
          ) : reports.length === 0 ? (
            <div className="card text-center py-12">
              <TrendingUp size={40} className="text-gray-200 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No reports yet</p>
              <p className="text-gray-400 text-sm mt-1 mb-4">Run your first analysis to get personalized investment insights</p>
              <Link to="/run" className="btn-primary inline-flex items-center gap-2">
                <Play size={16} /> Start Analysis
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {reports.map((r) => <ReportCard key={r.id} report={r} />)}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Profile summary */}
          <div className="card">
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <Settings size={16} className="text-blue-600" /> Investment Profile
            </h3>
            {profile ? (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Risk</span>
                  <span className="font-medium capitalize text-gray-700">{profile.risk_tolerance}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Budget</span>
                  <span className="font-medium text-gray-700">
                    ${parseFloat(profile.budget).toLocaleString()} {profile.currency}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Horizon</span>
                  <span className="font-medium capitalize text-gray-700">{profile.time_horizon}-term</span>
                </div>
                <div className="mt-3">
                  <span className="text-gray-500 block mb-1">Sectors</span>
                  <div className="flex flex-wrap gap-1">
                    {profile.sectors.map((s) => (
                      <span key={s} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full capitalize">
                        {s.replace('_', ' ')}
                      </span>
                    ))}
                  </div>
                </div>
                <Link to="/preferences" className="btn-secondary block text-center mt-4 text-xs py-1.5">
                  Edit Preferences
                </Link>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-gray-500 mb-3">No profile yet</p>
                <Link to="/preferences" className="btn-primary text-sm py-1.5">
                  Set Up Profile
                </Link>
              </div>
            )}
          </div>

          {/* Quick actions */}
          <div className="card">
            <h3 className="font-semibold text-gray-800 mb-3">Quick Actions</h3>
            <div className="space-y-2">
              <Link to="/run" className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors text-sm text-gray-700">
                <Play size={16} className="text-blue-600" /> Run Analysis
              </Link>
              <Link to="/preferences" className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors text-sm text-gray-700">
                <Settings size={16} className="text-purple-600" /> Update Preferences
              </Link>
              <Link to="/history" className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors text-sm text-gray-700">
                <Clock size={16} className="text-green-600" /> View History
              </Link>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
