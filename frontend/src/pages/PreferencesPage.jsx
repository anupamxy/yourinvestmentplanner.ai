import { useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import PreferencesForm from '../components/preferences/PreferencesForm';
import { Settings } from 'lucide-react';

export default function PreferencesPage() {
  const navigate = useNavigate();

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-50 rounded-lg">
            <Settings size={22} className="text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Investment Preferences</h1>
            <p className="text-sm text-gray-500">Tell the AI about your investment goals and risk tolerance</p>
          </div>
        </div>

        <div className="card">
          <PreferencesForm onSaved={() => setTimeout(() => navigate('/run'), 1000)} />
        </div>
      </div>
    </Layout>
  );
}
