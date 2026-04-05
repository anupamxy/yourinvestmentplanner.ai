import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import Layout from '../components/layout/Layout';
import ProfileCanvas from '../components/life_profile/ProfileCanvas';
import useLifeAdvisorStore from '../store/useLifeAdvisorStore';

export default function LifeProfilePage() {
  const navigate = useNavigate();
  const { lifeProfile, profileLoading, profileSaving, profileError, fetchProfile, saveProfile } = useLifeAdvisorStore();
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

        {/* ── Page header ── */}
        <div className="flex items-center justify-between px-1 pb-4 shrink-0">
          <div>
            <h1 className="text-2xl font-bold text-white dark:text-white flex items-center gap-2">
              🌟 Life Financial Profile
            </h1>
            <p className="text-sm text-[var(--text-muted)] dark:text-[var(--text-secondary)] mt-0.5">
              Build your profile visually — add nodes, connect them and edit each card
            </p>
          </div>

          {lifeProfile && (
            <button
              onClick={() => navigate('/life-advisor')}
              className="flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-sm"
            >
              Run Analysis <ArrowRight size={15} />
            </button>
          )}
        </div>

        {/* ── Legend ── */}
        <div className="flex flex-wrap gap-2 mb-3 shrink-0">
          {[
            { color: 'bg-blue-500',   label: 'Professional' },
            { color: 'bg-purple-500', label: 'Personal' },
            { color: 'bg-green-500',  label: 'Financial' },
            { color: 'bg-amber-400',  label: 'Life Goal' },
            { color: 'bg-red-500',    label: 'Loan / EMI' },
          ].map(({ color, label }) => (
            <span key={label} className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)] dark:text-[var(--text-secondary)]">
              <span className={`w-2.5 h-2.5 rounded-full ${color}`} />
              {label}
            </span>
          ))}
        </div>

        {profileError && (
          <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl px-4 py-2 mb-3 shrink-0">
            {profileError}
          </p>
        )}

        {/* ── Canvas ── */}
        {profileLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="flex-1 min-h-0">
            <ProfileCanvas
              existingProfile={lifeProfile}
              onSave={handleSave}
              saving={profileSaving}
              saved={saved}
            />
          </div>
        )}
      </div>
    </Layout>
  );
}
