import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Edit3, User } from 'lucide-react';
import Layout from '../components/layout/Layout';
import LifeAdvisorPipeline from '../components/life_advisor/LifeAdvisorPipeline';
import LifeAdvisorReport from '../components/life_advisor/LifeAdvisorReport';
import ResearchSidebar from '../components/life_advisor/ResearchSidebar';
import useLifeAdvisorStore from '../store/useLifeAdvisorStore';

export default function LifeAdvisorPage() {
  const {
    lifeProfile, profileLoading,
    runStatus, agentSteps, report, webSources, runError,
    fetchProfile, startRun, reset,
  } = useLifeAdvisorStore();

  useEffect(() => { fetchProfile(); }, []);

  const symbol     = lifeProfile?.currency === 'INR' ? '₹' : '$';
  const hasProfile = !!lifeProfile;

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-5">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              🌟 Life Financial Advisor
            </h1>
            <p className="text-sm text-[var(--text-muted)] mt-1">
              AI-powered financial plan built around your life — profession, family, goals &amp; community wisdom
            </p>
          </div>
          <Link
            to="/life-profile"
            className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300
                       border border-indigo-500/30 hover:border-indigo-400/50
                       bg-indigo-500/10 hover:bg-indigo-500/15
                       rounded-lg px-3 py-1.5 transition-all"
          >
            <Edit3 size={13} /> {hasProfile ? 'Edit Profile' : 'Create Profile'}
          </Link>
        </div>

        {/* No profile warning */}
        {!profileLoading && !hasProfile && (
          <div className="rounded-2xl border-2 border-dashed border-indigo-500/30 bg-black p-10 text-center max-w-3xl mx-auto">
            <div className="w-16 h-16 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl
                            flex items-center justify-center mx-auto mb-4">
              <User size={28} className="text-indigo-400" />
            </div>
            <h3 className="font-bold text-white mb-2">Set Up Your Life Profile First</h3>
            <p className="text-sm text-[var(--text-muted)] mb-5">
              Tell us about your profession, family, finances, and life goals to get your personalised AI life plan.
            </p>
            <Link to="/life-profile" className="btn-primary inline-flex items-center gap-2">
              <Edit3 size={15} /> Create Life Profile
            </Link>
          </div>
        )}

        {/* Profile summary pill */}
        {hasProfile && (
          <div className="bg-[var(--bg-card)] border border-white/[0.08] rounded-2xl px-5 py-4">
            <div className="flex flex-wrap gap-5 text-sm">
              {[
                { label: 'Profession', val: lifeProfile.profession },
                { label: 'Salary',    val: `${symbol}${Number(lifeProfile.monthly_salary).toLocaleString()}/mo` },
                { label: 'Family',    val: `${lifeProfile.family_members} members` },
                { label: 'City',      val: lifeProfile.city || '—' },
                { label: 'Goals',     val: `${(lifeProfile.life_goals || []).length} goals` },
              ].map(({ label, val }) => (
                <div key={label}>
                  <span className="text-[var(--text-muted)] text-[11px] uppercase tracking-wider">{label}</span>
                  <p className="font-semibold text-white">{val}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pipeline */}
        {hasProfile && runStatus !== 'completed' && (
          <div className="max-w-3xl mx-auto w-full">
            <LifeAdvisorPipeline
              runStatus={runStatus}
              agentSteps={agentSteps}
              onStart={startRun}
              loading={runStatus === 'running'}
            />
          </div>
        )}

        {runError && runStatus === 'failed' && (
          <p className="text-sm text-red-400 bg-red-950/30 border border-red-800/50
                        rounded-xl p-3 max-w-3xl mx-auto">
            {runError}
          </p>
        )}

        {/* Two-column: Report + Research sidebar */}
        {runStatus === 'completed' && report && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 items-start">
            <div className="lg:col-span-3 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-white">Your Life Financial Plan</h2>
                <button
                  onClick={reset}
                  className="text-xs text-indigo-400 hover:text-indigo-300
                             border border-indigo-500/30 hover:border-indigo-400/50
                             bg-indigo-500/10 rounded-lg px-3 py-1.5 transition-all"
                >
                  Run New Analysis
                </button>
              </div>
              <LifeAdvisorReport report={report} symbol={symbol} />
            </div>
            <div className="lg:col-span-2">
              <div className="sticky top-20" style={{ maxHeight: 'calc(100vh - 5rem)', overflowY: 'auto' }}>
                <ResearchSidebar sources={webSources} />
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
