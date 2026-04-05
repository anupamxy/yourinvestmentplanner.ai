import { useEffect, useState } from 'react';
import Layout from '../components/layout/Layout';
import ReportCard from '../components/reports/ReportCard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { reportApi } from '../api/reportApi';
import { Clock } from 'lucide-react';

export default function HistoryPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    reportApi.list().then(({ data }) => {
      setReports(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  return (
    <Layout>
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Clock size={22} className="text-blue-600" />
          <h1 className="text-xl font-bold text-white">Report History</h1>
        </div>

        {loading ? (
          <div className="py-20 flex justify-center"><LoadingSpinner /></div>
        ) : reports.length === 0 ? (
          <div className="card text-center py-16 text-[var(--text-muted)]">No reports yet.</div>
        ) : (
          <div className="space-y-3">
            {reports.map((r) => <ReportCard key={r.id} report={r} />)}
          </div>
        )}
      </div>
    </Layout>
  );
}
