import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Play, RotateCcw, XCircle,
  TrendingUp, Zap, Clock,
} from 'lucide-react';
import useAgentStore from '../../store/useAgentStore';
import AgentStatusCard from './AgentStatusCard';

const AGENTS = ['market_data', 'analysis', 'memory', 'llm'];

const STAGE_MESSAGES = {
  idle:      null,
  pending:   { emoji: '⚙️', text: 'Initialising pipeline...',              sub: 'Setting up agents and loading your profile' },
  running:   { emoji: '🚀', text: 'Analysis in progress',                  sub: 'Agents are working — this takes 1–3 minutes' },
  completed: { emoji: '✅', text: 'Report ready!',                         sub: 'Your personalised investment report has been generated' },
  failed:    { emoji: '❌', text: 'Pipeline failed',                        sub: 'Something went wrong. Check the error below and try again.' },
  cancelled: { emoji: '🛑', text: 'Pipeline cancelled',                    sub: 'Click Run Again to start a fresh analysis' },
  conflict:  { emoji: '⚠️', text: 'Another analysis is already running',   sub: 'Cancel the existing run or wait for it to finish' },
};

// Human-readable descriptions of what each SSE event means
const SSE_LABELS = {
  market_data_done:   '📊 Market data fetched — quotes and news loaded for your sectors',
  analysis_done:      '🧠 Analysis complete — top tickers scored and portfolio allocated',
  memory_done:        '💾 Memory retrieved — past recommendations loaded into context',
  llm_done:           '🤖 AI report generated — Llama 3 has written your investment plan',
  market_data_error:  '⚠️  Market data had issues — using fallback data where needed',
  memory_error:       '⚠️  Memory unavailable — proceeding without historical context',
};

