import { useEffect, useState } from 'react';
import { Globe, Brain, CheckCircle, Loader } from 'lucide-react';

const AGENTS = [
  {
    key:   'web_research',
    label: 'Web Research Agent',
    icon:  Globe,
    color: 'indigo',
    steps: [
      'Searching Reddit for community advice...',
      'Finding relevant Quora discussions...',
      'Scanning financial news & blogs...',
      'Collecting community wisdom...',
      'Summarising findings...',
    ],
  },
  {
    key:   'life_advisor',
    label: 'Life Advisor AI',
    icon:  Brain,
    color: 'violet',
    steps: [
      'Analysing your life profile...',
      'Calculating financial health score...',
      'Building your goals timeline...',
      'Crafting investment plan...',
      'Generating personalised report...',
    ],
  },
];

function AgentCard({ agent, status, elapsed }) {
  const Icon = agent.icon;
  const stepIdx = Math.min(Math.floor(elapsed / 5), agent.steps.length - 1);
  const isDone    = status === 'done';
  const isRunning = status === 'running';
  const isPending = !status;

  const colorMap = {
    indigo: {
      ring:   'ring-indigo-500',
      bg:     'bg-indigo-50 dark:bg-indigo-900/20',
      border: 'border-indigo-200 dark:border-indigo-700',
      icon:   'bg-indigo-100 dark:bg-indigo-800 text-indigo-600 dark:text-indigo-300',
      bar:    'bg-indigo-500',
      text:   'text-indigo-700 dark:text-indigo-300',
    },
    violet: {
      ring:   'ring-violet-500',
      bg:     'bg-violet-50 dark:bg-violet-900/20',
      border: 'border-violet-200 dark:border-violet-700',
      icon:   'bg-violet-100 dark:bg-violet-800 text-violet-600 dark:text-violet-300',
      bar:    'bg-violet-500',
      text:   'text-violet-700 dark:text-violet-300',
    },
  };
  const c = colorMap[agent.color];

  return (
    <div className={`relative rounded-2xl border-2 p-5 transition-all duration-500 overflow-hidden
      ${isDone    ? `${c.bg} ${c.border}` : ''}
      ${isRunning ? `${c.bg} ${c.border} ring-2 ${c.ring} shadow-lg` : ''}
      ${isPending ? 'border-gray-200 dark:border-white/[0.1] bg-white dark:bg-[var(--bg-raised)]/50 opacity-50' : ''}`}>

      {/* Shimmer while running */}
      {isRunning && <div className="shimmer absolute inset-0 pointer-events-none opacity-30" />}

      <div className="flex items-start gap-4">
        <div className={`relative w-12 h-12 rounded-xl flex items-center justify-center shrink-0
          ${isDone || isRunning ? c.icon : 'bg-gray-100 dark:bg-slate-700 text-[var(--text-muted)]'}`}>
          {isRunning && <div className={`absolute inset-0 rounded-xl border-2 ${c.ring} animate-spin border-t-transparent`} />}
          {isDone ? <CheckCircle size={22} className="text-green-500 animate-check-pop" /> : <Icon size={20} />}
          {isRunning && <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-green-400 animate-ping" />}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h4 className={`font-semibold text-sm ${isDone || isRunning ? 'text-white dark:text-white' : 'text-[var(--text-muted)] dark:text-[var(--text-muted)]'}`}>
              {agent.label}
            </h4>
            {isDone    && <span className="text-xs font-medium text-green-600 dark:text-green-400">✓ Done</span>}
            {isRunning && <span className={`text-xs font-medium ${c.text}`}>{elapsed}s</span>}
            {isPending && <span className="text-xs text-[var(--text-muted)]">Waiting...</span>}
          </div>

          <p className={`text-xs mt-1 transition-all duration-300 ${isRunning ? c.text : 'text-[var(--text-muted)] dark:text-[var(--text-muted)]'}`}>
            {isDone    ? 'Completed successfully' : isRunning ? agent.steps[stepIdx] : 'Waiting to start'}
          </p>

          {/* Progress bar */}
          {isRunning && (
            <div className="mt-3 h-1.5 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
              <div className={`h-full ${c.bar} progress-stripe rounded-full`}
                style={{ width: `${Math.min(((stepIdx + 1) / agent.steps.length) * 85 + 10, 95)}%`, transition: 'width 0.8s ease' }} />
            </div>
          )}
          {isDone && (
            <div className="mt-3 h-1.5 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
              <div className={`h-full ${c.bar} rounded-full w-full transition-all duration-500`} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function LifeAdvisorPipeline({ runStatus, agentSteps, onStart, loading }) {
  const [elapsed, setElapsed] = useState(0);
  const isRunning = runStatus === 'running';

  useEffect(() => {
    if (!isRunning) { setElapsed(0); return; }
    const interval = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(interval);
  }, [isRunning]);

  return (
    <div className="space-y-4">
      {/* Status banner */}
      <div className={`rounded-xl px-4 py-3 text-sm font-medium flex items-center gap-2 transition-all
        ${runStatus === 'idle'      ? 'bg-gray-50 dark:bg-[var(--bg-raised)] text-[var(--text-muted)] dark:text-[var(--text-secondary)] border border-gray-200 dark:border-white/[0.1]' : ''}
        ${runStatus === 'running'   ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-700' : ''}
        ${runStatus === 'completed' ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-700' : ''}
        ${runStatus === 'failed'    ? 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-700' : ''}`}>
        {runStatus === 'idle'      && <><Loader size={15} /> Ready to analyse your life profile</>}
        {runStatus === 'running'   && <><span className="w-2 h-2 bg-indigo-500 rounded-full animate-ping inline-block" /> AI agents are researching your situation — {elapsed}s elapsed</>}
        {runStatus === 'completed' && <>🎉 Your life financial plan is ready!</>}
        {runStatus === 'failed'    && <>❌ Analysis failed. Please try again.</>}
      </div>

      {/* Agent cards */}
      <div className="space-y-3">
        {AGENTS.map((agent) => (
          <AgentCard key={agent.key} agent={agent} status={agentSteps[agent.key]} elapsed={elapsed} />
        ))}
      </div>

      {/* CTA */}
      {(runStatus === 'idle' || runStatus === 'failed') && (
        <button onClick={onStart} disabled={loading}
          className="w-full btn-primary py-3.5 text-base font-semibold flex items-center justify-center gap-2 disabled:opacity-50">
          {loading ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Starting...</> : '🚀 Start Life Analysis'}
        </button>
      )}
    </div>
  );
}
