import { CheckCircle, Loader, XCircle, Clock, Database, BarChart2, Brain, Cpu } from 'lucide-react';

const AGENT_META = {
  market_data: { label: 'Market Data Agent',  desc: 'Fetching real-time prices & news', Icon: BarChart2, color: 'blue' },
  analysis:    { label: 'Analysis Agent',      desc: 'Scoring and ranking tickers',      Icon: Brain,    color: 'purple' },
  memory:      { label: 'Memory Agent',        desc: 'Retrieving past context',          Icon: Database, color: 'green' },
  llm:         { label: 'LLM Agent',           desc: 'Generating AI investment report',  Icon: Cpu,      color: 'orange' },
};

const COLOR_MAP = {
  blue:   { bg: 'bg-blue-50',   icon: 'text-blue-600',   border: 'border-blue-200' },
  purple: { bg: 'bg-purple-50', icon: 'text-purple-600', border: 'border-purple-200' },
  green:  { bg: 'bg-green-50',  icon: 'text-green-600',  border: 'border-green-200' },
  orange: { bg: 'bg-orange-50', icon: 'text-orange-600', border: 'border-orange-200' },
};

export default function AgentStatusCard({ agentName, log }) {
  const meta = AGENT_META[agentName];
  const { Icon, color, label, desc } = meta;
  const colors = COLOR_MAP[color];

  const status = log?.status ?? 'pending';
  const durationSec = log?.duration_ms ? (log.duration_ms / 1000).toFixed(1) : null;

  return (
    <div className={`card flex items-start gap-4 border-2 transition-all ${
      status === 'done'    ? `${colors.border} ${colors.bg}` :
      status === 'running' ? 'border-yellow-300 bg-yellow-50' :
      status === 'error'   ? 'border-red-200 bg-red-50' :
      'border-gray-200 bg-white'
    }`}>
      <div className={`p-2 rounded-lg ${status === 'pending' ? 'bg-gray-100' : colors.bg}`}>
        <Icon size={22} className={status === 'pending' ? 'text-gray-400' : colors.icon} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <p className="font-semibold text-sm text-gray-800">{label}</p>
          {durationSec && (
            <span className="text-xs text-gray-400">{durationSec}s</span>
          )}
        </div>
        <p className="text-xs text-gray-500 mt-0.5">{desc}</p>

        {log?.output?.memories_retrieved !== undefined && (
          <p className="text-xs text-green-600 mt-1">
            {log.output.memories_retrieved} memories retrieved
          </p>
        )}
        {log?.output?.tickers && (
          <p className="text-xs text-blue-600 mt-1">
            Tickers: {log.output.tickers.join(', ')}
          </p>
        )}
        {log?.output?.top_picks && (
          <p className="text-xs text-purple-600 mt-1">
            Top picks: {log.output.top_picks.join(', ')}
          </p>
        )}
        {log?.output?.error && (
          <p className="text-xs text-red-500 mt-1 truncate">{log.output.error}</p>
        )}
      </div>

      <div className="ml-auto shrink-0">
        {status === 'pending' && <Clock size={18} className="text-gray-300" />}
        {status === 'running' && <Loader size={18} className="text-yellow-500 animate-spin" />}
        {status === 'done'    && <CheckCircle size={18} className="text-green-500" />}
        {status === 'error'   && <XCircle size={18} className="text-red-400" />}
      </div>
    </div>
  );
}