export default function AgentPipeline() {
  const {
    runStatus, stepLogs, currentReportId, error,
    cancelling, startRun, reset, cancelAndRestart, cancelCurrent,
  } = useAgentStore();
  const navigate = useNavigate();

  // Track when each agent started for the elapsed-time sub-steps
  const agentStartTimes = useRef({});
  const [, forceRender] = useState(0);

  // Tick every second while running so sub-step text updates
  useEffect(() => {
    if (runStatus !== 'running' && runStatus !== 'pending') return;
    const id = setInterval(() => forceRender(n => n + 1), 1000);
    return () => clearInterval(id);
  }, [runStatus]);

  // Record when each agent starts
  useEffect(() => {
    stepLogs.forEach(log => {
      if (log.status === 'running' && !agentStartTimes.current[log.agent_name]) {
        agentStartTimes.current[log.agent_name] = Date.now();
      }
    });
  }, [stepLogs]);

  // Compute which agent is currently active (running or about to run)
  const activeAgentIdx = (() => {
    const lastDone = [...AGENTS].reverse().findIndex(
      name => stepLogs.some(l => l.agent_name === name && l.status === 'done')
    );
    if (lastDone === -1) return runStatus === 'running' || runStatus === 'pending' ? 0 : -1;
    const doneIdx = AGENTS.length - 1 - lastDone;
    return doneIdx < AGENTS.length - 1 ? doneIdx + 1 : -1;
  })();

  const completedCount = stepLogs.filter(l => l.status === 'done').length;
  const progressPct = runStatus === 'completed' ? 100 : Math.round((completedCount / AGENTS.length) * 100);

  const isRunning  = runStatus === 'running' || runStatus === 'pending';
  const isDone     = runStatus === 'completed';
  const isFailed   = runStatus === 'failed';
  const isCancelled= runStatus === 'cancelled';
  const isConflict = runStatus === 'conflict';
  const isIdle     = runStatus === 'idle';

  const stage = STAGE_MESSAGES[runStatus];

  // Build human-readable activity log from step logs
  const activityLog = stepLogs.map(log => {
    const key = `${log.agent_name}_${log.status}`;
    return SSE_LABELS[key] || null;
  }).filter(Boolean);

  return (
    <div className="space-y-5">

      {/* ── Stage banner ── */}
      {stage && (
        <div className={`
          animate-slide-up rounded-xl p-4 border flex items-start gap-3
          ${isDone     ? 'bg-green-50  dark:bg-green-950/40  border-green-200  dark:border-green-800'  : ''}
          ${isRunning  ? 'bg-blue-50   dark:bg-blue-950/40   border-blue-200   dark:border-blue-800'   : ''}
          ${isFailed   ? 'bg-red-50    dark:bg-red-950/40    border-red-200    dark:border-red-800'    : ''}
          ${isCancelled? 'bg-slate-50  dark:bg-slate-800/60  border-slate-200  dark:border-slate-700' : ''}
          ${isConflict ? 'bg-amber-50  dark:bg-amber-950/40  border-amber-200  dark:border-amber-800' : ''}
        `}>
          <span className="text-xl leading-none mt-0.5">{stage.emoji}</span>
          <div className="flex-1 min-w-0">
            <p className={`font-semibold text-sm
              ${isDone      ? 'text-green-800  dark:text-green-300'  : ''}
              ${isRunning   ? 'text-blue-800   dark:text-blue-300'   : ''}
              ${isFailed    ? 'text-red-800    dark:text-red-300'    : ''}
              ${isCancelled ? 'text-slate-700  dark:text-slate-300'  : ''}
              ${isConflict  ? 'text-amber-800  dark:text-amber-300'  : ''}
            `}>
              {stage.text}
              {isRunning && (
                <span className="inline-flex gap-0.5 ml-2">
                  {[0,1,2].map(i => (
                    <span key={i} className="dot-bounce w-1.5 h-1.5 rounded-full bg-blue-500 inline-block"
                      style={{ animationDelay: `${i * 0.2}s` }} />
                  ))}
                </span>
              )}
            </p>
            <p className="text-xs mt-0.5 opacity-70">{stage.sub}</p>

            {/* Conflict actions inline */}
            {isConflict && (
              <div className="flex gap-2 mt-3">
                <button onClick={cancelAndRestart} disabled={cancelling}
                  className="flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white
                             font-semibold py-1.5 px-3 rounded-lg text-xs transition-all disabled:opacity-50">
                  <XCircle size={13} />
                  {cancelling ? 'Cancelling...' : 'Cancel & Start New'}
                </button>
                <button onClick={reset}
                  className="btn-secondary text-xs py-1.5 px-3">
                  Keep Existing
                </button>
              </div>
            )}
          </div>

          {/* Cancel button while running */}
          {isRunning && (
            <button onClick={cancelCurrent}
              className="shrink-0 btn-danger text-xs py-1.5 px-2 flex items-center gap-1">
              <XCircle size={13} /> Cancel
            </button>
          )}
        </div>
      )}

      {/* ── Progress bar ── */}
      {(isRunning || isDone) && (
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1">
              <Zap size={12} className="text-blue-500" />
              {isDone ? 'All agents completed' : `Agent ${completedCount + 1} of ${AGENTS.length} running`}
            </span>
            <span className="font-mono">{progressPct}%</span>
          </div>
          <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ease-out
                ${isDone ? 'bg-green-500' : 'bg-blue-500 progress-stripe'}`}
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      )}

      {/* ── Agent cards ── */}
      {!isConflict && (
        <div className="space-y-2">
          {AGENTS.map((name, idx) => {
            const log = stepLogs.find(s => s.agent_name === name);
            // Synthesise a 'running' log for the active agent
            const effectiveLog = (!log && idx === activeAgentIdx)
              ? { status: 'running', agent_name: name }
              : log;
            const startedAt = agentStartTimes.current[name] ||
              (idx === activeAgentIdx ? Date.now() : null);

            return (
              <div key={name} className="animate-agent-enter" style={{ animationDelay: `${idx * 0.08}s` }}>
                <AgentStatusCard
                  agentName={name}
                  log={effectiveLog}
                  startedAt={startedAt}
                />
              </div>
            );
          })}
        </div>
      )}

      {/* ── Live SSE activity log ── */}
      {activityLog.length > 0 && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700">
            <Clock size={13} className="text-slate-400" />
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
              Activity Log
            </span>
            {isRunning && (
              <span className="ml-auto w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            )}
          </div>
          <div className="px-4 py-3 space-y-1.5 max-h-36 overflow-y-auto">
            {activityLog.map((msg, i) => (
              <p key={i} className="text-xs text-slate-600 dark:text-slate-400 animate-slide-up leading-relaxed">
                {msg}
              </p>
            ))}
            {isRunning && (
              <p className="text-xs text-blue-500 dark:text-blue-400 animate-slide-up flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping inline-block" />
                Processing...
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── Error detail ── */}
      {isFailed && error && (
        <div className="animate-slide-up rounded-lg border border-red-200 dark:border-red-800
                        bg-red-50 dark:bg-red-950/40 p-4 text-sm text-red-700 dark:text-red-400">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* ── Success CTA ── */}
      {isDone && currentReportId && (
        <div className="animate-slide-up rounded-xl border-2 border-green-300 dark:border-green-700
                        bg-gradient-to-br from-green-50 to-emerald-50
                        dark:from-green-950/40 dark:to-emerald-950/40 p-6 text-center">
          <div className="text-3xl mb-2">🎉</div>
          <p className="font-bold text-green-800 dark:text-green-300 text-lg mb-1">
            Your Report is Ready!
          </p>
          <p className="text-sm text-green-700 dark:text-green-400 mb-4">
            AI-powered investment recommendations tailored to your profile.
          </p>
          <button
            onClick={() => navigate(`/reports/${currentReportId}`)}
            className="btn-primary bg-green-600 hover:bg-green-700 flex items-center gap-2 mx-auto"
          >
            <TrendingUp size={16} /> View Full Report
          </button>
        </div>
      )}

      {/* ── Bottom controls ── */}
      {!isConflict && (
        <div className="flex items-center justify-between pt-1">
          <div className="flex gap-2">
            {(isDone || isFailed || isCancelled || isIdle) && (
              <button onClick={startRun} className="btn-primary flex items-center gap-2">
                <Play size={15} />
                {isCancelled || isDone ? 'Run Again' : 'Start Analysis'}
              </button>
            )}
          </div>
          {(isDone || isFailed || isCancelled) && (
            <button onClick={reset} className="btn-secondary flex items-center gap-2 text-sm">
              <RotateCcw size={14} /> Reset
            </button>
          )}
        </div>
      )}
    </div>
  );
}
