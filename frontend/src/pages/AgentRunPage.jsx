import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import Layout from '../components/layout/Layout';
import AgentPipeline from '../components/agents/AgentPipeline';
import usePreferencesStore from '../store/usePreferencesStore';

export default function AgentRunPage() {
  const { profile, fetchProfile } = usePreferencesStore();

  useEffect(() => { fetchProfile(); }, []);

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-900">Run Investment Analysis</h1>
          <p className="text-sm text-gray-500">
            Our 4-agent AI pipeline will fetch market data, analyze it, recall your history, and generate a personalized report.
          </p>
        </div>

        {!profile ? (
          <div className="card border-orange-200 bg-orange-50">
            <div className="flex items-start gap-3">
              <AlertCircle size={20} className="text-orange-500 mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold text-orange-800">Investment profile required</p>
                <p className="text-sm text-orange-600 mt-1">
                  Please set up your investment preferences before running an analysis.
                </p>
                <Link to="/preferences" className="btn-primary inline-block mt-3 text-sm py-1.5">
                  Set Preferences
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Profile summary strip */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 flex flex-wrap gap-4 text-sm">
              <span className="text-gray-500">Risk: <strong className="text-gray-800 capitalize">{profile.risk_tolerance}</strong></span>
              <span className="text-gray-300">|</span>
              <span className="text-gray-500">Budget: <strong className="text-gray-800">${parseFloat(profile.budget).toLocaleString()}</strong></span>
              <span className="text-gray-300">|</span>
              <span className="text-gray-500">Horizon: <strong className="text-gray-800 capitalize">{profile.time_horizon}</strong></span>
              <span className="text-gray-300">|</span>
              <span className="text-gray-500">Sectors: <strong className="text-gray-800">{profile.sectors.length}</strong></span>
            </div>
            <AgentPipeline />
          </>
        )}
      </div>
    </Layout>
  );
}
