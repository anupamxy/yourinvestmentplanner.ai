import { CheckCircle, XCircle, Clock, Database, BarChart2, Brain, Cpu } from 'lucide-react';

const AGENT_META = {
  market_data: {
    label: 'Market Data Agent', Icon: BarChart2, color: 'blue',
    steps: ['Connecting to Alpha Vantage API...','Fetching real-time stock quotes...','Pulling sector performance data...','Retrieving news sentiment scores...','Normalizing market data...'],
  },
  analysis: {
    label: 'Analysis Agent', Icon: Brain, color: 'purple',
    steps: ['Loading market data into engine...','Scoring tickers against risk profile...','Calculating sentiment weights...','Ranking top investment candidates...','Building portfolio allocation...'],
  },
  memory: {
    label: 'Memory Agent', Icon: Database, color: 'emerald',
    steps: ['Connecting to vector store...','Generating semantic query embedding...','Searching past recommendations...','Retrieving relevant history...','Preparing memory context...'],
  },
  llm: {
    label: 'LLM Agent', Icon: Cpu, color: 'amber',
    steps: ['Assembling investment context...','Building personalized prompt...','Calling Groq AI (Llama 3)...','Streaming model response...','Formatting investment report...'],
  },
};

const THEME = {
  blue:    { border: 'border-blue-500/30',    bg: 'rgba(59,130,246,0.06)',   icon: 'text-blue-400',    ring: 'rgba(59,130,246,0.4)',   bar: 'bg-blue-500',    glow: 'bg-blue-500/10'   },
  purple:  { border: 'border-violet-500/30',  bg: 'rgba(139,92,246,0.06)',   icon: 'text-violet-400',  ring: 'rgba(139,92,246,0.4)',   bar: 'bg-violet-500',  glow: 'bg-violet-500/10' },
  emerald: { border: 'border-emerald-500/30', bg: 'rgba(16,185,129,0.06)',   icon: 'text-emerald-400', ring: 'rgba(16,185,129,0.4)',   bar: 'bg-emerald-500', glow: 'bg-emerald-500/10'},
  amber:   { border: 'border-amber-500/30',   bg: 'rgba(245,158,11,0.06)',   icon: 'text-amber-400',   ring: 'rgba(245,158,11,0.4)',   bar: 'bg-amber-500',   glow: 'bg-amber-500/10'  },
};

function TypingDots() {
  return (
    <span className="inline-flex items-center gap-0.5 ml-1">
      {[0,1,2].map(i => (
        <span key={i} className="dot-bounce w-1 h-1 rounded-full bg-current inline-block"
              style={{ animationDelay: `${i * 0.2}s` }} />
      ))}
    </span>
  );
}

export default function AgentStatusCard({ agentName, log, startedAt }) {
  const meta = AGENT_META[agentName];
  if (!meta) return null;
  const { Icon, color, label } = meta;
  const t = THEME[color];

  const status    = log?.status ?? 'pending';
  const durationSec = log?.duration_ms ? (log.duration_ms / 1000).toFixed(1) : null;
  const elapsed   = startedAt ? Math.floor((Date.now() - startedAt) / 1000) : 0;
  const stepIdx   = Math.min(Math.floor(elapsed / 4), meta.steps.length - 1);

  const isDone    = status === 'done';
  const isRunning = status === 'running';
  const isError   = status === 'error';
  const isPending = status === 'pending';

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border transition-all duration-500 animate-agent-enter p-4
                  ${isPending ? 'border-white/[0.06]' : t.border}
                  ${isError   ? 'border-red-500/30' : ''}`}
      style={{
        background: isError ? 'rgba(239,68,68,0.06)' : '#000000',
      }}
    >
      {/* Shimmer when running */}
      {isRunning && <div className="absolute inset-0 shimmer pointer-events-none" />}

      <div className="relative flex items-start gap-3">
        {/* Icon */}
        <div
          className={`relative w-9 h-9 rounded-xl flex items-center justify-center shrink-0
                      border transition-all duration-500
                      ${isPending ? 'border-white/[0.06]' : t.border}`}
          style={{ background: t.bg }}
        >
          <Icon size={17}
            className={isPending ? 'text-[var(--text-muted)]' : isError ? 'text-red-400' : t.icon} />
          {isRunning && (
            <span className={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full ${t.bar} animate-ping opacity-75`} />
          )}
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className={`font-semibold text-[13px] ${isPending ? 'text-[var(--text-muted)]' : 'text-white'}`}>
              {label}
            </span>
            {durationSec && (
              <span className="text-[11px] text-[var(--text-muted)] tabular-nums shrink-0">{durationSec}s</span>
            )}
          </div>

          {isPending && <p className="text-[11px] text-slate-700 mt-0.5">Waiting to start…</p>}

          {isRunning && (
            <p className={`text-[11px] font-medium mt-1 ${t.icon} font-mono flex items-center`}>
              {meta.steps[stepIdx]}
              <TypingDots />
            </p>
          )}

          {isDone && (
            <p className="text-[11px] text-[var(--text-muted)] mt-0.5 leading-relaxed">
              {log?.output?.memories_retrieved !== undefined && `${log.output.memories_retrieved} memories · `}
              {log?.output?.tickers           && `${log.output.tickers.length} tickers · `}
              {log?.output?.top_picks         && `Picks: ${log.output.top_picks.join(', ')} · `}
              {log?.output?.response_length   && `${log.output.response_length} chars · `}
              {log?.output?.note              && `${log.output.note} · `}
              Done in {durationSec}s
            </p>
          )}

          {isError && (
            <p className="text-[11px] text-red-400 mt-0.5 truncate">
              {log?.output?.error || 'An error occurred'}
            </p>
          )}
        </div>

        {/* Status icon */}
        <div className="shrink-0">
          {isPending && <Clock size={16} className="text-slate-700" />}
          {isRunning && (
            <div className={`w-4 h-4 rounded-full border-2 border-t-transparent ${t.icon} animate-spin`}
                 style={{ borderColor: 'currentColor', borderTopColor: 'transparent' }} />
          )}
          {isDone  && <CheckCircle size={17} className="text-emerald-400 animate-check-pop" />}
          {isError && <XCircle     size={17} className="text-red-400" />}
        </div>
      </div>

      {/* Progress bar */}
      {isRunning && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/[0.04]">
          <div
            className={`h-full ${t.bar} transition-all duration-1000 progress-stripe`}
            style={{ width: `${Math.min(elapsed * 3, 90)}%` }}
          />
        </div>
      )}
    </div>
  );
}
