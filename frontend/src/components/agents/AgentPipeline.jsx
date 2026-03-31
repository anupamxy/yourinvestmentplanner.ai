import { useNavigate } from 'react-router-dom';
import { Play, RotateCcw, ArrowRight } from 'lucide-react';
import useAgentStore from '../../store/useAgentStore';
import AgentStatusCard from './AgentStatusCard';

const AGENTS = ['market_data', 'analysis', 'memory', 'llm'];

export default function AgentPipeline() {
  const { runStatus, stepLogs, currentReportId, error, startRun, reset } = useAgentStore();
  const navigate = useNavigate();

  const isRunning = runStatus === 'running' || runStatus === 'pending';
  const isDone = runStatus === 'completed';
  const isFailed = runStatus === 'failed';

  const handleStart = async () => {
    await startRun();
  };

  const handleViewReport = () => {
    if (currentReportId) navigate(`/reports/${currentReportId}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">AI Agent Pipeline</h2>
          <p className="text-sm text-gray-500">4 specialized agents working in sequence</p>
        </div>
        <div className="flex gap-2">
          {(isDone || isFailed) && (
            <button onClick={reset} className="btn-secondary flex items-center gap-2">
              <RotateCcw size={16} /> Reset
            </button>
          )}
          <button
            onClick={handleStart}
            disabled={isRunning}
            className="btn-primary flex items-center gap-2"
          >
            <Play size={16} />
            {isRunning ? 'Running...' : 'Start Analysis'}
          </button>
        </div>
      </div>

      {/* Pipeline flow */}
      <div className="space-y-3">
        {AGENTS.map((name, idx) => {
          const log = stepLogs.find((s) => s.agent_name === name);
          return (
            <div key={name} className="flex flex-col gap-1">
              <AgentStatusCard agentName={name} log={log} />
              {idx < AGENTS.length - 1 && (
                <div className="flex justify-center">
                  <ArrowRight size={16} className="text-gray-300 rotate-90" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Error */}
      {isFailed && error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
          <strong>Pipeline failed:</strong> {error}
        </div>
      )}

      {/* Success CTA */}
      {isDone && currentReportId && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-5 text-center">
          <p className="text-green-700 font-semibold text-base mb-3">
            Your investment report is ready!
          </p>
          <button onClick={handleViewReport} className="btn-primary">
            View Full Report
          </button>
        </div>
      )}

      {/* Progress indicator */}
      {isRunning && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700 text-center">
          Analysis in progress — this may take 1–3 minutes depending on market data and LLM response time.
        </div>
      )}
    </div>
  );
}
