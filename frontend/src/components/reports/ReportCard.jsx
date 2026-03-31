import { Link } from 'react-router-dom';
import { TrendingUp, Calendar, ChevronRight } from 'lucide-react';

export default function ReportCard({ report }) {
  const date = new Date(report.created_at).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });

  return (
    <Link
      to={`/reports/${report.id}`}
      className="card flex items-start gap-4 hover:shadow-md transition-shadow group cursor-pointer"
    >
      <div className="p-2 bg-blue-50 rounded-lg">
        <TrendingUp size={20} className="text-blue-600" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs text-gray-400 flex items-center gap-1">
            <Calendar size={12} /> {date}
          </span>
          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
            {Math.round((report.confidence_score || 0) * 100)}% confidence
          </span>
        </div>
        <p className="text-sm text-gray-700 line-clamp-2">{report.summary}</p>
        {report.tickers?.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {report.tickers.slice(0, 5).map((t) => (
              <span key={t} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                {t}
              </span>
            ))}
          </div>
        )}
      </div>

      <ChevronRight size={18} className="text-gray-300 group-hover:text-blue-400 transition-colors mt-1 shrink-0" />
    </Link>
  );
}
