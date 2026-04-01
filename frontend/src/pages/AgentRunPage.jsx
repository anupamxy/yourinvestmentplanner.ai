import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, Cpu, BarChart2, Brain, Database } from 'lucide-react';
import Layout from '../components/layout/Layout';
import AgentPipeline from '../components/agents/AgentPipeline';
import usePreferencesStore from '../store/usePreferencesStore';

const HOW_IT_WORKS = [
  { Icon: BarChart2, color: 'text-blue-500',   label: 'Market Data',  desc: 'Fetches live prices & news for your sectors' },
  { Icon: Brain,     color: 'text-purple-500', label: 'Analysis',     desc: 'Scores tickers and builds your portfolio' },
  { Icon: Database,  color: 'text-green-500',  label: 'Memory',       desc: 'Recalls your past recommendations' },
  { Icon: Cpu,       color: 'text-orange-500', label: 'AI Report',    desc: 'Generates your full investment plan with Llama 3' },
];

export default function AgentRunPage() {
  const { profile, fetchProfile } = usePreferencesStore();

  useEffect(() => { fetchProfile(); }, []);

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6">

        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Investment Analysis
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            4 AI agents work in sequence to deliver personalised market insights.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {HOW_IT_WORKS.map(({ Icon, color, label, desc }, i) => (
            <div key={i} className="card p-3 flex flex-col gap-2">
              <div className={`${color} flex items-center gap-1.5 font-semibold text-xs`}>
                <Icon size={14} /> {label}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-snug">{desc}</p>
            </div>
          ))}
        </div>

        {!profile ? (
          <div className="card border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-950/40">
            <div className="flex items-start gap-3">
              <AlertCircle size={20} className="text-orange-500 mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold text-orange-800 dark:text-orange-300">
                  Investment profile required
                </p>
                <p className="text-sm text-orange-700 dark:text-orange-400 mt-1">
                  Set your risk tolerance, sectors, and budget before running an analysis.
                </p>
                <Link to="/preferences" className="btn-primary inline-flex mt-3 text-sm py-1.5">
                  Set Preferences
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="rounded-xl border border-slate-200 dark:border-slate-700
                            bg-white dark:bg-slate-900 px-4 py-3
                            flex flex-wrap gap-x-5 gap-y-1.5 text-sm items-center">
              <span className="text-slate-500 dark:text-slate-400">
                Risk: <strong className="text-slate-800 dark:text-slate-200 capitalize">{profile.risk_tolerance}</strong>
              </span>
              <span className="text-slate-500 dark:text-slate-400">
                Budget: <strong className="text-slate-800 dark:text-slate-200">${parseFloat(profile.budget).toLocaleString()} {profile.currency}</strong>
              </span>
              <span className="text-slate-500 dark:text-slate-400">
                Horizon: <strong className="text-slate-800 dark:text-slate-200 capitalize">{profile.time_horizon}-term</strong>
              </span>
              <span className="text-slate-500 dark:text-slate-400">
                Sectors: <strong className="text-slate-800 dark:text-slate-200">{profile.sectors.map(s => s.replace('_', ' ')).join(', ')}</strong>
              </span>
              <Link to="/preferences" className="ml-auto text-xs text-blue-500 hover:text-blue-700 dark:text-blue-400 underline underline-offset-2">
                Edit
              </Link>
            </div>

            <div className="card">
              <AgentPipeline />
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
