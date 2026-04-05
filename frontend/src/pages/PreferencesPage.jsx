import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import Layout from '../components/layout/Layout';
import PreferencesCanvas from '../components/preferences/PreferencesCanvas';
import usePreferencesStore from '../store/usePreferencesStore';

export default function PreferencesPage() {
  const navigate = useNavigate();
  const { profile, saving, fetchProfile, saveProfile } = usePreferencesStore();
  const [saved, setSaved] = useState(false);

  useEffect(() => { fetchProfile(); }, []);

  const handleSave = async (payload) => {
    const ok = await saveProfile(payload);
    if (ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  };

  return (
    <Layout>
      <div className="flex flex-col h-[calc(100vh-4rem)]">

        {/* Header */}
        <div className="flex items-center justify-between pb-4 shrink-0">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              📈 Investment Preferences
            </h1>
            <p className="text-sm text-[var(--text-secondary)] mt-0.5">
              Configure your risk, budget, sectors and goals — drag nodes to arrange
            </p>
          </div>

          {profile && (
            <button
              onClick={() => navigate('/run')}
              className="flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl
                         bg-gradient-to-r from-indigo-600 to-violet-600
                         hover:from-indigo-500 hover:to-violet-500
                         text-white shadow-md shadow-indigo-500/20 transition-all active:scale-95"
            >
              Run Analysis <ArrowRight size={15} />
            </button>
          )}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-2 mb-3 shrink-0">
          {[
            { color: 'bg-amber-500',   label: 'Risk Tolerance' },
            { color: 'bg-emerald-500', label: 'Budget' },
            { color: 'bg-cyan-500',    label: 'Sectors' },
            { color: 'bg-violet-500',  label: 'Goal' },
            { color: 'bg-rose-500',    label: 'Time Horizon' },
          ].map(({ color, label }) => (
            <span key={label} className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
              <span className={`w-2 h-2 rounded-full ${color}`} />
              {label}
            </span>
          ))}
        </div>

        {/* Canvas */}
        <div className="flex-1 min-h-0">
          <PreferencesCanvas
            existingProfile={profile}
            onSave={handleSave}
            saving={saving}
            saved={saved}
          />
        </div>
      </div>
    </Layout>
  );
}
