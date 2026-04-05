import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Calendar, TrendingUp, Star } from 'lucide-react';

export default function ReportViewer({ report }) {
  if (!report) return null;

  const date = new Date(report.created_at).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  return (
    <div className="space-y-4">
      {/* Meta bar */}
      <div className="flex flex-wrap items-center gap-4 text-sm text-[var(--text-muted)]">
        <span className="flex items-center gap-1">
          <Calendar size={14} /> {date}
        </span>
        {report.tickers?.length > 0 && (
          <span className="flex items-center gap-1">
            <TrendingUp size={14} />
            {report.tickers.join(', ')}
          </span>
        )}
        {report.confidence_score > 0 && (
          <span className="flex items-center gap-1">
            <Star size={14} className="text-yellow-500" />
            Confidence: {Math.round(report.confidence_score * 100)}%
          </span>
        )}
      </div>

      {/* Full markdown report */}
      <div className="report-content bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {report.full_report}
        </ReactMarkdown>
      </div>
    </div>
  );
}
