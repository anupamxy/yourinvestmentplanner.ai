import { Link } from 'react-router-dom';
import { TrendingUp, Calendar, ChevronRight, Tag } from 'lucide-react';

const CONFIDENCE_COLOR = (score) => {
  if (score >= 0.75) return { bar: 'bg-emerald-500', text: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' };
  if (score >= 0.5)  return { bar: 'bg-amber-500',   text: 'text-amber-400',   bg: 'bg-amber-500/10 border-amber-500/20'   };
  return               { bar: 'bg-red-500',    text: 'text-red-400',    bg: 'bg-red-500/10 border-red-500/20'       };
};

export default function ReportCard({ report }) {
  const date   = new Date(report.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const score  = report.confidence_score || 0;
  const colors = CONFIDENCE_COLOR(score);

  return (
    <Link
      to={`/reports/${report.id}`}
      className="group flex items-start gap-4 p-4 rounded-2xl
                 border border-white/[0.06] hover:border-indigo-500/30
                 transition-all duration-200 hover:-translate-y-0.5
                 hover:shadow-[0_8px_32px_rgba(99,102,241,0.12)]"
      style={{ background: 'var(--bg-card)' }}
    >
      {/* Icon */}
      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0
                      bg-indigo-500/10 border border-indigo-500/20
                      group-hover:bg-indigo-500/20 transition-colors">
        <TrendingUp size={16} className="text-indigo-400" strokeWidth={2} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
          <span className="flex items-center gap-1 text-[11px] text-[var(--text-muted)]">
            <Calendar size={10} /> {date}
          </span>
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${colors.bg} ${colors.text}`}>
            {Math.round(score * 100)}% confidence
          </span>
        </div>

        <p className="text-[13px] text-[var(--text-secondary)] line-clamp-2 leading-relaxed mb-2">
          {report.summary || 'No summary available'}
        </p>

        {report.tickers?.length > 0 && (
          <div className="flex flex-wrap gap-1 items-center">
            <Tag size={9} className="text-slate-700 shrink-0" />
            {report.tickers.slice(0, 6).map((t) => (
              <span key={t}
                className="text-[10px] font-mono font-semibold
                           bg-[var(--bg-raised)] border border-white/[0.1]/60
                           text-[var(--text-secondary)] px-1.5 py-0.5 rounded">
                {t}
              </span>
            ))}
            {report.tickers.length > 6 && (
              <span className="text-[10px] text-slate-700">+{report.tickers.length - 6}</span>
            )}
          </div>
        )}
      </div>

      {/* Arrow */}
      <ChevronRight
        size={15}
        className="text-slate-700 group-hover:text-indigo-400 group-hover:translate-x-0.5
                   transition-all shrink-0 mt-1"
      />
    </Link>
  );
}
