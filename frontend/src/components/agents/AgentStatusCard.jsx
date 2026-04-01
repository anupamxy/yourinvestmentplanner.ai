import { CheckCircle, XCircle, Clock, Database, BarChart2, Brain, Cpu } from 'lucide-react';

const AGENT_META = {
  market_data: {
    label: 'Market Data Agent',
    Icon: BarChart2,
    color: 'blue',
    steps: [
      'Connecting to Alpha Vantage API...',
      'Fetching real-time stock quotes...',
      'Pulling sector performance data...',
      'Retrieving news sentiment scores...',
      'Normalizing market data...',
    ],
  },
  analysis: {
    label: 'Analysis Agent',
    Icon: Brain,
    color: 'purple',
    steps: [
      'Loading market data into engine...',
      'Scoring tickers against risk profile...',
      'Calculating sentiment weights...',
      'Ranking top investment candidates...',
      'Building portfolio allocation...',
    ],
  },
  memory: {
    label: 'Memory Agent',
    Icon: Database,
    color: 'green',
    steps: [
      'Connecting to vector store...',
      'Generating semantic query embedding...',
      'Searching past recommendations...',
      'Retrieving relevant history...',
      'Preparing memory context...',
    ],
  },
  llm: {
    label: 'LLM Agent',
    Icon: Cpu,
    color: 'orange',
    steps: [
      'Assembling investment context...',
      'Building personalized prompt...',
      'Calling Groq AI (Llama 3)...',
      'Streaming model response...',
      'Formatting investment report...',
    ],
  },
};

const COLORS = {
  blue:   { ring: 'ring-blue-500',   bg: 'bg-blue-500',   light: 'bg-blue-50 dark:bg-blue-950/40',   icon: 'text-blue-600 dark:text-blue-400',   border: 'border-blue-300 dark:border-blue-700',   glow: 'shadow-blue-200 dark:shadow-blue-900' },
  purple: { ring: 'ring-purple-500', bg: 'bg-purple-500', light: 'bg-purple-50 dark:bg-purple-950/40', icon: 'text-purple-600 dark:text-purple-400', border: 'border-purple-300 dark:border-purple-700', glow: 'shadow-purple-200 dark:shadow-purple-900' },
  green:  { ring: 'ring-green-500',  bg: 'bg-green-500',  light: 'bg-green-50 dark:bg-green-950/40',  icon: 'text-green-600 dark:text-green-400',  border: 'border-green-300 dark:border-green-700',  glow: 'shadow-green-200 dark:shadow-green-900' },
  orange: { ring: 'ring-orange-500', bg: 'bg-orange-500', light: 'bg-orange-50 dark:bg-orange-950/40', icon: 'text-orange-600 dark:text-orange-400', border: 'border-orange-300 dark:border-orange-700', glow: 'shadow-orange-200 dark:shadow-orange-900' },
};

function TypingDots() {
  return (
    <span className="inline-flex items-center gap-0.5 ml-1">
      {[0, 1, 2].map(i => (
        <span key={i} className="dot-bounce w-1 h-1 rounded-full bg-current inline-block" style={{ animationDelay: `${i * 0.2}s` }} />
      ))}
    </span>
  );
}

function RunningSubtext({ agentName, elapsed }) {
  const steps = AGENT_META[agentName]?.steps ?? [];
  // Cycle through sub-steps every ~4 seconds
  const idx = Math.min(Math.floor(elapsed / 4), steps.length - 1);
  return (
    <p className="text-xs mt-1.5 font-mono flex items-center gap-1">
      <span className="opacity-70">{steps[idx]}</span>
      <TypingDots />
    </p>
  );
}

export default function AgentStatusCard({ agentName, log, startedAt }) {
  const meta = AGENT_META[agentName];
  if (!meta) return null;
  const { Icon, color, label } = meta;
  const c = COLORS[color];

  const status = log?.status ?? 'pending';
  const durationSec = log?.duration_ms ? (log.duration_ms / 1000).toFixed(1) : null;
  const elapsed = startedAt ? Math.floor((Date.now() - startedAt) / 1000) : 0;

  const isDone    = status === 'done';
  const isRunning = status === 'running';
  const isError   = status === 'error';
  const isPending = status === 'pending';

  return (
    <div
      className={`
        relative overflow-hidden rounded-xl border-2 p-4 transition-all duration-500
        animate-agent-enter
        ${isDone    ? `${c.border} ${c.light} shadow-md ${c.glow}` : ''}
        ${isRunning ? `${c.border} ${c.light} shadow-lg ${c.glow} animate-pulse-glow` : ''}
        ${isError   ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-950/40' : ''}
        ${isPending ? 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900' : ''}
      `}
    >
      {/* Shimmer overlay when running */}
      {isRunning && (
        <div className="absolute inset-0 shimmer pointer-events-none" />
      )}

      <div className="relative flex items-start gap-4">
        {/* Icon bubble */}
        <div className={`
          relative shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500
          ${isPending ? 'bg-slate-100 dark:bg-slate-800' : c.light}
          ${isRunning ? `ring-2 ${c.ring} ring-offset-2 dark:ring-offset-slate-900` : ''}
        `}>
          <Icon size={20} className={isPending ? 'text-slate-400' : c.icon} />
          {isRunning && (
            <span className={`absolute -top-1 -right-1 w-3 h-3 ${c.bg} rounded-full animate-ping opacity-75`} />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className={`font-semibold text-sm ${isDone || isRunning ? 'text-slate-900 dark:text-slate-100' : 'text-slate-500 dark:text-slate-400'}`}>
              {label}
            </span>
            {durationSec && (
              <span className="text-xs text-slate-400 dark:text-slate-500 tabular-nums shrink-0">
                {durationSec}s
              </span>
            )}
          </div>

          {/* Status line */}
          {isPending && (
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Waiting to start...</p>
          )}
          {isRunning && (
            <span className={`text-xs font-medium ${c.icon}`}>
              <RunningSubtext agentName={agentName} elapsed={elapsed} />
            </span>
          )}
          {isDone && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {log?.output?.memories_retrieved !== undefined && `${log.output.memories_retrieved} memories retrieved · `}
              {log?.output?.tickers && `Fetched ${log.output.tickers.length} tickers · `}
              {log?.output?.top_picks && `Top picks: ${log.output.top_picks.join(', ')} · `}
              {log?.output?.response_length && `${log.output.response_length} chars generated · `}
              {log?.output?.note && `${log.output.note} · `}
              Completed in {durationSec}s
            </p>
          )}
          {isError && (
            <p className="text-xs text-red-500 dark:text-red-400 mt-0.5 truncate">
              {log?.output?.error || 'An error occurred'}
            </p>
          )}
        </div>

        {/* Status icon */}
        <div className="shrink-0 flex items-center">
          {isPending && <Clock size={18} className="text-slate-300 dark:text-slate-600" />}
          {isRunning && (
            <div className={`w-5 h-5 rounded-full border-2 border-current ${c.icon} border-t-transparent animate-spin`} />
          )}
          {isDone && <CheckCircle size={20} className="text-green-500 animate-check-pop" />}
          {isError && <XCircle size={20} className="text-red-400" />}
        </div>
      </div>

      {/* Bottom progress bar when running */}
      {isRunning && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-200 dark:bg-slate-700">
          <div className={`h-full ${c.bg} progress-stripe`} style={{ width: `${Math.min(elapsed * 3, 90)}%`, transition: 'width 1s linear' }} />
        </div>
      )}
    </div>
  );
}
